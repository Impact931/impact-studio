// ---------------------------------------------------------------------------
// POST /api/assessment — Score, store in DynamoDB + Notion, email, return result
// ---------------------------------------------------------------------------

import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { AssessmentFormData, AssessmentResult } from '@/types/assessment';
import {
  calculateScore,
  classifyTier,
  detectStrengths,
  detectSignals,
} from '@/lib/assessment-scoring';
import { putItem } from '@/lib/dynamodb';
import { createAssessmentPage } from '@/lib/notion-assessment';
import { sendAssessmentNotification } from '@/lib/assessment-email';

export async function POST(request: Request) {
  try {
    const formData: AssessmentFormData = await request.json();

    // Validate required fields
    if (!formData.contactName || !formData.email || !formData.company) {
      return NextResponse.json(
        { error: 'Name, email, and company are required.' },
        { status: 400 },
      );
    }
    if (!formData.magicWandAnswer) {
      return NextResponse.json(
        { error: 'Please answer the Magic Wand question.' },
        { status: 400 },
      );
    }

    const assessmentId = uuidv4();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || 'https://impactstudio931.com';
    const reportUrl = `${siteUrl}/ai-readiness/results?id=${assessmentId}`;
    const submittedAt = new Date().toISOString();

    // Score
    const score = calculateScore(formData);
    const { tier, description: tierDescription } = classifyTier(score);
    const strengths = detectStrengths(formData);
    const signals = detectSignals(formData);

    const result: AssessmentResult = {
      assessmentId,
      score,
      tier,
      tierDescription,
      strengths,
      signals,
      formData,
      reportUrl,
      submittedAt,
    };

    // Store in DynamoDB
    await putItem({
      PK: `ASSESSMENT#${assessmentId}`,
      SK: 'META',
      ...result,
      status: 'New',
    });

    // Notion + Email — run in parallel, don't block on failures
    const [notionResult, emailResult] = await Promise.allSettled([
      createAssessmentPage(result),
      sendAssessmentNotification(result),
    ]);

    if (notionResult.status === 'rejected') {
      console.error('Notion page creation failed:', notionResult.reason);
    }
    if (emailResult.status === 'rejected') {
      console.error('Email notification failed:', emailResult.reason);
    }

    return NextResponse.json({
      assessmentId,
      score,
      tier,
    });
  } catch (error) {
    console.error('Assessment submission error:', error);
    return NextResponse.json(
      { error: 'Failed to process assessment.' },
      { status: 500 },
    );
  }
}
