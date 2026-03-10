'use client';

interface PricingToggleProps {
  mode: 'in_studio' | 'out_of_studio';
  onChange: (mode: 'in_studio' | 'out_of_studio') => void;
}

export default function PricingToggle({ mode, onChange }: PricingToggleProps) {
  return (
    <div className="inline-flex items-center rounded-full border border-brand-border bg-brand-dark p-1">
      <button
        type="button"
        onClick={() => onChange('in_studio')}
        className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
          mode === 'in_studio'
            ? 'bg-brand-accent text-brand-black'
            : 'text-brand-muted hover:text-brand-text'
        }`}
      >
        In-Studio
      </button>
      <button
        type="button"
        onClick={() => onChange('out_of_studio')}
        className={`rounded-full px-5 py-2 text-sm font-medium transition-all ${
          mode === 'out_of_studio'
            ? 'bg-brand-accent text-brand-black'
            : 'text-brand-muted hover:text-brand-text'
        }`}
      >
        Out-of-Studio
      </button>
    </div>
  );
}
