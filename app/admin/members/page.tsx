'use client';

import { useEffect, useState } from 'react';
import { Search, Mail, Phone, Calendar, CreditCard, X, ExternalLink, Building } from 'lucide-react';

interface Member {
  customerId: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  createdAt: string;
  totalRentals?: number;
  totalSpent?: number;
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface MemberDetail {
  customer: Member & {
    bio?: string;
    instagram?: string;
    linkedin?: string;
    website?: string;
    hasInsurance?: boolean;
    stripeCustomerId?: string | null;
  };
  paymentMethods: PaymentMethod[];
}

function CardBrandIcon({ brand }: { brand: string }) {
  const colors: Record<string, string> = {
    visa: 'text-blue-600',
    mastercard: 'text-red-500',
    amex: 'text-blue-500',
    discover: 'text-orange-500',
  };
  return (
    <span className={`text-xs font-bold uppercase ${colors[brand] || 'text-gray-600'}`}>
      {brand}
    </span>
  );
}

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<MemberDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/admin/members');
        if (res.ok) {
          const data = await res.json();
          setMembers(data.members || []);
        }
      } catch {
        // empty
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function openDetail(customerId: string) {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/members/${customerId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedMember(data);
      }
    } catch {
      // empty
    } finally {
      setDetailLoading(false);
    }
  }

  const filtered = members.filter(
    (m) =>
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.company?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Members</h1>
          <p className="text-gray-500 mt-1">{members.length} registered members</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, email, or company..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent/50 focus:border-brand-accent"
        />
      </div>

      <div className="flex gap-6">
        {/* Table */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="px-6 py-12 text-center text-gray-400">Loading members...</div>
            ) : filtered.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400">
                {search ? 'No members match your search' : 'No members yet'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Name</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Contact</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Company</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Joined</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500">Rentals</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-500">Spent</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filtered.map((m) => (
                      <tr
                        key={m.customerId}
                        onClick={() => openDetail(m.customerId)}
                        className={`cursor-pointer transition-colors ${
                          selectedMember?.customer.customerId === m.customerId
                            ? 'bg-brand-accent/5'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-sm font-medium text-brand-accent">
                                {m.name?.[0]?.toUpperCase() || '?'}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900">{m.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Mail className="w-3.5 h-3.5" />
                              <span>{m.email}</span>
                            </div>
                            {m.phone && (
                              <div className="flex items-center gap-1.5 text-gray-500">
                                <Phone className="w-3.5 h-3.5" />
                                <span>{m.phone}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{m.company || '—'}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{new Date(m.createdAt).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right text-gray-900 font-medium">
                          {m.totalRentals ?? 0}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-900 font-medium">
                          ${(m.totalSpent ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {(selectedMember || detailLoading) && (
          <div className="hidden lg:block w-80 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden sticky top-6">
              {detailLoading ? (
                <div className="p-6 text-center text-gray-400">Loading...</div>
              ) : selectedMember ? (
                <>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="font-medium text-gray-900 text-sm">Member Details</h3>
                    <button
                      onClick={() => setSelectedMember(null)}
                      className="p-1 rounded text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4">
                    {/* Profile */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-brand-accent/10 flex items-center justify-center">
                        <span className="text-lg font-bold text-brand-accent">
                          {selectedMember.customer.name?.[0]?.toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{selectedMember.customer.name}</p>
                        <p className="text-xs text-gray-500">{selectedMember.customer.email}</p>
                      </div>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 mb-4">
                      {selectedMember.customer.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Phone className="w-4 h-4 text-gray-400" />
                          {selectedMember.customer.phone}
                        </div>
                      )}
                      {selectedMember.customer.company && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Building className="w-4 h-4 text-gray-400" />
                          {selectedMember.customer.company}
                        </div>
                      )}
                      {selectedMember.customer.website && (
                        <div className="flex items-center gap-2 text-sm">
                          <ExternalLink className="w-4 h-4 text-gray-400" />
                          <a
                            href={selectedMember.customer.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-brand-accent hover:underline"
                          >
                            {selectedMember.customer.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Bio */}
                    {selectedMember.customer.bio && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-gray-500 mb-1">Bio</p>
                        <p className="text-sm text-gray-700">{selectedMember.customer.bio}</p>
                      </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-gray-900">{selectedMember.customer.totalRentals ?? 0}</p>
                        <p className="text-xs text-gray-500">Rentals</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-gray-900">${(selectedMember.customer.totalSpent ?? 0).toLocaleString()}</p>
                        <p className="text-xs text-gray-500">Spent</p>
                      </div>
                    </div>

                    {/* Insurance Status */}
                    <div className="flex items-center justify-between py-2 border-t border-gray-100 mb-3">
                      <span className="text-sm text-gray-500">Insurance</span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        selectedMember.customer.hasInsurance
                          ? 'bg-green-50 text-green-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}>
                        {selectedMember.customer.hasInsurance ? 'On File' : 'Not Provided'}
                      </span>
                    </div>

                    {/* Payment Methods */}
                    <div className="border-t border-gray-100 pt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-4 h-4 text-gray-400" />
                        <p className="text-xs font-medium text-gray-500">Payment Methods</p>
                      </div>
                      {selectedMember.paymentMethods.length > 0 ? (
                        <div className="space-y-2">
                          {selectedMember.paymentMethods.map((pm) => (
                            <div key={pm.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                              <div className="flex items-center gap-2">
                                <CardBrandIcon brand={pm.brand} />
                                <span className="text-sm text-gray-900 font-mono">•••• {pm.last4}</span>
                              </div>
                              <span className="text-xs text-gray-500">
                                {pm.expMonth.toString().padStart(2, '0')}/{pm.expYear.toString().slice(-2)}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No payment methods on file</p>
                      )}

                      {/* Stripe Dashboard Link */}
                      {selectedMember.customer.stripeCustomerId && (
                        <a
                          href={`https://dashboard.stripe.com/customers/${selectedMember.customer.stripeCustomerId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs font-medium text-brand-accent border border-brand-accent/20 rounded-lg hover:bg-brand-accent/5 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          View in Stripe
                        </a>
                      )}
                    </div>

                    {/* Social Links */}
                    {(selectedMember.customer.instagram || selectedMember.customer.linkedin) && (
                      <div className="border-t border-gray-100 pt-3 mt-3">
                        <p className="text-xs font-medium text-gray-500 mb-2">Social</p>
                        <div className="flex gap-2">
                          {selectedMember.customer.instagram && (
                            <a
                              href={`https://instagram.com/${selectedMember.customer.instagram}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-gray-500 hover:text-brand-accent"
                            >
                              @{selectedMember.customer.instagram}
                            </a>
                          )}
                          {selectedMember.customer.linkedin && (
                            <a
                              href={selectedMember.customer.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-gray-500 hover:text-brand-accent"
                            >
                              LinkedIn
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="text-xs text-gray-400 mt-3 border-t border-gray-100 pt-3">
                      Joined {new Date(selectedMember.customer.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
