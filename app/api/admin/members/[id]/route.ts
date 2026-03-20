import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getItem, updateItem } from '@/lib/dynamodb';
import { stripe } from '@/lib/stripe';
import bcrypt from 'bcryptjs';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const customerId = params.id;
    const customer = await getItem(`CUSTOMER#${customerId}`, 'META');

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Fetch Stripe payment methods if we have a stripeCustomerId
    let paymentMethods: {
      id: string;
      brand: string;
      last4: string;
      expMonth: number;
      expYear: number;
    }[] = [];

    const stripeCustomerId = customer.stripeCustomerId as string | undefined;
    if (stripeCustomerId) {
      try {
        const methods = await stripe.paymentMethods.list({
          customer: stripeCustomerId,
          type: 'card',
        });
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

    // Also try to find Stripe customer by email if no stripeCustomerId stored
    if (!stripeCustomerId && customer.email) {
      try {
        const customers = await stripe.customers.list({
          email: customer.email as string,
          limit: 1,
        });
        if (customers.data.length > 0) {
          const stripeId = customers.data[0].id;
          const methods = await stripe.paymentMethods.list({
            customer: stripeId,
            type: 'card',
          });
          paymentMethods = methods.data.map((pm) => ({
            id: pm.id,
            brand: pm.card?.brand || 'unknown',
            last4: pm.card?.last4 || '****',
            expMonth: pm.card?.exp_month || 0,
            expYear: pm.card?.exp_year || 0,
          }));
        }
      } catch {
        // Stripe lookup failed, continue without payment info
      }
    }

    return NextResponse.json({
      customer: {
        customerId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        company: customer.company,
        bio: customer.bio,
        instagram: customer.instagram,
        linkedin: customer.linkedin,
        twitter: customer.twitter,
        facebook: customer.facebook,
        website: customer.website,
        hasInsurance: customer.hasInsurance,
        createdAt: customer.createdAt,
        totalRentals: customer.totalRentals,
        totalSpent: customer.totalSpent,
        stripeCustomerId: stripeCustomerId || null,
      },
      paymentMethods,
    });
  } catch (err) {
    console.error('Member detail error:', err);
    return NextResponse.json({ error: 'Failed to load member' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/members/[id] — Update member (password reset, profile edits)
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const customerId = params.id;
    const customer = await getItem(`CUSTOMER#${customerId}`, 'META');
    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const body = await req.json();
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

    updates.updatedAt = new Date().toISOString();
    await updateItem(`CUSTOMER#${customerId}`, 'META', updates);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Member update error:', err);
    return NextResponse.json({ error: 'Failed to update member' }, { status: 500 });
  }
}
