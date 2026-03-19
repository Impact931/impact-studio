import { NextRequest, NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME!;
const REGION = process.env.AWS_REGION || 'us-east-1';

const clientConfig: ConstructorParameters<typeof DynamoDBClient>[0] = {
  region: REGION,
};
if (
  process.env.CUSTOM_AWS_ACCESS_KEY_ID &&
  process.env.CUSTOM_AWS_SECRET_ACCESS_KEY
) {
  clientConfig.credentials = {
    accessKeyId: process.env.CUSTOM_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.CUSTOM_AWS_SECRET_ACCESS_KEY,
  };
}
const ddbClient = new DynamoDBClient(clientConfig);
const docClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: { removeUndefinedValues: true },
});

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'email required' }, { status: 400 });
  }

  try {
    // Scan for bookings by email (DynamoDB doesn't have a GSI on email for bookings)
    const result = await docClient.send(
      new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: 'begins_with(PK, :prefix) AND SK = :sk AND email = :email',
        ExpressionAttributeValues: {
          ':prefix': { S: 'BOOKING#' },
          ':sk': { S: 'META' },
          ':email': { S: email },
        },
      }),
    );

    const bookings = (result.Items || [])
      .map((item) => {
        const record = unmarshall(item);
        return {
          bookingId: record.bookingId,
          rentalDate: record.rentalDate,
          endDate: record.endDate || record.rentalDate,
          startTime: record.startTime,
          endTime: record.endTime,
          rentalMode: record.rentalMode,
          status: record.status,
          totalAmount: record.totalAmount,
          equipment: (record.equipment || []).map(
            (e: { name: string; quantity: number; price: number }) => ({
              name: e.name,
              quantity: e.quantity,
              price: e.price,
            }),
          ),
          createdAt: record.createdAt,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    return NextResponse.json({ rentals: bookings });
  } catch (err) {
    console.error('Rentals fetch error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to fetch rentals' },
      { status: 500 },
    );
  }
}
