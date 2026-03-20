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
    const customers = await scanItems(
      'begins_with(PK, :pk) AND SK = :sk',
      { ':pk': 'CUSTOMER#', ':sk': 'PROFILE' },
    );

    const members = customers
      .map((c) => ({
        customerId: (c.PK as string).replace('CUSTOMER#', ''),
        name: c.name,
        email: c.email,
        phone: c.phone,
        company: c.company,
        createdAt: c.createdAt,
        totalRentals: Number(c.totalRentals) || 0,
        totalSpent: Number(c.totalSpent) || 0,
      }))
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
