import { useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, MessageCircle, RotateCcw, Search } from 'lucide-react';
import './lib/firebase';
import { Product, ProductFormInput, SortOption, STORE_INFO } from './types/store';
import {
  filterAndSortProducts,
  findProductByShareParam,
  getDiscountedProducts,
  sanitizeProductPayload,
  verifyAdminPassword,
} from './utils/catalogLogic';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { OffersSection } from './components/OffersSection';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { PartnerAndAboutSection } from './components/PartnerAndAboutSection';
import { Footer } from './components/Footer';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminPasswordModal } from './components/AdminPasswordModal';
import { MobileStorefront } from './components/mobile/MobileStorefront';

const LOCAL_STORAGE_KEY = 'mahallawy_store_catalog_v1';
const ADMIN_SESSION_KEY = 'mahallawy_admin_unlocked_v1';

function loadCachedProducts(): Product[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Product[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {
    // Ignore malformed cache
  }
  return [];
}

export default function App() {
  const [activeView, setActiveView] = useState<'store' | 'admin'>('store');
  const [products, setProducts] = useState<Product[]>(loadCachedProducts);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(
    () => loadCachedProducts().length === 0
  );

  // Admin password state (never persisted; always required to open Admin Panel)
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  const isAdminUnlocked = Boolean(adminPassword);

  // Storefront search, sort & detail modal
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>(SortOption.NEWEST);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sharedProductId, setSharedProductId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return new URLSearchParams(window.location.search).get('product');
  });
  const [publicOrigin, setPublicOrigin] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.origin : ''
  );

  const clearSharedProductParam = () => {
    setSharedProductId(null);
    if (typeof window === 'undefined') return;
    try {
      const url = new URL(window.location.href);
      if (url.searchParams.has('product')) {
        url.searchParams.delete('product');
        const nextUrl = `${url.pathname}${url.search}${url.hash}`;
        window.history.replaceState({}, '', nextUrl);
      }
    } catch {
      // Ignore URL history restrictions
    }
  };

  useEffect(() => {
    if (!sharedProductId || products.length === 0) return;
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      const matched = findProductByShareParam(products, sharedProductId);
      if (matched) {
        setSelectedProduct(matched);
        clearSharedProductParam();
      }
    }
  }, [sharedProductId, products]);

  const syncLocalCache = (items: Product[]) => {
    setProducts(items);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore storage quota warnings
    }
  };

  // Fetch public origin (/api/health) and load persistent server catalog (/api/products)
  useEffect(() => {
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      // Ignore storage restrictions
    }

    fetch('/api/health')
      .then((res) => res.json())
      .then((data: { publicOrigin?: string }) => {
        if (data.publicOrigin) {
          setPublicOrigin(data.publicOrigin);
        }
      })
      .catch(() => {
        // Keep window.location.origin fallback
      });

    fetch('/api/products')
      .then((res) => res.json())
      .then((data: { initialized?: boolean; products?: Product[] }) => {
        if (Array.isArray(data.products)) {
          syncLocalCache(data.products);
        }
      })
      .catch(() => {
        // Keep cached products
      })
      .finally(() => {
        setIsLoadingProducts(false);
      });
  }, []);

  const handleVerifyAdminPassword = async (candidate: string): Promise<boolean> => {
    const trimmed = (candidate || '').trim();
    if (!trimmed) return false;

    let isValid = false;
    try {
      const res = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: trimmed }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.ok) {
          isValid = true;
        }
      }
    } catch {
      // Ignore network error and fall back to local check
    }

    if (!isValid) {
      if (verifyAdminPassword(trimmed)) {
        isValid = true;
      }
    }

    if (!isValid) {
      return false;
    }

    setAdminPassword(trimmed);
    setPasswordModalOpen(false);
    setActiveView('admin');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return true;
  };

  const handleAdminButtonClick = () => {
    setAdminPassword('');
    setPasswordModalOpen(true);
  };

  const handleAdminLogout = () => {
    setAdminPassword('');
    try {
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch {
      // Ignore storage restrictions
    }
    setActiveView('store');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveProduct = async (input: ProductFormInput, editingId?: string) => {
    if (editingId) {
      const existing = products.find((p) => p.id === editingId);
      const updated = {
        ...sanitizeProductPayload(input, editingId, existing?.authorUid || 'admin'),
        createdAt: existing?.createdAt || new Date().toISOString(),
      };

      const res = await fetch(`/api/products/${encodeURIComponent(editingId)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify({ product: updated }),
      });

      if (res.ok) {
        const payload = (await res.json()) as { products?: Product[] };
        if (Array.isArray(payload.products)) {
          syncLocalCache(payload.products);
          return;
        }
      }

      syncLocalCache(products.map((p) => (p.id === editingId ? updated : p)));
    } else {
      const created = sanitizeProductPayload(input);
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword,
        },
        body: JSON.stringify({ product: created }),
      });

      if (res.ok) {
        const payload = (await res.json()) as { products?: Product[] };
        if (Array.isArray(payload.products)) {
          syncLocalCache(payload.products);
          return;
        }
      }

      syncLocalCache([created, ...products]);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const res = await fetch(`/api/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      headers: {
        'x-admin-password': adminPassword,
      },
    });

    if (res.ok) {
      const payload = (await res.json()) as { products?: Product[] };
      if (Array.isArray(payload.products)) {
        syncLocalCache(payload.products);
        return;
      }
    }

    syncLocalCache(products.filter((p) => p.id !== productId));
  };

  const discountedProducts = useMemo(() => getDiscountedProducts(products), [products]);

  const filteredProducts = useMemo(
    () => filterAndSortProducts(products, searchQuery, 'الكل', sortBy),
    [products, searchQuery, sortBy]
  );

  const heroSpotlightProduct = useMemo(
    () =>
      products.find((p) => p.isFeatured && p.isPublished) ||
      products.find((p) => p.isPublished) ||
      undefined,
    [products]
  );

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#0B1F3A]">
      {activeView === 'admin' ? (
        <>
          <div className="hidden md:block">
            <Navbar
              activeView={activeView}
              onSwitchView={(view) => {
                if (view === 'store') {
                  handleAdminLogout();
                } else {
                  handleAdminButtonClick();
                }
              }}
              onAdminButtonClick={handleAdminButtonClick}
              hasDiscountOffers={discountedProducts.length > 0}
            />
          </div>
          <main className="flex-1">
            <AdminDashboard
              products={products}
              isAuthorized={isAdminUnlocked}
              onSubmitPassword={handleVerifyAdminPassword}
              onLogout={handleAdminLogout}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
              onBackToStore={handleAdminLogout}
              publicOrigin={publicOrigin}
            />
          </main>
        </>
      ) : (
        <>
          {/* Dedicated Rebuilt Mobile Storefront (< 768px) */}
          <MobileStorefront
            products={products}
            filteredProducts={filteredProducts}
            discountedProducts={discountedProducts}
            isLoadingProducts={isLoadingProducts}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onAdminButtonClick={handleAdminButtonClick}
            publicOrigin={publicOrigin}
            initialProductId={sharedProductId}
            onConsumeInitialProduct={clearSharedProductParam}
          />

          {/* Existing Desktop Storefront (>= 768px) — Kept Completely Unchanged */}
          <div className="hidden md:flex md:flex-col min-h-screen">
            <Navbar
              activeView={activeView}
              onSwitchView={(view) => {
                if (view === 'store') {
                  handleAdminLogout();
                } else {
                  handleAdminButtonClick();
                }
              }}
              onAdminButtonClick={handleAdminButtonClick}
              hasDiscountOffers={discountedProducts.length > 0}
            />

            <main className="flex-1">
              {/* 1. Welcome Hero & Trust Banner */}
              <HeroSection
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                featuredProduct={heroSpotlightProduct}
                onSelectProduct={(product) => setSelectedProduct(product)}
                hasDiscountOffers={discountedProducts.length > 0}
              />

              {/* 2. Dedicated Offers & Discounts Section */}
              <OffersSection
                products={products}
                onViewDetails={(product) => setSelectedProduct(product)}
                publicOrigin={publicOrigin}
              />

              {/* 3. Main Products Catalog Section */}
              <section
                id="products-section"
                aria-labelledby="catalog-heading"
                className="py-12 sm:py-16 bg-white"
              >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  {/* Catalog Header & Controls */}
                  <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-8">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#0284C7] mb-1">
                        أحدث المنتجات والأجهزة المتاحة
                      </p>
                      <h2
                        id="catalog-heading"
                        className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]"
                      >
                        منتجات المحلاوي ستور
                      </h2>
                    </div>

                    {/* Search & Sort Controls */}
                    {products.length > 0 && (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="relative min-w-[240px] sm:w-72">
                          <label htmlFor="catalog-search-input" className="sr-only">
                            البحث داخل قسم المنتجات
                          </label>
                          <Search
                            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0284C7]"
                            aria-hidden="true"
                          />
                          <input
                            id="catalog-search-input"
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ابحث باسم المنتج أو المواصفات..."
                            className="w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] pr-10 pl-3 py-2 text-xs sm:text-sm text-[#0B1F3A] focus:bg-white focus:outline-2 focus:outline-[#1D4ED8]"
                          />
                        </div>

                        <div className="relative flex items-center">
                          <label htmlFor="catalog-sort-select" className="sr-only">
                            ترتيب المنتجات
                          </label>
                          <ArrowUpDown
                            className="pointer-events-none absolute right-3.5 h-4 w-4 text-[#1D4ED8]"
                            aria-hidden="true"
                          />
                          <select
                            id="catalog-sort-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="min-h-[44px] w-full sm:w-auto rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] pr-9 pl-4 py-2 text-xs sm:text-sm font-bold text-[#0F294A] focus:bg-white focus:outline-2 focus:outline-[#1D4ED8] cursor-pointer"
                          >
                            <option value={SortOption.NEWEST}>الأحدث إضافة</option>
                            <option value={SortOption.PRICE_ASC}>السعر: من الأقل للأعلى</option>
                            <option value={SortOption.PRICE_DESC}>السعر: من الأعلى للأقل</option>
                            <option value={SortOption.DISCOUNT_DESC}>الأعلى نسبة خصم</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Product Cards Grid or Empty State */}
                  {filteredProducts.length === 0 ? (
                    <div className="rounded-3xl bg-[#F2FAFF] border border-[#D8EEFB] p-10 sm:p-14 text-center">
                      {searchQuery.trim() ? (
                        <>
                          <p className="text-base sm:text-lg font-extrabold text-[#0B1F3A] mb-2">
                            لم نجد منتجات تطابق بحثك الحالي
                          </p>
                          <p className="text-xs sm:text-sm text-slate-600 mb-5">
                            جرّب البحث بكلمة أخرى أو استعرض كافة منتجات المحلاوي ستور.
                          </p>
                          <button
                            type="button"
                            onClick={() => setSearchQuery('')}
                            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] px-5 py-2.5 text-xs sm:text-sm font-bold text-white cursor-pointer"
                          >
                            <RotateCcw className="h-4 w-4" aria-hidden="true" />
                            <span>عرض جميع المنتجات</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <p className="text-base sm:text-lg font-extrabold text-[#0B1F3A] mb-2">
                            يتم تحديث قائمة المنتجات والأجهزة الحديثة باستمرار
                          </p>
                          <p className="text-xs sm:text-sm text-slate-600 mb-5 max-w-lg mx-auto">
                            تواصل معنا مباشرة عبر واتساب الأعمال للاستفسار عن أحدث الموديلات
                            والأسعار والتوافر في المحلاوي ستور.
                          </p>
                          <a
                            href={STORE_INFO.whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] px-5 py-2.5 text-xs sm:text-sm font-bold text-white"
                          >
                            <MessageCircle className="h-4 w-4" aria-hidden="true" />
                            <span>تواصل عبر واتساب الأعمال</span>
                          </a>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                      {filteredProducts.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onViewDetails={(p) => setSelectedProduct(p)}
                          publicOrigin={publicOrigin}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* 4. Store Offerings, Infinity Corp Smart Solutions & Partnership */}
              <PartnerAndAboutSection />
            </main>

            <Footer />

            {/* Desktop Product Details Modal */}
            <ProductDetailModal
              product={selectedProduct}
              onClose={() => setSelectedProduct(null)}
              publicOrigin={publicOrigin}
            />
          </div>
        </>
      )}

      {/* Admin Password Modal triggered by Admin Panel button (Desktop & Mobile) */}
      <AdminPasswordModal
        isOpen={passwordModalOpen}
        onClose={() => setPasswordModalOpen(false)}
        onSubmitPassword={handleVerifyAdminPassword}
      />
    </div>
  );
}
