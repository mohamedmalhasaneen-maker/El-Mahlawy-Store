import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, MessageCircle, RotateCcw, Search } from 'lucide-react';
import './lib/firebase';
import { SiteConfigContext } from './contexts/SiteConfigContext';
import { Product, ProductFormInput, SortOption } from './types/store';
import {
  filterAndSortProducts,
  findProductByShareParam,
  getDiscountedProducts,
} from './utils/catalogLogic';
import { DEFAULT_SITE_CONFIG, SiteConfig, sanitizeSiteConfig } from './utils/siteConfig';
import {
  DiscountQuickUpdatePayload,
  User,
  auth,
  db,
  doc,
  runTransaction,
  checkUserIsCloudAdmin,
  createCloudProduct,
  deleteCloudProduct,
  isAuthorizedDeveloperUser,
  migrateLegacySiteConfigMapsInCloud,
  onAuthStateChanged,
  saveCloudSiteConfig,
  signOutAdmin,
  subscribeToAllProductsForAdmin,
  subscribeToPublishedProducts,
  subscribeToSiteConfig,
  updateCloudProduct,
  updateCloudProductDiscount,
  updateCloudProductFlags,
} from './lib/firebase';
import { isPermanentAuthSessionInvalidError } from './utils/developerAuth';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { OffersSection } from './components/OffersSection';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { AboutUsPage } from './components/AboutUsPage';
import { DeveloperSettingsPage } from './components/DeveloperSettingsPage';
import { Footer } from './components/Footer';
import { MobileStorefront } from './components/mobile/MobileStorefront';
import { TechBackground } from './components/TechBackground';
import { RatingInvitationPrompt } from './components/RatingInvitationPrompt';
import { RatingFormModal } from './components/RatingFormModal';
import { listenForRatingPromptTrigger, recordUsefulActivity } from './utils/activityTracker';
import { useTheme } from './utils/useTheme';
import { getCategoryName, getOrderedCategories } from './constants/categories';

const LOCAL_STORAGE_KEY = 'mahallawy_store_catalog_v1';
const SITE_CONFIG_CACHE_KEY = 'mahallawy_site_config_v1';

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

function loadCachedSiteConfig(): SiteConfig {
  try {
    const raw = localStorage.getItem(SITE_CONFIG_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<SiteConfig>;
      if (parsed && typeof parsed === 'object' && typeof parsed.storeName === 'string') {
        return sanitizeSiteConfig(
          parsed,
          typeof parsed.updatedBy === 'string' ? parsed.updatedBy : 'system'
        );
      }
    }
  } catch {
    // Ignore malformed cache
  }
  return DEFAULT_SITE_CONFIG;
}

