import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Product } from '../types/store';
import {
  CartItem,
  CartTotals,
  getCartTotals,
  normalizeCartItems,
  reconcileCartWithLiveProducts,
  removeCartItemByKey,
  setCartItemQuantity,
  upsertCartItem,
} from '../utils/cartLogic';
import {
  CART_LS_KEY,
  FAVORITES_LS_KEY,
  idbClearCart,
  idbGetCartItems,
  idbGetFavorites,
  idbRemoveCartItem,
  idbReplaceCartItems,
  idbSaveCartItem,
  idbSetFavorites,
  lsGetCartItems,
  lsGetFavorites,
  lsSaveCartItems,
  lsSaveFavorites,
} from '../utils/offlineDb';

interface AddToCartOptions {
  selectedOption?: string;
  quantity?: number;
}

interface CartContextValue {
  cartItems: CartItem[];
  favoriteIds: string[];
  totals: CartTotals;
  isHydrated: boolean;
  addToCart: (product: Product, options?: AddToCartOptions) => CartItem;
  updateCartQuantity: (cartKey: string, nextQuantity: number) => void;
  removeFromCart: (cartKey: string) => void;
  clearCart: () => void;
  toggleFavorite: (productId: string) => boolean;
  isFavorite: (productId: string) => boolean;
  getCartQuantityForProduct: (productId: string, selectedOption?: string) => number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({
  products,
  children,
}: {
  products: Product[];
  children: React.ReactNode;
}) {
  const [cartItems, setCartItems] = useState<CartItem[]>(() => lsGetCartItems());
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => lsGetFavorites());
  const [isHydrated, setIsHydrated] = useState(false);

  const cartItemsRef = useRef<CartItem[]>(cartItems);
  cartItemsRef.current = cartItems;

  const favoriteIdsRef = useRef<string[]>(favoriteIds);
  favoriteIdsRef.current = favoriteIds;

  const hasUserMutatedCartRef = useRef(false);
  const hasUserMutatedFavsRef = useRef(false);

  const cartPersistQueueRef = useRef<Promise<void>>(Promise.resolve());
  const favPersistQueueRef = useRef<Promise<void>>(Promise.resolve());

  const enqueueCartPersist = useCallback((task: () => Promise<void>) => {
    cartPersistQueueRef.current = cartPersistQueueRef.current
      .then(() => task())
      .catch(() => {
        // localStorage mirror keeps data safe even if IndexedDB is temporarily unavailable
      });
  }, []);

  const enqueueFavPersist = useCallback((task: () => Promise<void>) => {
    favPersistQueueRef.current = favPersistQueueRef.current
      .then(() => task())
      .catch(() => {
        // localStorage mirror keeps favorites safe even if IndexedDB is temporarily unavailable
      });
  }, []);

  // Hydrate authoritative offline state from IndexedDB on startup
  useEffect(() => {
    let cancelled = false;

    async function hydrateFromIdb() {
      try {
        const [rawIdbCart, idbFavs] = await Promise.all([
          idbGetCartItems().catch(() => null),
          idbGetFavorites().catch(() => null),
        ]);

        if (cancelled) return;

        if (rawIdbCart !== null && !hasUserMutatedCartRef.current) {
          const normalizedIdbCart = normalizeCartItems(rawIdbCart);
          const lsCart = cartItemsRef.current;

          if (normalizedIdbCart.length > 0) {
            const reconciled =
              products.length > 0
                ? reconcileCartWithLiveProducts(normalizedIdbCart, products).nextItems
                : normalizedIdbCart;
            cartItemsRef.current = reconciled;
            setCartItems(reconciled);
            lsSaveCartItems(reconciled);
          } else if (lsCart.length > 0) {
            // Restore localStorage backup into IndexedDB if IndexedDB was empty
            enqueueCartPersist(() => idbReplaceCartItems(lsCart));
          }
        }

        if (idbFavs !== null && !hasUserMutatedFavsRef.current) {
          const uniqueIdbFavs = Array.from(new Set(idbFavs));
          const lsFavs = favoriteIdsRef.current;

          if (uniqueIdbFavs.length > 0) {
            favoriteIdsRef.current = uniqueIdbFavs;
            setFavoriteIds(uniqueIdbFavs);
            lsSaveFavorites(uniqueIdbFavs);
          } else if (lsFavs.length > 0) {
            enqueueFavPersist(() => idbSetFavorites(lsFavs));
          }
        }
      } finally {
        if (!cancelled) {
          setIsHydrated(true);
        }
      }
    }

    void hydrateFromIdb();

    return () => {
      cancelled = true;
    };
  }, [enqueueCartPersist, enqueueFavPersist]);

