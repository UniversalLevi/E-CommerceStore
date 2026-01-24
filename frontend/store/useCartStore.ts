import { create } from 'zustand';

export interface CartItem {
  productId: string;
  title?: string;
  image?: string;
  price?: number;
  variant?: string;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  storeSlug: string | null;
  setStoreSlug: (slug: string) => void;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variant?: string) => void;
  updateQuantity: (productId: string, variant: string | undefined, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  storeSlug: null,
  setStoreSlug: (slug: string) => {
    // Load cart for this store from localStorage
    if (typeof window === 'undefined') return;
    const cartKey = `storefront_cart_${slug}`;
    const savedCart = localStorage.getItem(cartKey);
    if (savedCart) {
      try {
        const items = JSON.parse(savedCart);
        set({ items, storeSlug: slug });
      } catch (e) {
        set({ items: [], storeSlug: slug });
      }
    } else {
      set({ items: [], storeSlug: slug });
    }
  },
  addItem: (item: CartItem) => {
    const state = get();
    const existingIndex = state.items.findIndex(
      (i) => i.productId === item.productId && i.variant === item.variant
    );

    let updatedItems: CartItem[];
    if (existingIndex >= 0) {
      // Update quantity if item exists
      updatedItems = state.items.map((i, idx) =>
        idx === existingIndex ? { ...i, quantity: i.quantity + item.quantity } : i
      );
    } else {
      // Add new item
      updatedItems = [...state.items, item];
    }
    
    set({ items: updatedItems });

    // Persist to localStorage
    if (state.storeSlug && typeof window !== 'undefined') {
      const cartKey = `storefront_cart_${state.storeSlug}`;
      localStorage.setItem(cartKey, JSON.stringify(updatedItems));
    }
  },
  removeItem: (productId: string, variant?: string) => {
    const state = get();
    const updatedItems = state.items.filter(
      (i) => !(i.productId === productId && i.variant === variant)
    );
    set({ items: updatedItems });

    // Persist to localStorage
    if (state.storeSlug && typeof window !== 'undefined') {
      const cartKey = `storefront_cart_${state.storeSlug}`;
      localStorage.setItem(cartKey, JSON.stringify(updatedItems));
    }
  },
  updateQuantity: (productId: string, variant: string | undefined, quantity: number) => {
    if (quantity <= 0) {
      get().removeItem(productId, variant);
      return;
    }

    const state = get();
    const updatedItems = state.items.map((i) =>
      i.productId === productId && i.variant === variant
        ? { ...i, quantity }
        : i
    );
    set({ items: updatedItems });

    // Persist to localStorage
    if (state.storeSlug && typeof window !== 'undefined') {
      const cartKey = `storefront_cart_${state.storeSlug}`;
      localStorage.setItem(cartKey, JSON.stringify(updatedItems));
    }
  },
  clearCart: () => {
    const state = get();
    set({ items: [] });

    // Clear localStorage
    if (state.storeSlug && typeof window !== 'undefined') {
      const cartKey = `storefront_cart_${state.storeSlug}`;
      localStorage.removeItem(cartKey);
    }
  },
  getTotalItems: () => {
    return get().items.reduce((sum, item) => sum + item.quantity, 0);
  },
  getTotalPrice: () => {
    return get().items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
  },
}));
