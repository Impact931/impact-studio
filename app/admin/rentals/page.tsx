'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Calendar, DollarSign, ChevronRight } from 'lucide-react';

interface Rental {
  bookingId: string;
  renterName: string;
  email: string;
  rentalDate: string;
  endDate?: string;
  rentalMode: string;
  total: number;
  status: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700',
  confirmed: 'bg-blue-50 text-blue-700',
  checked_out: 'bg-purple-50 text-purple-700',
  returned: 'bg-teal-50 text-teal-700',
  completed: 'bg-green-50 text-green-700',
  cancelled: 'bg-red-50 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  checked_out: 'Checked Out',
  returned: 'Returned',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const FILTER_ORDER = ['all', 'pending', 'confirmed', 'checked_out', 'returned', 'completed', 'cancelled'];

export default function RentalsPage() {
  const router = useRouter();
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/rentals');
        if (res.ok) {
          const data = await res.json();
          setRentals(data.rentals || []);
        }
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = rentals.filter((r) => {
    const matchesSearch =
      r.renterName?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Build filter tabs from actual data + standard order
  const activeStatuses = new Set(rentals.map((r) => r.status).filter(Boolean));
  const statuses = FILTER_ORDER.filter((s) => s === 'all' || activeStatuses.has(s));

  // Status counts
  const counts: Record<string, number> = {};
  rentals.forEach((r) => { counts[r.status] = (counts[r.status] || 0) + 1; });

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Rentals</h1>
        <p className="text-gray-500 mt-1">{rentals.length} total bookings</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-brand-accent text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {s === 'all' ? 'All' : STATUS_LABELS[s] || s}
              {s !== 'all' && counts[s] ? ` (${counts[s]})` : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-6 py-12 text-center text-gray-400">Loading rentals...</div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-400">
            {search || statusFilter !== 'all' ? 'No rentals match your filters' : 'No rentals yet'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Client</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Dates</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Type</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-right px-6 py-3 font-medium text-gray-500">Total</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r) => (
                  <tr
                    key={r.bookingId}
                    onClick={() => router.push(`/admin/rentals/${r.bookingId}`)}
                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{r.renterName}</p>
                      <p className="text-xs text-gray-500">{r.email}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{r.rentalDate}</span>
                        {r.endDate && r.endDate !== r.rentalDate && (
                          <span className="text-gray-400">→ {r.endDate}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-gray-600 capitalize">
                        {r.rentalMode?.replace(/_/g, ' ') || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                          STATUS_STYLES[r.status] || 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {STATUS_LABELS[r.status] || r.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1 font-medium text-gray-900">
                        <DollarSign className="w-3.5 h-3.5" />
                        {((r.total || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-2 py-4">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
