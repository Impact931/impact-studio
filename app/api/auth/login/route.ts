import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getItem, queryItems } from '@/lib/dynamodb';
import { updateNotionClientLogin } from '@/lib/notion-crm';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      );
    }

    // Look up customer by email
    const emailIndex = await queryItems('CUSTOMER_EMAIL', email);
    if (emailIndex.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 },
      );
    }

    const customerId = emailIndex[0].customerId as string;
    const customer = await getItem(`CUSTOMER#${customerId}`, 'META');

    if (!customer) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 },
      );
    }

    // Verify password
    const valid = await bcrypt.compare(password, customer.passwordHash as string);
    if (!valid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 },
      );
    }

    // Update last login in Notion (non-blocking)
    updateNotionClientLogin(email).catch((err) =>
      console.error('Notion login sync error:', err),
    );

    return NextResponse.json({
      customer: {
        customerId: customer.customerId,
        email: customer.email,
        name: customer.name,
        company: customer.company || undefined,
        phone: customer.phone,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Login failed' },
      { status: 500 },
    );
  }
}
