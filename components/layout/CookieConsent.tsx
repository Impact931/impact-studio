'use client';

import { useState, useEffect } from 'react';

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem('cookie-consent', 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem('cookie-consent', 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-brand-border bg-white p-4 shadow-lg sm:p-6">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 sm:flex-row">
        <p className="flex-1 text-sm text-brand-muted">
          This site uses cookies to improve your experience. By continuing to
          use this site, you consent to our use of cookies.{' '}
          <a href="/privacy" className="text-brand-accent underline">
            Learn more
          </a>
        </p>
        <div className="flex gap-3">
          <button
            onClick={decline}
            className="rounded-md border border-brand-border px-4 py-2 text-sm font-medium text-brand-muted transition-colors hover:bg-brand-light"
          >
            Decline
          </button>
          <button
            onClick={accept}
            className="rounded-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-accent-hover"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
