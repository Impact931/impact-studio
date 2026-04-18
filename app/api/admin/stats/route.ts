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
    const [customers, bookings] = await Promise.all([
      scanItems(
        'begins_with(PK, :pk) AND SK = :sk',
        { ':pk': 'CUSTOMER#', ':sk': 'META' },
      ),
      scanItems(
        'begins_with(PK, :pk) AND SK = :sk',
        { ':pk': 'BOOKING#', ':sk': 'META' },
      ),
    ]);

    const totalRevenue = bookings.reduce(
      (sum, b) => sum + (Number(b.totalAmount || b.total) || 0),
      0,
    ) / 100;

    const recentMembers = customers
      .sort(
        (a, b) =>
          new Date(b.createdAt as string).getTime() -
          new Date(a.createdAt as string).getTime(),
      )
      .slice(0, 5)
      .map((c) => ({
        name: c.name || c.email,
        email: c.email,
        createdAt: c.createdAt,
      }));

    const recentRentals = bookings
      .sort(
        (a, b) =>
          new Date(b.createdAt as string).getTime() -
          new Date(a.createdAt as string).getTime(),
      )
      .slice(0, 5)
      .map((b) => ({
        renterName: b.renterName,
        rentalDate: b.rentalDate,
        total: (Number(b.totalAmount || b.total) || 0) / 100,
        status: b.status || 'pending',
      }));

    return NextResponse.json({
      totalMembers: customers.length,
      totalRentals: bookings.length,
      totalRevenue,
      recentMembers,
      recentRentals,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
