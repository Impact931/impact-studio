'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  Mail,
  Phone,
  Building2,
  User,
  Shield,
  ShieldOff,
  Package,
  FileText,
  Send,
  CheckCircle2,
  XCircle,
  Truck,
  RotateCcw,
  AlertTriangle,
  Loader2,
  MessageSquare,
  Receipt,
  ClipboardCheck,
} from 'lucide-react';

interface Equipment {
  name: string;
  quantity: number;
  price: number;
  equipmentId?: string;
}

interface Activity {
  id: string;
  action: string;
  details: string;
  performedBy: string;
  timestamp: string;
}

interface Note {
  id: string;
  text: string;
  author: string;
  timestamp: string;
}

interface ReturnItemInspection {
  equipmentName: string;
  returned: boolean;
  condition: 'good' | 'minor_damage' | 'damaged' | 'missing';
  notes: string;
}

interface Rental {
  bookingId: string;
  renterName: string;
  email: string;
  phone: string;
  company?: string;
  rentalDate: string;
  endDate?: string;
  startTime: string;
  endTime: string;
  rentalMode: string;
  productionType?: string;
  description?: string;
  estimatedPeople?: string;
  equipment: Equipment[];
  totalAmount: number;
  status: string;
  hasInsurance: boolean;
  insuranceProvider?: string;
  securityHold: boolean;
  damageWaiver: boolean;
  signatureImageKey?: string;
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  stripeCustomerId?: string;
  stripeAmountTotal?: number;
  depositPaymentIntentId?: string;
  depositStatus?: string;
  specialRequirements: string[];
  contentDisclosure: string[];
  createdAt: string;
  updatedAt?: string;
  confirmedAt?: string;
  checkedOutAt?: string;
  returnedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  returnInspection?: ReturnItemInspection[] | null;
  returnInspectedBy?: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pending', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  confirmed: { label: 'Confirmed', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  checked_out: { label: 'Checked Out', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  returned: { label: 'Returned', color: 'text-teal-700', bg: 'bg-teal-50 border-teal-200' },
  completed: { label: 'Completed', color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
  cancelled: { label: 'Cancelled', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
};

const STATUS_ACTIONS: Record<string, { action: string; label: string; icon: React.ComponentType<{ className?: string }>; color: string }[]> = {
  pending: [
    { action: 'confirmed', label: 'Confirm Rental', icon: CheckCircle2, color: 'bg-blue-600 hover:bg-blue-700 text-white' },
    { action: 'cancelled', label: 'Cancel', icon: XCircle, color: 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200' },
  ],
  confirmed: [
    { action: 'checked_out', label: 'Check Out Equipment', icon: Truck, color: 'bg-purple-600 hover:bg-purple-700 text-white' },
    { action: 'cancelled', label: 'Cancel', icon: XCircle, color: 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200' },
  ],
  checked_out: [
    { action: 'returned', label: 'Mark Returned', icon: RotateCcw, color: 'bg-teal-600 hover:bg-teal-700 text-white' },
    { action: 'cancelled', label: 'Cancel', icon: XCircle, color: 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200' },
  ],
  returned: [
    { action: 'completed', label: 'Complete Rental', icon: CheckCircle2, color: 'bg-green-600 hover:bg-green-700 text-white' },
  ],
  completed: [],
  cancelled: [],
};

function formatUSD(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function RentalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [rental, setRental] = useState<Rental | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [showNoteForAction, setShowNoteForAction] = useState<string | null>(null);
  const [depositAction, setDepositAction] = useState<string | null>(null);
  const [damageAmount, setDamageAmount] = useState('');
  const [error, setError] = useState('');
  const [showReturnInspection, setShowReturnInspection] = useState(false);
  const [inspectionItems, setInspectionItems] = useState<ReturnItemInspection[]>([]);
  const [receiptSent, setReceiptSent] = useState(false);

  const loadRental = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/rentals/${id}`);
      if (!res.ok) throw new Error('Not found');
      const data = await res.json();
      setRental(data.rental);
      setActivities(data.activities || []);
      setNotes(data.notes || []);
    } catch {
      setError('Rental not found');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadRental(); }, [loadRental]);

  async function handleStatusChange(action: string) {
    if (action === 'cancelled' && !statusNote) {
      setShowNoteForAction(action);
      return;
    }

    setActionLoading(action);
    setError('');
    try {
      const res = await fetch(`/api/admin/rentals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: statusNote || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed');
      }
      setStatusNote('');
      setShowNoteForAction(null);
      await loadRental();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleAddNote() {
    if (!noteText.trim()) return;
    setActionLoading('note');
    try {
      const res = await fetch(`/api/admin/rentals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: noteText }),
      });
      if (!res.ok) throw new Error('Failed to add note');
      setNoteText('');
      await loadRental();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSendReceipt() {
    setActionLoading('receipt');
    setError('');
    try {
      const res = await fetch(`/api/admin/rentals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sendReceipt' }),
      });
      if (!res.ok) throw new Error('Failed to send receipt');
      setReceiptSent(true);
      setTimeout(() => setReceiptSent(false), 3000);
      await loadRental();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send receipt');
    } finally {
      setActionLoading(null);
    }
  }

  function openReturnInspection() {
    if (!rental) return;
    setInspectionItems(
      rental.equipment.map((item) => ({
        equipmentName: item.name,
        returned: true,
        condition: 'good' as const,
        notes: '',
      })),
    );
    setShowReturnInspection(true);
  }

  function updateInspectionItem(index: number, updates: Partial<ReturnItemInspection>) {
    setInspectionItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...updates } : item)),
    );
  }

  async function submitReturnInspection() {
    setActionLoading('returned');
    setError('');
    try {
      const hasIssues = inspectionItems.some((i) => !i.returned || i.condition !== 'good');
      const summaryNote = hasIssues
        ? `Return inspection: ${inspectionItems.filter((i) => !i.returned || i.condition !== 'good').map((i) => `${i.equipmentName} — ${i.returned ? i.condition.replace(/_/g, ' ') : 'MISSING'}${i.notes ? ` (${i.notes})` : ''}`).join('; ')}`
        : 'All items returned in good condition';

      const res = await fetch(`/api/admin/rentals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'returned',
          note: summaryNote,
          returnInspection: inspectionItems,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed');
      }
      setShowReturnInspection(false);
      setStatusNote('');
      await loadRental();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Return failed');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDeposit(action: string) {
    setActionLoading(`deposit-${action}`);
    setError('');
    try {
      const body: Record<string, unknown> = { action, bookingId: id };
      if (action === 'capture' || action === 'charge') {
        const amt = Math.round(parseFloat(damageAmount) * 100);
        if (!amt || amt <= 0) {
          setError('Enter a valid dollar amount');
          setActionLoading(null);
          return;
        }
        body.amount = amt;
      }
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed');
      }
      setDepositAction(null);
      setDamageAmount('');
      await loadRental();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deposit action failed');
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!rental) {
    return (
      <div className="p-8">
        <button onClick={() => router.push('/admin/rentals')} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Rentals
        </button>
        <p className="text-gray-500">Rental not found.</p>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[rental.status] || STATUS_CONFIG.pending;
  const actions = STATUS_ACTIONS[rental.status] || [];
  const isMultiDay = rental.endDate && rental.endDate !== rental.rentalDate;

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => router.push('/admin/rentals')} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{rental.renterName}</h1>
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold border ${statusCfg.bg} ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1 font-mono">#{rental.bookingId.slice(0, 8)}</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
          <button onClick={() => setError('')} className="ml-auto text-red-500 hover:text-red-700">&times;</button>
        </div>
      )}

      {/* Return Inspection Form */}
      {showReturnInspection && (
        <div className="mb-6 p-6 bg-white rounded-xl border-2 border-teal-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardCheck className="w-5 h-5 text-teal-600" />
            <h2 className="text-lg font-semibold text-gray-900">Return Check-In</h2>
          </div>
          <p className="text-sm text-gray-500 mb-4">Inspect each item and note its condition before completing the return.</p>

          <div className="space-y-3">
            {inspectionItems.map((item, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-4 flex-wrap">
                  <label className="flex items-center gap-2 min-w-[180px]">
                    <input
                      type="checkbox"
                      checked={item.returned}
                      onChange={(e) => updateInspectionItem(i, { returned: e.target.checked, condition: e.target.checked ? item.condition : 'missing' })}
                      className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="font-medium text-gray-900 text-sm">{item.equipmentName}</span>
                  </label>

                  <select
                    value={item.condition}
                    onChange={(e) => updateInspectionItem(i, { condition: e.target.value as ReturnItemInspection['condition'] })}
                    disabled={!item.returned}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm bg-white disabled:opacity-50 disabled:bg-gray-100"
                  >
                    <option value="good">Good</option>
                    <option value="minor_damage">Minor Damage</option>
                    <option value="damaged">Damaged</option>
                    <option value="missing">Missing</option>
                  </select>

                  <input
                    type="text"
                    placeholder="Notes (optional)..."
                    value={item.notes}
                    onChange={(e) => updateInspectionItem(i, { notes: e.target.value })}
                    className="flex-1 min-w-[150px] px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50"
                  />
                </div>
              </div>
            ))}
          </div>

          {inspectionItems.some((i) => !i.returned || i.condition !== 'good') && (
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                Issues detected: {inspectionItems.filter((i) => !i.returned || i.condition !== 'good').map((i) =>
                  `${i.equipmentName} (${i.returned ? i.condition.replace(/_/g, ' ') : 'missing'})`
                ).join(', ')}
              </p>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <button
              onClick={submitReturnInspection}
              disabled={!!actionLoading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              {actionLoading === 'returned' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Complete Return
            </button>
            <button
              onClick={() => setShowReturnInspection(false)}
              className="px-4 py-2.5 text-gray-500 hover:text-gray-700 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Email Receipt for terminal statuses (no other actions) */}
      {actions.length === 0 && !['pending', 'cancelled'].includes(rental.status) && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-3">Actions</p>
          <button
            onClick={handleSendReceipt}
            disabled={!!actionLoading}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border disabled:opacity-50 ${
              receiptSent
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {actionLoading === 'receipt' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : receiptSent ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <Receipt className="w-4 h-4" />
            )}
            {receiptSent ? 'Receipt Sent' : 'Email Receipt'}
          </button>
        </div>
      )}

      {/* Status Actions */}
      {actions.length > 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-200">
          <p className="text-sm font-medium text-gray-600 mb-3">Actions</p>

          {showNoteForAction && (
            <div className="mb-3 flex gap-2">
              <input
                type="text"
                placeholder="Reason for cancellation (required)..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
              />
              <button
                onClick={() => handleStatusChange(showNoteForAction)}
                disabled={!statusNote.trim() || !!actionLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Cancel'}
              </button>
              <button onClick={() => { setShowNoteForAction(null); setStatusNote(''); }} className="px-3 py-2 text-gray-500 hover:text-gray-700">
                Back
              </button>
            </div>
          )}

          {!showNoteForAction && (
            <div className="flex flex-wrap gap-2">
              {actions.map((a) => {
                const Icon = a.icon;
                const isReturnAction = a.action === 'returned';
                return (
                  <button
                    key={a.action}
                    onClick={() => isReturnAction ? openReturnInspection() : handleStatusChange(a.action)}
                    disabled={!!actionLoading}
                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${a.color} disabled:opacity-50`}
                  >
                    {actionLoading === a.action ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                    {isReturnAction ? 'Return Check-In' : a.label}
                  </button>
                );
              })}

              {/* Email Receipt */}
              {!['pending', 'cancelled'].includes(rental.status) && (
                <button
                  onClick={handleSendReceipt}
                  disabled={!!actionLoading}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors border disabled:opacity-50 ${
                    receiptSent
                      ? 'bg-green-50 border-green-200 text-green-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {actionLoading === 'receipt' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : receiptSent ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Receipt className="w-4 h-4" />
                  )}
                  {receiptSent ? 'Receipt Sent' : 'Email Receipt'}
                </button>
              )}

              {/* Optional note for non-cancel actions */}
              <input
                type="text"
                placeholder="Add note with status change (optional)..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
              />
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Customer</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-400" />
                <div><p className="font-medium text-gray-900">{rental.renterName}</p><p className="text-gray-500">Name</p></div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-400" />
                <div><p className="font-medium text-gray-900">{rental.email}</p><p className="text-gray-500">Email</p></div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div><p className="font-medium text-gray-900">{rental.phone || '—'}</p><p className="text-gray-500">Phone</p></div>
              </div>
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-gray-400" />
                <div><p className="font-medium text-gray-900">{rental.company || '—'}</p><p className="text-gray-500">Company</p></div>
              </div>
            </div>
          </div>

          {/* Rental Details */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Rental Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    {rental.rentalDate}{isMultiDay && ` → ${rental.endDate}`}
                  </p>
                  <p className="text-gray-500">Date{isMultiDay ? 's' : ''}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-gray-400" />
                <div><p className="font-medium text-gray-900">{rental.startTime} — {rental.endTime}</p><p className="text-gray-500">Time</p></div>
              </div>
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 capitalize">{rental.rentalMode?.replace(/_/g, ' ')}</p>
                  <p className="text-gray-500">Rental Mode</p>
                </div>
              </div>
              {rental.productionType && (
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <div><p className="font-medium text-gray-900">{rental.productionType}</p><p className="text-gray-500">Production Type</p></div>
                </div>
              )}
            </div>
            {rental.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p className="text-sm text-gray-900">{rental.description}</p>
              </div>
            )}
            {rental.specialRequirements?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500 mb-1">Special Requirements</p>
                <ul className="text-sm text-gray-900 list-disc list-inside">
                  {rental.specialRequirements.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>

          {/* Equipment */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Equipment</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 font-medium text-gray-500">Item</th>
                  <th className="text-center py-2 font-medium text-gray-500 w-16">Qty</th>
                  <th className="text-right py-2 font-medium text-gray-500 w-24">Price</th>
                  <th className="text-right py-2 font-medium text-gray-500 w-24">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rental.equipment.map((item, i) => {
                  const inspection = rental.returnInspection?.find((ri) => ri.equipmentName === item.name);
                  return (
                    <tr key={i}>
                      <td className="py-3">
                        <span className="text-gray-900">{item.name}</span>
                        {inspection && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                              !inspection.returned ? 'bg-red-50 text-red-700' :
                              inspection.condition === 'good' ? 'bg-green-50 text-green-700' :
                              inspection.condition === 'minor_damage' ? 'bg-amber-50 text-amber-700' :
                              inspection.condition === 'damaged' ? 'bg-red-50 text-red-700' :
                              'bg-red-50 text-red-700'
                            }`}>
                              {!inspection.returned ? 'Missing' : inspection.condition.replace(/_/g, ' ')}
                            </span>
                            {inspection.notes && (
                              <span className="text-xs text-gray-500">{inspection.notes}</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-center text-gray-600">{item.quantity}</td>
                      <td className="py-3 text-right text-gray-600">{formatUSD(item.price)}</td>
                      <td className="py-3 text-right font-medium text-gray-900">{formatUSD(item.price * item.quantity)}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td colSpan={3} className="py-3 text-right font-semibold text-gray-900">Total</td>
                  <td className="py-3 text-right font-bold text-lg text-brand-accent">{formatUSD(rental.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>
            {rental.returnInspection && rental.returnInspectedBy && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-500">
                <ClipboardCheck className="w-3.5 h-3.5" />
                <span>Inspected by {rental.returnInspectedBy}{rental.returnedAt ? ` · ${formatDateTime(rental.returnedAt)}` : ''}</span>
              </div>
            )}
          </div>

          {/* Notes & Activity */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Notes & Activity</h2>

            {/* Add Note */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                placeholder="Add a note..."
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50"
              />
              <button
                onClick={handleAddNote}
                disabled={!noteText.trim() || actionLoading === 'note'}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-gray-800 transition-colors"
              >
                {actionLoading === 'note' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>

            {/* Timeline */}
            <div className="space-y-3">
              {[...notes.map((n) => ({ type: 'note' as const, ...n, timestamp: n.timestamp })),
                ...activities.map((a) => ({ type: 'activity' as const, ...a, timestamp: a.timestamp }))]
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((item, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.type === 'note' ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {item.type === 'note' ? <MessageSquare className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900">
                        {item.type === 'note' ? (item as Note & { type: 'note' }).text : (item as Activity & { type: 'activity' }).details}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.type === 'note' ? (item as Note & { type: 'note' }).author : (item as Activity & { type: 'activity' }).performedBy}
                        {' · '}{formatDateTime(item.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}

              {/* Created entry always at bottom */}
              <div className="flex gap-3 text-sm">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-green-50 text-green-600">
                  <Package className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="text-gray-900">Booking created</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(rental.createdAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column — Sidebar */}
        <div className="space-y-6">
          {/* Payment */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Payment</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Total</span>
                <span className="font-bold text-lg text-gray-900">{formatUSD(rental.totalAmount)}</span>
              </div>
              {rental.stripeAmountTotal && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Stripe Charged</span>
                  <span className="font-medium text-gray-900">{formatUSD(rental.stripeAmountTotal)}</span>
                </div>
              )}
              {rental.stripeSessionId && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-400">Checkout Session</p>
                  <p className="font-mono text-xs text-gray-600 break-all">{rental.stripeSessionId}</p>
                </div>
              )}
              {rental.stripePaymentIntentId && (
                <div>
                  <p className="text-xs text-gray-400">Payment Intent</p>
                  <p className="font-mono text-xs text-gray-600 break-all">{rental.stripePaymentIntentId}</p>
                </div>
              )}
            </div>
          </div>

          {/* Insurance & Deposit */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Insurance & Deposit</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                {rental.hasInsurance ? (
                  <>
                    <Shield className="w-4 h-4 text-green-600" />
                    <span className="text-green-700 font-medium">Insured</span>
                  </>
                ) : (
                  <>
                    <ShieldOff className="w-4 h-4 text-red-500" />
                    <span className="text-red-600 font-medium">No Insurance</span>
                  </>
                )}
              </div>
              {rental.hasInsurance && rental.insuranceProvider && (
                <p className="text-gray-600 ml-6">{rental.insuranceProvider}</p>
              )}
              {rental.damageWaiver && (
                <p className="text-gray-600">Damage waiver: <span className="font-medium">Yes</span></p>
              )}
              {rental.depositPaymentIntentId && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xs text-gray-400 mb-1">Security Deposit Hold</p>
                  <p className="font-mono text-xs text-gray-600 break-all">{rental.depositPaymentIntentId}</p>
                  {rental.depositStatus && (
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                      rental.depositStatus === 'released' ? 'bg-green-50 text-green-700' :
                      rental.depositStatus === 'captured' ? 'bg-red-50 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {rental.depositStatus}
                    </span>
                  )}

                  {/* Deposit actions */}
                  {!rental.depositStatus && (rental.status === 'returned' || rental.status === 'completed') && (
                    <div className="mt-3 space-y-2">
                      {!depositAction ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeposit('release')}
                            disabled={!!actionLoading}
                            className="flex-1 px-3 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-100 disabled:opacity-50"
                          >
                            Release Hold
                          </button>
                          <button
                            onClick={() => setDepositAction('capture')}
                            disabled={!!actionLoading}
                            className="flex-1 px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-medium hover:bg-red-100 disabled:opacity-50"
                          >
                            Charge Damage
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Damage amount ($)"
                            value={damageAmount}
                            onChange={(e) => setDamageAmount(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleDeposit('capture')}
                              disabled={!!actionLoading}
                              className="flex-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium disabled:opacity-50"
                            >
                              {actionLoading === 'deposit-capture' ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : 'Charge'}
                            </button>
                            <button
                              onClick={() => { setDepositAction(null); setDamageAmount(''); }}
                              className="px-3 py-1.5 text-gray-500 text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Timeline Timestamps */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">Timeline</h2>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Created', time: rental.createdAt },
                { label: 'Confirmed', time: rental.confirmedAt },
                { label: 'Checked Out', time: rental.checkedOutAt },
                { label: 'Returned', time: rental.returnedAt },
                { label: 'Completed', time: rental.completedAt },
                { label: 'Cancelled', time: rental.cancelledAt },
              ]
                .filter((t) => t.time)
                .map((t) => (
                  <div key={t.label} className="flex justify-between">
                    <span className="text-gray-500">{t.label}</span>
                    <span className="text-gray-900">{formatDateTime(t.time!)}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
