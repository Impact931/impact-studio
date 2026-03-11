'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { label, error, options, placeholder, id, className = '', ...rest },
    ref,
  ) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={selectId}
            className="text-sm font-medium text-brand-text"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`
            w-full px-3 py-2 rounded-md text-sm appearance-none
            bg-white border border-brand-border text-brand-text
            focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-brand-red ring-1 ring-brand-red' : ''}
            ${className}
          `}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-xs text-brand-red">{error}</p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
export default Select;
