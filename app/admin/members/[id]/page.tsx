'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Calendar,
  DollarSign,
  CreditCard,
  ExternalLink,
  Shield,
  ShieldOff,
  Package,
  TrendingUp,
  Clock,
  Send,
  Loader2,
  MessageSquare,
  KeyRound,
  Check,
  User,
  ChevronRight,
  Activity,
  Star,
} from 'lucide-react';

interface Equipment {
  name: string;
  quantity: number;
  price: number;
  equipmentId?: string;
}

interface Rental {
  bookingId: string;
  rentalDate: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  rentalMode: string;
  productionType?: string;
  status: string;
  totalAmount: number;
  equipment: Equipment[];
  hasInsurance: boolean;
  createdAt: string;
}

interface Note {
  id: string;
  text: string;
  author: string;
  timestamp: string;
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface PreferredEquipment {
  name: string;
  count: number;
}

interface MemberData {
  customer: {
    customerId: string;
    name: string;
    email: string;
    phone?: string;
    company?: string;
    bio?: string;
    instagram?: string;
    linkedin?: string;
    website?: string;
    hasInsurance?: boolean;
    insuranceProvider?: string;
    createdAt: string;
    stripeCustomerId?: string | null;
  };
  stats: {
    totalRentals: number;
    totalSpent: number;
    avgRentalValue: number;
    clientStatus: 'new' | 'active' | 'at_risk' | 'inactive';
    lastRentalDate: string | null;
  };
  rentals: Rental[];
  preferredEquipment: PreferredEquipment[];
  paymentMethods: PaymentMethod[];
  notes: Note[];
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

const CLIENT_STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  active: { label: 'Active', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  at_risk: { label: 'At Risk', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  inactive: { label: 'Inactive', color: 'text-gray-600', bg: 'bg-gray-100 border-gray-300' },
};

function formatUSD(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function daysSince(dateStr: string) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24));
}

export default function MemberDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [data, setData] = useState<MemberData | null>(null);
  const [loading, setLoading] = useState(true);
  const [noteText, setNoteText] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [resetMessage, setResetMessage] = useState('');

