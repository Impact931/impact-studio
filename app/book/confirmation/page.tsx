'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Button from '@/components/ui/Button';
import Link from 'next/link';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-brand-black text-brand-text flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        {/* Success icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-brand-green/20 flex items-center justify-center">
            <svg
              className="w-8 h-8 text-brand-green"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-3xl font-display font-bold text-brand-white text-center mb-2">
          Booking Confirmed
        </h1>
        <p className="text-center text-brand-muted mb-6">
          Your studio rental has been successfully booked.
        </p>

        {sessionId && (
          <div className="bg-brand-card border border-brand-border rounded-lg p-5 mb-6">
            <p className="text-xs text-brand-muted mb-1">Booking Reference</p>
            <p className="text-sm font-mono text-brand-accent break-all">
              {sessionId}
            </p>
          </div>
        )}

        {/* What's Next */}
        <div className="bg-brand-card border border-brand-border rounded-lg p-5 mb-8">
          <h2 className="text-lg font-semibold text-brand-white mb-4">
            What&apos;s Next
          </h2>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-accent text-brand-black text-xs font-bold shrink-0">
                1
              </span>
              <div>
                <p className="text-sm text-brand-text font-medium">
                  Ops Manager Review
                </p>
                <p className="text-xs text-brand-muted">
                  Our operations manager will review your booking and confirm
                  equipment availability.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-accent text-brand-black text-xs font-bold shrink-0">
                2
              </span>
              <div>
                <p className="text-sm text-brand-text font-medium">
                  Confirmation Email
                </p>
                <p className="text-xs text-brand-muted">
                  You&apos;ll receive a confirmation email with your booking
                  details, rental agreement, and studio access instructions.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-accent text-brand-black text-xs font-bold shrink-0">
                3
              </span>
              <div>
                <p className="text-sm text-brand-text font-medium">
                  Studio Address
                </p>
                <p className="text-xs text-brand-muted">
                  Impact Studio — 2300 Rotary Park Dr, Suite A, Clarksville, TN
                  37043
                </p>
              </div>
            </li>
          </ul>
        </div>

        <div className="text-center">
          <Link href="/">
            <Button variant="secondary" size="lg">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-brand-black flex items-center justify-center">
          <p className="text-brand-muted">Loading...</p>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
