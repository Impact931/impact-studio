import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getItem, updateItem, scanItems, queryItems } from '@/lib/dynamodb';
import { stripe } from '@/lib/stripe';
import bcrypt from 'bcryptjs';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: customerId } = await params;
    const customer = await getItem(`CUSTOMER#${customerId}`, 'META');

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const email = customer.email as string;

    // Fetch all bookings for this customer by email
    const allBookings = await scanItems(
      'begins_with(PK, :pk) AND SK = :sk',
      { ':pk': 'BOOKING#', ':sk': 'META' },
    );

    const memberBookings = allBookings
      .filter((b) => (b.email as string)?.toLowerCase() === email.toLowerCase())
      .map((b) => ({
        bookingId: (b.PK as string).replace('BOOKING#', ''),
        rentalDate: b.rentalDate as string,
        endDate: b.endDate as string | undefined,
        startTime: b.startTime as string,
        endTime: b.endTime as string,
        rentalMode: b.rentalMode as string,
        productionType: b.productionType as string | undefined,
        status: (b.status as string) || 'pending',
        totalAmount: Number(b.totalAmount) || 0,
        equipment: (b.equipment || []) as Array<{ name: string; quantity: number; price: number; equipmentId?: string }>,
        hasInsurance: b.hasInsurance as boolean,
        insuranceProvider: b.insuranceProvider as string | undefined,
        createdAt: b.createdAt as string,
      }))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Compute real stats from booking data
    const completedOrConfirmed = memberBookings.filter(
      (b) => b.status === 'confirmed' || b.status === 'completed' || b.status === 'checked_out' || b.status === 'returned',
    );
    const totalRentals = completedOrConfirmed.length;
    const totalSpent = completedOrConfirmed.reduce((sum, b) => sum + b.totalAmount, 0);
    const avgRentalValue = totalRentals > 0 ? Math.round(totalSpent / totalRentals) : 0;
    const lastRental = completedOrConfirmed[0] || null;

    // Equipment frequency — what do they rent most?
    const equipFreq: Record<string, { name: string; count: number }> = {};
    completedOrConfirmed.forEach((b) => {
      b.equipment.forEach((item) => {
        const key = item.equipmentId || item.name;
        if (!equipFreq[key]) equipFreq[key] = { name: item.name, count: 0 };
        equipFreq[key].count += item.quantity;
      });
    });
    const preferredEquipment = Object.values(equipFreq)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Client health status
    let clientStatus: 'new' | 'active' | 'at_risk' | 'inactive' = 'new';
    if (totalRentals > 0 && lastRental) {
      const daysSinceLast = Math.floor(
        (Date.now() - new Date(lastRental.rentalDate).getTime()) / (1000 * 60 * 60 * 24),
      );
      if (daysSinceLast <= 30) clientStatus = 'active';
      else if (daysSinceLast <= 90) clientStatus = 'at_risk';
      else clientStatus = 'inactive';
    }

    // Fetch admin notes for this customer
    const notes = await queryItems(`CUSTOMER#${customerId}`, 'NOTE#');

    // Fetch Stripe payment methods
    let paymentMethods: { id: string; brand: string; last4: string; expMonth: number; expYear: number }[] = [];
    let stripeCustomerId = customer.stripeCustomerId as string | undefined;

    if (!stripeCustomerId && email) {
      try {
        const customers = await stripe.customers.list({ email, limit: 1 });
        if (customers.data.length > 0) stripeCustomerId = customers.data[0].id;
      } catch { /* continue */ }
    }

    if (stripeCustomerId) {
      try {
        const methods = await stripe.paymentMethods.list({ customer: stripeCustomerId, type: 'card' });
        paymentMethods = methods.data.map((pm) => ({
          id: pm.id,
          brand: pm.card?.brand || 'unknown',
          last4: pm.card?.last4 || '****',
          expMonth: pm.card?.exp_month || 0,
          expYear: pm.card?.exp_year || 0,
        }));
      } catch (err) {
        console.error('Stripe payment methods error:', err);
      }
    }

    return NextResponse.json({
      customer: {
        customerId,
        name: customer.name,
        email,
        phone: customer.phone,
        company: customer.company,
        bio: customer.bio,
        instagram: customer.instagram,
        linkedin: customer.linkedin,
        twitter: customer.twitter,
        facebook: customer.facebook,
        website: customer.website,
        hasInsurance: customer.hasInsurance,
        insuranceProvider: customer.insuranceProvider,
        createdAt: customer.createdAt,
        stripeCustomerId: stripeCustomerId || null,
      },
      stats: {
        totalRentals,
        totalSpent,
        avgRentalValue,
        clientStatus,
        lastRentalDate: lastRental?.rentalDate || null,
      },
      rentals: memberBookings,
      preferredEquipment,
      paymentMethods,
      notes: notes.map((n) => ({
        id: n.SK,
        text: n.text,
        author: n.author,
        timestamp: n.timestamp,
      })),
    });
  } catch (err) {
    console.error('Member detail error:', err);
    return NextResponse.json({ error: 'Failed to load member' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/members/[id] — Update member (password reset, profile edits, add note)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id: customerId } = await params;
    const customer = await getItem(`CUSTOMER#${customerId}`, 'META');
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const body = await req.json();
    const now = new Date().toISOString();
    const performedBy = (session.user?.email as string) || 'admin';

    // Handle note addition
    if (body.note) {
      const noteId = `NOTE#${now}`;
      await updateItem(`CUSTOMER#${customerId}`, noteId, {
        text: body.note,
        author: performedBy,
        timestamp: now,
      });
      return NextResponse.json({ success: true, noteId });
    }

    const updates: Record<string, unknown> = {};

    // Password reset
    if (body.newPassword) {
      if (body.newPassword.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 },
        );
      }
      updates.password = await bcrypt.hash(body.newPassword, 12);
    }

    // Profile field updates
    if (body.name !== undefined) updates.name = body.name;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.company !== undefined) updates.company = body.company;
    if (body.email !== undefined) updates.email = body.email;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    updates.updatedAt = now;
    await updateItem(`CUSTOMER#${customerId}`, 'META', updates);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Member update error:', err);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}
