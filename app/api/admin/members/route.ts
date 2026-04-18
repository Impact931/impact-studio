import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { scanItems } from '@/lib/dynamodb';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch customers and bookings in parallel
    const [customers, allBookings] = await Promise.all([
      scanItems('begins_with(PK, :pk) AND SK = :sk', { ':pk': 'CUSTOMER#', ':sk': 'META' }),
      scanItems('begins_with(PK, :pk) AND SK = :sk', { ':pk': 'BOOKING#', ':sk': 'META' }),
    ]);

    // Build a map of email → booking stats (from confirmed/completed bookings only)
    const statsByEmail: Record<string, { totalRentals: number; totalSpent: number; lastRentalDate: string | null }> = {};
    for (const b of allBookings) {
      const status = b.status as string;
      if (!['confirmed', 'completed', 'checked_out', 'returned'].includes(status)) continue;

      const email = (b.email as string)?.toLowerCase();
      if (!email) continue;

      if (!statsByEmail[email]) {
        statsByEmail[email] = { totalRentals: 0, totalSpent: 0, lastRentalDate: null };
      }
      statsByEmail[email].totalRentals += 1;
      statsByEmail[email].totalSpent += Number(b.totalAmount) || 0;

      const rentalDate = b.rentalDate as string;
      if (!statsByEmail[email].lastRentalDate || rentalDate > statsByEmail[email].lastRentalDate!) {
        statsByEmail[email].lastRentalDate = rentalDate;
      }
    }

    const members = customers
      .map((c) => {
        const email = (c.email as string)?.toLowerCase() || '';
        const stats = statsByEmail[email] || { totalRentals: 0, totalSpent: 0, lastRentalDate: null };
        return {
          customerId: (c.PK as string).replace('CUSTOMER#', ''),
          name: c.name,
          email: c.email,
          phone: c.phone,
          company: c.company,
          createdAt: c.createdAt,
          totalRentals: stats.totalRentals,
          totalSpent: stats.totalSpent,
          lastRentalDate: stats.lastRentalDate,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt as string).getTime() -
          new Date(a.createdAt as string).getTime(),
      );

    return NextResponse.json({ members });
  } catch (err) {
    console.error('Admin members error:', err);
    return NextResponse.json({ error: 'Failed to load members' }, { status: 500 });
  }
}
