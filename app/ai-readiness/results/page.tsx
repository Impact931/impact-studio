'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Button from '@/components/ui/Button';
import { AssessmentResult, AssessmentTier } from '@/types/assessment';

// ---------------------------------------------------------------------------
// Score Gauge (circular SVG)
// ---------------------------------------------------------------------------

function ScoreGauge({ score, tier }: { score: number; tier: AssessmentTier }) {
  const radius = 80;
  const stroke = 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    tier === 'AI Curious'
      ? '#DC2626'
      : tier === 'AI Ready'
        ? '#D97706'
        : '#059669';

  return (
    <div className="flex flex-col items-center">
      <svg width="200" height="200" viewBox="0 0 200 200">
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="#E5E7EB"
          strokeWidth={stroke}
        />
        {/* Score arc */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 100 100)"
          className="transition-all duration-1000 ease-out"
        />
        {/* Score text */}
        <text
          x="100"
          y="92"
          textAnchor="middle"
          className="fill-brand-text"
          style={{ fontSize: '48px', fontWeight: 'bold' }}
        >
          {score}
        </text>
        <text
          x="100"
          y="118"
          textAnchor="middle"
          className="fill-brand-muted"
          style={{ fontSize: '14px' }}
        >
          out of 100
        </text>
      </svg>
      <span
        className="mt-3 px-5 py-1.5 rounded-full text-white text-sm font-bold"
        style={{ backgroundColor: color }}
      >
        {tier}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Signal Icon
// ---------------------------------------------------------------------------

function signalIcon(label: string): string {
  const icons: Record<string, string> = {
    'Process Mapping': '🗺️',
    'AI Training & Onboarding': '🎓',
    'Workflow Automation': '⚡',
    'AI Content Pipeline': '✍️',
    'Automated Analytics': '📊',
    'Automation ROI': '💰',
  };
  return icons[label] || '🔍';
}

// ---------------------------------------------------------------------------
// Results Content (needs searchParams)
// ---------------------------------------------------------------------------

function ResultsContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [result, setResult] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('No assessment ID provided.');
      setLoading(false);
      return;
    }

    fetch(`/api/assessment/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Assessment not found.');
        }
        return res.json();
      })
      .then((data) => {
        setResult(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-accent mx-auto mb-4" />
          <p className="text-brand-muted">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-brand-text mb-4">
            Assessment Not Found
          </h1>
          <p className="text-brand-muted mb-6">{error}</p>
          <a href="/ai-readiness">
            <Button>Take the Assessment</Button>
          </a>
        </div>
      </div>
    );
  }

  const { score, tier, tierDescription, strengths, signals, formData, submittedAt } =
    result;

  const bookingLink =
    'https://calendar.google.com/appointments/schedules/AcZssZ3y2VgrZ5Zh9tIyvBM0cz7vEQxFLbXk0Xw3lwC1vkYGWLxp9OqmFWVHNp8ic9ia4S_xk781q0w7';

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="bg-brand-dark text-white py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-brand-accent font-medium text-sm tracking-wider uppercase mb-2">
            Your Results
          </p>
          <h1 className="text-3xl font-bold mb-1">
            AI Readiness Report
          </h1>
          <p className="text-gray-400 text-sm">
            {formData.company} &middot;{' '}
            {new Date(submittedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </section>

      <section className="py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Score */}
          <div className="text-center mb-10">
            <ScoreGauge score={score} tier={tier} />
            <p className="mt-6 text-brand-muted text-sm max-w-lg mx-auto leading-relaxed">
              {tierDescription}
            </p>
          </div>

          {/* Strengths */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-brand-text mb-4">
              Your Strengths
            </h2>
            <div className="space-y-3">
              {strengths.map((s, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 p-4 bg-green-50 border border-green-100 rounded-lg"
                >
                  <span className="text-brand-success text-lg mt-0.5">✓</span>
                  <p className="text-sm text-brand-text">{s}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Opportunities */}
          {signals.length > 0 && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-brand-text mb-4">
                Biggest Opportunities
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {signals.map((signal, i) => (
                  <div
                    key={i}
                    className="p-5 border border-brand-border rounded-xl hover:border-brand-accent/40 transition-colors"
                  >
                    <div className="text-2xl mb-2">{signalIcon(signal.label)}</div>
                    <h3 className="font-semibold text-brand-text mb-2">
                      {signal.label}
                    </h3>
                    <p className="text-sm text-brand-muted leading-relaxed">
                      {signal.opportunity}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Discovery Notes */}
          {(formData.discoveryNote1 || formData.discoveryNote2 || formData.magicWandAnswer) && (
            <div className="mb-10">
              <h2 className="text-xl font-bold text-brand-text mb-4">
                Your Discovery Notes
              </h2>
              <div className="space-y-4">
                {formData.magicWandAnswer && (
                  <NoteCard
                    label="If AI could handle one thing perfectly..."
                    text={formData.magicWandAnswer}
                  />
                )}
                {formData.discoveryNote1 && (
                  <NoteCard
                    label="Tool & process frustrations"
                    text={formData.discoveryNote1}
                  />
                )}
                {formData.discoveryNote2 && (
                  <NoteCard
                    label="Information bottleneck"
                    text={formData.discoveryNote2}
                  />
                )}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="bg-brand-light rounded-2xl p-8 text-center border border-brand-border">
            <h2 className="text-xl font-bold text-brand-text mb-2">
              Ready to Put This Into Action?
            </h2>
            <p className="text-sm text-brand-muted mb-6 max-w-md mx-auto">
              Schedule a complimentary AI Workflow Review and we&apos;ll walk
              through your results, identify quick wins, and build a custom
              action plan for your team.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href={bookingLink} target="_blank" rel="noopener noreferrer">
                <Button size="lg">Schedule Your AI Workflow Review</Button>
              </a>
            </div>
            <p className="text-xs text-brand-muted mt-4">
              No cost. No obligation. Just a conversation about what&apos;s possible.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Note Card
// ---------------------------------------------------------------------------

function NoteCard({ label, text }: { label: string; text: string }) {
  return (
    <div className="border-l-4 border-brand-accent bg-brand-light rounded-r-lg p-4">
      <p className="text-xs font-medium text-brand-muted uppercase tracking-wider mb-1">
        {label}
      </p>
      <p className="text-sm text-brand-text italic">&ldquo;{text}&rdquo;</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page (wrapped in Suspense for useSearchParams)
// ---------------------------------------------------------------------------

export default function AIReadinessResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-accent" />
        </div>
      }
    >
      <ResultsContent />
    </Suspense>
  );
}