  // Cross-tab localStorage sync
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorage = (e: StorageEvent) => {
      if (e.key === CART_LS_KEY) {
        const next = lsGetCartItems();
        cartItemsRef.current = next;
        setCartItems(next);
      } else if (e.key === FAVORITES_LS_KEY) {
        const next = lsGetFavorites();
        favoriteIdsRef.current = next;
        setFavoriteIds(next);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Reconcile cart product snapshots (latest prices, discounts, stock, names, images) when live products update
  useEffect(() => {
    if (products.length === 0) return;
    const current = cartItemsRef.current;
    if (current.length === 0) return;

    const { nextItems, changed } = reconcileCartWithLiveProducts(current, products);
    if (!changed) return;

    cartItemsRef.current = nextItems;
    setCartItems(nextItems);
    lsSaveCartItems(nextItems);
    enqueueCartPersist(() => idbReplaceCartItems(nextItems));
  }, [products, enqueueCartPersist]);

  const addToCart = useCallback(
    (product: Product, options?: AddToCartOptions): CartItem => {
      hasUserMutatedCartRef.current = true;
      const { nextItems, updatedItem } = upsertCartItem(cartItemsRef.current, product, {
        selectedOption: options?.selectedOption,
        quantity: options?.quantity,
      });
      cartItemsRef.current = nextItems;
      setCartItems(nextItems);
      lsSaveCartItems(nextItems);
      enqueueCartPersist(() => idbSaveCartItem(updatedItem));
      return updatedItem;
    },
    [enqueueCartPersist]
  );

  const updateCartQuantity = useCallback(
    (cartKey: string, nextQuantity: number) => {
      hasUserMutatedCartRef.current = true;
      const current = cartItemsRef.current;
      const nextItems = setCartItemQuantity(current, cartKey, nextQuantity);
      cartItemsRef.current = nextItems;
      setCartItems(nextItems);
      lsSaveCartItems(nextItems);

      const updatedItem = nextItems.find((i) => i.cartKey === cartKey);
      if (updatedItem) {
        enqueueCartPersist(() => idbSaveCartItem(updatedItem));
      } else {
        enqueueCartPersist(() => idbRemoveCartItem(cartKey));
      }
    },
    [enqueueCartPersist]
  );

  const removeFromCart = useCallback(
    (cartKey: string) => {
      hasUserMutatedCartRef.current = true;
      const nextItems = removeCartItemByKey(cartItemsRef.current, cartKey);
      cartItemsRef.current = nextItems;
      setCartItems(nextItems);
      lsSaveCartItems(nextItems);
      enqueueCartPersist(() => idbRemoveCartItem(cartKey));
    },
    [enqueueCartPersist]
  );

  const clearCart = useCallback(() => {
    hasUserMutatedCartRef.current = true;
    cartItemsRef.current = [];
    setCartItems([]);
    lsSaveCartItems([]);
    enqueueCartPersist(() => idbClearCart());
  }, [enqueueCartPersist]);

  const toggleFavorite = useCallback(
    (productId: string): boolean => {
      hasUserMutatedFavsRef.current = true;
      const current = favoriteIdsRef.current;
      const exists = current.includes(productId);
      const next = exists
        ? current.filter((id) => id !== productId)
        : [...current, productId];
      favoriteIdsRef.current = next;
      setFavoriteIds(next);
      lsSaveFavorites(next);
      enqueueFavPersist(() => idbSetFavorites(next));
      return !exists;
    },
    [enqueueFavPersist]
  );

  const isFavorite = useCallback(
    (productId: string): boolean => favoriteIds.includes(productId),
    [favoriteIds]
  );

  const getCartQuantityForProduct = useCallback(
    (productId: string, selectedOption?: string): number => {
      if (selectedOption !== undefined) {
        const key = `${productId}::${selectedOption.trim()}`;
        return cartItems.find((i) => i.cartKey === key)?.quantity ?? 0;
      }
      return cartItems
        .filter((i) => i.productId === productId)
        .reduce((sum, i) => sum + i.quantity, 0);
    },
    [cartItems]
  );

  const totals = useMemo(() => getCartTotals(cartItems), [cartItems]);

  const value = useMemo<CartContextValue>(
    () => ({
      cartItems,
      favoriteIds,
      totals,
      isHydrated,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      toggleFavorite,
      isFavorite,
      getCartQuantityForProduct,
    }),
    [
      cartItems,
      favoriteIds,
      totals,
      isHydrated,
      addToCart,
      updateCartQuantity,
      removeFromCart,
      clearCart,
      toggleFavorite,
      isFavorite,
      getCartQuantityForProduct,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return ctx;
}

/**
 * Reusable hook to trigger cart addition with fast tactile feedback
 * and automatic duplicate-click lock (~1100ms) so accidental double-taps
 * cannot add the same item twice by mistake.
 */
export function useAddToCartButton(resetDelayMs = 1100) {
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const lockRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null && typeof window !== 'undefined') {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const triggerAdd = useCallback(
    (product: Product, options?: AddToCartOptions): boolean => {
      if (lockRef.current) return false;
      lockRef.current = true;
      addToCart(product, options);
      setJustAdded(true);

      if (typeof window !== 'undefined') {
        if (timerRef.current !== null) {
          window.clearTimeout(timerRef.current);
        }
        timerRef.current = window.setTimeout(() => {
          lockRef.current = false;
          setJustAdded(false);
        }, resetDelayMs);
      } else {
        lockRef.current = false;
      }

      return true;
    },
    [addToCart, resetDelayMs]
  );

  return { justAdded, triggerAdd };
}
