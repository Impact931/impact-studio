// ---------------------------------------------------------------------------
// GET /api/assessment/[id] — Retrieve assessment by ID for results page
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server';
import { getItem } from '@/lib/dynamodb';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Assessment ID is required.' },
        { status: 400 },
      );
    }

    const item = await getItem(`ASSESSMENT#${id}`, 'META');

    if (!item) {
      return NextResponse.json(
        { error: 'Assessment not found.' },
        { status: 404 },
      );
    }

    // Strip DynamoDB keys and status from client response
    const { PK, SK, status, ...result } = item;

    return NextResponse.json(result);
  } catch (error) {
    console.error('Assessment retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve assessment.' },
      { status: 500 },
    );
  }
}
