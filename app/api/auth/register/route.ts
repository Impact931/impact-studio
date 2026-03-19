import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { putItem, queryItems } from '@/lib/dynamodb';
import { createNotionClient } from '@/lib/notion-crm';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, phone, company } = await req.json();

    if (!email || !password || !name || !phone) {
      return NextResponse.json(
        { error: 'Email, password, name, and phone are required' },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 },
      );
    }

    // Check if email already exists
    const existing = await queryItems('CUSTOMER_EMAIL', email);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Please sign in.' },
        { status: 409 },
      );
    }

    const customerId = uuidv4();
    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash(password, 12);

    // Store customer record
    await putItem({
      PK: `CUSTOMER#${customerId}`,
      SK: 'META',
      customerId,
      email,
      name,
      phone,
      company: company || undefined,
      passwordHash,
      hasInsurance: false,
      createdAt: now,
      updatedAt: now,
    });

    // Store email index for login lookup
    await putItem({
      PK: 'CUSTOMER_EMAIL',
      SK: email,
      customerId,
    });

    // Sync to Notion Clients DB (non-blocking)
    createNotionClient({
      customerId,
      name,
      email,
      phone,
      company: company || undefined,
      createdAt: now,
    }).catch((err) => console.error('Notion client sync error:', err));

    return NextResponse.json({
      customer: {
        customerId,
        email,
        name,
        company: company || undefined,
        phone,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Registration failed' },
      { status: 500 },
    );
  }
}
