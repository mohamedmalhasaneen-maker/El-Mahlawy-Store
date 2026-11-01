import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowUpDown, MessageCircle, RotateCcw, Search, Star } from 'lucide-react';
import './lib/firebase';
import { SiteConfigContext } from './contexts/SiteConfigContext';
import { Product, ProductFormInput, SortOption } from './types/store';
import {
  filterAndSortProducts,
  findProductByShareParam,
  getDiscountedProducts,
  getFeaturedProducts,
  isStorefrontShowingFeatured,
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
  reorderCloudFeaturedProducts,
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
import { ValuesAndPrinciplesSection } from './components/ValuesAndPrinciplesSection';
import { RatingInvitationPrompt } from './components/RatingInvitationPrompt';
import { RatingFormModal } from './components/RatingFormModal';
import { listenForRatingPromptTrigger, recordUsefulActivity } from './utils/activityTracker';
import { useTheme } from './utils/useTheme';
import { getCategoryIdByName, getCategoryName, getOrderedCategories } from './constants/categories';
import {
  SeoRouteInfo,
  buildPageSeoMetadata,
  buildStructuredDataGraph,
  parseStoreSeoRoute,
  syncDocumentSeoHead,
} from './utils/seo';

const LEGACY_PRODUCT_STORAGE_KEY = 'mahallawy_store_catalog_v1';
const SITE_CONFIG_CACHE_KEY = 'mahallawy_site_config_v1';

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

function readWindowLocationSnapshot(): { pathname: string; search: string; hash: string } {
  if (typeof window === 'undefined') {
    return { pathname: '/', search: '', hash: '' };
  }
  return {
    pathname: window.location.pathname || '/',
    search: window.location.search || '',
    hash: window.location.hash || '',
  };
}

function resolveViewFromRoute(
  route: SeoRouteInfo,
  pathname: string,
  hash: string
): 'store' | 'about' | 'developer' {
  if (route.kind === 'developer') return 'developer';
  if (route.kind === 'about') {
    // Clean stale #about hash on root reload while honoring clean /about pathname & ?view=about
    if ((pathname === '/' || pathname === '') && hash.toLowerCase() === '#about') {
      return 'store';
    }
    return 'about';
  }
  return 'store';
}

export default function App() {
  const { isDark, toggleTheme } = useTheme();
  const [locationSnapshot, setLocationSnapshot] = useState(readWindowLocationSnapshot);

  const initialRoute = useMemo(() => {
    const snap = readWindowLocationSnapshot();
    return parseStoreSeoRoute(snap.pathname, snap.search, snap.hash);
  }, []);

  const [activeView, setActiveView] = useState<'store' | 'about' | 'developer'>(() => {
    const snap = readWindowLocationSnapshot();
    return resolveViewFromRoute(initialRoute, snap.pathname, snap.hash);
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [adminProducts, setAdminProducts] = useState<Product[] | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(true);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(loadCachedSiteConfig);

  // Firebase Auth state for Developer Settings
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isCloudAdmin, setIsCloudAdmin] = useState(false);

  // Storefront search, sort & detail modal
  const [searchQuery, setSearchQuery] = useState<string>(() =>
    initialRoute.kind === 'search' ? initialRoute.query : ''
  );
  const [sortBy, setSortBy] = useState<SortOption>(SortOption.NEWEST);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [mobileActiveProduct, setMobileActiveProduct] = useState<Product | null>(null);
  const [sharedProductId, setSharedProductId] = useState<string | null>(() =>
    initialRoute.kind === 'product' ? initialRoute.productId : null
  );
  const [publicOrigin, setPublicOrigin] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.origin : ''
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(() =>
    initialRoute.kind === 'category' ? initialRoute.categoryId : 'all'
  );

  // Visitor Rating invitation prompt & modal state
  const [isRatingPromptOpen, setIsRatingPromptOpen] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);

  const updateBrowserUrl = useCallback((nextUrl: string, mode: 'push' | 'replace' = 'push') => {
    if (typeof window === 'undefined') return;
    try {
      const currentFull = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (currentFull !== nextUrl) {
        if (mode === 'replace') {
          window.history.replaceState(window.history.state, '', nextUrl);
        } else {
          window.history.pushState(null, '', nextUrl);
        }
      }
      setLocationSnapshot(readWindowLocationSnapshot());
    } catch {
      // Ignore history restrictions in sandboxed iframes
    }
  }, []);

  useEffect(() => {
    return listenForRatingPromptTrigger(() => {
      setIsRatingPromptOpen(true);
    });
  }, []);

  const getStoreFallbackPath = useCallback((catId: string): string => {
    if (catId && catId !== 'all' && catId !== 'featured') {
      return `/category/${encodeURIComponent(catId)}`;
    }
    return '/';
  }, []);

  const handleSelectProduct = (product: Product | null) => {
    setSelectedProduct(product);
    if (product) {
      recordUsefulActivity('view_product_details', product.name);
      updateBrowserUrl(`/product/${encodeURIComponent(product.id)}`, 'replace');
    } else if (typeof window !== 'undefined') {
      const snap = readWindowLocationSnapshot();
      const currentRoute = parseStoreSeoRoute(snap.pathname, snap.search, snap.hash);
      if (currentRoute.kind === 'product') {
        updateBrowserUrl(getStoreFallbackPath(selectedCategoryId), 'replace');
      }
    }
  };

  const handleMobileActiveProductChange = useCallback(
    (product: Product | null) => {
      setMobileActiveProduct(product);
      if (product) {
        updateBrowserUrl(`/product/${encodeURIComponent(product.id)}`, 'replace');
      } else if (typeof window !== 'undefined') {
        const snap = readWindowLocationSnapshot();
        const currentRoute = parseStoreSeoRoute(snap.pathname, snap.search, snap.hash);
        if (currentRoute.kind === 'product') {
          updateBrowserUrl(getStoreFallbackPath(selectedCategoryId), 'replace');
        }
      }
    },
    [getStoreFallbackPath, selectedCategoryId, updateBrowserUrl]
  );

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 1) {
      recordUsefulActivity('search', query.trim());
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    if (categoryId === 'featured') {
      setSortBy(SortOption.FEATURED);
    } else if (sortBy === SortOption.FEATURED) {
      setSortBy(SortOption.NEWEST);
    }
    if (categoryId !== 'all' && categoryId !== 'featured') {
      recordUsefulActivity('category_switch', categoryId);
    }
    updateBrowserUrl(getStoreFallbackPath(categoryId), 'push');
  };

  // Sync URL pathname/search/hash <-> activeView, category, search & product state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Clean legacy #about hash on root reload so home entry stays clean
    if (
      (window.location.pathname === '/' || window.location.pathname === '') &&
      window.location.hash.toLowerCase() === '#about'
    ) {
      updateBrowserUrl(window.location.pathname + window.location.search || '/', 'replace');
      setActiveView('store');
    }

    const syncFromWindowLocation = () => {
      const snap = readWindowLocationSnapshot();
      setLocationSnapshot(snap);
      const route = parseStoreSeoRoute(snap.pathname, snap.search, snap.hash);

      if (route.kind === 'developer') {
        setActiveView('developer');
        setSelectedProduct(null);
        setMobileActiveProduct(null);
        return;
      }

      if (route.kind === 'about') {
        setActiveView('about');
        setSelectedProduct(null);
        setMobileActiveProduct(null);
        return;
      }

      setActiveView('store');
      if (route.kind === 'product') {
        setSharedProductId(route.productId);
      } else {
        setSelectedProduct(null);
        setMobileActiveProduct(null);
        setSharedProductId(null);
      }

      if (route.kind === 'category') {
        setSelectedCategoryId(route.categoryId);
      } else if (route.kind === 'home') {
        setSelectedCategoryId('all');
      }

      if (route.kind === 'search') {
        setSearchQuery(route.query);
      }
    };

    window.addEventListener('hashchange', syncFromWindowLocation);
    window.addEventListener('popstate', syncFromWindowLocation);
    return () => {
      window.removeEventListener('hashchange', syncFromWindowLocation);
      window.removeEventListener('popstate', syncFromWindowLocation);
    };
  }, [updateBrowserUrl]);

  // Synchronize document <title>, <meta>, <link rel="canonical">, OpenGraph, Twitter & JSON-LD
  const activeSeoProduct = selectedProduct || mobileActiveProduct;
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const baseRoute = parseStoreSeoRoute(
      locationSnapshot.pathname,
      locationSnapshot.search,
      locationSnapshot.hash
    );

    let effectiveRoute: SeoRouteInfo = baseRoute;
    if (activeView === 'developer') {
      effectiveRoute = { kind: 'developer', canonicalPath: '/developer' };
    } else if (activeView === 'about') {
      effectiveRoute = { kind: 'about', canonicalPath: '/about' };
    } else if (activeSeoProduct) {
      effectiveRoute = {
        kind: 'product',
        productId: activeSeoProduct.id,
        canonicalPath: `/product/${encodeURIComponent(activeSeoProduct.id)}`,
      };
    } else if (baseRoute.kind === 'home' && searchQuery.trim().length > 0) {
      effectiveRoute = {
        kind: 'search',
        query: searchQuery.trim(),
        canonicalPath: '/',
      };
    }

    const origin =
      publicOrigin || (typeof window !== 'undefined' ? window.location.origin : '');
    const seoInput = {
      origin,
      route: effectiveRoute,
      siteConfig,
      products,
      activeProductOverride: activeSeoProduct,
      catalogLoaded: !isLoadingProducts,
    };

    const meta = buildPageSeoMetadata(seoInput);
    const jsonLdGraph = buildStructuredDataGraph(seoInput);
    syncDocumentSeoHead(meta, jsonLdGraph);
  }, [
    activeSeoProduct,
    activeView,
    isLoadingProducts,
    locationSnapshot.hash,
    locationSnapshot.pathname,
    locationSnapshot.search,
    products,
    publicOrigin,
    searchQuery,
    siteConfig,
  ]);

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
    setSelectedProduct(null);
    setMobileActiveProduct(null);
    setSharedProductId(null);
    setActiveView(view);
    if (typeof window !== 'undefined') {
      if (view === 'about') {
        updateBrowserUrl('/about', 'push');
      } else if (view === 'developer') {
        updateBrowserUrl('/developer', 'push');
      } else {
        setSelectedCategoryId('all');
        updateBrowserUrl('/', 'push');
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOpenDeveloperSettings = () => {
    navigateToView('developer');
  };

  const consumeSharedProduct = useCallback(
    (matchedProductId?: string) => {
      setSharedProductId(null);
      if (typeof window === 'undefined') return;
      if (matchedProductId) {
        updateBrowserUrl(`/product/${encodeURIComponent(matchedProductId)}`, 'replace');
      }
    },
    [updateBrowserUrl]
  );

  useEffect(() => {
    if (!sharedProductId || products.length === 0) return;
    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      const matched = findProductByShareParam(products, sharedProductId);
      if (matched) {
        setSelectedProduct(matched);
        consumeSharedProduct(matched.id);
      }
    }
  }, [consumeSharedProduct, sharedProductId, products]);

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

    try {
      localStorage.removeItem(LEGACY_PRODUCT_STORAGE_KEY);
    } catch {
      // Ignore storage restrictions
    }

    const unsubProducts = subscribeToPublishedProducts(
      (items) => {
        setProducts(items);
        setIsLoadingProducts(false);
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
      return saved.isPublished ? [saved, ...withoutTarget] : withoutTarget;
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
    setProducts((prev) => prev.filter((item) => item.id !== productId));
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
    updates: Partial<Pick<Product, 'isPublished' | 'inStock' | 'isFeatured' | 'featuredOrder'>>
  ) => {
    const saved = await updateCloudProductFlags(product.id, updates);
    syncAuthoritativeProductIntoState(saved);
  };

  const handleReorderFeaturedProducts = async (orderedIds: string[]) => {
    const updatedItems = await reorderCloudFeaturedProducts(orderedIds);
    for (const saved of updatedItems) {
      syncAuthoritativeProductIntoState(saved);
    }
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
    if (isLoadingProducts) return;
    if (selectedCategoryId !== 'all' && selectedCategoryId !== 'featured') {
      const resolvedId = getCategoryIdByName(selectedCategoryId, orderedStoreCategories);
      if (!resolvedId) {
        setSelectedCategoryId('all');
      } else if (resolvedId !== selectedCategoryId) {
        setSelectedCategoryId(resolvedId);
      }
    }
    if (selectedCategoryId === 'featured' && !products.some((p) => p.isPublished && p.isFeatured)) {
      setSelectedCategoryId('all');
    }
  }, [isLoadingProducts, selectedCategoryId, orderedStoreCategories, products]);

  const discountedProducts = useMemo(() => getDiscountedProducts(products), [products]);
  const featuredProducts = useMemo(() => getFeaturedProducts(products), [products]);
  const hasFeaturedProducts = featuredProducts.length > 0;
  const isShowingFeatured = useMemo(
    () => isStorefrontShowingFeatured(products, searchQuery, selectedCategoryId),
    [products, searchQuery, selectedCategoryId]
  );
  const effectiveSortValue =
    !isShowingFeatured && sortBy === SortOption.FEATURED ? SortOption.NEWEST : sortBy;

  const filteredProducts = useMemo(() => {
    return filterAndSortProducts(products, searchQuery, selectedCategoryId, sortBy);
  }, [products, searchQuery, sortBy, selectedCategoryId]);

  const heroSpotlightProduct = useMemo(() => {
    if (!siteConfig.showHeroSpotlight) return undefined;
    if (featuredProducts.length > 0) {
      return featuredProducts[0];
    }
    const published = products.filter((p) => p.isPublished);
    if (published.length === 0) return undefined;
    const sortedByNewest = [...published].sort((a, b) =>
      (b.createdAt || '').localeCompare(a.createdAt || '')
    );
    return sortedByNewest[0];
  }, [products, featuredProducts, siteConfig.showHeroSpotlight]);

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
              onReorderFeaturedProducts={handleReorderFeaturedProducts}
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
              onConsumeInitialProduct={() => consumeSharedProduct(sharedProductId || undefined)}
              selectedCategoryId={selectedCategoryId}
              onCategoryChange={handleCategoryChange}
              hasFeaturedProducts={hasFeaturedProducts}
              isShowingFeatured={isShowingFeatured}
              featuredProducts={siteConfig.showHeroSpotlight ? featuredProducts : []}
              heroSpotlightProduct={heroSpotlightProduct}
              onOpenRatingModal={() => setIsRatingModalOpen(true)}
              onActiveProductChange={handleMobileActiveProductChange}
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
                  featuredProducts={siteConfig.showHeroSpotlight ? featuredProducts : []}
                  onSelectProduct={(product) => handleSelectProduct(product)}
                  hasDiscountOffers={discountedProducts.length > 0 && siteConfig.showOffersSection}
                  publicOrigin={publicOrigin}
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
                          {searchQuery.trim()
                            ? 'نتائج البحث في الكتالوج'
                            : isShowingFeatured
                              ? `اختياراتنا المميزة في ${siteConfig.storeName}`
                              : selectedCategoryId !== 'all' && selectedCategoryId !== 'featured'
                                ? `تصفح منتجات القسم في ${siteConfig.storeName}`
                                : 'أحدث المنتجات والأجهزة المتاحة'}
                        </p>
                        <h2
                          id="catalog-heading"
                          className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF] flex items-center gap-2.5"
                        >
                          {isShowingFeatured && (
                            <Star
                              className="h-6 w-6 sm:h-7 sm:w-7 text-[#F59E0B] fill-[#F59E0B] shrink-0"
                              aria-hidden="true"
                            />
                          )}
                          <span>
                            {searchQuery.trim()
                              ? `نتائج البحث في ${siteConfig.storeName}`
                              : isShowingFeatured
                                ? 'منتجاتنا المفضّلة'
                                : selectedCategoryId !== 'all' && selectedCategoryId !== 'featured'
                                  ? getCategoryName(selectedCategoryId, orderedStoreCategories)
                                  : 'أحدث منتجاتنا'}
                          </span>
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
                              value={effectiveSortValue}
                              onChange={(e) => setSortBy(e.target.value as SortOption)}
                              className="min-h-[44px] w-full sm:w-auto rounded-xl bg-[#F2FAFF] dark:bg-[#0E264A] border border-[#CBE7FA] dark:border-[#1E3F73] pr-9 pl-4 py-2 text-xs sm:text-sm font-bold text-[#0F294A] dark:text-[#E0F2FE] focus:bg-white dark:focus:bg-[#081830] focus:outline-2 focus:outline-[#1D4ED8] cursor-pointer"
                            >
                              {isShowingFeatured && (
                                <option value={SortOption.FEATURED}>الترتيب المميز</option>
                              )}
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
                            selectedCategoryId === 'all' || selectedCategoryId === 'featured'
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

                    {/* Product Cards Grid, Skeleton, or Empty State */}
                    {isLoadingProducts && products.length === 0 ? (
                      <div
                        aria-label="جاري تحميل المنتجات"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8"
                      >
                        {[0, 1, 2].map((idx) => (
                          <div
                            key={idx}
                            className="rounded-2xl bg-white dark:bg-[#0E264A] border border-[#D8EEFB] dark:border-[#1E3F73] p-5 space-y-4"
                          >
                            <div className="aspect-[4/3] w-full rounded-xl bg-[#F2FAFF] dark:bg-[#081830] animate-pulse" />
                            <div className="h-3.5 w-1/3 rounded bg-[#E8F4FD] dark:bg-[#1E3F73] animate-pulse" />
                            <div className="h-5 w-4/5 rounded bg-[#E8F4FD] dark:bg-[#1E3F73] animate-pulse" />
                            <div className="h-11 w-full rounded-xl bg-[#E8F4FD] dark:bg-[#1E3F73] animate-pulse mt-3" />
                          </div>
                        ))}
                      </div>
                    ) : filteredProducts.length === 0 ? (
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
                        ) : selectedCategoryId !== 'all' && selectedCategoryId !== 'featured' ? (
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

                {/* 4. Values & Principles Section */}
                <ValuesAndPrinciplesSection id="values-section" variant="storefront" />
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
