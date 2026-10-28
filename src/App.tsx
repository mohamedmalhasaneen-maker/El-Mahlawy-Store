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
import {
  subscribeToPublishedProducts,
  createCloudProduct,
  updateCloudProduct,
  deleteCloudProduct,
  auth,
} from './lib/firebase';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { OffersSection } from './components/OffersSection';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { PartnerAndAboutSection } from './components/PartnerAndAboutSection';
import { AboutUsPage } from './components/AboutUsPage';
import { Footer } from './components/Footer';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminPasswordModal } from './components/AdminPasswordModal';
import { MobileStorefront } from './components/mobile/MobileStorefront';
import { TechBackground } from './components/TechBackground';
import { useTheme } from './utils/useTheme';

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
  const { theme, toggleTheme, isDark } = useTheme();
  const [activeView, setActiveView] = useState<'store' | 'about' | 'admin'>('store');
  const [products, setProducts] = useState<Product[]>(loadCachedProducts);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(
    () => loadCachedProducts().length === 0
  );

  // Admin password state (never persisted; always required to open Admin Panel)
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);

  useEffect(() => {
    const syncViewWithUrl = () => {
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      const search = typeof window !== 'undefined' ? window.location.search : '';
      if (hash === '#about' || search.includes('view=about')) {
        setActiveView('about');
      }
    };
    syncViewWithUrl();
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', syncViewWithUrl);
      return () => window.removeEventListener('hashchange', syncViewWithUrl);
    }
  }, []);

  const navigateToView = (view: 'store' | 'about' | 'admin') => {
    if (view === 'about') {
      setActiveView('about');
      if (typeof window !== 'undefined') {
        try {
          window.history.pushState(null, '', '#about');
        } catch {
          // ignore history restriction
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (view === 'store') {
      setActiveView('store');
      if (typeof window !== 'undefined') {
        if (window.location.hash === '#about') {
          try {
            window.history.pushState(null, '', window.location.pathname);
          } catch {
            // ignore history restriction
          }
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else if (view === 'admin') {
      handleAdminButtonClick();
    }
  };

  const isAdminUnlocked = Boolean(adminPassword);

  const [siteSettings, setSiteSettings] = useState<Record<string, any>>({
    storeName: 'المحلاوي ستور',
    storeEnglishName: 'El Mahlawy Store',
    tagline: 'منتجات متنوعة وحلول ذكية لحياة أسهل',
    address: 'جنوب سيناء – شرم الشيخ – الرويسات – مدخل 1 – شارع دستي، بجوار قسم الشرطة، الشارع الجانبي لمول الشيخ عيد، محل المحلاوي ستور.',
    googleMapsUrl: 'https://maps.google.com/?q=27.9158,34.3300',
    workingHours: 'يومياً من 10 صباحاً حتى 11 مساؤًا',
    deliverySummary: 'شحن متاح لجميع محافظات مصر. وتوصيل داخل شرم الشيخ من خلال خدمة الدليفري.',
    deliveryCost: 'يُحدد حسب المنطقة (خدمة الدليفري متاحة بشرم الشيخ)',
    warrantyPolicy: 'ضمان معتمد ودعم فني طوال فترة الضمان',
    afterSalesPolicy: 'نضمن لك الدعم والمساعدة خلال فترة الضمان. معاينة المنتج عن بُعد وتوجيه الدعم الفني.',
    primaryPhone: '01210141187',
    secondaryPhone: '01000000000',
    primaryWhatsApp: '201210141187',
    afterSalesWhatsApp: '201210141187',
    infinityCorpPhone: '01000000000',
    infinityCorpWhatsApp: '201000000000',
    facebookUrl: 'https://facebook.com/elmahlawystore',
    instagramUrl: 'https://instagram.com/elmahlawystore',
    whatsappOrderTemplate: 'السلام عليكم، أرغب في طلب المنتج التالي:\n- المنتج: {productName}\n- السعر: {price} جنيه\n- الرابط: {productUrl}\n\nملاحظات العميل: {notes}',
    orderConfirmationMessage: 'تم استلام طلبك بنجاح! سيتم التواصل معك قريباً لتأكيد التوصيل.',
    htmlTitle: 'المحلاوي ستور | El Mahlawy Store',
    seoDescription: 'المحلاوي ستور - تسوق أحدث المنتجات والإلكترونيات وحلول الذكاء التكنولوجي بشرم الشيخ وجميع محافظات مصر.',
    seoKeywords: 'المحلاوي ستور, شرم الشيخ, تسوق, إلكترونيات, الرويسات, Infinity Corp',
    ogImageUrl: '',
    primaryColor: '#0284c7',
    secondaryColor: '#0ea5e9',
    bannerImageUrl: '',
    announcementText: 'عروض خاصة لفترة محدودة على جميع المنتجات - شحن لجميع محافظات مصر!',
    announcementEnabled: true,
    maintenanceMode: false,
    maintenanceMessage: 'الموقع تحت الصيانة الدورية وسيعود قريباً.',
    activityLog: [],
  });

  const handleSaveSettings = async (newSettings: Record<string, any>): Promise<boolean> => {
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': adminPassword,
      },
      body: JSON.stringify({ settings: newSettings }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      throw new Error(data.error || 'تعذر حفظ الإعدادات.');
    }
    setSiteSettings(data.settings);
    return true;
  };

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

    const unsubscribe = subscribeToPublishedProducts(
      (items) => {
        syncLocalCache(items);
        setIsLoadingProducts(false);
      },
      (err) => {
        console.error('Error fetching products:', err);
        setIsLoadingProducts(false);
      }
    );

    return () => unsubscribe();

    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data === 'object') {
          setSiteSettings((prev) => ({ ...prev, ...data }));
        }
      })
      .catch(() => {});
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
    const authorUid = auth.currentUser?.uid || 'admin';
    if (editingId) {
      await updateCloudProduct(editingId, input, authorUid);
    } else {
      await createCloudProduct(input, authorUid);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    await deleteCloudProduct(productId);
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
    <div className="relative min-h-screen flex flex-col bg-white dark:bg-[#071326] text-[#0B1F3A] dark:text-[#F0F9FF] transition-colors">
      <TechBackground isDark={isDark} />

      {activeView === 'admin' ? (
        <>
          <div className="hidden md:block">
            <Navbar
              activeView={activeView}
              onSwitchView={(view) => {
                if (view === 'admin') {
                  handleAdminButtonClick();
                } else {
                  navigateToView(view);
                }
              }}
              onAdminButtonClick={handleAdminButtonClick}
              hasDiscountOffers={discountedProducts.length > 0}
              isDark={isDark}
              onToggleTheme={toggleTheme}
            />
          </div>
          <main className="flex-1 relative z-10">
            <AdminDashboard
              products={products}
              isAuthorized={isAdminUnlocked}
              onSubmitPassword={handleVerifyAdminPassword}
              onLogout={handleAdminLogout}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
              onBackToStore={handleAdminLogout}
              publicOrigin={publicOrigin}
              siteSettings={siteSettings}
              onSaveSettings={handleSaveSettings}
            />
          </main>
        </>
      ) : activeView === 'about' ? (
        <div className="relative z-10">
          <AboutUsPage
            onBackToStore={() => navigateToView('store')}
            onAdminButtonClick={handleAdminButtonClick}
          />
        </div>
      ) : (
        <div className="relative z-10">
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
            onNavigateAbout={() => navigateToView('about')}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            publicOrigin={publicOrigin}
            initialProductId={sharedProductId}
            onConsumeInitialProduct={clearSharedProductParam}
          />

          {/* Existing Desktop Storefront (>= 768px) */}
          <div className="hidden md:flex md:flex-col min-h-screen">
            <Navbar
              activeView={activeView}
              onSwitchView={(view) => {
                if (view === 'admin') {
                  handleAdminButtonClick();
                } else {
                  navigateToView(view);
                }
              }}
              onAdminButtonClick={handleAdminButtonClick}
              hasDiscountOffers={discountedProducts.length > 0}
              isDark={isDark}
              onToggleTheme={toggleTheme}
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
                className="py-12 sm:py-16 bg-white dark:bg-[#071326]"
              >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                  {/* Catalog Header & Controls */}
                  <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-8">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-[#0284C7] dark:text-[#38BDF8] mb-1">
                        أحدث المنتجات والأجهزة المتاحة
                      </p>
                      <h2
                        id="catalog-heading"
                        className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF]"
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
                            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0284C7] dark:text-[#38BDF8]"
                            aria-hidden="true"
                          />
                          <input
                            id="catalog-search-input"
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="ابحث باسم المنتج أو المواصفات..."
                            className="w-full min-h-[44px] rounded-xl bg-[#F2FAFF] dark:bg-[#0E264A] border border-[#CBE7FA] dark:border-[#1E3F73] pr-10 pl-3 py-2 text-xs sm:text-sm text-[#0B1F3A] dark:text-[#F0F9FF] placeholder:text-slate-400 focus:bg-white dark:focus:bg-[#081830] focus:outline-2 focus:outline-[#1D4ED8]"
                          />
                        </div>

                        <div className="relative flex items-center">
                          <label htmlFor="catalog-sort-select" className="sr-only">
                            ترتيب المنتجات
                          </label>
                          <ArrowUpDown
                            className="pointer-events-none absolute right-3.5 h-4 w-4 text-[#1D4ED8] dark:text-[#38BDF8]"
                            aria-hidden="true"
                          />
                          <select
                            id="catalog-sort-select"
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="min-h-[44px] w-full sm:w-auto rounded-xl bg-[#F2FAFF] dark:bg-[#0E264A] border border-[#CBE7FA] dark:border-[#1E3F73] pr-9 pl-4 py-2 text-xs sm:text-sm font-bold text-[#0F294A] dark:text-[#E0F2FE] focus:bg-white dark:focus:bg-[#081830] focus:outline-2 focus:outline-[#1D4ED8] cursor-pointer"
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
                    <div className="rounded-3xl bg-[#F2FAFF] dark:bg-[#0E264A] border border-[#D8EEFB] dark:border-[#1E3F73] p-10 sm:p-14 text-center">
                      {searchQuery.trim() ? (
                        <>
                          <p className="text-base sm:text-lg font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF] mb-2">
                            لم نجد منتجات تطابق بحثك الحالي
                          </p>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-5">
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
                          <p className="text-base sm:text-lg font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF] mb-2">
                            يتم تحديث قائمة المنتجات والأجهزة الحديثة باستمرار
                          </p>
                          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-5 max-w-lg mx-auto">
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
            </main>

            <Footer
              onAdminButtonClick={handleAdminButtonClick}
              onNavigateAbout={() => navigateToView('about')}
            />

            {/* Desktop Product Details Modal */}
            <ProductDetailModal
              product={selectedProduct}
              onClose={() => setSelectedProduct(null)}
              publicOrigin={publicOrigin}
            />
          </div>
        </div>
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

