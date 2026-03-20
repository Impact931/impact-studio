'use client';

import { useSession } from 'next-auth/react';
import { Settings, Globe, Mail, Database } from 'lucide-react';

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your site configuration.</p>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Admin Info */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Settings className="w-5 h-5 text-brand-accent" />
            <h2 className="font-semibold text-gray-900">Admin Account</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Email</span>
              <span className="text-gray-900">{session?.user?.email || '—'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Role</span>
              <span className="text-gray-900">Administrator</span>
            </div>
          </div>
        </div>

        {/* Site Config */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-brand-accent" />
            <h2 className="font-semibold text-gray-900">Site</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Domain</span>
              <span className="text-gray-900">impactstudio931.com</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Platform</span>
              <span className="text-gray-900">Next.js on AWS Amplify</span>
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <Database className="w-5 h-5 text-brand-accent" />
            <h2 className="font-semibold text-gray-900">Integrations</h2>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Payments</span>
              <span className="inline-flex items-center gap-1.5 text-green-700">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Stripe Connected
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">CRM</span>
              <span className="inline-flex items-center gap-1.5 text-green-700">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Notion Synced
              </span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">Email</span>
              <span className="inline-flex items-center gap-1.5 text-green-700">
                <span className="w-2 h-2 rounded-full bg-green-500" /> AWS SES Active
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-500">Storage</span>
              <span className="inline-flex items-center gap-1.5 text-green-700">
                <span className="w-2 h-2 rounded-full bg-green-500" /> S3 + CloudFront
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