function resolveInitialView(): 'store' | 'about' | 'developer' {
  if (typeof window === 'undefined') return 'store';
  const hash = window.location.hash.toLowerCase();
  const search = window.location.search.toLowerCase();
  if (
    hash === '#developer' ||
    hash === '#developer-settings' ||
    hash === '#admin' ||
    search.includes('view=developer')
  ) {
    return 'developer';
  }
  if (hash === '#about' || search.includes('view=about')) {
    return 'about';
  }
  return 'store';
}

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const [activeView, setActiveView] = useState<'store' | 'about' | 'developer'>(() => {
    const initial = resolveInitialView();
    // Entry should never be 'about' per user request
    if (initial === 'about') return 'store';
    return initial;
  });
  const [products, setProducts] = useState<Product[]>(loadCachedProducts);
  const [adminProducts, setAdminProducts] = useState<Product[] | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(
    () => loadCachedProducts().length === 0
  );
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(loadCachedSiteConfig);

  // Firebase Auth state for Developer Settings
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isCloudAdmin, setIsCloudAdmin] = useState(false);

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
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  // Visitor Rating invitation prompt & modal state
  const [isRatingPromptOpen, setIsRatingPromptOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  useEffect(() => {
    return listenForRatingPromptTrigger(() => {
      setIsRatingPromptOpen(true);
    });
  }, []);

  const handleSelectProduct = (product: Product | null) => {
    setSelectedProduct(product);
    if (product) {
      recordUsefulActivity('view_product_details', product.name);
    }
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 1) {
      recordUsefulActivity('search', query.trim());
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    if (categoryId !== 'all') {
      recordUsefulActivity('category_switch', categoryId);
    }
  };

  // Sync URL hash <-> activeView
  useEffect(() => {
    // Force reset to home if the entry was #about to satisfy "entry should be home" request
    if (typeof window !== 'undefined' && window.location.hash.toLowerCase() === '#about') {
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        setActiveView('store');
      } catch {
        // Ignore iframe history restrictions
      }
    }

    const syncViewWithUrl = () => {
      setActiveView(resolveInitialView());
    };
    syncViewWithUrl();
    if (typeof window !== 'undefined') {
      window.addEventListener('hashchange', syncViewWithUrl);
      window.addEventListener('popstate', syncViewWithUrl);
      return () => {
        window.removeEventListener('hashchange', syncViewWithUrl);
        window.removeEventListener('popstate', syncViewWithUrl);
      };
    }
  }, []);

  // Sync document SEO title & meta description dynamically with cloud SiteConfig
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const title = siteConfig.seoTitle?.trim() || `${siteConfig.storeName} | ${siteConfig.storeSubtitle}`;
    document.title = title;

    const description = siteConfig.seoDescription?.trim();
    if (description) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', description);
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute('content', description);
    }
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);
  }, [siteConfig.seoTitle, siteConfig.seoDescription, siteConfig.storeName, siteConfig.storeSubtitle]);

  // Listen to Firebase Auth state & verify admin role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const allowed = await checkUserIsCloudAdmin(user);
          setIsCloudAdmin(allowed);
        } catch {
          setIsCloudAdmin(false);
        }
      } else {
        setIsCloudAdmin(false);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const handleRefreshAuth = useCallback(async (options?: { reloadFromServer?: boolean }) => {
    if (!auth.currentUser) return;
    const shouldReloadFromServer = options?.reloadFromServer !== false;
    if (shouldReloadFromServer) {
      await auth.currentUser.reload();
      if (isAuthorizedDeveloperUser(auth.currentUser)) {
        await auth.currentUser.getIdToken(true);
      }
    } else if (isAuthorizedDeveloperUser(auth.currentUser)) {
      await auth.currentUser.getIdToken(false);
    }
    const refreshed = auth.currentUser;
    if (!refreshed) return;
    setCurrentUser({ ...refreshed } as User);
    const allowed = await checkUserIsCloudAdmin(refreshed);
    setIsCloudAdmin(allowed);
  }, []);

  const navigateToView = (view: 'store' | 'about' | 'developer') => {
    if (view === 'about') {
      recordUsefulActivity('view_about_page');
    }
    setActiveView(view);
    if (typeof window !== 'undefined') {
      try {
        if (view === 'about') {
          window.history.pushState(null, '', '#about');
        } else if (view === 'developer') {
          window.history.pushState(null, '', '#developer');
        } else {
          window.history.pushState(null, '', window.location.pathname + window.location.search);
        }
      } catch {
        // Ignore history restrictions in sandboxed iframes
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenDeveloperSettings = () => {
    navigateToView('developer');
  };

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

  // Increment visitor count
  useEffect(() => {
    const incrementVisitorCount = async () => {
      const statsRef = doc(db, 'meta', 'visitors');
      try {
        await runTransaction(db, async (transaction) => {
          const sfDoc = await transaction.get(statsRef);
          if (!sfDoc.exists()) {
            transaction.set(statsRef, { id: 'visitors', count: 1 });
          } else {
            const newCount = (sfDoc.data().count || 0) + 1;
            transaction.update(statsRef, { count: newCount });
          }
        });
      } catch (e) {
        console.error("Error incrementing visitor count", e);
      }
    };
    incrementVisitorCount();
  }, []);

  // Subscribe to public published products and cloud SiteConfig
  useEffect(() => {
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

    const unsubProducts = subscribeToPublishedProducts(
      (items) => {
        setProducts(items);
        setIsLoadingProducts(false);
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
        } catch {
          // Ignore storage quota warnings
        }
      },
      (err) => {
        console.error('Error fetching published products:', err);
        setIsLoadingProducts(false);
      }
    );

    const unsubSiteConfig = subscribeToSiteConfig(
      (cfg) => {
        setSiteConfig(cfg);
        try {
          localStorage.setItem(SITE_CONFIG_CACHE_KEY, JSON.stringify(cfg));
        } catch {
          // Ignore storage quota warnings
        }
      },
      (err) => {
        console.error('Error fetching site config:', err);
      }
    );

    return () => {
      unsubProducts();
      unsubSiteConfig();
    };
  }, []);

  // Subscribe to full catalog (including hidden/unpublished products) when authenticated as authorized developer
  useEffect(() => {
    const isAuthorized = isAuthorizedDeveloperUser(currentUser);

    if (!isCloudAdmin || !isAuthorized) {
      setAdminProducts(null);
      return;
    }

    const unsubAll = subscribeToAllProductsForAdmin(
      (items) => {
        setAdminProducts(items);
      },
      (err) => {
        console.error('Admin catalog subscription fallback:', err);
        setAdminProducts(null);
      }
    );

    void migrateLegacySiteConfigMapsInCloud().then((migrated) => {
      if (migrated) {
        setSiteConfig(migrated);
        try {
          localStorage.setItem(SITE_CONFIG_CACHE_KEY, JSON.stringify(migrated));
        } catch {
          // Ignore storage quota warnings
        }
      }
    });

    return () => unsubAll();
  }, [currentUser, isCloudAdmin]);

  const handleDeveloperLogout = useCallback(async () => {
    try {
      await signOutAdmin();
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setIsCloudAdmin(false);
      setCurrentUser(null);
      setAdminProducts(null);
    }
  }, []);

  // Secure session management: idle auto-logout (45 min) & token validity recheck on tab focus
  useEffect(() => {
    if (!isCloudAdmin) return;
    const IDLE_TIMEOUT_MS = 45 * 60 * 1000;
    let idleTimer: ReturnType<typeof setTimeout> | undefined;

    const resetIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        void handleDeveloperLogout();
      }, IDLE_TIMEOUT_MS);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && auth.currentUser) {
        auth.currentUser
          .reload()
          .then(async () => {
            const allowed = await checkUserIsCloudAdmin(auth.currentUser);
            if (!allowed) {
              await handleDeveloperLogout();
            }
          })
          .catch((err) => {
            if (isPermanentAuthSessionInvalidError(err)) {
              void handleDeveloperLogout();
            }
          });
      }
    };

    resetIdleTimer();
    const activityEvents: (keyof WindowEventMap)[] = [
      'pointerdown',
      'keydown',
      'touchstart',
      'scroll',
    ];
    for (const ev of activityEvents) {
      window.addEventListener(ev, resetIdleTimer, { passive: true });
    }
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (idleTimer) clearTimeout(idleTimer);
      for (const ev of activityEvents) {
        window.removeEventListener(ev, resetIdleTimer);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isCloudAdmin, handleDeveloperLogout]);

  const syncAuthoritativeProductIntoState = useCallback((saved: Product) => {
    setProducts((prev) => {
      const withoutTarget = prev.filter((item) => item.id !== saved.id);
      const next = saved.isPublished ? [saved, ...withoutTarget] : withoutTarget;
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage quota warnings
      }
      return next;
    });
    setAdminProducts((prev) => {
      if (!prev) return prev;
      const withoutTarget = prev.filter((item) => item.id !== saved.id);
      return [saved, ...withoutTarget];
    });
  }, []);

  const handleSaveProduct = async (input: ProductFormInput, editingId?: string) => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      throw new Error('يرجى تسجيل الدخول بحساب المطور أولًا.');
    }
    const saved = editingId
      ? await updateCloudProduct(
          editingId,
          input,
          (adminProducts ?? products).find((p) => p.id === editingId)?.authorUid || currentUid
        )
      : await createCloudProduct(input, currentUid);
    syncAuthoritativeProductIntoState(saved);
  };

  const handleDeleteProduct = async (productId: string) => {
    await deleteCloudProduct(productId);
    setProducts((prev) => {
      const next = prev.filter((item) => item.id !== productId);
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage quota warnings
      }
      return next;
    });
    setAdminProducts((prev) => (prev ? prev.filter((item) => item.id !== productId) : prev));
  };

  const handleSaveProductDiscount = async (
    productId: string,
    payload: DiscountQuickUpdatePayload
  ) => {
    const saved = await updateCloudProductDiscount(productId, payload);
    syncAuthoritativeProductIntoState(saved);
  };

  const handleQuickUpdateProductFlags = async (
    product: Product,
    updates: Partial<Pick<Product, 'isPublished' | 'inStock' | 'isFeatured'>>
  ) => {
    const saved = await updateCloudProductFlags(product.id, updates);
    syncAuthoritativeProductIntoState(saved);
  };

  const handleSaveSiteConfig = async (nextConfig: SiteConfig) => {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      throw new Error('يرجى تسجيل الدخول بحساب المطور أولًا.');
    }
    const saved = await saveCloudSiteConfig(nextConfig, currentUid);
    setSiteConfig(saved);
    try {
      localStorage.setItem(SITE_CONFIG_CACHE_KEY, JSON.stringify(saved));
    } catch {
      // Ignore storage quota warnings
    }
  };

  const orderedStoreCategories = useMemo(
    () => getOrderedCategories(siteConfig.categories),
    [siteConfig.categories]
  );

  useEffect(() => {
    if (
      selectedCategoryId !== 'all' &&
      !orderedStoreCategories.some((c) => c.id === selectedCategoryId)
    ) {
      setSelectedCategoryId('all');
    }
  }, [selectedCategoryId, orderedStoreCategories]);

  const discountedProducts = useMemo(() => getDiscountedProducts(products), [products]);

  const filteredProducts = useMemo(() => {
    return filterAndSortProducts(products, searchQuery, selectedCategoryId, sortBy);
  }, [products, searchQuery, sortBy, selectedCategoryId]);

  const heroSpotlightProduct = useMemo(() => {
    if (!siteConfig.showHeroSpotlight) return undefined;
    return (
      products.find((p) => p.isFeatured && p.isPublished) ||
      products.find((p) => p.isPublished) ||
      undefined
    );
  }, [products, siteConfig.showHeroSpotlight]);

  const developerCatalogProducts = useMemo(() => {
    const source = adminProducts ?? products;
    return [...source].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  }, [adminProducts, products]);

  return (
    <SiteConfigContext.Provider value={siteConfig}>
      <div className="relative min-h-screen flex flex-col bg-white dark:bg-[#071326] text-[#0B1F3A] dark:text-[#F0F9FF] transition-colors">
        <TechBackground isDark={isDark} />

        {activeView === 'developer' ? (
          <div className="relative z-10">
            <DeveloperSettingsPage
              products={developerCatalogProducts}
              siteConfig={siteConfig}
              currentUser={currentUser}
              isAuthReady={isAuthReady}
              isCloudAdmin={isCloudAdmin}
              onRefreshAuth={handleRefreshAuth}
              onLogout={handleDeveloperLogout}
              onBackToStore={async () => {
                await handleDeveloperLogout();
                navigateToView('store');
              }}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
              onSaveProductDiscount={handleSaveProductDiscount}
              onQuickUpdateProductFlags={handleQuickUpdateProductFlags}
              onSaveSiteConfig={handleSaveSiteConfig}
            />
          </div>
        ) : activeView === 'about' ? (
          <div className="relative z-10">
            <AboutUsPage
              onBackToStore={() => navigateToView('store')}
              onAdminButtonClick={handleOpenDeveloperSettings}
              isDark={isDark}
              onToggleTheme={toggleTheme}
            />
          </div>
        ) : (
          <div className="relative z-10">
            {/* Dedicated Mobile Storefront (< 768px) */}
            <MobileStorefront
              products={products}
              filteredProducts={filteredProducts}
              discountedProducts={discountedProducts}
              isLoadingProducts={isLoadingProducts}
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onAdminButtonClick={handleOpenDeveloperSettings}
              onNavigateAbout={() => navigateToView('about')}
              isDark={isDark}
              onToggleTheme={toggleTheme}
              publicOrigin={publicOrigin}
              initialProductId={sharedProductId}
              onConsumeInitialProduct={clearSharedProductParam}
              selectedCategoryId={selectedCategoryId}
              onCategoryChange={handleCategoryChange}
              onOpenRatingModal={() => setIsRatingModalOpen(true)}
            />

            {/* Desktop Storefront (>= 768px) */}
            <div className="hidden md:flex md:flex-col min-h-screen">
              <Navbar
                activeView={activeView}
                onSwitchView={(view) => {
                  if (view === 'developer') {
                    handleOpenDeveloperSettings();
                  } else {
                    navigateToView(view);
                  }
                }}
                onAdminButtonClick={handleOpenDeveloperSettings}
                hasDiscountOffers={discountedProducts.length > 0 && siteConfig.showOffersSection}
                isDark={isDark}
                onToggleTheme={toggleTheme}
                onOpenRatingModal={() => setIsRatingModalOpen(true)}
              />

              <main className="flex-1">
                {/* 1. Welcome Hero & Trust Banner */}
                <HeroSection
                  searchQuery={searchQuery}
                  onSearchChange={handleSearchChange}
                  featuredProduct={heroSpotlightProduct}
                  onSelectProduct={(product) => handleSelectProduct(product)}
                  hasDiscountOffers={discountedProducts.length > 0 && siteConfig.showOffersSection}
                />

                {/* 2. Dedicated Offers & Discounts Section */}
                {siteConfig.showOffersSection && (
                  <OffersSection
                    products={products}
                    onViewDetails={(product) => handleSelectProduct(product)}
                    publicOrigin={publicOrigin}
                  />
                )}

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
                          منتجات {siteConfig.storeName}
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
                              onChange={(e) => handleSearchChange(e.target.value)}
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

                    {/* Category Filter Bar */}
                    <div className="mb-10 overflow-x-auto pb-2 scrollbar-hide">
                      <div className="flex items-center gap-3 min-w-max">
                        <button
                          type="button"
                          onClick={() => handleCategoryChange('all')}
                          className={`min-h-[44px] px-6 py-2.5 rounded-2xl text-sm font-extrabold transition-all border ${
                            selectedCategoryId === 'all'
                              ? 'bg-[#1D4ED8] text-white border-[#1D4ED8] shadow-lg scale-105'
                              : 'bg-[#F2FAFF] dark:bg-[#0E264A] text-[#0F294A] dark:text-[#E0F2FE] border-[#CBE7FA] dark:border-[#1E3F73] hover:bg-[#E0F2FE] dark:hover:bg-[#163663]'
                          } cursor-pointer`}
                        >
                          الكل
                        </button>
                        {orderedStoreCategories.map((cat) => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => handleCategoryChange(cat.id)}
                            className={`min-h-[44px] px-6 py-2.5 rounded-2xl text-sm font-extrabold transition-all border ${
                              selectedCategoryId === cat.id
                                ? 'bg-[#1D4ED8] text-white border-[#1D4ED8] shadow-lg scale-105'
                                : 'bg-[#F2FAFF] dark:bg-[#0E264A] text-[#0F294A] dark:text-[#E0F2FE] border-[#CBE7FA] dark:border-[#1E3F73] hover:bg-[#E0F2FE] dark:hover:bg-[#163663]'
                            } cursor-pointer`}
                          >
                            {cat.name}
                          </button>
                        ))}
                      </div>
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
                              جرّب البحث بكلمة أخرى أو استعرض كافة منتجات {siteConfig.storeName}.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleSearchChange('')}
                              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] px-5 py-2.5 text-xs sm:text-sm font-bold text-white cursor-pointer"
                            >
                              <RotateCcw className="h-4 w-4" aria-hidden="true" />
                              <span>عرض جميع المنتجات</span>
                            </button>
                          </>
                        ) : selectedCategoryId !== 'all' ? (
                          <>
                            <p className="text-base sm:text-lg font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF] mb-2">
                              لا توجد منتجات في «
                              {getCategoryName(selectedCategoryId, orderedStoreCategories)}» حاليًا
                            </p>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-5 max-w-lg mx-auto">
                              يتم تحديث قائمة المنتجات باستمرار. يمكنك استعراض كافة الأقسام أو التواصل معنا للاستفسار.
                            </p>
                            <button
                              type="button"
                              onClick={() => handleCategoryChange('all')}
                              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] px-5 py-2.5 text-xs sm:text-sm font-bold text-white cursor-pointer"
                            >
                              عرض جميع الأقسام
                            </button>
                          </>
                        ) : (
                          <>
                            <p className="text-base sm:text-lg font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF] mb-2">
                              يتم تحديث قائمة المنتجات والأجهزة الحديثة باستمرار
                            </p>
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-5 max-w-lg mx-auto">
                              تواصل معنا مباشرة عبر واتساب الأعمال للاستفسار عن أحدث الموديلات
                              والأسعار والتوافر في {siteConfig.storeName}.
                            </p>
                            <a
                              href={siteConfig.whatsappUrl}
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
                            onViewDetails={(p) => handleSelectProduct(p)}
                            publicOrigin={publicOrigin}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              </main>

              <Footer
                onAdminButtonClick={handleOpenDeveloperSettings}
                onNavigateAbout={() => navigateToView('about')}
                onOpenRatingModal={() => setIsRatingModalOpen(true)}
              />

              {/* Desktop Product Details Modal */}
              <ProductDetailModal
                product={selectedProduct}
                onClose={() => handleSelectProduct(null)}
                publicOrigin={publicOrigin}
              />
            </div>
          </div>
        )}

        {/* Visitor Rating Prompt & Form Modal */}
        <RatingInvitationPrompt
          isOpen={isRatingPromptOpen}
          onOpenRatingModal={() => {
            setIsRatingPromptOpen(false);
            setIsRatingModalOpen(true);
          }}
          onClose={() => setIsRatingPromptOpen(false)}
        />

        <RatingFormModal
          isOpen={isRatingModalOpen}
          onClose={() => setIsRatingModalOpen(false)}
        />
      </div>
    </SiteConfigContext.Provider>
  );
}
