'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { AssessmentFormData } from '@/types/assessment';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SECTIONS = [
  "Let's Start With the Basics",
  'Your Current Toolkit',
  'Where Your Time Goes',
  'How Information Flows',
  'Your AI Vision',
];

const ORG_TYPES = [
  'Marketing Agency',
  'Event Production',
  'Media & Podcast',
  'Consulting & Professional Services',
  'Technology & SaaS',
  'Other',
];

const TEAM_SIZES = ['1–3', '4–10', '11–25', '26–50', '50+'];

const WORKFLOW_LEVELS = [
  'Mostly manual',
  'Some project management tools',
  'Structured with documented processes',
  'Highly systematized with automation',
];

const PROJECT_TOOLS = [
  'Google Workspace',
  'Notion',
  'Monday',
  'Asana',
  'Trello',
  'Airtable',
  'CRM (HubSpot/Salesforce)',
  'Other',
];

const AI_TOOLS = [
  'ChatGPT',
  'Claude',
  'Google Gemini',
  'AI video tools',
  'AI writing tools',
  'AI image generation',
  'None',
];

const AI_USAGE_LEVELS = [
  "Haven't started yet",
  'Experimenting here and there',
  'Using it for specific tasks',
  'Integrated into multiple daily workflows',
];

const TIME_SINKS = [
  'Email',
  'Reporting & analytics',
  'Content creation',
  'File search',
  'Data entry',
  'Client presentations',
  'Social media',
  'Media production',
  'Event logistics',
];

const AUTOMATION_AREAS = [
  'Email workflows',
  'Data reporting',
  'Content publishing',
  'Client onboarding',
  'Task management',
  'None',
];

const REPETITIVE_OPTIONS = ['Very few', '5–10', '10–25', '25+'];

const DATA_STORAGE = [
  'Email inboxes',
  'Spreadsheets',
  'Project management tools',
  'CRM systems',
  'Multiple disconnected systems',
];

const INFO_ACCESS = [
  'Very difficult',
  'Somewhat difficult',
  'Moderate',
  'Easy',
  'Very easy',
];

const DESIRED_OUTCOMES = [
  'Reduce repetitive work',
  'Improve productivity',
  'Faster content',
  'Better reporting',
  'Improved client communication',
  'Workflow automation',
  'Cost reduction',
];

const BIGGEST_CHALLENGES = [
  'Lack of time',
  'Lack of expertise',
  'Not sure where to start',
  'Security concerns',
  'Budget constraints',
];

const REVIEW_OPTIONS = [
  "Yes, let's schedule it",
  'Maybe — send me my results first',
  'Not right now',
];

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------

