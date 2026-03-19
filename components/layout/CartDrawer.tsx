'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/content/equipment-catalog';

export default function CartDrawer() {
  const { items, total, removeItem, updateQuantity, drawerOpen, setDrawerOpen } =
    useCart();

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [drawerOpen]);

  if (!drawerOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/40 transition-opacity"
        onClick={() => setDrawerOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-brand-border px-6 py-4">
          <h2 className="font-display text-lg font-semibold text-brand-text">
            Your Cart
          </h2>
          <button
            onClick={() => setDrawerOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-brand-muted hover:text-brand-text"
            aria-label="Close cart"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg className="mb-4 h-12 w-12 text-brand-border" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
              </svg>
              <p className="text-sm text-brand-muted">Your cart is empty</p>
              <Link
                href="/equipment-rental"
                onClick={() => setDrawerOpen(false)}
                className="mt-4 text-sm font-medium text-brand-accent hover:text-brand-accent-hover"
              >
                Browse Equipment
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-brand-border">
              {items.map((item) => (
                <div key={item.equipmentId} className="flex items-start gap-4 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-brand-text truncate">
                      {item.name}
                    </p>
                    <p className="mt-1 text-sm text-brand-accent">
                      {formatPrice(item.price)}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.equipmentId, item.quantity - 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-brand-border text-xs text-brand-muted hover:border-brand-accent hover:text-brand-accent"
                      >
                        -
                      </button>
                      <span className="min-w-[1.5rem] text-center text-sm text-brand-text">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.equipmentId, item.quantity + 1)}
                        className="flex h-6 w-6 items-center justify-center rounded border border-brand-border text-xs text-brand-muted hover:border-brand-accent hover:text-brand-accent"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm font-medium text-brand-text">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                    <button
                      onClick={() => removeItem(item.equipmentId)}
                      className="text-xs text-brand-muted hover:text-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-brand-border px-6 py-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-brand-text">Subtotal</span>
              <span className="text-base font-semibold text-brand-accent">
                {formatPrice(total)}
              </span>
            </div>
            <Link
              href="/book"
              onClick={() => setDrawerOpen(false)}
              className="block w-full rounded-full bg-brand-accent py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-brand-accent-hover"
            >
              Proceed to Booking
            </Link>
            <button
              onClick={() => setDrawerOpen(false)}
              className="mt-2 block w-full py-2 text-center text-xs text-brand-muted hover:text-brand-text"
            >
              Continue Browsing
            </button>
          </div>
        )}
      </div>
    </>
  );
}
