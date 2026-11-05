import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";

/* ============ Cart (guest-friendly, persisted in localStorage) ============ */

export type CartItem = {
  product_id: string;
  slug: string;
  name_bn: string;
  model: string | null;
  brand_name: string | null;
  price: number;
  image_url: string | null;
  qty: number;
  stock_qty: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "qty">, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const CART_KEY = "techno_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* corrupted cart data — start empty */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      /* storage full/unavailable */
    }
  }, [items]);

  const addItem = useCallback(
    (item: Omit<CartItem, "qty">, qty = 1) => {
      if (item.stock_qty <= 0) {
        toast.error("দুঃখিত, পণ্যটি এখন স্টকে নেই");
        return;
      }
      const existing = items.find((i) => i.product_id === item.product_id);
      const current = existing?.qty ?? 0;
      if (current >= item.stock_qty) {
        toast.info("স্টকে যতটা আছে ততটাই ইতিমধ্যে কার্টে যোগ করা হয়েছে");
        return;
      }
      const nextQty = Math.min(current + qty, item.stock_qty, 10);
      if (existing) {
        setItems((prev) =>
          prev.map((i) => (i.product_id === item.product_id ? { ...i, qty: nextQty } : i))
        );
      } else {
        setItems((prev) => [...prev, { ...item, qty: nextQty }]);
      }
      toast.success("কার্টে যোগ হয়েছে");
    },
    [items]
  );

  const setQty = useCallback(
    (productId: string, qty: number) => {
      setItems((prev) =>
        prev.map((i) =>
          i.product_id === productId
            ? { ...i, qty: Math.max(1, Math.min(qty, i.stock_qty, 10)) }
            : i
        )
      );
    },
    []
  );

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
    toast.info("পণ্যটি কার্ট থেকে সরানো হয়েছে");
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const itemCount = items.reduce((sum, i) => sum + i.qty, 0);
  const subtotal = items.reduce((sum, i) => sum + i.qty * i.price, 0);

  return (
    <CartContext.Provider
      value={{ items, itemCount, subtotal, addItem, setQty, removeItem, clear }}
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

/* ============ Wishlist (local for guests; synced with account later) ============ */

export type WishlistItem = {
  product_id: string;
  slug: string;
  name_bn: string;
  brand_name: string | null;
  price: number;
  image_url: string | null;
  stock_qty: number;
};

type WishlistContextValue = {
  items: WishlistItem[];
  has: (productId: string) => boolean;
  toggle: (item: WishlistItem) => void;
  remove: (productId: string) => void;
};

const WishlistContext = createContext<WishlistContextValue | null>(null);
const WISHLIST_KEY = "techno_wishlist_v1";

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(WISHLIST_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      /* start empty */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
    } catch {
      /* storage full/unavailable */
    }
  }, [items]);

  const has = useCallback(
    (productId: string) => items.some((i) => i.product_id === productId),
    [items]
  );

  const toggle = useCallback(
    (item: WishlistItem) => {
      setItems((prev) => {
        if (prev.some((i) => i.product_id === item.product_id)) {
          toast.info("পছন্দের তালিকা থেকে সরানো হয়েছে");
          return prev.filter((i) => i.product_id !== item.product_id);
        }
        toast.success("পছন্দের তালিকায় সংরক্ষণ করা হয়েছে");
        return [...prev, item];
      });
    },
    []
  );

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }, []);

  return (
    <WishlistContext.Provider value={{ items, has, toggle, remove }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}

/* ============ Helpers ============ */

export function formatBn(amount: number): string {
  return `৳${amount.toLocaleString("en-IN")}`;
}

export function discountPercent(price: number, original: number | null): number {
  if (!original || original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}
