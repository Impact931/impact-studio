// ---------------------------------------------------------------------------
// AI Readiness Assessment — Types
// ---------------------------------------------------------------------------

export interface AssessmentFormData {
  // Section 1: Basics
  organizationType: string;
  organizationTypeOther?: string;
  teamSize: string;
  workflowMaturity: string;

  // Section 2: Toolkit
  currentTools: string[];
  currentToolsOther?: string;
  aiTools: string[];
  aiUsageLevel: string;
  discoveryNote1: string; // tools/process frustration

  // Section 3: Time
  timeSinks: string[]; // max 3
  currentAutomation: string[];
  repetitiveTasks: string;

  // Section 4: Information Flow
  dataStorage: string;
  infoAccessibility: string;
  discoveryNote2: string; // information bottleneck story

  // Section 5: Vision + Contact
  desiredOutcomes: string[];
  biggestChallenge: string;
  magicWandAnswer: string; // required free text
  interestedInReview: string;

  // Contact
  contactName: string;
  email: string;
  company: string;
  phone?: string;
}

export type AssessmentTier = 'AI Curious' | 'AI Ready' | 'AI Optimized';

export interface ConsultingSignal {
  label: string;
  trigger: string;
  opportunity: string;
}

export interface AssessmentResult {
  assessmentId: string;
  score: number;
  tier: AssessmentTier;
  tierDescription: string;
  strengths: string[];
  signals: ConsultingSignal[];
  formData: AssessmentFormData;
  reportUrl: string;
  submittedAt: string;
}

export interface AssessmentRecord extends AssessmentResult {
  PK: string;
  SK: string;
  status: 'New' | 'Contacted' | 'Proposal Sent' | 'Booked' | 'Closed';
}