  const loadMember = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/members/${id}`);
      if (!res.ok) throw new Error('Not found');
      setData(await res.json());
    } catch {
      // not found
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadMember(); }, [loadMember]);

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setNoteLoading(true);
    try {
      await fetch(`/api/admin/members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteText }),
      });
      setNoteText('');
      await loadMember();
    } catch { /* */ }
    finally { setNoteLoading(false); }
  }

  async function handlePasswordReset() {
    if (!newPassword || newPassword.length < 8) {
      setResetMessage('Min 8 characters');
      setResetStatus('error');
      return;
    }
    setResetStatus('saving');
    try {
      const res = await fetch(`/api/admin/members/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      if (res.ok) {
        setResetStatus('done');
        setResetMessage('Password updated');
        setNewPassword('');
        setTimeout(() => { setResetStatus('idle'); setResetMessage(''); }, 3000);
      } else {
        setResetStatus('error');
        setResetMessage('Reset failed');
      }
    } catch {
      setResetStatus('error');
      setResetMessage('Reset failed');
    }
  }

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-[400px]"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  if (!data) {
    return (
      <div className="p-8">
        <button onClick={() => router.push('/admin/members')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Members
        </button>
        <p className="text-gray-500">Member not found.</p>
      </div>
    );
  }

  const { customer, stats, rentals, preferredEquipment, paymentMethods, notes } = data;
  const clientStatusCfg = CLIENT_STATUS_CONFIG[stats.clientStatus];
  const mostRecent = rentals[0];

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push('/admin/members')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand-accent/10 flex items-center justify-center">
              <span className="text-xl font-bold text-brand-accent">{customer.name?.[0]?.toUpperCase()}</span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold border ${clientStatusCfg.bg} ${clientStatusCfg.color}`}>
                  {clientStatusCfg.label}
                </span>
              </div>
              <p className="text-sm text-gray-500">{customer.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-brand-accent" />
            <span className="text-xs font-medium text-gray-500 uppercase">Lifetime Value</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{formatUSD(stats.totalSpent)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <Package className="w-4 h-4 text-brand-accent" />
            <span className="text-xs font-medium text-gray-500 uppercase">Total Rentals</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalRentals}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-brand-accent" />
            <span className="text-xs font-medium text-gray-500 uppercase">Avg Rental</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalRentals > 0 ? formatUSD(stats.avgRentalValue) : '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-brand-accent" />
            <span className="text-xs font-medium text-gray-500 uppercase">Last Rental</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {stats.lastRentalDate ? `${daysSince(stats.lastRentalDate)}d ago` : '—'}
          </p>
          {stats.lastRentalDate && (
            <p className="text-xs text-gray-400">{stats.lastRentalDate}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Most Recent Rental */}
          {mostRecent && (
            <div
              className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 cursor-pointer hover:border-brand-accent/30 transition-colors"
              onClick={() => router.push(`/admin/rentals/${mostRecent.bookingId}`)}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Most Recent Rental</h2>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium text-gray-900">{mostRecent.rentalDate}</span>
                    {mostRecent.endDate && mostRecent.endDate !== mostRecent.rentalDate && (
                      <span className="text-sm text-gray-400">→ {mostRecent.endDate}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 capitalize">{mostRecent.rentalMode?.replace(/_/g, ' ')} · {mostRecent.equipment.length} item{mostRecent.equipment.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[mostRecent.status] || 'bg-gray-100 text-gray-600'}`}>
                    {STATUS_LABELS[mostRecent.status] || mostRecent.status}
                  </span>
                  <p className="text-lg font-bold text-gray-900 mt-1">{formatUSD(mostRecent.totalAmount)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Rental History */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Rental History</h2>
              <p className="text-xs text-gray-500 mt-0.5">{rentals.length} total bookings</p>
            </div>
            {rentals.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-400 text-sm">No rental history yet</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-2 font-medium text-gray-500">Date</th>
                    <th className="text-left px-6 py-2 font-medium text-gray-500">Type</th>
                    <th className="text-left px-6 py-2 font-medium text-gray-500">Items</th>
                    <th className="text-left px-6 py-2 font-medium text-gray-500">Status</th>
                    <th className="text-right px-6 py-2 font-medium text-gray-500">Total</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {rentals.map((r) => (
                    <tr
                      key={r.bookingId}
                      onClick={() => router.push(`/admin/rentals/${r.bookingId}`)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-3">
                        <span className="text-gray-900">{r.rentalDate}</span>
                      </td>
                      <td className="px-6 py-3 text-gray-600 capitalize">{r.rentalMode?.replace(/_/g, ' ')}</td>
                      <td className="px-6 py-3 text-gray-600">{r.equipment.length}</td>
                      <td className="px-6 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[r.status] || 'bg-gray-100 text-gray-600'}`}>
                          {STATUS_LABELS[r.status] || r.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-medium text-gray-900">{formatUSD(r.totalAmount)}</td>
                      <td className="px-2 py-3"><ChevronRight className="w-4 h-4 text-gray-300" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Admin Notes</h2>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Add a note about this client..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
              />
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim() || noteLoading}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-800 transition-colors"
              >
                {noteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
            <div className="space-y-3">
              {notes.length === 0 && <p className="text-sm text-gray-400">No notes yet</p>}
              {notes
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((note) => (
                  <div key={note.id} className="flex gap-3 text-sm">
                    <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-gray-900">{note.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{note.author} · {formatDateTime(note.timestamp)}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Right Column — Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Contact</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <a href={`mailto:${customer.email}`} className="text-gray-900 hover:text-brand-accent">{customer.email}</a>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <a href={`tel:${customer.phone}`} className="text-gray-900 hover:text-brand-accent">{customer.phone}</a>
                </div>
              )}
              {customer.company && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-900">{customer.company}</span>
                </div>
              )}
              {customer.website && (
                <div className="flex items-center gap-3">
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                  <a href={customer.website} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline truncate">
                    {customer.website.replace(/^https?:\/\//, '')}
                  </a>
                </div>
              )}
              {customer.bio && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">Bio</p>
                  <p className="text-gray-700">{customer.bio}</p>
                </div>
              )}
              {(customer.instagram || customer.linkedin) && (
                <div className="pt-2 border-t border-gray-100 flex gap-3">
                  {customer.instagram && (
                    <a href={`https://instagram.com/${customer.instagram}`} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-brand-accent">
                      @{customer.instagram}
                    </a>
                  )}
                  {customer.linkedin && (
                    <a href={customer.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-500 hover:text-brand-accent">
                      LinkedIn
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Preferred Equipment */}
          {preferredEquipment.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Preferred Equipment</h2>
              <div className="space-y-2">
                {preferredEquipment.map((eq, i) => (
                  <div key={eq.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {i === 0 && <Star className="w-3.5 h-3.5 text-brand-accent" />}
                      {i > 0 && <Package className="w-3.5 h-3.5 text-gray-300" />}
                      <span className="text-gray-900 truncate">{eq.name}</span>
                    </div>
                    <span className="text-gray-500 text-xs font-medium">{eq.count}x</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insurance */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">Insurance</h2>
            <div className="flex items-center gap-2 text-sm">
              {customer.hasInsurance ? (
                <>
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-green-700 font-medium">On File</span>
                </>
              ) : (
                <>
                  <ShieldOff className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-700 font-medium">Not Provided</span>
                </>
              )}
            </div>
            {customer.hasInsurance && customer.insuranceProvider && (
              <p className="text-sm text-gray-600 mt-1 ml-6">{customer.insuranceProvider}</p>
            )}
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Payment Methods</h2>
            </div>
            {paymentMethods.length > 0 ? (
              <div className="space-y-2">
                {paymentMethods.map((pm) => (
                  <div key={pm.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase text-gray-600">{pm.brand}</span>
                      <span className="text-sm text-gray-900 font-mono">•••• {pm.last4}</span>
                    </div>
                    <span className="text-xs text-gray-500">{String(pm.expMonth).padStart(2, '0')}/{String(pm.expYear).slice(-2)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No payment methods on file</p>
            )}
            {customer.stripeCustomerId && (
              <a
                href={`https://dashboard.stripe.com/customers/${customer.stripeCustomerId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs font-medium text-brand-accent border border-brand-accent/20 rounded-lg hover:bg-brand-accent/5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View in Stripe
              </a>
            )}
          </div>

          {/* Password Reset */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="w-4 h-4 text-gray-400" />
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">Reset Password</h2>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand-accent"
              />
              <button
                onClick={handlePasswordReset}
                disabled={resetStatus === 'saving'}
                className="px-3 py-1.5 text-xs font-medium bg-brand-accent text-white rounded-lg hover:bg-brand-accent-hover disabled:opacity-50 transition-colors"
              >
                {resetStatus === 'saving' ? <Loader2 className="w-3 h-3 animate-spin" /> :
                 resetStatus === 'done' ? <Check className="w-3 h-3" /> : 'Reset'}
              </button>
            </div>
            {resetMessage && (
              <p className={`text-xs mt-1 ${resetStatus === 'error' ? 'text-red-500' : 'text-green-600'}`}>{resetMessage}</p>
            )}
          </div>

          {/* Member Since */}
          <div className="text-center">
            <p className="text-xs text-gray-400">
              <User className="w-3 h-3 inline mr-1" />
              Member since {new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
