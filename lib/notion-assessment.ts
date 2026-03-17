// ---------------------------------------------------------------------------
// AI Readiness Assessment — Notion Integration
// ---------------------------------------------------------------------------

import { AssessmentResult } from '@/types/assessment';

const NOTION_API_KEY = process.env.NOTION_API_KEY!;
const DATABASE_ID = '325c2a32df0d80d79090caae298ec80f';
const NOTION_VERSION = '2022-06-28';

const headers = {
  Authorization: `Bearer ${NOTION_API_KEY}`,
  'Content-Type': 'application/json',
  'Notion-Version': NOTION_VERSION,
};

// ---------------------------------------------------------------------------
// Create Notion page with assessment results
// ---------------------------------------------------------------------------

export async function createAssessmentPage(
  result: AssessmentResult,
): Promise<string> {
  const { formData, score, tier, signals, assessmentId, reportUrl, submittedAt } = result;

  const orgType =
    formData.organizationType === 'Other'
      ? formData.organizationTypeOther || 'Other'
      : formData.organizationType;

  const signalLabels = signals.map((s) => s.label);

  const properties: Record<string, unknown> = {
    // Title
    Name: {
      title: [{ text: { content: formData.company } }],
    },
    'Contact Name': {
      rich_text: [{ text: { content: formData.contactName } }],
    },
    Email: {
      email: formData.email,
    },
    Score: {
      number: score,
    },
    Tier: {
      select: { name: tier },
    },
    'Organization Type': {
      select: { name: orgType },
    },
    'Team Size': {
      select: { name: formData.teamSize },
    },
    'Workflow Maturity': {
      select: { name: formData.workflowMaturity },
    },
    'Current Tools': {
      multi_select: formData.currentTools.map((t) => ({ name: t })),
    },
    'AI Tools': {
      multi_select: formData.aiTools.map((t) => ({ name: t })),
    },
    'AI Usage Level': {
      select: { name: formData.aiUsageLevel },
    },
    'Time Sinks': {
      multi_select: formData.timeSinks.map((t) => ({ name: t })),
    },
    'Current Automation': {
      multi_select: formData.currentAutomation.map((t) => ({ name: t })),
    },
    'Repetitive Tasks': {
      select: { name: formData.repetitiveTasks },
    },
    'Data Storage': {
      select: { name: formData.dataStorage },
    },
    'Info Accessibility': {
      select: { name: formData.infoAccessibility },
    },
    'Desired Outcomes': {
      multi_select: formData.desiredOutcomes.map((t) => ({ name: t })),
    },
    'Biggest Challenge': {
      select: { name: formData.biggestChallenge },
    },
    'Magic Wand Answer': {
      rich_text: [
        {
          text: {
            content: formData.magicWandAnswer.slice(0, 2000),
          },
        },
      ],
    },
    'Interested in Review': {
      select: { name: formData.interestedInReview },
    },
    'Consulting Signals': {
      multi_select: signalLabels.map((s) => ({ name: s })),
    },
    'Assessment ID': {
      rich_text: [{ text: { content: assessmentId } }],
    },
    'Submitted At': {
      date: { start: submittedAt },
    },
    'Report URL': {
      url: reportUrl,
    },
    Status: {
      select: { name: 'New' },
    },
  };

  // Add phone if provided
  if (formData.phone) {
    properties['Phone'] = {
      phone_number: formData.phone,
    };
  }

  // Add discovery notes if provided
  if (formData.discoveryNote1) {
    properties['Discovery Notes 1'] = {
      rich_text: [
        { text: { content: formData.discoveryNote1.slice(0, 2000) } },
      ],
    };
  }
  if (formData.discoveryNote2) {
    properties['Discovery Notes 2'] = {
      rich_text: [
        { text: { content: formData.discoveryNote2.slice(0, 2000) } },
      ],
    };
  }

  const response = await fetch('https://api.notion.com/v1/pages', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      parent: { database_id: DATABASE_ID },
      properties,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Notion API error:', error);
    throw new Error(`Failed to create Notion page: ${response.status}`);
  }

  const page = await response.json();
  return page.id;
}
