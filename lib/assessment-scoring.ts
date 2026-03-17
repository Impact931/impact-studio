// ---------------------------------------------------------------------------
// AI Readiness Assessment — Scoring Engine
// ---------------------------------------------------------------------------

import {
  AssessmentFormData,
  AssessmentTier,
  ConsultingSignal,
} from '@/types/assessment';

// ---------------------------------------------------------------------------
// Score Calculation (0-100)
// ---------------------------------------------------------------------------

export function calculateScore(data: AssessmentFormData): number {
  let score = 0;

  // Q3: Workflow maturity (max 20)
  const maturityScores: Record<string, number> = {
    'Mostly manual': 0,
    'Some project management tools': 7,
    'Structured with documented processes': 14,
    'Highly systematized with automation': 20,
  };
  score += maturityScores[data.workflowMaturity] ?? 0;

  // Q5: AI tools count (max 20)
  const aiToolCount = data.aiTools.filter((t) => t !== 'None').length;
  if (aiToolCount === 0) score += 0;
  else if (aiToolCount === 1) score += 5;
  else if (aiToolCount <= 3) score += 12;
  else score += 20;

  // Q6: AI usage level (max 25)
  const usageScores: Record<string, number> = {
    "Haven't started yet": 0,
    'Experimenting here and there': 8,
    'Using it for specific tasks': 16,
    'Integrated into multiple daily workflows': 25,
  };
  score += usageScores[data.aiUsageLevel] ?? 0;

  // Q8: Automation areas (max 15)
  const autoCount = data.currentAutomation.filter((a) => a !== 'None').length;
  if (autoCount === 0) score += 0;
  else if (autoCount <= 2) score += 5;
  else if (autoCount <= 4) score += 10;
  else score += 15;

  // Q9: Repetitive tasks (max 10) — inverse: more tasks = more opportunity
  const repScores: Record<string, number> = {
    'Very few': 2,
    '5–10': 5,
    '10–25': 8,
    '25+': 10,
  };
  score += repScores[data.repetitiveTasks] ?? 0;

  // Q11: Info accessibility (max 10)
  const accessScores: Record<string, number> = {
    'Very difficult': 0,
    'Somewhat difficult': 3,
    'Moderate': 5,
    'Easy': 8,
    'Very easy': 10,
  };
  score += accessScores[data.infoAccessibility] ?? 0;

  return Math.min(score, 100);
}

// ---------------------------------------------------------------------------
// Tier Classification
// ---------------------------------------------------------------------------

export function classifyTier(score: number): {
  tier: AssessmentTier;
  description: string;
} {
  if (score <= 35) {
    return {
      tier: 'AI Curious',
      description:
        "Your team is at the starting line — and that's a great place to be. You have a clean slate and a chance to build AI into your workflows the right way from day one. The organizations that start with a clear strategy outperform those that bolt on tools later.",
    };
  }
  if (score <= 65) {
    return {
      tier: 'AI Ready',
      description:
        "You've started experimenting, and your workflows show clear opportunities for AI to make a real impact. The gap between where you are and where you could be represents significant time savings and competitive advantage. A structured approach will accelerate your progress.",
    };
  }
  return {
    tier: 'AI Optimized',
    description:
      "Your team is already leveraging AI in meaningful ways. You're ahead of most organizations. The next level is connecting your tools into automated workflows, building custom solutions, and turning AI from a productivity boost into a strategic advantage.",
  };
}

// ---------------------------------------------------------------------------
// Strength Detection
// ---------------------------------------------------------------------------

export function detectStrengths(data: AssessmentFormData): string[] {
  const strengths: string[] = [];

  if (
    data.workflowMaturity === 'Structured with documented processes' ||
    data.workflowMaturity === 'Highly systematized with automation'
  ) {
    strengths.push(
      'Your workflows are already structured — that makes AI integration much smoother.',
    );
  }

  const aiToolCount = data.aiTools.filter((t) => t !== 'None').length;
  if (aiToolCount >= 2) {
    strengths.push(
      `Your team is already using ${aiToolCount} AI tools — you're not starting from scratch.`,
    );
  }

  if (
    data.aiUsageLevel === 'Using it for specific tasks' ||
    data.aiUsageLevel === 'Integrated into multiple daily workflows'
  ) {
    strengths.push(
      'Your team has moved past experimentation into real AI usage.',
    );
  }

  const autoCount = data.currentAutomation.filter((a) => a !== 'None').length;
  if (autoCount >= 3) {
    strengths.push(
      `You're already automating ${autoCount} areas — a strong foundation to build on.`,
    );
  }

  if (
    data.infoAccessibility === 'Easy' ||
    data.infoAccessibility === 'Very easy'
  ) {
    strengths.push(
      'Your team can find information easily — that means data is accessible for AI tools.',
    );
  }

  if (data.currentTools.length >= 3) {
    strengths.push(
      'Your team uses multiple productivity tools — there are likely integration opportunities.',
    );
  }

  // Always return at least one strength
  if (strengths.length === 0) {
    strengths.push(
      "You're taking the first step by assessing where you stand — that puts you ahead of organizations that haven't started thinking about AI yet.",
    );
  }

  return strengths.slice(0, 4);
}

// ---------------------------------------------------------------------------
// Consulting Signal Detection
// ---------------------------------------------------------------------------

export function detectSignals(data: AssessmentFormData): ConsultingSignal[] {
  const signals: ConsultingSignal[] = [];

  if (
    data.workflowMaturity === 'Mostly manual' ||
    data.workflowMaturity === 'Some project management tools'
  ) {
    signals.push({
      label: 'Process Mapping',
      trigger: 'Manual or lightly-tooled workflows',
      opportunity:
        'A process mapping engagement would identify your highest-impact automation opportunities and create a clear implementation roadmap.',
    });
  }

  if (
    data.aiUsageLevel === "Haven't started yet" ||
    data.aiUsageLevel === 'Experimenting here and there'
  ) {
    signals.push({
      label: 'AI Training & Onboarding',
      trigger: 'Early-stage AI adoption',
      opportunity:
        'Structured AI training would get your team productive with AI tools in weeks instead of months, with workflows tailored to your specific needs.',
    });
  }

  if (
    data.dataStorage === 'Email inboxes' ||
    data.dataStorage === 'Multiple disconnected systems'
  ) {
    signals.push({
      label: 'Workflow Automation',
      trigger: 'Disconnected data systems',
      opportunity:
        'Connecting your data sources with automated workflows could eliminate hours of manual data transfer and reduce errors across your team.',
    });
  }

  if (data.timeSinks.includes('Content creation')) {
    signals.push({
      label: 'AI Content Pipeline',
      trigger: 'Content creation is a top time sink',
      opportunity:
        'An AI-powered content pipeline could cut content production time by 60-70% while maintaining your brand voice and quality standards.',
    });
  }

  if (data.timeSinks.includes('Reporting & analytics')) {
    signals.push({
      label: 'Automated Analytics',
      trigger: 'Reporting is a top time sink',
      opportunity:
        'Automated reporting dashboards would give your team real-time insights without the manual data pulling and formatting.',
    });
  }

  if (data.repetitiveTasks === '10–25' || data.repetitiveTasks === '25+') {
    signals.push({
      label: 'Automation ROI',
      trigger: 'High volume of repetitive tasks',
      opportunity:
        'With the volume of repetitive work your team handles, automation could save 10-20 hours per week — that\'s a measurable ROI within the first month.',
    });
  }

  return signals;
}
