'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '' });

  const update = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Please enter your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(form.email, form.password);
      router.push('/book');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="font-display text-2xl font-bold text-brand-text">
          Sign In
        </h1>
        <p className="mt-2 text-sm text-brand-muted">
          Sign in to your account to book studio time and rent equipment.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => update('password', e.target.value)}
            required
          />

          {error && (
            <div className="rounded-md bg-brand-red/10 border border-brand-red/30 p-3">
              <p className="text-sm text-brand-red">{error}</p>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" loading={submitting}>
            Sign In
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-brand-muted">
          Don&apos;t have an account?{' '}
          <Link href="/account/create" className="text-brand-accent font-medium hover:text-brand-accent-hover">
            Create Account
          </Link>
        </p>
      </div>
    </div>
  );
}
