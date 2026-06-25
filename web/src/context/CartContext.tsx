"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import { Product, CartItem, parsePrice } from "@/lib/types";

export type { CartItem };

const VALID_PROMO_CODES: Record<string, number> = {
  SOULDAWN10: 10,
  FIRST15: 15,
  FIGHT20: 20,
};

const CART_STORAGE_KEY = "souldawn-cart";

interface CartContextType {
  items: CartItem[];
  hydrated: boolean;
  addItem: (product: Product, size: string) => boolean;
  removeItem: (productId: string, size: string) => void;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  promoCode: string | null;
  discount: number;
  applyPromo: (code: string) => boolean;
  removePromo: () => void;
  discountedTotal: number;
}

function maxStock(product: Product): number {
  return typeof product.stock === "number" ? product.stock : Infinity;
}

function loadCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore parse errors
  }
  return [];
}

function saveCartToStorage(items: CartItem[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore storage errors
  }
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [promoCode, setPromoCode] = useState<string | null>(null);
  const [discount, setDiscount] = useState<number>(0);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate cart from localStorage on mount
  useEffect(() => {
    const stored = loadCartFromStorage();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate localStorage hydration on mount
    setItems(stored.length > 0 ? stored : []);
    setHydrated(true);
  }, []);

  // Persist cart to localStorage on every change (after initial hydration)
  useEffect(() => {
    if (hydrated) {
      saveCartToStorage(items);
    }
  }, [items, hydrated]);

  const addItem = useCallback((product: Product, size: string): boolean => {
    const limit = maxStock(product);
    let ok = true;
    setItems((prev) => {
      const existing = prev.find(
        (i) => i.product.id === product.id && i.size === size
      );
      const currentQty = existing?.quantity ?? 0;
      if (currentQty + 1 > limit) {
        ok = false;
        return prev;
      }
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id && i.size === size
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { product, size, quantity: 1 }];
    });
    return ok;
  }, []);

  const removeItem = useCallback((productId: string, size: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.product.id === productId && i.size === size))
    );
  }, []);

  const updateQuantity = useCallback(
    (productId: string, size: string, quantity: number) => {
      if (quantity <= 0) {
        setItems((prev) =>
          prev.filter(
            (i) => !(i.product.id === productId && i.size === size)
          )
        );
        return;
      }
      setItems((prev) =>
        prev.map((i) => {
          if (i.product.id === productId && i.size === size) {
            const limit = maxStock(i.product);
            return { ...i, quantity: Math.min(quantity, limit) };
          }
          return i;
        })
      );
    },
    []
  );

  const clearCart = useCallback(() => {
    setItems([]);
    setPromoCode(null);
    setDiscount(0);
  }, []);

  const applyPromo = useCallback((code: string): boolean => {
    const normalized = code.trim().toUpperCase();
    const pct = VALID_PROMO_CODES[normalized];
    if (pct !== undefined) {
      setPromoCode(normalized);
      setDiscount(pct);
      return true;
    }
    return false;
  }, []);

  const removePromo = useCallback(() => {
    setPromoCode(null);
    setDiscount(0);
  }, []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  const totalPrice = items.reduce((sum, i) => {
    return sum + parsePrice(i.product.price) * i.quantity;
  }, 0);

  const discountedTotal =
    discount > 0 ? Math.round(totalPrice * (1 - discount / 100)) : totalPrice;

  return (
    <CartContext.Provider
      value={{
        items,
        hydrated,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        promoCode,
        discount,
        applyPromo,
        removePromo,
        discountedTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}