export default function Footer() {
  return (
    <footer className="border-t border-brand-border bg-brand-dark">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div>
            <h3 className="font-display text-lg font-bold text-brand-white">
              Impact Studio
            </h3>
            <p className="mt-1 text-sm text-brand-muted">
              JHR Photography LLC
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-brand-muted">
              Contact
            </h4>
            <address className="mt-3 space-y-1 text-sm not-italic text-brand-text">
              <p>2300 Rotary Park Dr, Suite A</p>
              <p>Clarksville, TN 37043</p>
              <p className="mt-2">
                <a
                  href="tel:6152498096"
                  className="transition-colors hover:text-brand-accent"
                >
                  615-249-8096
                </a>
              </p>
            </address>
          </div>

          {/* Hours */}
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-brand-muted">
              Studio Hours
            </h4>
            <p className="mt-3 text-sm text-brand-text">
              7:00 AM &ndash; 11:00 PM
            </p>
            <p className="mt-1 text-sm text-brand-muted">Seven days a week</p>
          </div>
        </div>

        <div className="mt-12 border-t border-brand-border pt-6 text-center text-xs text-brand-muted">
          &copy; 2026 Impact Studio &mdash; JHR Photography LLC. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
