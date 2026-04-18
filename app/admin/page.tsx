'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Users, CalendarDays, DollarSign, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalMembers: number;
  totalRentals: number;
  totalRevenue: number;
  recentMembers: { name: string; email: string; createdAt: string }[];
  recentRentals: { renterName: string; rentalDate: string; total: number; status: string }[];
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{label}</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/stats');
        if (res.ok) {
          setStats(await res.json());
        }
      } catch {
        // Stats will show as 0
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const firstName = session?.user?.name?.split(' ')[0] || session?.user?.email?.split('@')[0] || 'Admin';

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {firstName}</h1>
        <p className="text-gray-500 mt-1">Here&apos;s what&apos;s happening at Impact Studio.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatCard
          label="Total Members"
          value={loading ? '—' : String(stats?.totalMembers ?? 0)}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Total Rentals"
          value={loading ? '—' : String(stats?.totalRentals ?? 0)}
          icon={<CalendarDays className="w-6 h-6 text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard
          label="Revenue"
          value={loading ? '—' : `$${(stats?.totalRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
          color="bg-green-50"
        />
        <StatCard
          label="This Month"
          value={loading ? '—' : `$${(stats?.recentRentals?.reduce((sum, r) => sum + (r.total || 0), 0) ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={<TrendingUp className="w-6 h-6 text-amber-600" />}
          color="bg-amber-50"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Members */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Members</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="px-6 py-8 text-center text-gray-400">Loading...</div>
            ) : stats?.recentMembers?.length ? (
              stats.recentMembers.slice(0, 5).map((m, i) => (
                <div key={i} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.name}</p>
                    <p className="text-xs text-gray-500">{m.email}</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-400">No members yet</div>
            )}
          </div>
        </div>

        {/* Recent Rentals */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Rentals</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="px-6 py-8 text-center text-gray-400">Loading...</div>
            ) : stats?.recentRentals?.length ? (
              stats.recentRentals.slice(0, 5).map((r, i) => (
                <div key={i} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.renterName}</p>
                    <p className="text-xs text-gray-500">{r.rentalDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      ${(r.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.status === 'confirmed'
                        ? 'bg-green-50 text-green-700'
                        : r.status === 'pending'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {r.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-400">No rentals yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
