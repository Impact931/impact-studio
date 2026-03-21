import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { putItem } from '@/lib/dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { createCheckoutSession } from '@/lib/stripe';
import { getOrCreateStripeCustomer } from '@/lib/stripe-deposits';
import { Booking, BookingFormData } from '@/types/booking';
import { scanItems } from '@/lib/dynamodb';

const REGION = process.env.AWS_REGION || 'us-east-1';
const BUCKET = process.env.S3_BUCKET_NAME!;

const s3Config: ConstructorParameters<typeof S3Client>[0] = { region: REGION };
if (
  process.env.CUSTOM_AWS_ACCESS_KEY_ID &&
  process.env.CUSTOM_AWS_SECRET_ACCESS_KEY
) {
  s3Config.credentials = {
    accessKeyId: process.env.CUSTOM_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.CUSTOM_AWS_SECRET_ACCESS_KEY,
  };
}
const s3 = new S3Client(s3Config);

export async function POST(req: NextRequest) {
  try {
    const body: BookingFormData & { totalAmount: number } = await req.json();

    // --- Validate required fields ---
    const required: (keyof BookingFormData)[] = [
      'renterName',
      'email',
      'phone',
      'rentalDate',
      'startTime',
      'endTime',
      'signedName',
      'signatureDataUrl',
    ];

    // productionType is only required for in-studio bookings
    if (body.rentalMode === 'in_studio') {
      required.push('productionType');
    }

    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 },
        );
      }
    }

    if (!body.agreedToTerms) {
      return NextResponse.json(
        { error: 'You must agree to the rental agreement' },
        { status: 400 },
      );
    }

    if (!body.equipment || body.equipment.length === 0) {
      return NextResponse.json(
        { error: 'At least one equipment item is required' },
        { status: 400 },
      );
    }

    // --- Generate booking ID ---
    const bookingId = uuidv4();
    const now = new Date().toISOString();

    // --- Look up customerId by email ---
    let customerId: string | undefined;
    try {
      const customers = await scanItems(
        'begins_with(PK, :pk) AND SK = :sk AND email = :email',
        { ':pk': 'CUSTOMER#', ':sk': 'META', ':email': body.email },
      );
      if (customers.length > 0) {
        customerId = (customers[0].PK as string).replace('CUSTOMER#', '');
      }
    } catch {
      // Continue without customerId
    }

    // --- Get or create Stripe Customer ---
    const stripeCustomerId = await getOrCreateStripeCustomer(
      body.email,
      body.renterName,
      body.phone,
      { bookingId },
    );

    // --- Upload signature to S3 ---
    let signatureImageKey = '';
    if (body.signatureDataUrl) {
      const base64Data = body.signatureDataUrl.replace(
        /^data:image\/png;base64,/,
        '',
      );
      const buffer = Buffer.from(base64Data, 'base64');
      signatureImageKey = `signatures/${bookingId}.png`;

      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: signatureImageKey,
          Body: buffer,
          ContentType: 'image/png',
        }),
      );
    }

    // --- Build booking record ---
    const booking: Booking = {
      ...body,
      bookingId,
      status: 'pending',
      signatureImageKey,
      securityHold: !body.hasInsurance,
      totalAmount: body.totalAmount,
      createdAt: now,
      updatedAt: now,
    };

    // --- Store in DynamoDB ---
    await putItem({
      PK: `BOOKING#${bookingId}`,
      SK: `META`,
      ...booking,
      stripeCustomerId,
      customerId: customerId || undefined,
      // Remove the large base64 string from DynamoDB (stored in S3)
      signatureDataUrl: undefined,
    });

    // --- Create Stripe Checkout Session ---
    const { sessionUrl, sessionId, securityHoldIntentId } =
      await createCheckoutSession(booking);

    // --- Update booking with Stripe refs ---
    if (sessionId || securityHoldIntentId) {
      await putItem({
        PK: `BOOKING#${bookingId}`,
        SK: `META`,
        ...booking,
        stripeCustomerId,
        customerId: customerId || undefined,
        signatureDataUrl: undefined,
        stripeSessionId: sessionId,
        stripePaymentIntentId: securityHoldIntentId ?? undefined,
        depositPaymentIntentId: securityHoldIntentId ?? undefined,
        depositStatus: securityHoldIntentId ? 'held' : undefined,
      });
    }

    return NextResponse.json({
      url: sessionUrl,
      bookingId,
    });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : 'An unexpected error occurred',
      },
      { status: 500 },
    );
  }
}
