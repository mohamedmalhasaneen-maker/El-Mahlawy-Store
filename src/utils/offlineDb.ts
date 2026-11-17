import { Product } from '../types/store';
import { SiteConfig } from './siteConfig';
import { CartItem, normalizeCartItems } from './cartLogic';

export type { CartItem };

const DB_NAME = 'elmahlawy_store_pwa_v1';
const DB_VERSION = 1;
export const CART_LS_KEY = 'mahallawy_cart_v1';
export const FAVORITES_LS_KEY = 'mahallawy_favorites_v1';

export interface SyncQueueItem {
  id: string;
  kind: 'visitor_rating' | 'site_review' | 'site_config' | 'product_mutation';
  payload: unknown;
  createdAt: number;
  retryCount: number;
  lastError?: string;
}

export function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this environment.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error || new Error('Failed to open offline IndexedDB database.'));
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('siteConfig')) {
        db.createObjectStore('siteConfig', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('cart')) {
        db.createObjectStore('cart', { keyPath: 'cartKey' });
      }
      if (!db.objectStoreNames.contains('favorites')) {
        db.createObjectStore('favorites', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };
  });
}

export async function idbSaveProducts(products: Product[]): Promise<void> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');
    
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);

    // Put each product
    for (const p of products) {
      store.put({ ...p, cachedAt: Date.now() });
    }
  });
}

export async function idbGetProducts(): Promise<Product[]> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('products', 'readonly');
    const store = tx.objectStore('products');
    const req = store.getAll();

    req.onsuccess = () => resolve((req.result || []) as Product[]);
    req.onerror = () => reject(req.error);
  });
}

export async function idbSaveSiteConfig(config: SiteConfig): Promise<void> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('siteConfig', 'readwrite');
    const store = tx.objectStore('siteConfig');
    
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);

    store.put({ ...config, id: 'main', cachedAt: Date.now() });
  });
}

export async function idbGetSiteConfig(): Promise<SiteConfig | null> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('siteConfig', 'readonly');
    const store = tx.objectStore('siteConfig');
    const req = store.get('main');

    req.onsuccess = () => {
      const res = req.result;
      if (!res) return resolve(null);
      const { id, cachedAt, ...cfg } = res;
      resolve(cfg as SiteConfig);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function idbGetCartItems(): Promise<CartItem[]> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cart', 'readonly');
    const store = tx.objectStore('cart');
    const req = store.getAll();

    req.onsuccess = () => resolve((req.result || []) as CartItem[]);
    req.onerror = () => reject(req.error);
  });
}

export async function idbSaveCartItem(item: CartItem): Promise<void> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cart', 'readwrite');
    const store = tx.objectStore('cart');

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);

    store.put(item);
  });
}

export async function idbRemoveCartItem(cartKey: string): Promise<void> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cart', 'readwrite');
    const store = tx.objectStore('cart');

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);

    store.delete(cartKey);
  });
}

export async function idbClearCart(): Promise<void> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cart', 'readwrite');
    const store = tx.objectStore('cart');

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);

    store.clear();
  });
}

export async function idbReplaceCartItems(items: CartItem[]): Promise<void> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('cart', 'readwrite');
    const store = tx.objectStore('cart');

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);

    store.clear();
    for (const item of items) {
      store.put(item);
    }
  });
}

export async function idbGetFavorites(): Promise<string[]> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('favorites', 'readonly');
    const store = tx.objectStore('favorites');
    const req = store.getAll();

    req.onsuccess = () => {
      const items = (req.result || []) as Array<{ id: string }>;
      resolve(items.map((i) => i.id));
    };
    req.onerror = () => reject(req.error);
  });
}

export async function idbSetFavorites(ids: string[]): Promise<void> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('favorites', 'readwrite');
    const store = tx.objectStore('favorites');

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);

    store.clear();
    const unique = Array.from(new Set(ids.filter((id) => typeof id === 'string' && id.trim())));
    for (const id of unique) {
      store.put({ id, addedAt: Date.now() });
    }
  });
}

export async function idbToggleFavorite(productId: string): Promise<boolean> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('favorites', 'readwrite');
    const store = tx.objectStore('favorites');

    const getReq = store.get(productId);
    getReq.onsuccess = () => {
      if (getReq.result) {
        store.delete(productId);
        tx.oncomplete = () => resolve(false);
      } else {
        store.put({ id: productId, addedAt: Date.now() });
        tx.oncomplete = () => resolve(true);
      }
    };
    getReq.onerror = () => reject(getReq.error);
  });
}

export function lsGetCartItems(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_LS_KEY);
    if (!raw) return [];
    return normalizeCartItems(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function lsSaveCartItems(items: CartItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CART_LS_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function lsGetFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FAVORITES_LS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return Array.from(new Set(parsed.filter((id): id is string => typeof id === 'string' && id.length > 0)));
  } catch {
    return [];
  }
}

export function lsSaveFavorites(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FAVORITES_LS_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export async function idbAddSyncQueueItem(item: Omit<SyncQueueItem, 'id' | 'createdAt' | 'retryCount'>): Promise<string> {
  const db = await openOfflineDb();
  const id = 'sync_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
  const fullItem: SyncQueueItem = {
    id,
    createdAt: Date.now(),
    retryCount: 0,
    ...item,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');

    tx.oncomplete = () => resolve(id);
    tx.onerror = () => reject(tx.error);

    store.put(fullItem);
  });
}

export async function idbGetSyncQueue(): Promise<SyncQueueItem[]> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readonly');
    const store = tx.objectStore('syncQueue');
    const req = store.getAll();

    req.onsuccess = () => resolve((req.result || []) as SyncQueueItem[]);
    req.onerror = () => reject(req.error);
  });
}

export async function idbRemoveSyncQueueItem(id: string): Promise<void> {
  const db = await openOfflineDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('syncQueue', 'readwrite');
    const store = tx.objectStore('syncQueue');

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);

    store.delete(id);
  });
}
