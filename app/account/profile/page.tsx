'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { CustomerProfile } from '@/types/customer';
import { formatPrice } from '@/content/equipment-catalog';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface RentalRecord {
  bookingId: string;
  rentalDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  rentalMode: string;
  status: string;
  totalAmount: number;
  equipment: Array<{ name: string; quantity: number; price: number }>;
  createdAt: string;
}

export default function ProfilePage() {
  const { customer, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [rentals, setRentals] = useState<RentalRecord[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    company: '',
    phone: '',
    bio: '',
    instagram: '',
    linkedin: '',
    twitter: '',
    facebook: '',
    website: '',
  });

  // Fetch profile
  useEffect(() => {
    if (!customer) return;
    fetch(`/api/account/profile?customerId=${customer.customerId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile);
          setForm({
            name: data.profile.name || '',
            company: data.profile.company || '',
            phone: data.profile.phone || '',
            bio: data.profile.bio || '',
            instagram: data.profile.instagram || '',
            linkedin: data.profile.linkedin || '',
            twitter: data.profile.twitter || '',
            facebook: data.profile.facebook || '',
            website: data.profile.website || '',
          });
        }
      })
      .catch(console.error);
  }, [customer]);

  // Fetch rentals
  useEffect(() => {
    if (!customer) return;
    fetch(`/api/account/rentals?email=${encodeURIComponent(customer.email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.rentals) setRentals(data.rentals);
      })
      .catch(console.error);
  }, [customer]);

  const handleSave = async () => {
    if (!customer) return;
    setSaving(true);
    setMessage('');
    try {
      const res = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customer.customerId, ...form }),
      });
      if (!res.ok) throw new Error('Failed to update profile');
      const data = await res.json();
      setProfile(data.profile);
      setEditing(false);
      setMessage('Profile updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const optimizeImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        const MAX_SIZE = 1200;
        let { width, height } = img;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          const ratio = Math.min(MAX_SIZE / width, MAX_SIZE / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Canvas conversion failed'))),
          'image/webp',
          0.85,
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !customer) return;
    setUploading(true);
    setMessage('');
    try {
      // Optimize image client-side
      const optimized = await optimizeImage(file);
      const contentType = 'image/webp';

      // Get presigned URL
      const presignRes = await fetch('/api/account/profile-photo/presign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: customer.customerId,
          contentType,
          filename: file.name,
        }),
      });
      if (!presignRes.ok) throw new Error('Failed to get upload URL');
      const { uploadUrl, key } = await presignRes.json();

      // Upload directly to S3
      const uploadRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: optimized,
      });
      if (!uploadRes.ok) throw new Error('Upload to storage failed');

      // Confirm upload
      const completeRes = await fetch('/api/account/profile-photo/presign', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: customer.customerId, key }),
      });
      if (!completeRes.ok) throw new Error('Failed to save photo');
      const { url } = await completeRes.json();

      setProfile((prev) =>
        prev ? { ...prev, profilePhotoUrl: url } : prev,
      );
      setMessage('Photo updated successfully');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-brand-white flex items-center justify-center">
        <p className="text-brand-muted">Loading...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-brand-light">
        <div className="mx-auto max-w-md px-6 py-24 text-center">
          <h1 className="font-display text-2xl font-bold text-brand-text">
            Sign In Required
          </h1>
          <p className="mt-3 text-brand-muted">
            Please sign in to view your profile.
          </p>
          <Link
            href="/account/login"
            className="mt-6 inline-block rounded-full bg-brand-accent px-8 py-3 text-sm font-semibold text-white"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  return (
    <div className="min-h-screen bg-brand-light">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
        <h1 className="font-display text-3xl font-bold text-brand-text mb-8">
          My Profile
        </h1>

        {message && (
          <div className="mb-6 rounded-md bg-brand-accent/10 border border-brand-accent/30 p-3">
            <p className="text-sm text-brand-accent">{message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column — photo + quick info */}
          <div className="space-y-6">
            {/* Profile Photo */}
            <div className="bg-white rounded-lg border border-brand-border shadow-sm p-6 text-center">
              <div className="relative mx-auto mb-4 h-32 w-32 overflow-hidden rounded-full bg-brand-light border-2 border-brand-border">
                {profile?.profilePhotoUrl ? (
                  <Image
                    src={profile.profilePhotoUrl}
                    alt={profile.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-4xl font-bold text-brand-accent">
                    {customer.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <h2 className="font-display text-lg font-semibold text-brand-text">
                {profile?.name || customer.name}
              </h2>
              {profile?.company && (
                <p className="text-sm text-brand-muted">{profile.company}</p>
              )}
              <p className="text-xs text-brand-muted mt-1">{customer.email}</p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mt-4 text-xs font-medium text-brand-accent hover:text-brand-accent-hover disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Change Photo'}
              </button>

              {profile?.createdAt && (
                <p className="mt-3 text-xs text-brand-muted">
                  Member since{' '}
                  {new Date(profile.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>

            {/* Social Links (view mode) */}
            {!editing && (
              <div className="bg-white rounded-lg border border-brand-border shadow-sm p-6">
                <h3 className="text-sm font-semibold text-brand-text mb-3">
                  Links
                </h3>
                <div className="space-y-2">
                  {[
                    { label: 'Website', value: form.website },
                    { label: 'Instagram', value: form.instagram },
                    { label: 'LinkedIn', value: form.linkedin },
                    { label: 'X', value: form.twitter },
                    { label: 'Facebook', value: form.facebook },
                  ]
                    .filter((l) => l.value)
                    .map((link) => (
                      <a
                        key={link.label}
                        href={link.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-brand-accent hover:text-brand-accent-hover"
                      >
                        <span className="text-xs text-brand-muted w-16">
                          {link.label}
                        </span>
                        <span className="truncate">
                          {link.value.replace(/^https?:\/\/(www\.)?/, '')}
                        </span>
                      </a>
                    ))}
                  {![form.website, form.instagram, form.linkedin, form.twitter, form.facebook].some(Boolean) && (
                    <p className="text-xs text-brand-muted">
                      No links added yet.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right column — details + history */}
          <div className="lg:col-span-2 space-y-6">
            {/* About / Edit Form */}
            <div className="bg-white rounded-lg border border-brand-border shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-brand-text">
                  {editing ? 'Edit Profile' : 'About'}
                </h3>
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-sm font-medium text-brand-accent hover:text-brand-accent-hover"
                  >
                    Edit
                  </button>
                )}
              </div>

              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Name"
                      value={form.name}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, name: e.target.value }))
                      }
                    />
                    <Input
                      label="Company"
                      value={form.company}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, company: e.target.value }))
                      }
                    />
                    <Input
                      label="Phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, phone: e.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-brand-text block mb-1.5">
                      Bio
                    </label>
                    <textarea
                      value={form.bio}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, bio: e.target.value }))
                      }
                      rows={4}
                      className="w-full px-3 py-2 rounded-md text-sm bg-white border border-brand-border text-brand-text placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
                      placeholder="Tell us about yourself and your work..."
                    />
                  </div>

                  <h4 className="text-sm font-semibold text-brand-text pt-2">
                    Social Links
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Website"
                      value={form.website}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, website: e.target.value }))
                      }
                      placeholder="https://yoursite.com"
                    />
                    <Input
                      label="Instagram"
                      value={form.instagram}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, instagram: e.target.value }))
                      }
                      placeholder="https://instagram.com/handle"
                    />
                    <Input
                      label="LinkedIn"
                      value={form.linkedin}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, linkedin: e.target.value }))
                      }
                      placeholder="https://linkedin.com/in/handle"
                    />
                    <Input
                      label="X (Twitter)"
                      value={form.twitter}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, twitter: e.target.value }))
                      }
                      placeholder="https://x.com/handle"
                    />
                    <Input
                      label="Facebook"
                      value={form.facebook}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, facebook: e.target.value }))
                      }
                      placeholder="https://facebook.com/page"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button onClick={handleSave} loading={saving}>
                      Save Changes
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setEditing(false);
                        // Reset form to profile values
                        if (profile) {
                          setForm({
                            name: profile.name || '',
                            company: profile.company || '',
                            phone: profile.phone || '',
                            bio: profile.bio || '',
                            instagram: profile.instagram || '',
                            linkedin: profile.linkedin || '',
                            twitter: profile.twitter || '',
                            facebook: profile.facebook || '',
                            website: profile.website || '',
                          });
                        }
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  {form.bio ? (
                    <p className="text-sm text-brand-text whitespace-pre-wrap">
                      {form.bio}
                    </p>
                  ) : (
                    <p className="text-sm text-brand-muted italic">
                      No bio added yet. Click Edit to tell us about yourself.
                    </p>
                  )}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-brand-muted">Phone:</span>{' '}
                      <span className="text-brand-text">{form.phone}</span>
                    </div>
                    {form.company && (
                      <div>
                        <span className="text-brand-muted">Company:</span>{' '}
                        <span className="text-brand-text">{form.company}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Rental History */}
            <div className="bg-white rounded-lg border border-brand-border shadow-sm p-6">
              <h3 className="text-lg font-semibold text-brand-text mb-4">
                Rental History
              </h3>
              {rentals.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-brand-muted">
                    No rentals yet.
                  </p>
                  <Link
                    href="/book"
                    className="mt-3 inline-block text-sm font-medium text-brand-accent hover:text-brand-accent-hover"
                  >
                    Book Your First Rental
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-brand-border">
                  {rentals.map((rental) => (
                    <div key={rental.bookingId} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                statusColor[rental.status] || 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {rental.status}
                            </span>
                            <span className="text-xs text-brand-muted">
                              {rental.rentalMode === 'in_studio'
                                ? 'In-Studio'
                                : 'Equipment Only'}
                            </span>
                          </div>
                          <p className="text-sm text-brand-text">
                            {rental.rentalDate}
                            {rental.endDate && rental.endDate !== rental.rentalDate
                              ? ` — ${rental.endDate}`
                              : ''}{' '}
                            <span className="text-brand-muted">
                              {rental.startTime} – {rental.endTime}
                            </span>
                          </p>
                          <p className="mt-1 text-xs text-brand-muted truncate">
                            {rental.equipment
                              .map((e) => `${e.name}${e.quantity > 1 ? ` x${e.quantity}` : ''}`)
                              .join(', ')}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-brand-accent">
                          {formatPrice(rental.totalAmount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
