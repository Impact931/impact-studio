import { NextRequest, NextResponse } from 'next/server';
import { getItem, updateItem } from '@/lib/dynamodb';
import { updateNotionClientProfile } from '@/lib/notion-crm';

const CLOUDFRONT = process.env.CLOUDFRONT_DOMAIN || 'd2jen1l9e002bl.cloudfront.net';

// GET — fetch full profile by customerId
export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get('customerId');
  if (!customerId) {
    return NextResponse.json({ error: 'customerId required' }, { status: 400 });
  }

  const customer = await getItem(`CUSTOMER#${customerId}`, 'META');
  if (!customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
  }

  return NextResponse.json({
    profile: {
      customerId: customer.customerId,
      email: customer.email,
      name: customer.name,
      company: customer.company || '',
      phone: customer.phone,
      bio: customer.bio || '',
      profilePhotoUrl: customer.profilePhotoKey
        ? `https://${CLOUDFRONT}/${customer.profilePhotoKey}`
        : null,
      instagram: customer.instagram || '',
      linkedin: customer.linkedin || '',
      twitter: customer.twitter || '',
      facebook: customer.facebook || '',
      website: customer.website || '',
      hasInsurance: customer.hasInsurance ?? false,
      insuranceProvider: customer.insuranceProvider || '',
      createdAt: customer.createdAt,
    },
  });
}

// PATCH — update profile fields
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, ...updates } = body;

    if (!customerId) {
      return NextResponse.json({ error: 'customerId required' }, { status: 400 });
    }

    // Only allow safe fields to be updated
    const allowedFields = [
      'name', 'company', 'phone', 'bio',
      'instagram', 'linkedin', 'twitter', 'facebook', 'website',
      'hasInsurance', 'insuranceProvider',
    ];

    const safeUpdates: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        safeUpdates[field] = updates[field];
      }
    }

    await updateItem(`CUSTOMER#${customerId}`, 'META', safeUpdates);

    // Fetch email for Notion sync
    const customer = await getItem(`CUSTOMER#${customerId}`, 'META');
    if (customer?.email) {
      updateNotionClientProfile(customer.email as string, {
        name: safeUpdates.name as string | undefined,
        company: safeUpdates.company as string | undefined,
        phone: safeUpdates.phone as string | undefined,
        bio: safeUpdates.bio as string | undefined,
        instagram: safeUpdates.instagram as string | undefined,
        linkedin: safeUpdates.linkedin as string | undefined,
        twitter: safeUpdates.twitter as string | undefined,
        facebook: safeUpdates.facebook as string | undefined,
        website: safeUpdates.website as string | undefined,
      }).catch((err) => console.error('Notion profile sync error:', err));
    }

    // Update session name if changed
    const profilePhotoUrl = customer?.profilePhotoKey
      ? `https://${CLOUDFRONT}/${customer.profilePhotoKey}`
      : null;

    return NextResponse.json({
      profile: {
        customerId,
        email: customer?.email,
        name: safeUpdates.name ?? customer?.name,
        company: safeUpdates.company ?? customer?.company ?? '',
        phone: safeUpdates.phone ?? customer?.phone,
        bio: safeUpdates.bio ?? customer?.bio ?? '',
        profilePhotoUrl,
        instagram: safeUpdates.instagram ?? customer?.instagram ?? '',
        linkedin: safeUpdates.linkedin ?? customer?.linkedin ?? '',
        twitter: safeUpdates.twitter ?? customer?.twitter ?? '',
        facebook: safeUpdates.facebook ?? customer?.facebook ?? '',
        website: safeUpdates.website ?? customer?.website ?? '',
        hasInsurance: safeUpdates.hasInsurance ?? customer?.hasInsurance ?? false,
        insuranceProvider: safeUpdates.insuranceProvider ?? customer?.insuranceProvider ?? '',
        createdAt: customer?.createdAt,
      },
    });
  } catch (err) {
    console.error('Profile update error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Update failed' },
      { status: 500 },
    );
  }
}
