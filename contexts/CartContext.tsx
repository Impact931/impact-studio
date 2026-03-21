'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { CartItem } from '@/types/booking';
import { useAuth } from '@/contexts/AuthContext';

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (item: CartItem) => void;
  removeItem: (equipmentId: string) => void;
  updateQuantity: (equipmentId: string, quantity: number) => void;
  clearCart: () => void;
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  requiresAuth: boolean;
}

function getStorageKey(customerId: string | undefined): string | null {
  if (!customerId) return null;
  return `impact-studio-cart-${customerId}`;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { customer } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const storageKey = getStorageKey(customer?.customerId);

  // Load cart from localStorage when user changes
  useEffect(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          setItems(JSON.parse(stored));
        } catch {
          localStorage.removeItem(storageKey);
        }
      } else {
        setItems([]);
      }
    } else {
      // Not logged in — clear cart state
      setItems([]);
    }
    setLoaded(true);
  }, [storageKey]);

  // Persist to localStorage (per-user key)
  useEffect(() => {
    if (loaded && storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(items));
    }
  }, [items, loaded, storageKey]);

  // Clean up old global cart key from before per-user migration
  useEffect(() => {
    localStorage.removeItem('impact-studio-cart');
  }, []);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.equipmentId === item.equipmentId);
      if (existing) {
        return prev.map((i) =>
          i.equipmentId === item.equipmentId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i,
        );
      }
      return [...prev, item];
    });
    setDrawerOpen(true);
  }, []);

  const removeItem = useCallback((equipmentId: string) => {
    setItems((prev) => prev.filter((i) => i.equipmentId !== equipmentId));
  }, []);

  const updateQuantity = useCallback((equipmentId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.equipmentId !== equipmentId));
    } else {
      setItems((prev) =>
        prev.map((i) =>
          i.equipmentId === equipmentId ? { ...i, quantity } : i,
        ),
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    if (storageKey) {
      localStorage.removeItem(storageKey);
    }
  }, [storageKey]);

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items],
  );

  const total = useMemo(
    () => items.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [items],
  );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        total,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        drawerOpen,
        setDrawerOpen,
        requiresAuth: !customer,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
