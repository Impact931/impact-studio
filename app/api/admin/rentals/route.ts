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
    const bookings = await scanItems(
      'begins_with(PK, :pk) AND SK = :sk',
      { ':pk': 'BOOKING#', ':sk': 'DETAILS' },
    );

    const rentals = bookings
      .map((b) => ({
        bookingId: (b.PK as string).replace('BOOKING#', ''),
        renterName: b.renterName,
        email: b.email,
        rentalDate: b.rentalDate,
        endDate: b.endDate,
        rentalMode: b.rentalMode,
        total: Number(b.total) || 0,
        status: b.status || 'pending',
        createdAt: b.createdAt,
      }))
      .sort(
        (a, b) =>
          new Date(b.createdAt as string).getTime() -
          new Date(a.createdAt as string).getTime(),
      );

    return NextResponse.json({ rentals });
  } catch (err) {
    console.error('Admin rentals error:', err);
    return NextResponse.json({ error: 'Failed to load rentals' }, { status: 500 });
  }
}
