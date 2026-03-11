'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = '', type = 'text', ...rest }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-brand-text"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`
            w-full px-3 py-2 rounded-md text-sm
            bg-white border border-brand-border text-brand-text
            placeholder:text-brand-muted
            focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-brand-red ring-1 ring-brand-red' : ''}
            ${className}
          `}
          {...rest}
        />
        {error && (
          <p className="text-xs text-brand-red">{error}</p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';
export default Input;
