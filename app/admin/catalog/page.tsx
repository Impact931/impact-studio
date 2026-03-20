'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Package,
  DollarSign,
  Eye,
  EyeOff,
  Loader2,
  ChevronDown,
} from 'lucide-react';

interface Product {
  productId: string;
  name: string;
  description: string;
  category: 'studio' | 'bundle' | 'alacarte' | 'addon';
  priceInStudio: number;
  priceOutOfStudio: number;
  active: boolean;
  included?: boolean;
  sortOrder: number;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  studio: 'Studio Rentals',
  bundle: 'Lighting Bundles',
  alacarte: 'A La Carte',
  addon: 'Add-ons',
};

const CATEGORY_COLORS: Record<string, string> = {
  studio: 'bg-blue-100 text-blue-800',
  bundle: 'bg-purple-100 text-purple-800',
  alacarte: 'bg-green-100 text-green-800',
  addon: 'bg-amber-100 text-amber-800',
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function PriceInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [display, setDisplay] = useState((value / 100).toFixed(2));

  useEffect(() => {
    setDisplay((value / 100).toFixed(2));
  }, [value]);

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
        <input
          type="text"
          value={display}
          onChange={(e) => {
            setDisplay(e.target.value);
            const parsed = parseFloat(e.target.value);
            if (!isNaN(parsed)) {
              onChange(Math.round(parsed * 100));
            }
          }}
          className="w-full pl-7 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
        />
      </div>
    </div>
  );
}

function ProductEditPanel({
  product,
  onSave,
  onCancel,
  saving,
}: {
  product: Product;
  onSave: (updates: Partial<Product>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({ ...product });

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Edit Product</h3>
        <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Product Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
          <select
            value={form.category}
            onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as Product['category'] }))}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
          >
            <option value="studio">Studio Rentals</option>
            <option value="bundle">Lighting Bundles</option>
            <option value="alacarte">A La Carte</option>
            <option value="addon">Add-ons</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <PriceInput
            label="In-Studio Price"
            value={form.priceInStudio}
            onChange={(v) => setForm((p) => ({ ...p, priceInStudio: v }))}
          />
          <PriceInput
            label="Out-of-Studio Price"
            value={form.priceOutOfStudio}
            onChange={(v) => setForm((p) => ({ ...p, priceOutOfStudio: v }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Sort Order</label>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((p) => ({ ...p, sortOrder: parseInt(e.target.value) || 0 }))}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
            />
          </div>
          <div className="flex items-end gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((p) => ({ ...p, active: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-brand-accent focus:ring-brand-accent"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.included || false}
                onChange={(e) => setForm((p) => ({ ...p, included: e.target.checked }))}
                className="w-4 h-4 rounded border-gray-300 text-brand-accent focus:ring-brand-accent"
              />
              <span className="text-sm text-gray-700">Included in-studio</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={() => onSave(form)}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-brand-accent text-white text-sm font-medium rounded-lg hover:bg-brand-accent-hover disabled:opacity-50 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string>('all');
  const [message, setMessage] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/catalog');
      const data = await res.json();
      if (data.products) {
        setProducts(data.products);
        if (data.seeded) {
          setMessage('Catalog seeded from static data — you can now edit products here.');
          setTimeout(() => setMessage(''), 5000);
        }
      }
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSave = async (productId: string, updates: Partial<Product>) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/catalog/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        await fetchProducts();
        setEditingId(null);
        setMessage('Product updated');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      console.error('Save error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await fetch(`/api/admin/catalog/${product.productId}`, { method: 'DELETE' });
      await fetchProducts();
      setMessage('Product deleted');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleCreate = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'New Product',
          category: filter === 'all' ? 'alacarte' : filter,
          sortOrder: products.length,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        await fetchProducts();
        setEditingId(data.product.productId);
      }
    } catch (err) {
      console.error('Create error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (product: Product) => {
    await handleSave(product.productId, { active: !product.active });
  };

  const filtered = filter === 'all' ? products : products.filter((p) => p.category === filter);
  const categories = ['all', 'studio', 'bundle', 'alacarte', 'addon'];

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-brand-accent" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Catalog</h1>
          <p className="text-gray-500 mt-1">
            Manage equipment, pricing, and availability.
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-brand-accent text-white text-sm font-medium rounded-lg hover:bg-brand-accent-hover disabled:opacity-50 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {message && (
        <div className="mb-4 rounded-lg bg-brand-accent/10 border border-brand-accent/30 px-4 py-2.5 text-sm text-brand-accent">
          {message}
        </div>
      )}

      {/* Category filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${
              filter === cat
                ? 'bg-brand-accent text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-accent/50'
            }`}
          >
            {cat === 'all' ? 'All Products' : CATEGORY_LABELS[cat]}
            <span className="ml-2 text-xs opacity-75">
              ({cat === 'all' ? products.length : products.filter((p) => p.category === cat).length})
            </span>
          </button>
        ))}
      </div>

      {/* Product list */}
      <div className="space-y-3">
        {filtered.map((product) => (
          <div key={product.productId}>
            {editingId === product.productId ? (
              <ProductEditPanel
                product={product}
                onSave={(updates) => handleSave(product.productId, updates)}
                onCancel={() => setEditingId(null)}
                saving={saving}
              />
            ) : (
              <div
                className={`bg-white rounded-xl border shadow-sm p-4 flex items-center gap-4 transition-all ${
                  product.active ? 'border-gray-200' : 'border-gray-200 opacity-50'
                }`}
              >
                {/* Icon */}
                <div className="w-10 h-10 rounded-lg bg-brand-light flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5 text-brand-accent" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">
                      {product.name}
                    </h3>
                    <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full ${CATEGORY_COLORS[product.category]}`}>
                      {CATEGORY_LABELS[product.category]}
                    </span>
                    {!product.active && (
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
                        Inactive
                      </span>
                    )}
                    {product.included && (
                      <span className="inline-block px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                        Included
                      </span>
                    )}
                  </div>
                  {product.description && (
                    <p className="text-xs text-gray-500 truncate">{product.description}</p>
                  )}
                </div>

                {/* Prices */}
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-brand-accent">
                    {formatPrice(product.priceInStudio)}
                    {product.priceInStudio === 0 && product.included && (
                      <span className="text-xs text-gray-400 ml-1">free</span>
                    )}
                  </div>
                  {product.priceOutOfStudio > 0 && (
                    <div className="text-xs text-gray-400">
                      Out: {formatPrice(product.priceOutOfStudio)}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggleActive(product)}
                    className="p-2 rounded-lg text-gray-400 hover:text-brand-accent hover:bg-brand-accent/5 transition-colors"
                    title={product.active ? 'Deactivate' : 'Activate'}
                  >
                    {product.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setEditingId(product.productId)}
                    className="p-2 rounded-lg text-gray-400 hover:text-brand-accent hover:bg-brand-accent/5 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(product)}
                    className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No products in this category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