const initialData: AssessmentFormData = {
  organizationType: '',
  organizationTypeOther: '',
  teamSize: '',
  workflowMaturity: '',
  currentTools: [],
  currentToolsOther: '',
  aiTools: [],
  aiUsageLevel: '',
  discoveryNote1: '',
  timeSinks: [],
  currentAutomation: [],
  repetitiveTasks: '',
  dataStorage: '',
  infoAccessibility: '',
  discoveryNote2: '',
  desiredOutcomes: [],
  biggestChallenge: '',
  magicWandAnswer: '',
  interestedInReview: '',
  contactName: '',
  email: '',
  company: '',
  phone: '',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function RadioGroup({
  options,
  value,
  onChange,
  name,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  name: string;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt) => (
        <label
          key={opt}
          className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
            value === opt
              ? 'border-brand-accent bg-brand-accent/5'
              : 'border-brand-border hover:border-brand-accent/40'
          }`}
        >
          <input
            type="radio"
            name={name}
            value={opt}
            checked={value === opt}
            onChange={() => onChange(opt)}
            className="w-4 h-4 text-brand-accent focus:ring-brand-accent"
          />
          <span className="text-sm text-brand-text">{opt}</span>
        </label>
      ))}
    </div>
  );
}

function CheckboxGroup({
  options,
  selected,
  onChange,
  max,
}: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
  max?: number;
}) {
  const toggle = (opt: string) => {
    // "None" clears all others; selecting others clears "None"
    if (opt === 'None') {
      onChange(selected.includes('None') ? [] : ['None']);
      return;
    }
    const without = selected.filter((s) => s !== 'None');
    if (without.includes(opt)) {
      onChange(without.filter((s) => s !== opt));
    } else {
      if (max && without.length >= max) return;
      onChange([...without, opt]);
    }
  };

  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const checked = selected.includes(opt);
        const disabled =
          !checked &&
          max !== undefined &&
          selected.filter((s) => s !== 'None').length >= max &&
          opt !== 'None';
        return (
          <label
            key={opt}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
              checked
                ? 'border-brand-accent bg-brand-accent/5'
                : disabled
                  ? 'border-brand-border opacity-50 cursor-not-allowed'
                  : 'border-brand-border hover:border-brand-accent/40'
            }`}
          >
            <input
              type="checkbox"
              checked={checked}
              disabled={disabled}
              onChange={() => toggle(opt)}
              className="w-4 h-4 rounded text-brand-accent focus:ring-brand-accent"
            />
            <span className="text-sm text-brand-text">{opt}</span>
          </label>
        );
      })}
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = ((current + 1) / total) * 100;
  return (
    <div className="w-full bg-brand-border rounded-full h-2">
      <div
        className="bg-brand-accent h-2 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function AIReadinessPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<AssessmentFormData>(initialData);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = <K extends keyof AssessmentFormData>(
    key: K,
    value: AssessmentFormData[K],
  ) => {
    setData((d) => ({ ...d, [key]: value }));
    setErrors((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  // -----------------------------------------------------------------------
  // Validation per section
  // -----------------------------------------------------------------------

  const validateSection = (): boolean => {
    const e: Record<string, string> = {};
    switch (step) {
      case 0:
        if (!data.organizationType) e.organizationType = 'Please select one';
        if (data.organizationType === 'Other' && !data.organizationTypeOther)
          e.organizationTypeOther = 'Please specify';
        if (!data.teamSize) e.teamSize = 'Please select one';
        if (!data.workflowMaturity) e.workflowMaturity = 'Please select one';
        break;
      case 1:
        if (data.currentTools.length === 0) e.currentTools = 'Select at least one';
        if (data.aiTools.length === 0) e.aiTools = 'Select at least one';
        if (!data.aiUsageLevel) e.aiUsageLevel = 'Please select one';
        break;
      case 2:
        if (data.timeSinks.length === 0) e.timeSinks = 'Select at least one';
        if (data.currentAutomation.length === 0) e.currentAutomation = 'Select at least one';
        if (!data.repetitiveTasks) e.repetitiveTasks = 'Please select one';
        break;
      case 3:
        if (!data.dataStorage) e.dataStorage = 'Please select one';
        if (!data.infoAccessibility) e.infoAccessibility = 'Please select one';
        break;
      case 4:
        if (data.desiredOutcomes.length === 0) e.desiredOutcomes = 'Select at least one';
        if (!data.biggestChallenge) e.biggestChallenge = 'Please select one';
        if (!data.magicWandAnswer.trim()) e.magicWandAnswer = 'This question is required';
        if (!data.interestedInReview) e.interestedInReview = 'Please select one';
        if (!data.contactName.trim()) e.contactName = 'Required';
        if (!data.email.trim()) e.email = 'Required';
        if (!data.company.trim()) e.company = 'Required';
        break;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validateSection()) return;
    setStep((s) => Math.min(s + 1, SECTIONS.length - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const prev = () => {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    if (!validateSection()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        setErrors({ submit: err.error || 'Something went wrong.' });
        setSubmitting(false);
        return;
      }
      const { assessmentId } = await res.json();
      router.push(`/ai-readiness/results?id=${assessmentId}`);
    } catch {
      setErrors({ submit: 'Network error. Please try again.' });
      setSubmitting(false);
    }
  };

  // -----------------------------------------------------------------------
  // Section Renderers
  // -----------------------------------------------------------------------

  const renderSection = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-8">
            <SectionIntro text="First, a little about your organization so we can tailor our recommendations." />

            <Question
              num={1}
              label="What best describes your organization?"
              error={errors.organizationType}
            >
              <RadioGroup
                name="orgType"
                options={ORG_TYPES}
                value={data.organizationType}
                onChange={(v) => update('organizationType', v)}
              />
              {data.organizationType === 'Other' && (
                <div className="mt-3 ml-7">
                  <Input
                    placeholder="Please specify..."
                    value={data.organizationTypeOther || ''}
                    onChange={(e) =>
                      update('organizationTypeOther', e.target.value)
                    }
                    error={errors.organizationTypeOther}
                  />
                </div>
              )}
            </Question>

            <Question num={2} label="How large is your team?" error={errors.teamSize}>
              <RadioGroup
                name="teamSize"
                options={TEAM_SIZES}
                value={data.teamSize}
                onChange={(v) => update('teamSize', v)}
              />
            </Question>

            <Question
              num={3}
              label="How would you describe your current workflow management?"
              error={errors.workflowMaturity}
            >
              <RadioGroup
                name="maturity"
                options={WORKFLOW_LEVELS}
                value={data.workflowMaturity}
                onChange={(v) => update('workflowMaturity', v)}
              />
            </Question>
          </div>
        );

      case 1:
        return (
          <div className="space-y-8">
            <SectionIntro text="Understanding what you're already working with helps us identify what's working — and what might be holding you back." />

            <Question
              num={4}
              label="Which tools does your team use to manage projects or workflows?"
              subtitle="Check all that apply"
              error={errors.currentTools}
            >
              <CheckboxGroup
                options={PROJECT_TOOLS}
                selected={data.currentTools}
                onChange={(v) => update('currentTools', v)}
              />
              {data.currentTools.includes('Other') && (
                <div className="mt-3 ml-7">
                  <Input
                    placeholder="What other tools?"
                    value={data.currentToolsOther || ''}
                    onChange={(e) =>
                      update('currentToolsOther', e.target.value)
                    }
                  />
                </div>
              )}
            </Question>

            <Question
              num={5}
              label="Which AI tools is your team currently using?"
              subtitle="Check all that apply"
              error={errors.aiTools}
            >
              <CheckboxGroup
                options={AI_TOOLS}
                selected={data.aiTools}
                onChange={(v) => update('aiTools', v)}
              />
            </Question>

            <Question
              num={6}
              label="How would you describe your team's comfort level with AI right now?"
              error={errors.aiUsageLevel}
            >
              <RadioGroup
                name="aiUsage"
                options={AI_USAGE_LEVELS}
                value={data.aiUsageLevel}
                onChange={(v) => update('aiUsageLevel', v)}
              />
            </Question>

            <DiscoveryNote
              prompt="Is there anything about your current tools or processes that frustrates your team? What's the one thing that feels harder than it should be?"
              value={data.discoveryNote1}
              onChange={(v) => update('discoveryNote1', v)}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <SectionIntro text="One of the fastest wins with AI is reclaiming time your team spends on repetitive work. Let's see where that time is going." />

            <Question
              num={7}
              label="Which activities take the most time?"
              subtitle="Pick up to 3"
              error={errors.timeSinks}
            >
              <CheckboxGroup
                options={TIME_SINKS}
                selected={data.timeSinks}
                onChange={(v) => update('timeSinks', v)}
                max={3}
              />
            </Question>

            <Question
              num={8}
              label="Which of these does your team currently automate?"
              subtitle="Check all that apply"
              error={errors.currentAutomation}
            >
              <CheckboxGroup
                options={AUTOMATION_AREAS}
                selected={data.currentAutomation}
                onChange={(v) => update('currentAutomation', v)}
              />
            </Question>

            <Question
              num={9}
              label="Roughly how many repetitive tasks does your team handle each week?"
              error={errors.repetitiveTasks}
            >
              <RadioGroup
                name="repTasks"
                options={REPETITIVE_OPTIONS}
                value={data.repetitiveTasks}
                onChange={(v) => update('repetitiveTasks', v)}
              />
            </Question>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <SectionIntro text="When information is scattered, even small tasks take longer than they should. This helps us spot data bottlenecks." />

            <Question
              num={10}
              label="Where does most of your operational data live?"
              error={errors.dataStorage}
            >
              <RadioGroup
                name="dataStorage"
                options={DATA_STORAGE}
                value={data.dataStorage}
                onChange={(v) => update('dataStorage', v)}
              />
            </Question>

            <Question
              num={11}
              label="How easy is it for your team to find information they need?"
              error={errors.infoAccessibility}
            >
              <RadioGroup
                name="infoAccess"
                options={INFO_ACCESS}
                value={data.infoAccessibility}
                onChange={(v) => update('infoAccessibility', v)}
              />
            </Question>

            <DiscoveryNote
              prompt="Think about the last time your team needed a key piece of information and couldn't find it quickly. What happened?"
              value={data.discoveryNote2}
              onChange={(v) => update('discoveryNote2', v)}
            />
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <SectionIntro text="Now the fun part — let's talk about where you want to go." />

            <Question
              num={12}
              label="What outcomes matter most from AI or automation?"
              subtitle="Check all that apply"
              error={errors.desiredOutcomes}
            >
              <CheckboxGroup
                options={DESIRED_OUTCOMES}
                selected={data.desiredOutcomes}
                onChange={(v) => update('desiredOutcomes', v)}
              />
            </Question>

            <Question
              num={13}
              label="What's the biggest thing standing between your team and adopting AI?"
              error={errors.biggestChallenge}
            >
              <RadioGroup
                name="challenge"
                options={BIGGEST_CHALLENGES}
                value={data.biggestChallenge}
                onChange={(v) => update('biggestChallenge', v)}
              />
            </Question>

            <Question
              num={14}
              label="The Magic Wand Question"
              error={errors.magicWandAnswer}
            >
              <p className="text-sm text-brand-muted mb-3 italic">
                If AI could handle one part of your workflow perfectly starting
                tomorrow — what would it be, and why?
              </p>
              <textarea
                rows={5}
                value={data.magicWandAnswer}
                onChange={(e) => update('magicWandAnswer', e.target.value)}
                placeholder="Tell us what you'd automate first..."
                className={`w-full px-3 py-2 rounded-md text-sm bg-white border text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent ${
                  errors.magicWandAnswer
                    ? 'border-brand-red ring-1 ring-brand-red'
                    : 'border-brand-border'
                }`}
              />
            </Question>

            <Question
              num={15}
              label="Would you like a complimentary AI Workflow Review based on your results?"
              error={errors.interestedInReview}
            >
              <RadioGroup
                name="review"
                options={REVIEW_OPTIONS}
                value={data.interestedInReview}
                onChange={(v) => update('interestedInReview', v)}
              />
            </Question>

            {/* Contact Info */}
            <div className="border-t border-brand-border pt-8">
              <h3 className="text-lg font-semibold text-brand-text mb-1">
                Where should we send your results?
              </h3>
              <p className="text-sm text-brand-muted mb-6">
                We&apos;ll generate a personalized report you can share with
                your team.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Your Name *"
                  value={data.contactName}
                  onChange={(e) => update('contactName', e.target.value)}
                  error={errors.contactName}
                />
                <Input
                  label="Email *"
                  type="email"
                  value={data.email}
                  onChange={(e) => update('email', e.target.value)}
                  error={errors.email}
                />
                <Input
                  label="Company *"
                  value={data.company}
                  onChange={(e) => update('company', e.target.value)}
                  error={errors.company}
                />
                <Input
                  label="Phone (optional)"
                  type="tel"
                  value={data.phone || ''}
                  onChange={(e) => update('phone', e.target.value)}
                />
              </div>
            </div>

            {errors.submit && (
              <div className="p-4 bg-red-50 border border-brand-red/20 rounded-lg">
                <p className="text-sm text-brand-red">{errors.submit}</p>
              </div>
            )}
          </div>
        );
    }
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-brand-dark text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-brand-accent font-medium text-sm tracking-wider uppercase mb-3">
            Free Assessment
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            AI Readiness Assessment
          </h1>
          <p className="text-gray-300 text-lg max-w-xl mx-auto">
            Discover where AI can make the biggest impact on your workflows.
            Takes 3–5 minutes — you&apos;ll get a personalized report instantly.
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-brand-text">
                Section {step + 1} of {SECTIONS.length}
              </span>
              <span className="text-sm text-brand-muted">{SECTIONS[step]}</span>
            </div>
            <ProgressBar current={step} total={SECTIONS.length} />
          </div>

          {/* Section Title */}
          <h2 className="text-2xl font-bold text-brand-text mb-8">
            {SECTIONS[step]}
          </h2>

          {/* Questions */}
          {renderSection()}

          {/* Navigation */}
          <div className="flex justify-between mt-10 pt-6 border-t border-brand-border">
            {step > 0 ? (
              <Button variant="ghost" onClick={prev}>
                ← Back
              </Button>
            ) : (
              <div />
            )}
            {step < SECTIONS.length - 1 ? (
              <Button onClick={next}>Continue →</Button>
            ) : (
              <Button onClick={submit} loading={submitting} size="lg">
                Get My Results
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionIntro({ text }: { text: string }) {
  return (
    <p className="text-brand-muted text-sm border-l-2 border-brand-accent pl-4 italic">
      {text}
    </p>
  );
}

function Question({
  num,
  label,
  subtitle,
  error,
  children,
}: {
  num: number;
  label: string;
  subtitle?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-3">
        <span className="text-xs font-bold text-brand-accent mr-2">
          Q{num}.
        </span>
        <span className="text-sm font-semibold text-brand-text">{label}</span>
        {subtitle && (
          <span className="text-xs text-brand-muted ml-2">({subtitle})</span>
        )}
      </div>
      {children}
      {error && <p className="text-xs text-brand-red mt-2">{error}</p>}
    </div>
  );
}

function DiscoveryNote({
  prompt,
  value,
  onChange,
}: {
  prompt: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="bg-brand-light rounded-xl p-6 border border-brand-border">
      <div className="flex items-start gap-3 mb-3">
        <span className="text-lg">📝</span>
        <p className="text-sm text-brand-text italic">{prompt}</p>
      </div>
      <textarea
        rows={4}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Optional — but this helps us tailor our recommendations..."
        className="w-full px-3 py-2 rounded-md text-sm bg-white border border-brand-border text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
      />
    </div>
  );
}
