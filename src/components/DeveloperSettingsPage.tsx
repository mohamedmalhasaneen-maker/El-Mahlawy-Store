import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Globe,
  HeartHandshake,
  ImagePlus,
  KeyRound,
  LayoutDashboard,
  Loader2,
  LogOut,
  Mail,
  MapPin,
  Menu,
  Package,
  Percent,
  Phone,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Store,
  Tag,
  Trash2,
  Upload,
  UserCheck,
  X,
} from 'lucide-react';
import {
  DiscountQuickUpdatePayload,
  User,
  formatCloudErrorForDeveloper,
  sendDeveloperPasswordReset,
  sendDeveloperVerificationEmail,
  signInDeveloperWithEmail,
  translateFirebaseAuthError,
} from '../lib/firebase';
import {
  isAuthorizedDeveloperUid,
  resolveDeveloperAccessState,
  validateDeveloperLoginInput,
} from '../utils/developerAuth';
import { DiscountType, Product, ProductFormInput } from '../types/store';
import {
  ProductDiscountDraft,
  calculateDiscountPercent,
  calculateSavingsAmount,
  computeDiscountPricing,
  deriveInitialDiscountDraft,
  formatPriceEgp,
  getDiscountScheduleStatus,
  getEffectiveProductPrice,
  isDiscountActive,
  prepareProductFormSubmission,
  roundCurrency,
  sanitizeProductPayload,
} from '../utils/catalogLogic';
import { SiteConfig, sanitizeSiteConfig, validateSiteConfigInput } from '../utils/siteConfig';
import { DiscountModal } from './DiscountModal';
import { ProductImage } from './ProductImage';
import { AccountSettingsSection } from './developer/AccountSettingsSection';
import { BranchesMapsSection } from './developer/BranchesMapsSection';
import { EssentialProductsSection } from './developer/EssentialProductsSection';
import { ContentSectionsSettings } from './developer/ContentSectionsSettings';
import { DeveloperSectionId, OverviewSection } from './developer/OverviewSection';
import { PhonesWhatsAppSection } from './developer/PhonesWhatsAppSection';
import { RatingsSection } from './developer/RatingsSection';
import { SiteAndAboutSection } from './developer/SiteAndAboutSection';
import { SocialLinksSection } from './developer/SocialLinksSection';
import {
  getCategoryIdByName,
  getCategoryName,
  getOrderedCategories,
} from '../constants/categories';
import { Footer } from './Footer';

interface DeveloperSettingsPageProps {
  products: Product[];
  siteConfig: SiteConfig;
  currentUser: User | null;
  isAuthReady: boolean;
  isCloudAdmin: boolean;
  onRefreshAuth: (options?: { reloadFromServer?: boolean }) => Promise<void>;
  onLogout: () => Promise<void>;
  onBackToStore: () => void | Promise<void>;
  onSaveProduct: (input: ProductFormInput, editingId?: string) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onSaveProductDiscount: (
    productId: string,
    payload: DiscountQuickUpdatePayload
  ) => Promise<void>;
  onQuickUpdateProductFlags: (
    product: Product,
    updates: Partial<Pick<Product, 'isPublished' | 'inStock' | 'isFeatured'>>
  ) => Promise<void>;
  onSaveSiteConfig: (nextConfig: SiteConfig) => Promise<void>;
}

const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/obvb7rtp/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'elmahlawy-store';

const EMPTY_PRODUCT_FORM: ProductFormInput = {
  name: '',
  brand: '',
  category: '',
  categoryId: '',
  shortDescription: '',
  description: '',
  price: 0,
  originalPrice: 0,
  discountEnabled: false,
  discountType: 'percentage',
  discountValue: 0,
  discountStartDate: '',
  discountEndDate: '',
  inStock: true,
  isFeatured: false,
  isPublished: true,
  images: [],
  specs: [],
  options: [],
};

export function DeveloperSettingsPage({
  products,
  siteConfig,
  currentUser,
  isAuthReady,
  isCloudAdmin,
  onRefreshAuth,
  onLogout,
  onBackToStore,
  onSaveProduct,
  onDeleteProduct,
  onSaveProductDiscount,
  onQuickUpdateProductFlags,
  onSaveSiteConfig,
}: DeveloperSettingsPageProps) {
  // Auth Login State (never pre-fill or expose credentials on public screen)
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authPending, setAuthPending] = useState<boolean>(false);
  const [authFeedback, setAuthFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Workspace Navigation State (9 Unified Sections)
  const [activeTab, setActiveTab] = useState<DeveloperSectionId>('overview');
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);
  const [globalBanner, setGlobalBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Products Tab State
  const [productViewMode, setProductViewMode] = useState<'list' | 'form'>('list');
  const [productSearch, setProductSearch] = useState<string>('');
  const [productStatusFilter, setProductStatusFilter] = useState<
    'all' | 'published' | 'hidden' | 'discounted' | 'out_of_stock'
  >('all');
  const [editingProductId, setEditingProductId] = useState<string | undefined>(undefined);
  const [productForm, setProductForm] = useState<ProductFormInput>(EMPTY_PRODUCT_FORM);
  const [basePriceDraft, setBasePriceDraft] = useState<string>('');
  const [discountValueDraft, setDiscountValueDraft] = useState<string>('');
  const [finalPriceDraft, setFinalPriceDraft] = useState<string>('');
  const [isDraggingFiles, setIsDraggingFiles] = useState<boolean>(false);
  const [isProductFormDirty, setIsProductFormDirty] = useState<boolean>(false);
  const [imageUrlInput, setImageUrlInput] = useState<string>('');
  const [specInput, setSpecInput] = useState<string>('');
  const [optionInput, setOptionInput] = useState<string>('');
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);
  const [savingProduct, setSavingProduct] = useState<boolean>(false);
  const [quickUpdatingId, setQuickUpdatingId] = useState<string | null>(null);
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Discounts Tab & Modal State
  const [discountFilter, setDiscountFilter] = useState<
    'all' | 'active' | 'scheduled' | 'expired' | 'none'
  >('all');
  const [discountSearch, setDiscountSearch] = useState<string>('');
  const [discountModalProduct, setDiscountModalProduct] = useState<Product | null>(null);

  // SiteConfig Draft State (shared across Phones, Social, Branches, Site & About, Sections)
  const [configDraft, setConfigDraft] = useState<SiteConfig>(siteConfig);
  const [isSiteConfigDirty, setIsSiteConfigDirty] = useState<boolean>(false);
  const [savingSiteConfig, setSavingSiteConfig] = useState<boolean>(false);

  // Keep configDraft synced with live Firestore siteConfig whenever user has no unsaved edits
  useEffect(() => {
    if (!isSiteConfigDirty) {
      setConfigDraft(siteConfig);
    }
  }, [siteConfig, isSiteConfigDirty]);

  // Warn before closing/reloading page if an upload, cloud save, or unsaved edit is active
  const hasUnsavedOrActiveWork =
    uploadingImages ||
    savingProduct ||
    savingSiteConfig ||
    isSiteConfigDirty ||
    (productViewMode === 'form' && isProductFormDirty);

  useEffect(() => {
    if (!isCloudAdmin || !hasUnsavedOrActiveWork) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isCloudAdmin, hasUnsavedOrActiveWork]);

  // Filtered Products for Tab 1
  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    return products
      .filter((p) => {
        if (productStatusFilter === 'published' && !p.isPublished) return false;
        if (productStatusFilter === 'hidden' && p.isPublished) return false;
        if (productStatusFilter === 'discounted' && !isDiscountActive(p)) return false;
        if (productStatusFilter === 'out_of_stock' && p.inStock) return false;
        if (!q) return true;
        return [p.name, p.brand, p.category, p.shortDescription]
          .join(' ')
          .toLowerCase()
          .includes(q);
      })
      .sort((a, b) => (b.updatedAt || b.createdAt || '').localeCompare(a.updatedAt || a.createdAt || ''));
  }, [products, productSearch, productStatusFilter]);

  const activeCategories = useMemo(
    () => getOrderedCategories(configDraft.categories),
    [configDraft.categories]
  );

  const uncategorizedProducts = useMemo(() => {
    return products.filter((p) => {
      const resolvedId =
        p.categoryId || getCategoryIdByName(p.category, activeCategories);
      return !resolvedId || !activeCategories.some((c) => c.id === resolvedId);
    });
  }, [products, activeCategories]);

  // Filtered Products for Tab 2 (Discounts)
  const filteredDiscountProducts = useMemo(() => {
    const q = discountSearch.trim().toLowerCase();
    return products
      .filter((p) => {
        const status = getDiscountScheduleStatus(p);
        if (discountFilter === 'active' && status !== 'active') return false;
        if (discountFilter === 'scheduled' && status !== 'scheduled') return false;
        if (discountFilter === 'expired' && status !== 'expired') return false;
        if (discountFilter === 'none' && status !== 'disabled') return false;
        if (!q) return true;
        return [p.name, p.brand, p.category].join(' ').toLowerCase().includes(q);
      })
      .sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''));
  }, [products, discountFilter, discountSearch]);

  const discountMetrics = useMemo(() => {
    let active = 0;
    let scheduled = 0;
    let expired = 0;
    for (const p of products) {
      const st = getDiscountScheduleStatus(p);
      if (st === 'active') active += 1;
      else if (st === 'scheduled') scheduled += 1;
      else if (st === 'expired') expired += 1;
    }
    return { total: products.length, active, scheduled, expired };
  }, [products]);

  // Reset sensitive workspace drafts whenever session is unauthenticated
  useEffect(() => {
    if (!isCloudAdmin) {
      setLoginPassword('');
      setProductViewMode('list');
      setEditingProductId(undefined);
      setProductForm(EMPTY_PRODUCT_FORM);
      setBasePriceDraft('');
      setDiscountValueDraft('');
      setFinalPriceDraft('');
      setIsDraggingFiles(false);
      setIsProductFormDirty(false);
      setDiscountModalProduct(null);
      setConfirmDeleteProduct(null);
      setPreviewProduct(null);
      setMobileNavOpen(false);
    }
  }, [isCloudAdmin]);

  // ============================================================================
  // AUTHENTICATION HANDLERS
  // ============================================================================
  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthFeedback(null);

    const check = validateDeveloperLoginInput(loginEmail, loginPassword);
    if (!check.valid) {
      setAuthFeedback({
        type: 'error',
        message: check.error || 'يرجى التحقق من البريد الإلكتروني وكلمة المرور.',
      });
      return;
    }

    setAuthPending(true);
    try {
      await signInDeveloperWithEmail(check.normalizedEmail, loginPassword);
      setLoginPassword('');
      await onRefreshAuth({ reloadFromServer: false });
    } catch (err) {
      setAuthFeedback({
        type: 'error',
        message: translateFirebaseAuthError(err),
      });
    } finally {
      setAuthPending(false);
    }
  };

  const handlePasswordResetRequest = async () => {
    setAuthFeedback(null);
    const rawTrimmed = loginEmail.trim();
    if (!rawTrimmed) {
      setAuthFeedback({
        type: 'error',
        message: 'يرجى كتابة البريد الإلكتروني لحساب المطور أولًا لإرسال رابط إعادة تعيين كلمة المرور.',
      });
      return;
    }

    if (isAuthorizedDeveloperUid(rawTrimmed)) {
      setAuthFeedback({
        type: 'error',
        message: 'لا يمكن استخدام معرّف الحساب (UID) بدلًا من البريد الإلكتروني.',
      });
      return;
    }

    const trimmedEmail = rawTrimmed.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setAuthFeedback({
        type: 'error',
        message: 'يرجى إدخال صيغة بريد إلكتروني صحيحة (مثل name@gmail.com).',
      });
      return;
    }

    setAuthPending(true);
    try {
      await sendDeveloperPasswordReset(trimmedEmail);
      setAuthFeedback({
        type: 'success',
        message: 'إذا كان البريد مرتبطًا بحساب المطور في Firebase فستصلك رسالة آمنة لإعادة تعيين كلمة المرور خلال لحظات.',
      });
    } catch (err) {
      setAuthFeedback({
        type: 'error',
        message: translateFirebaseAuthError(err),
      });
    } finally {
      setAuthPending(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    if (!currentUser) return;
    setAuthFeedback(null);
    setAuthPending(true);
    try {
      await sendDeveloperVerificationEmail(currentUser);
      setAuthFeedback({
        type: 'success',
        message: 'تم إرسال رابط تفعيل البريد الإلكتروني بنجاح. افتح الرابط في بريدك ثم اضغط «تم التفعيل — دخول اللوحة».',
      });
    } catch (err) {
      setAuthFeedback({
        type: 'error',
        message: translateFirebaseAuthError(err),
      });
    } finally {
      setAuthPending(false);
    }
  };

  const handleSecureLogout = async () => {
    setLoginPassword('');
    setGlobalBanner(null);
    await onLogout();
    setAuthFeedback({
      type: 'success',
      message: 'تم تسجيل الخروج من لوحة إعدادات المطور بأمان.',
    });
  };

  // ============================================================================
  // UNAUTHENTICATED / NON-ADMIN SECURITY GATE
  // ============================================================================
  const accessState = resolveDeveloperAccessState(currentUser, isAuthReady);

  if (accessState === 'checking') {
    return (
      <div
        dir="rtl"
        className="min-h-screen bg-[#0B0B0B] text-gray-100 flex items-center justify-center p-6"
      >
        <div className="flex items-center gap-3 text-sm font-bold text-[#D4AF37]">
          <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
          <span>جاري التحقق من جلسة المطور...</span>
        </div>
      </div>
    );
  }

  if (!isCloudAdmin || accessState !== 'authorized') {
    const isUnverifiedDeveloper = accessState === 'unverified_email';
    const isWrongAccount = accessState === 'unauthorized_account';

    return (
      <div dir="rtl" className="min-h-screen bg-[#0B0B0B] text-gray-100 flex flex-col">
        {/* Top Bar */}
        <header className="border-b border-[#D4AF37]/35 bg-[#0B0B0B]">
          <div className="mx-auto max-w-6xl h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src="/logo.png"
                alt={siteConfig.storeName}
                className="h-9 w-9 rounded-xl object-contain bg-white p-0.5 shrink-0"
              />
              <span className="text-sm sm:text-base font-extrabold text-white whitespace-nowrap truncate">
                إعدادات المطور
                <span className="hidden sm:inline">
                  {' '}
                  <span className="text-[#D4AF37]">|</span>{' '}
                  <bdi className="text-gray-300">Developer Settings</bdi>
                </span>
              </span>
            </div>

            <button
              type="button"
              onClick={onBackToStore}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#0B0B0B] hover:bg-[#1A1A1A] border border-[#D4AF37]/50 px-4 py-2 text-xs sm:text-sm font-bold text-[#D4AF37] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
              <span>العودة للمتجر</span>
            </button>
          </div>
        </header>

        {/* Centered RTL Login Gate */}
        <main className="flex-1 flex items-center justify-center px-4 py-10 sm:py-14">
          <div className="w-full max-w-md rounded-2xl bg-[#0B0B0B] border border-[#D4AF37]/40 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-start gap-3.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#050505] border border-[#D4AF37]/50 text-[#D4AF37]">
                <KeyRound className="h-6 w-6" aria-hidden="true" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-white">
                  تسجيل دخول المطور
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 leading-relaxed">
                  أدخل بيانات حساب المطور المعتمد للوصول إلى لوحة إدارة المنتجات والخصومات وبيانات
                  الموقع.
                </p>
              </div>
            </div>

            {authFeedback && (
              <div
                role="alert"
                className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-xs sm:text-sm font-semibold border ${
                  authFeedback.type === 'success'
                    ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-200'
                    : 'bg-[#0F4C5C]/15 border-[#0F4C5C] text-[#A0D2EB]'
                }`}
              >
                {authFeedback.type === 'success' ? (
                  <CheckCircle2
                    className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                ) : (
                  <AlertCircle
                    className="h-4 w-4 text-[#38BDF8] shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                )}
                <span>{authFeedback.message}</span>
              </div>
            )}

            {isUnverifiedDeveloper ? (
              <div className="space-y-4 rounded-xl bg-[#050505] border border-[#D4AF37]/40 p-4">
                <p className="text-xs sm:text-sm text-gray-200 leading-relaxed">
                  تم التحقق من كلمة المرور للحساب{' '}
                  <bdi className="font-bold text-[#D4AF37]">{currentUser?.email}</bdi>، ويتبقى فقط
                  تأكيد ملكية البريد الإلكتروني لمرة واحدة حتى تسمح قواعد أمان Firebase بحفظ
                  التعديلات.
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    disabled={authPending}
                    onClick={handleSendVerificationEmail}
                    className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white border border-[#D4AF37]/50 cursor-pointer disabled:opacity-50"
                  >
                    <Mail className="h-4 w-4" aria-hidden="true" />
                    <span>إرسال رابط تفعيل البريد</span>
                  </button>
                  <button
                    type="button"
                    disabled={authPending}
                    onClick={async () => {
                      setAuthPending(true);
                      setAuthFeedback(null);
                      try {
                        await onRefreshAuth();
                      } finally {
                        setAuthPending(false);
                      }
                    }}
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#0B0B0B] hover:bg-[#1A1A1A] border border-[#D4AF37]/40 px-4 py-2.5 text-xs sm:text-sm font-bold text-[#D4AF37] cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    <span>تم التفعيل — دخول اللوحة</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleSecureLogout}
                  className="w-full min-h-[40px] text-xs font-semibold text-gray-400 hover:text-white cursor-pointer"
                >
                  تسجيل الخروج والعودة لنموذج الدخول
                </button>
              </div>
            ) : isWrongAccount ? (
              <div className="space-y-4 rounded-xl bg-[#050505] border border-[#0F4C5C] p-4">
                <p className="text-xs sm:text-sm text-[#A0D2EB] leading-relaxed">
                  الحساب الحالي{' '}
                  <bdi className="font-bold text-white">
                    {currentUser?.email || currentUser?.uid}
                  </bdi>{' '}
                  غير مصرح له بالوصول إلى إعدادات المطور أو قراءة وتعديل بيانات الإدارة.
                </p>
                <button
                  type="button"
                  onClick={handleSecureLogout}
                  className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white border border-[#D4AF37]/50 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" aria-hidden="true" />
                  <span>تسجيل الخروج</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleEmailPasswordLogin} noValidate className="space-y-4">
                <div>
                  <label
                    htmlFor="dev-login-email"
                    className="block text-xs sm:text-sm font-bold text-[#D4AF37] mb-1.5"
                  >
                    البريد الإلكتروني
                  </label>
                  <input
                    id="dev-login-email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    dir="ltr"
                    value={loginEmail}
                    onChange={(e) => {
                      setLoginEmail(e.target.value);
                      if (authFeedback?.type === 'error') setAuthFeedback(null);
                    }}
                    placeholder="name@gmail.com"
                    className="w-full min-h-[46px] rounded-xl bg-[#050505] border border-[#D4AF37]/35 px-4 py-2.5 text-sm font-semibold text-white text-left placeholder:text-gray-600 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="dev-login-password"
                      className="text-xs sm:text-sm font-bold text-[#D4AF37]"
                    >
                      كلمة المرور
                    </label>
                    <button
                      type="button"
                      disabled={authPending}
                      onClick={handlePasswordResetRequest}
                      className="text-xs font-semibold text-gray-400 hover:text-[#D4AF37] transition-colors cursor-pointer"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="dev-login-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      dir="ltr"
                      value={loginPassword}
                      onChange={(e) => {
                        setLoginPassword(e.target.value);
                        if (authFeedback?.type === 'error') setAuthFeedback(null);
                      }}
                      placeholder="••••••••••••"
                      className="w-full min-h-[46px] rounded-xl bg-[#050505] border border-[#D4AF37]/35 pl-12 pr-4 py-2.5 text-sm font-semibold text-white text-left placeholder:text-gray-600 focus:outline-none focus:border-[#D4AF37]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                      className="absolute left-2 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:text-[#D4AF37] cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authPending}
                  className="inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] disabled:opacity-55 px-5 py-3 text-sm font-extrabold text-white border border-[#D4AF37]/70 transition-colors cursor-pointer"
                >
                  {authPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <ShieldCheck className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
                  )}
                  <span>تسجيل الدخول</span>
                </button>
              </form>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ============================================================================
  // PRODUCT MANAGEMENT HANDLERS (AUTHENTICATED ADMIN)
  // ============================================================================
  const openAddProductForm = (options?: { enableDiscount?: boolean }) => {
    const initialDraft = deriveInitialDiscountDraft(undefined, options);
    setEditingProductId(undefined);
    setProductForm({
      ...EMPTY_PRODUCT_FORM,
      discountEnabled: initialDraft.discountEnabled,
      discountType: initialDraft.discountType,
      discountValue: initialDraft.discountValueDraft ? Number(initialDraft.discountValueDraft) : 0,
    });
    setBasePriceDraft(initialDraft.basePriceDraft);
    setDiscountValueDraft(initialDraft.discountValueDraft);
    setFinalPriceDraft(initialDraft.finalPriceDraft);
    setIsDraggingFiles(false);
    setImageUrlInput('');
    setSpecInput('');
    setOptionInput('');
    setIsProductFormDirty(false);
    setGlobalBanner(null);
    setProductViewMode('form');
    setActiveTab('products');
    setMobileNavOpen(false);
  };

  const openEditProductForm = (product: Product) => {
    const initialDraft = deriveInitialDiscountDraft(product);
    const base =
      product.originalPrice && product.originalPrice > 0 ? product.originalPrice : product.price;
    const resolvedCategoryId =
      product.categoryId || getCategoryIdByName(product.category, activeCategories);
    setEditingProductId(product.id);
    setProductForm({
      id: product.id,
      name: product.name,
      brand: product.brand,
      categoryId: resolvedCategoryId,
      category:
        (resolvedCategoryId
          ? getCategoryName(resolvedCategoryId, activeCategories)
          : product.category) || 'بدون قسم',
      shortDescription: product.shortDescription,
      description: product.description,
      price: product.price,
      originalPrice: roundCurrency(base),
      discountEnabled: initialDraft.discountEnabled,
      discountType: initialDraft.discountType,
      discountValue: initialDraft.discountValueDraft ? Number(initialDraft.discountValueDraft) : 0,
      discountStartDate: initialDraft.discountStartDate,
      discountEndDate: initialDraft.discountEndDate,
      inStock: product.inStock,
      isFeatured: product.isFeatured,
      isPublished: product.isPublished,
      images: [...product.images],
      specs: [...product.specs],
      options: [...product.options],
    });
    setBasePriceDraft(initialDraft.basePriceDraft);
    setDiscountValueDraft(initialDraft.discountValueDraft);
    setFinalPriceDraft(initialDraft.finalPriceDraft);
    setIsDraggingFiles(false);
    setImageUrlInput('');
    setSpecInput('');
    setOptionInput('');
    setIsProductFormDirty(false);
    setGlobalBanner(null);
    setProductViewMode('form');
    setActiveTab('products');
    setMobileNavOpen(false);
  };

  const handleCancelProductEdits = () => {
    setEditingProductId(undefined);
    setProductForm(EMPTY_PRODUCT_FORM);
    setBasePriceDraft('');
    setDiscountValueDraft('');
    setFinalPriceDraft('');
    setIsDraggingFiles(false);
    setIsProductFormDirty(false);
    setProductViewMode('list');
  };

  const handleBasePriceChange = (raw: string) => {
    setBasePriceDraft(raw);
    setIsProductFormDirty(true);
    const parsedBase = roundCurrency(Number(raw));
    if (!Number.isFinite(parsedBase) || parsedBase <= 0) {
      setFinalPriceDraft('');
      setProductForm((prev) => ({ ...prev, price: 0, originalPrice: 0 }));
      return;
    }

    if (!productForm.discountEnabled) {
      setFinalPriceDraft(String(parsedBase));
      setProductForm((prev) => ({ ...prev, price: parsedBase, originalPrice: parsedBase }));
      return;
    }

    const activeType: DiscountType = productForm.discountType === 'fixed' ? 'fixed' : 'percentage';
    const numericDiscount =
      discountValueDraft.trim() === '' ? 0 : roundCurrency(Number(discountValueDraft));
    const calc = computeDiscountPricing({
      basePrice: parsedBase,
      discountEnabled: true,
      discountType: activeType,
      discountValue: numericDiscount,
      discountStartDate: productForm.discountStartDate,
      discountEndDate: productForm.discountEndDate,
    });
    setFinalPriceDraft(calc.valid ? String(calc.price) : '');
    setProductForm((prev) => ({
      ...prev,
      originalPrice: parsedBase,
      price: calc.valid ? calc.price : parsedBase,
    }));
  };

  const handleSelectDiscountMode = (mode: 'none' | 'percentage' | 'fixed') => {
    setIsProductFormDirty(true);
    const parsedBase = roundCurrency(Number(basePriceDraft));
    const validBase = Number.isFinite(parsedBase) && parsedBase > 0 ? parsedBase : 0;

    if (mode === 'none') {
      setFinalPriceDraft(validBase > 0 ? String(validBase) : '');
      setProductForm((prev) => ({
        ...prev,
        discountEnabled: false,
        price: validBase,
        originalPrice: validBase,
      }));
      return;
    }

    let nextDiscountStr = discountValueDraft.trim();
    const prevType: DiscountType = productForm.discountType === 'fixed' ? 'fixed' : 'percentage';

    if (productForm.discountEnabled && prevType !== mode && validBase > 0) {
      const currentCalc = computeDiscountPricing({
        basePrice: validBase,
        discountEnabled: true,
        discountType: prevType,
        discountValue: nextDiscountStr === '' ? 0 : roundCurrency(Number(nextDiscountStr)),
        discountStartDate: productForm.discountStartDate,
        discountEndDate: productForm.discountEndDate,
      });
      if (currentCalc.valid && currentCalc.savings > 0) {
        if (mode === 'fixed') {
          nextDiscountStr = String(currentCalc.savings);
        } else {
          const pct = roundCurrency((currentCalc.savings / validBase) * 100);
          nextDiscountStr = pct > 0 && pct < 100 ? String(pct) : '10';
        }
      } else {
        nextDiscountStr = mode === 'percentage' ? '10' : '';
      }
    } else if (!productForm.discountEnabled && nextDiscountStr === '') {
      if (mode === 'percentage') {
        nextDiscountStr = '10';
      } else if (validBase > 1) {
        nextDiscountStr = String(roundCurrency(validBase * 0.1));
      }
    }

    setDiscountValueDraft(nextDiscountStr);
    const numericVal = nextDiscountStr === '' ? 0 : roundCurrency(Number(nextDiscountStr));
    const nextCalc = computeDiscountPricing({
      basePrice: validBase,
      discountEnabled: true,
      discountType: mode,
      discountValue: numericVal,
      discountStartDate: productForm.discountStartDate,
      discountEndDate: productForm.discountEndDate,
    });

    setFinalPriceDraft(validBase > 0 && nextCalc.valid ? String(nextCalc.price) : '');
    setProductForm((prev) => ({
      ...prev,
      discountEnabled: true,
      discountType: mode,
      discountValue: Number.isFinite(numericVal) ? Math.max(0, numericVal) : 0,
      originalPrice: validBase,
      price: validBase > 0 && nextCalc.valid ? nextCalc.price : validBase,
    }));
  };

  const handleDiscountValueChange = (raw: string, explicitType?: DiscountType) => {
    setDiscountValueDraft(raw);
    setIsProductFormDirty(true);
    const activeType: DiscountType =
      explicitType ?? (productForm.discountType === 'fixed' ? 'fixed' : 'percentage');
    const parsedBase = roundCurrency(Number(basePriceDraft));
    const validBase = Number.isFinite(parsedBase) && parsedBase > 0 ? parsedBase : 0;
    const numericVal = raw.trim() === '' ? 0 : roundCurrency(Number(raw));

    const calc = computeDiscountPricing({
      basePrice: validBase,
      discountEnabled: true,
      discountType: activeType,
      discountValue: numericVal,
      discountStartDate: productForm.discountStartDate,
      discountEndDate: productForm.discountEndDate,
    });

    setFinalPriceDraft(validBase > 0 && calc.valid ? String(calc.price) : '');
    setProductForm((prev) => ({
      ...prev,
      discountEnabled: true,
      discountType: activeType,
      discountValue: Number.isFinite(numericVal) ? Math.max(0, numericVal) : 0,
      originalPrice: validBase,
      price: validBase > 0 && calc.valid ? calc.price : validBase,
    }));
  };

  const handleFinalPriceChange = (raw: string) => {
    setFinalPriceDraft(raw);
    setIsProductFormDirty(true);
    const parsedBase = roundCurrency(Number(basePriceDraft));
    const validBase = Number.isFinite(parsedBase) && parsedBase > 0 ? parsedBase : 0;

    if (raw.trim() === '') {
      setDiscountValueDraft('');
      setProductForm((prev) => ({
        ...prev,
        discountEnabled: true,
        discountValue: 0,
        originalPrice: validBase,
        price: validBase,
      }));
      return;
    }

    const parsedFinal = roundCurrency(Number(raw));
    if (validBase > 0 && Number.isFinite(parsedFinal) && parsedFinal > 0 && parsedFinal < validBase) {
      const savings = roundCurrency(validBase - parsedFinal);
      setDiscountValueDraft(String(savings));
      setProductForm((prev) => ({
        ...prev,
        discountEnabled: true,
        discountType: 'fixed',
        discountValue: savings,
        originalPrice: validBase,
        price: parsedFinal,
      }));
    } else {
      setDiscountValueDraft('0');
      setProductForm((prev) => ({
        ...prev,
        discountEnabled: true,
        originalPrice: validBase,
        price: validBase,
      }));
    }
  };

  const handleUploadCloudinaryFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploadingImages(true);
    setGlobalBanner(null);

    const uploadedUrls: string[] = [];
    const uploadErrors: string[] = [];

    for (const file of Array.from(fileList).slice(0, 15)) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        const response = await fetch(CLOUDINARY_UPLOAD_URL, {
          method: 'POST',
          body: formData,
        });

        const rawText = await response.text();
        let data: { secure_url?: string; error?: { message?: string } };
        try {
          data = JSON.parse(rawText);
        } catch {
          throw new Error('استجابة غير صالحة من خدمة الرفع السحابي Cloudinary.');
        }

        if (!response.ok) {
          throw new Error(data.error?.message || `فشل رفع الصورة (${response.status})`);
        }

        if (typeof data.secure_url === 'string' && data.secure_url.startsWith('https://')) {
          uploadedUrls.push(data.secure_url);
        } else {
          throw new Error('لم تُرجع خدمة Cloudinary رابط secure_url صالحًا.');
        }
      } catch (err) {
        uploadErrors.push(
          `تعذر رفع "${file.name}": ${err instanceof Error ? err.message : 'خطأ غير معروف'}`
        );
      }
    }

    if (uploadedUrls.length > 0) {
      setProductForm((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls].slice(0, 15),
      }));
      setIsProductFormDirty(true);
      setGlobalBanner({
        type: 'success',
        message: `تم رفع ${uploadedUrls.length} صورة سحابيًا إلى Cloudinary بنجاح.${
          uploadErrors.length > 0 ? ` (تعذر رفع ${uploadErrors.length} ملف)` : ''
        }`,
      });
    } else if (uploadErrors.length > 0) {
      setGlobalBanner({
        type: 'error',
        message: uploadErrors[0],
      });
    }

    setUploadingImages(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddExternalImageUrl = () => {
    const trimmed = imageUrlInput.trim();
    if (!trimmed) return;
    if (/^(blob:|data:)/i.test(trimmed) || !/^https?:\/\//i.test(trimmed)) {
      setGlobalBanner({
        type: 'error',
        message: 'يرجى إدخال رابط صورة سحابي دائم يبدأ بـ https:// (لا يُسمح بروابط blob أو base64 المحلية).',
      });
      return;
    }
    if (productForm.images.length >= 15) {
      setGlobalBanner({
        type: 'error',
        message: 'الحد الأقصى لصور المنتج الواحد هو 15 صورة.',
      });
      return;
    }
    setProductForm((prev) => ({ ...prev, images: [...prev.images, trimmed] }));
    setImageUrlInput('');
    setIsProductFormDirty(true);
  };

  const currentDiscountDraft: ProductDiscountDraft = {
    basePriceDraft,
    discountEnabled: productForm.discountEnabled,
    discountType: productForm.discountType === 'fixed' ? 'fixed' : 'percentage',
    discountValueDraft,
    finalPriceDraft,
    discountStartDate: productForm.discountStartDate || '',
    discountEndDate: productForm.discountEndDate || '',
  };

  const livePricingCalc = (() => {
    const parsedBase = roundCurrency(Number(basePriceDraft));
    const validBase = Number.isFinite(parsedBase) && parsedBase > 0 ? parsedBase : 0;
    const numericVal =
      discountValueDraft.trim() === '' ? 0 : roundCurrency(Number(discountValueDraft));
    const calc = computeDiscountPricing({
      basePrice: validBase,
      discountEnabled: productForm.discountEnabled,
      discountType: currentDiscountDraft.discountType,
      discountValue: numericVal,
      discountStartDate: currentDiscountDraft.discountStartDate,
      discountEndDate: currentDiscountDraft.discountEndDate,
    });

    let inlineError: string | null = null;
    if (productForm.discountEnabled && basePriceDraft.trim() !== '') {
      const trimmedFinal = finalPriceDraft.trim();
      if (trimmedFinal !== '' && validBase > 0) {
        const parsedFinal = roundCurrency(Number(trimmedFinal));
        if (!Number.isFinite(parsedFinal) || parsedFinal <= 0) {
          inlineError = 'يرجى إدخال سعر نهائي بعد الخصم أكبر من صفر.';
        } else if (parsedFinal >= validBase) {
          inlineError = 'السعر النهائي بعد الخصم يجب أن يكون أقل من السعر الأساسي للمنتج.';
        }
      }
      if (!inlineError && !calc.valid && calc.errors[0]) {
        inlineError = calc.errors[0];
      }
    }

    const scheduleStatus =
      calc.valid && productForm.discountEnabled && validBase > 0
        ? getDiscountScheduleStatus({
            discountEnabled: true,
            originalPrice: calc.originalPrice,
            price: calc.price,
            discountStartDate: currentDiscountDraft.discountStartDate,
            discountEndDate: currentDiscountDraft.discountEndDate,
          })
        : 'disabled';

    return {
      calc,
      validBase,
      inlineError,
      scheduleStatus,
    };
  })();

  const handleOpenLivePreview = () => {
    const prepared = prepareProductFormSubmission(
      productForm,
      currentDiscountDraft,
      activeCategories
    );
    if (!prepared.valid) {
      setGlobalBanner({
        type: 'error',
        message: prepared.errors[0] || 'يرجى مراجعة بيانات المنتج وإعدادات الخصم.',
      });
      return;
    }
    const sanitized = sanitizeProductPayload(
      prepared.candidate,
      editingProductId || 'preview-item',
      currentUser?.uid || 'admin',
      activeCategories
    );
    setPreviewProduct(sanitized);
  };

  const handleProductFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalBanner(null);

    if (uploadingImages) {
      setGlobalBanner({
        type: 'error',
        message: 'يرجى الانتظار حتى يكتمل رفع الصور إلى Cloudinary قبل الحفظ.',
      });
      return;
    }

    if (!productForm.categoryId) {
      setGlobalBanner({
        type: 'error',
        message: 'يرجى اختيار القسم الصحيح للمنتج من القائمة المنسدلة قبل الحفظ.',
      });
      return;
    }

    const prepared = prepareProductFormSubmission(
      productForm,
      currentDiscountDraft,
      activeCategories
    );
    if (!prepared.valid) {
      setGlobalBanner({
        type: 'error',
        message: prepared.errors[0] || 'يرجى مراجعة بيانات المنتج وإعدادات الخصم.',
      });
      return;
    }

    setSavingProduct(true);
    try {
      await onSaveProduct(prepared.candidate, editingProductId);
      setIsProductFormDirty(false);
      setProductViewMode('list');
      setEditingProductId(undefined);
      setProductForm(EMPTY_PRODUCT_FORM);
      setBasePriceDraft('');
      setDiscountValueDraft('');
      setFinalPriceDraft('');
      setGlobalBanner({
        type: 'success',
        message: editingProductId
          ? `تم حفظ تعديلات المنتج «${prepared.candidate.name.trim()}» وتأكيد تحديثه في قاعدة البيانات السحابية بنجاح.`
          : prepared.candidate.discountEnabled
            ? `تم رفع وإضافة المنتج «${prepared.candidate.name.trim()}» مع تفعيل الخصم وتأكيد حفظه سحابيًا بنجاح.`
            : `تم رفع وإضافة المنتج «${prepared.candidate.name.trim()}» وتأكيد حفظه سحابيًا بنجاح.`,
      });
    } catch (err) {
      setGlobalBanner({
        type: 'error',
        message: formatCloudErrorForDeveloper(err, 'حفظ المنتج سحابيًا'),
      });
    } finally {
      setSavingProduct(false);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!confirmDeleteProduct) return;
    setDeletingProduct(true);
    setGlobalBanner(null);
    try {
      await onDeleteProduct(confirmDeleteProduct.id);
      const deletedName = confirmDeleteProduct.name;
      setConfirmDeleteProduct(null);
      setGlobalBanner({
        type: 'success',
        message: `تم حذف المنتج «${deletedName}» نهائيًا وتأكيد إزالته من قاعدة البيانات السحابية.`,
      });
    } catch (err) {
      setGlobalBanner({
        type: 'error',
        message: formatCloudErrorForDeveloper(err, 'حذف المنتج سحابيًا'),
      });
    } finally {
      setDeletingProduct(false);
    }
  };

  const handleQuickToggle = async (
    product: Product,
    updates: Partial<Pick<Product, 'isPublished' | 'inStock' | 'isFeatured'>>,
    successText: string
  ) => {
    setQuickUpdatingId(product.id);
    setGlobalBanner(null);
    try {
      await onQuickUpdateProductFlags(product, updates);
      setGlobalBanner({ type: 'success', message: successText });
    } catch (err) {
      setGlobalBanner({
        type: 'error',
        message: formatCloudErrorForDeveloper(err, 'تحديث حالة المنتج سحابيًا'),
      });
    } finally {
      setQuickUpdatingId(null);
    }
  };

  // ============================================================================
  // SITE CONFIG (CONTACTS & SITE INFO) HANDLERS
  // ============================================================================
  const updateConfigField = <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => {
    setConfigDraft((prev) => ({ ...prev, [key]: value }));
    setIsSiteConfigDirty(true);
  };

  const handleCancelConfigChanges = () => {
    setConfigDraft(siteConfig);
    setIsSiteConfigDirty(false);
    setGlobalBanner({
      type: 'success',
      message: 'تم إلغاء التغييرات غير المحفوظة واستعادة القيم السحابية الحالية.',
    });
  };

  const handleSaveConfigSubmit = async (e: React.FormEvent, sectionLabel: string) => {
    e.preventDefault();
    setGlobalBanner(null);

    const validation = validateSiteConfigInput(configDraft);
    if (!validation.valid) {
      setGlobalBanner({
        type: 'error',
        message: validation.errors[0],
      });
      return;
    }

    setSavingSiteConfig(true);
    try {
      await onSaveSiteConfig(configDraft);
      setIsSiteConfigDirty(false);
      setGlobalBanner({
        type: 'success',
        message: `تم حفظ ${sectionLabel} وتأكيد مزامنتها في قاعدة البيانات السحابية بنجاح.`,
      });
    } catch (err) {
      setGlobalBanner({
        type: 'error',
        message: formatCloudErrorForDeveloper(err, `حفظ ${sectionLabel}`),
      });
    } finally {
      setSavingSiteConfig(false);
    }
  };

  const navItems: Array<{
    id: DeveloperSectionId;
    label: string;
    subtitle: string;
    Icon: typeof Package;
  }> = [
    {
      id: 'overview',
      label: 'لوحة المعلومات',
      subtitle: 'ملخص المتجر والوصول السريع',
      Icon: LayoutDashboard,
    },
    {
      id: 'products',
      label: 'إدارة المنتجات',
      subtitle: `${products.length} منتج مسجل`,
      Icon: Package,
    },
    {
      id: 'discounts',
      label: 'الأسعار والخصومات',
      subtitle: `${discountMetrics.active} عرض نشط`,
      Icon: Percent,
    },
    {
      id: 'phones',
      label: 'الهاتف وواتساب',
      subtitle: `${configDraft.contactChannels.length} قناة مضافة`,
      Icon: Phone,
    },
    {
      id: 'social',
      label: 'التواصل الاجتماعي',
      subtitle: 'فيسبوك وإنستغرام والمنصات',
      Icon: Globe,
    },
    {
      id: 'branches',
      label: 'العنوان والفروع',
      subtitle: `${configDraft.branches.length} فرع وخريطة`,
      Icon: MapPin,
    },
    {
      id: 'site-info',
      label: 'معلومات الموقع ومن نحن',
      subtitle: 'الهوية والنصوص والشركاء',
      Icon: FileText,
    },
    {
      id: 'essential-products',
      label: 'صور المنتجات الأساسية',
      subtitle: `${configDraft.essentialCategories?.length || 7} فئات بصفحة من نحن`,
      Icon: Camera,
    },
    {
      id: 'sections',
      label: 'المحتوى والأقسام',
      subtitle: 'إظهار وإخفاء عناصر الواجهة',
      Icon: SlidersHorizontal,
    },
    {
      id: 'ratings',
      label: 'تقييمات وآراء الزوار',
      subtitle: 'تحليلات ونسبة التوصية',
      Icon: HeartHandshake,
    },
    {
      id: 'account',
      label: 'الحساب والجلسة',
      subtitle: 'هوية المطور وتسجيل الخروج',
      Icon: UserCheck,
    },
  ];

  // ============================================================================
  // RENDER AUTHENTICATED WORKSPACE
  // ============================================================================
  return (
    <div dir="rtl" className="min-h-screen bg-[#0B0B0B] text-gray-100 flex flex-col">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 h-16 bg-[#0B0B0B]/95 backdrop-blur-md border-b border-[#D4AF37]/35 px-4 sm:px-6">
        <div className="mx-auto max-w-[1440px] h-full flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              aria-label="فتح قائمة أقسام إعدادات المطور"
              className="lg:hidden inline-flex min-h-[42px] min-w-[42px] items-center justify-center rounded-xl bg-[#141414] border border-[#D4AF37]/40 text-[#D4AF37] cursor-pointer"
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>

            <img
              src="/logo.png"
              alt={siteConfig.storeName}
              className="h-9 w-9 rounded-xl object-contain bg-white p-0.5 shrink-0 hidden sm:block"
            />
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-extrabold text-white whitespace-nowrap truncate">
                إعدادات المطور
                <span className="hidden md:inline">
                  {' '}
                  <span className="text-[#D4AF37]">|</span>{' '}
                  <bdi className="text-[#D4AF37]">Developer Settings</bdi>
                </span>
              </h1>
              <p className="text-[11px] text-gray-400 truncate">
                حساب المطور: <bdi className="text-gray-200">{currentUser?.email}</bdi>
                {hasUnsavedOrActiveWork ? ' · توجد تعديلات غير محفوظة' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onBackToStore}
              className="inline-flex min-h-[40px] items-center gap-1.5 sm:gap-2 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] border border-[#D4AF37]/45 px-2.5 sm:px-3.5 py-2 text-xs font-bold text-[#D4AF37] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Store className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">معاينة المتجر</span>
              <span className="sm:hidden">المتجر</span>
            </button>

            <button
              type="button"
              onClick={handleSecureLogout}
              className="inline-flex min-h-[40px] items-center gap-1.5 sm:gap-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] border border-[#D4AF37]/50 px-2.5 sm:px-3.5 py-2 text-xs font-extrabold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
              <span className="sm:hidden">خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileNavOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="أقسام إعدادات المطور"
          className="fixed inset-0 z-50 lg:hidden flex justify-start bg-black/75 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileNavOpen(false);
          }}
        >
          <div className="w-[82vw] max-w-[300px] h-full bg-[#141414] border-l border-[#D4AF37]/35 p-4 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-sm font-extrabold text-[#D4AF37]">أقسام لوحة المطور</span>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="إغلاق القائمة"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B0B0B] border border-white/15 text-gray-300 cursor-pointer"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <nav className="space-y-1.5">
                {navItems.map(({ id, label, subtitle, Icon }) => {
                  const active = activeTab === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setActiveTab(id);
                        setMobileNavOpen(false);
                        setGlobalBanner(null);
                      }}
                      className={`w-full min-h-[48px] rounded-xl px-3.5 py-2.5 flex items-center gap-3 text-right transition-colors cursor-pointer border ${
                        active
                          ? 'bg-[#0F4C5C] text-white border-[#D4AF37]'
                          : 'bg-[#0B0B0B] text-gray-300 border-white/10 hover:border-[#D4AF37]/40'
                      }`}
                    >
                      <Icon
                        className={`h-4 w-4 shrink-0 ${active ? 'text-[#D4AF37]' : 'text-gray-400'}`}
                        aria-hidden="true"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold truncate">{label}</p>
                        <p className="text-[11px] opacity-80 truncate tabular-nums">{subtitle}</p>
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            <button
              type="button"
              onClick={() => openAddProductForm()}
              className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] text-[#0B0B0B] px-4 py-2.5 text-xs font-extrabold whitespace-nowrap cursor-pointer"
            >
              <Upload className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>رفع وإضافة منتج جديد</span>
            </button>
          </div>
        </div>
      )}

      {/* Workspace Body: Sidebar + Main Viewport */}
      <div className="mx-auto w-full max-w-[1440px] flex-1 flex">
        {/* Desktop Right Sidebar */}
        <aside className="hidden lg:flex lg:w-68 shrink-0 flex-col justify-between border-l border-[#D4AF37]/25 bg-[#101010] p-5">
          <div className="space-y-6">
            <button
              type="button"
              onClick={() => openAddProductForm()}
              className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] border border-[#D4AF37]/70 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white transition-colors whitespace-nowrap cursor-pointer"
            >
              <Upload className="h-4 w-4 text-[#D4AF37] shrink-0" aria-hidden="true" />
              <span>رفع وإضافة منتج جديد</span>
            </button>

            <nav aria-label="أقسام إعدادات المطور" className="space-y-2">
              {navItems.map(({ id, label, subtitle, Icon }) => {
                const active = activeTab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setActiveTab(id);
                      setGlobalBanner(null);
                    }}
                    className={`w-full min-h-[50px] rounded-xl px-4 py-3 flex items-center gap-3 text-right transition-colors cursor-pointer border ${
                      active
                        ? 'bg-[#1A1A1A] text-white border-[#D4AF37]'
                        : 'bg-transparent text-gray-300 border-transparent hover:bg-[#161616] hover:border-white/10'
                    }`}
                  >
                    <Icon
                      className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-[#D4AF37]' : 'text-gray-400'}`}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold truncate">{label}</p>
                      <p className="text-[11px] text-gray-400 truncate tabular-nums">{subtitle}</p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-white/10 text-xs text-gray-400 space-y-1">
            <p className="font-bold text-[#D4AF37]">التخزين السحابي الموحّد</p>
            <p className="leading-relaxed">
              تُحفظ المنتجات والإعدادات في Firestore وتُرفع الصور مباشرة إلى Cloudinary لتظهر لجميع
              الزوار فورًا.
            </p>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Global Feedback Banner */}
          {globalBanner && (
            <div
              role="alert"
              className={`flex items-start justify-between gap-3 rounded-xl px-4 py-3.5 text-xs sm:text-sm font-semibold border ${
                globalBanner.type === 'success'
                  ? 'bg-emerald-950/45 border-emerald-500/50 text-emerald-200'
                  : 'bg-[#0F4C5C]/15 border-[#0F4C5C] text-[#A0D2EB]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {globalBanner.type === 'success' ? (
                  <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                ) : (
                  <AlertCircle className="h-4.5 w-4.5 text-[#0F4C5C] shrink-0 mt-0.5" aria-hidden="true" />
                )}
                <span>{globalBanner.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setGlobalBanner(null)}
                aria-label="إغلاق التنبيه"
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* ================================================================ */}
          {/* SECTION 1: OVERVIEW DASHBOARD                                    */}
          {/* ================================================================ */}
          {activeTab === 'overview' && (
            <OverviewSection
              products={products}
              siteConfig={configDraft}
              developerEmail={currentUser?.email || ''}
              developerUid={currentUser?.uid || ''}
              onNavigateSection={(sec) => {
                setActiveTab(sec);
                setGlobalBanner(null);
              }}
              onAddNewProduct={() => openAddProductForm()}
              onEditProduct={openEditProductForm}
              onConfigureDiscount={(prod) => setDiscountModalProduct(prod)}
              uncategorizedProducts={uncategorizedProducts}
            />
          )}

          {/* ================================================================ */}
          {/* SECTION 2: PRODUCTS MANAGEMENT                                   */}
          {/* ================================================================ */}
          {activeTab === 'products' && (
            <section aria-labelledby="dev-products-heading" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
                <div>
                  <h2 id="dev-products-heading" className="text-xl sm:text-2xl font-extrabold text-white">
                    {productViewMode === 'form'
                      ? editingProductId
                        ? 'تعديل المنتج وإعدادات الخصم'
                        : 'الرفع وإضافة منتج جديد'
                      : 'إدارة المنتجات'}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    {productViewMode === 'form'
                      ? 'ارفع صور المنتج السحابية، حدد السعر الأساسي وإعدادات الخصم والمواصفات ثم احفظه ليظهر في المتجر فورًا.'
                      : 'إضافة وتعديل وحذف المنتجات، ورفع الصور السحابية، والتحكم في الظهور والتوفر والخصومات.'}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  {productViewMode === 'form' ? (
                    <button
                      type="button"
                      onClick={handleCancelProductEdits}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] border border-[#D4AF37]/40 px-4 py-2 text-xs sm:text-sm font-bold text-[#D4AF37] whitespace-nowrap cursor-pointer"
                    >
                      <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>العودة لقائمة المنتجات</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openAddProductForm()}
                      className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] border border-[#D4AF37]/70 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white whitespace-nowrap cursor-pointer"
                    >
                      <Upload className="h-4 w-4 text-[#D4AF37] shrink-0" aria-hidden="true" />
                      <span>رفع وإضافة منتج جديد</span>
                    </button>
                  )}
                </div>
              </div>

              {productViewMode === 'list' ? (
                <div className="space-y-5">
                  {/* Search & Segmented Status Filter */}
                  <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                      <label htmlFor="dev-product-search" className="sr-only">
                        البحث في المنتجات
                      </label>
                      <Search
                        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]"
                        aria-hidden="true"
                      />
                      <input
                        id="dev-product-search"
                        type="search"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        placeholder="ابحث باسم المنتج أو التصنيف أو الماركة..."
                        className="w-full min-h-[44px] rounded-xl bg-[#141414] border border-white/15 pr-10 pl-3.5 py-2 text-xs sm:text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#141414] border border-white/10">
                      {(
                        [
                          ['all', `الكل (${products.length})`],
                          ['published', 'ظاهر بالموقع'],
                          ['hidden', 'مخفي'],
                          ['discounted', 'عليه خصم'],
                          ['out_of_stock', 'غير متوفر'],
                        ] as const
                      ).map(([key, label]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setProductStatusFilter(key)}
                          className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer tabular-nums ${
                            productStatusFilter === key
                              ? 'bg-[#D4AF37] text-[#0B0B0B]'
                              : 'text-gray-300 hover:text-white'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Products Rows */}
                  {filteredProducts.length === 0 ? (
                    <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-10 text-center space-y-3">
                      <p className="text-base font-extrabold text-white">
                        لا توجد منتجات مطابقة للفلتر الحالي
                      </p>
                      <p className="text-xs sm:text-sm text-gray-400">
                        يمكنك تغيير معايير البحث أو إضافة منتج جديد ليظهر في متجر المحلاوي ستور.
                      </p>
                      <button
                        type="button"
                        onClick={() => openAddProductForm()}
                        className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] border border-[#D4AF37]/60 px-5 py-2.5 text-xs sm:text-sm font-extrabold text-white whitespace-nowrap cursor-pointer"
                      >
                        <Upload className="h-4 w-4 text-[#D4AF37] shrink-0" aria-hidden="true" />
                        <span>رفع وإضافة أول منتج</span>
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/10 rounded-2xl bg-[#141414] border border-[#D4AF37]/25 overflow-hidden">
                      {filteredProducts.map((product) => {
                        const effectivePrice = getEffectiveProductPrice(product);
                        const discountActive = isDiscountActive(product);
                        const scheduleStatus = getDiscountScheduleStatus(product);
                        const isBusy = quickUpdatingId === product.id;

                        return (
                          <div
                            key={product.id}
                            className="p-4 sm:p-5 flex flex-col xl:flex-row xl:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors"
                          >
                            {/* Right: Image & Metadata */}
                            <div className="flex items-start sm:items-center gap-4 min-w-0">
                              <ProductImage
                                src={product.images[0]}
                                alt={product.name}
                                containerClassName="h-18 w-18 shrink-0 rounded-xl bg-[#0B0B0B] border border-[#D4AF37]/25 p-1.5"
                              />
                              <div className="min-w-0 space-y-1">
                                <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                                  {product.name}
                                </h3>
                                <div className="text-[10px] sm:text-xs flex flex-wrap items-center gap-x-2 gap-y-1">
                                  {(() => {
                                    const resolvedCatId =
                                      product.categoryId ||
                                      getCategoryIdByName(product.category, activeCategories);
                                    const isValidCat = Boolean(
                                      resolvedCatId &&
                                        activeCategories.some((c) => c.id === resolvedCatId)
                                    );
                                    return isValidCat ? (
                                      <span className="inline-flex items-center gap-1 text-[#D4AF37] font-bold">
                                        {getCategoryName(resolvedCatId, activeCategories)}
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                                        <AlertCircle className="h-3 w-3" />
                                        {product.category || 'بدون قسم'}
                                      </span>
                                    );
                                  })()}
                                  <span className="text-gray-500" aria-hidden="true">·</span>
                                  <span className="text-gray-400">{product.brand || 'ماركة غير محددة'}</span>
                                  <span aria-hidden="true">·</span>
                                  <span
                                    className={
                                      product.isPublished ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'
                                    }
                                  >
                                    {product.isPublished ? 'ظاهر في المتجر' : 'مخفي عن الزوار'}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span
                                    className={
                                      product.inStock ? 'text-gray-300' : 'text-[#0F4C5C] font-semibold'
                                    }
                                  >
                                    {product.inStock ? 'متوفر' : 'غير متوفر'}
                                  </span>
                                  {product.isFeatured && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span className="text-[#D4AF37] font-semibold">مميز بالرئيسية</span>
                                    </>
                                  )}
                                </div>

                                {/* Pricing Line */}
                                <div className="flex flex-wrap items-baseline gap-2 pt-0.5 tabular-nums">
                                  <span className="text-sm sm:text-base font-extrabold text-[#D4AF37]">
                                    {formatPriceEgp(effectivePrice)} ج.م
                                  </span>
                                  {discountActive && (
                                    <>
                                      <span className="text-xs text-gray-500 line-through">
                                        {formatPriceEgp(product.originalPrice)} ج.م
                                      </span>
                                      <span className="text-xs font-bold text-emerald-400">
                                        خصم{' '}
                                        {calculateDiscountPercent(
                                          product.originalPrice,
                                          effectivePrice
                                        )}
                                        % نشط
                                      </span>
                                    </>
                                  )}
                                  {scheduleStatus === 'scheduled' && (
                                    <span className="text-xs font-semibold text-amber-300">
                                      خصم مجدول يبدأ {product.discountStartDate}
                                    </span>
                                  )}
                                  {scheduleStatus === 'expired' && (
                                    <span className="text-xs text-gray-400">
                                      انتهى الخصم ({product.discountEndDate}) ويعرض السعر الأساسي
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Left: Product Actions */}
                            <div className="flex flex-wrap items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => setDiscountModalProduct(product)}
                                aria-label={`إعداد الخصم للمنتج ${product.name}`}
                                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#0B0B0B] hover:bg-[#1E1E1E] border border-[#D4AF37]/50 px-3.5 py-2 text-xs font-bold text-[#D4AF37] transition-colors whitespace-nowrap cursor-pointer"
                              >
                                <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>إعداد الخصم</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditProductForm(product)}
                                aria-label={`تعديل المنتج ${product.name}`}
                                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-white/15 px-3.5 py-2 text-xs font-bold text-white transition-colors whitespace-nowrap cursor-pointer"
                              >
                                <Edit3 className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
                                <span>تعديل</span>
                              </button>

                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  handleQuickToggle(
                                    product,
                                    { isPublished: !product.isPublished },
                                    product.isPublished
                                      ? `تم إخفاء «${product.name}» عن واجهة الزوار.`
                                      : `تم إظهار «${product.name}» في واجهة المتجر.`
                                  )
                                }
                                aria-label={`${product.isPublished ? 'إخفاء' : 'إظهار'} المنتج ${product.name}`}
                                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#0B0B0B] hover:bg-[#1E1E1E] border border-white/15 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white transition-colors whitespace-nowrap cursor-pointer disabled:opacity-50"
                              >
                                {product.isPublished ? (
                                  <>
                                    <EyeOff className="h-3.5 w-3.5" aria-hidden="true" />
                                    <span>إخفاء</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
                                    <span>إظهار</span>
                                  </>
                                )}
                              </button>

                              <button
                                type="button"
                                onClick={() => setConfirmDeleteProduct(product)}
                                aria-label={`حذف المنتج ${product.name}`}
                                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-[#0F4C5C]/15 hover:bg-[#0F4C5C] border border-[#0F4C5C]/60 px-3 py-2 text-xs font-bold text-[#A0D2EB] hover:text-white transition-colors whitespace-nowrap cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>حذف</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* UPLOAD & ADD / EDIT PRODUCT FORM WITH INTEGRATED DISCOUNT SETTINGS */
                <form
                  onSubmit={handleProductFormSubmit}
                  className="rounded-2xl bg-[#141414] border border-[#D4AF37]/30 p-5 sm:p-7 space-y-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-white/10">
                    <div>
                      <h3 className="text-base sm:text-lg font-extrabold text-[#D4AF37]">
                        {editingProductId
                          ? 'تعديل بيانات المنتج والصور وإعدادات الخصم'
                          : 'بيانات الرفع وإضافة منتج جديد'}
                      </h3>
                      <p className="text-xs text-gray-400 mt-0.5">
                        الحقول المسبوقة بـ * مطلوبة — يمكنك تفعيل الخصم وتحديد نسبته أو سعره المخفّض مباشرة من هذه الصفحة.
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-gray-400 whitespace-nowrap shrink-0">
                      مزامنة سحابية فورية
                    </span>
                  </div>

                  {/* 1. Cloud Image Upload Section */}
                  <div className="space-y-3.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="block text-xs sm:text-sm font-extrabold text-[#D4AF37]">
                          1. رفع صور المنتج السحابية (Cloudinary) *
                        </span>
                        <span className="text-[11px] sm:text-xs text-gray-400">
                          ارفع صورة واحدة أو أكثر (حتى 15 صورة). أول صورة تظهر كصورة رئيسية للمنتج في المتجر.
                        </span>
                      </div>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => void handleUploadCloudinaryFiles(e.target.files)}
                        className="hidden"
                      />
                      <button
                        type="button"
                        disabled={uploadingImages}
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] disabled:opacity-55 border border-[#D4AF37]/60 px-4 py-2 text-xs font-extrabold text-white whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        {uploadingImages ? (
                          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
                        ) : (
                          <Upload className="h-4 w-4 text-[#D4AF37] shrink-0" aria-hidden="true" />
                        )}
                        <span>
                          {uploadingImages ? 'جاري الرفع إلى Cloudinary...' : 'اختيار ورفع صور من جهازك'}
                        </span>
                      </button>
                    </div>

                    {/* Drag-and-Drop Upload Target */}
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (!uploadingImages) setIsDraggingFiles(true);
                      }}
                      onDragLeave={() => setIsDraggingFiles(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDraggingFiles(false);
                        if (!uploadingImages && e.dataTransfer?.files?.length) {
                          void handleUploadCloudinaryFiles(e.dataTransfer.files);
                        }
                      }}
                      onClick={() => {
                        if (!uploadingImages) fileInputRef.current?.click();
                      }}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if ((e.key === 'Enter' || e.key === ' ') && !uploadingImages) {
                          e.preventDefault();
                          fileInputRef.current?.click();
                        }
                      }}
                      aria-label="منطقة سحب وإفلات صور المنتج للرفع السحابي"
                      className={`rounded-xl border border-dashed px-4 py-5 text-center transition-colors cursor-pointer ${
                        isDraggingFiles
                          ? 'bg-[#1E1E1E] border-[#D4AF37]'
                          : 'bg-[#0B0B0B] border-white/20 hover:border-[#D4AF37]/60'
                      }`}
                    >
                      <p className="text-xs sm:text-sm font-bold text-gray-200">
                        {uploadingImages
                          ? 'جاري رفع الصور وحفظ روابطها السحابية...'
                          : 'اسحب صور المنتج وأفلتها هنا، أو اضغط لاختيار الصور من الهاتف أو الكمبيوتر'}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1 tabular-nums">
                        الصور المرفوعة حاليًا: {productForm.images.length} / 15
                      </p>
                    </div>

                    {/* Optional Direct HTTPS URL Input */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label htmlFor="prod-image-url-input" className="sr-only">
                        إضافة رابط صورة سحابي مباشر
                      </label>
                      <input
                        id="prod-image-url-input"
                        type="url"
                        dir="ltr"
                        value={imageUrlInput}
                        onChange={(e) => setImageUrlInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddExternalImageUrl();
                          }
                        }}
                        placeholder="أو الصق رابط صورة سحابي مباشر https://res.cloudinary.com/..."
                        className="flex-1 min-h-[42px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]"
                      />
                      <button
                        type="button"
                        onClick={handleAddExternalImageUrl}
                        className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-white/15 px-4 py-2 text-xs font-bold text-[#D4AF37] whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <ImagePlus className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>إضافة الرابط</span>
                      </button>
                    </div>

                    {/* Uploaded Images Preview Grid */}
                    {productForm.images.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 pt-1">
                        {productForm.images.map((url, idx) => (
                          <div
                            key={`${url}-${idx}`}
                            className={`rounded-xl bg-[#0B0B0B] border p-2 flex flex-col justify-between gap-2 ${
                              idx === 0 ? 'border-[#D4AF37]' : 'border-white/15'
                            }`}
                          >
                            <ProductImage
                              src={url}
                              alt={`صورة ${idx + 1}`}
                              containerClassName="aspect-square w-full rounded-lg bg-[#141414] p-1"
                            />
                            <div className="flex items-center justify-between gap-1 text-[11px]">
                              {idx === 0 ? (
                                <span className="font-bold text-[#D4AF37] truncate">الرئيسية</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProductForm((prev) => {
                                      const next = [...prev.images];
                                      const [picked] = next.splice(idx, 1);
                                      next.unshift(picked);
                                      return { ...prev, images: next };
                                    });
                                    setIsProductFormDirty(true);
                                  }}
                                  className="text-gray-300 hover:text-[#D4AF37] font-semibold truncate cursor-pointer"
                                >
                                  جعلها رئيسية
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setProductForm((prev) => ({
                                    ...prev,
                                    images: prev.images.filter((_, i) => i !== idx),
                                  }));
                                  setIsProductFormDirty(true);
                                }}
                                aria-label={`حذف الصورة رقم ${idx + 1}`}
                                className="text-[#0F4C5C] hover:text-[#0A3D4A] p-1 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 2. Basic Product Identity */}
                  <div className="space-y-4 pt-5 border-t border-white/10">
                    <span className="block text-xs sm:text-sm font-extrabold text-[#D4AF37]">
                      2. البيانات الأساسية للمنتج
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-6">
                        <label
                          htmlFor="prod-name-input"
                          className="block text-xs font-bold text-[#D4AF37] mb-1.5"
                        >
                          اسم المنتج *
                        </label>
                        <input
                          id="prod-name-input"
                          type="text"
                          required
                          maxLength={160}
                          value={productForm.name}
                          onChange={(e) => {
                            setProductForm((prev) => ({ ...prev, name: e.target.value }));
                            setIsProductFormDirty(true);
                          }}
                          placeholder="مثال: كاميرا مراقبة ذكية خارجية بدقة 5 ميجابكسل"
                          className="w-full min-h-[46px] rounded-xl bg-[#0B0B0B] border border-[#D4AF37]/35 px-4 py-2.5 text-sm font-semibold text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>

                      <div className="md:col-span-3">
                        <label
                          htmlFor="prod-category-input"
                          className="block text-xs font-bold text-[#D4AF37] mb-1.5"
                        >
                          التصنيف / القسم *
                        </label>
                        <select
                          id="prod-category-input"
                          required
                          value={productForm.categoryId}
                          onChange={(e) => {
                            const selectedId = e.target.value;
                            setProductForm((prev) => ({
                              ...prev,
                              categoryId: selectedId,
                              category: getCategoryName(selectedId, activeCategories),
                            }));
                            setIsProductFormDirty(true);
                          }}
                          className="w-full min-h-[46px] rounded-xl bg-[#0B0B0B] border border-[#D4AF37]/35 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                        >
                          <option value="" disabled>
                            اختر القسم...
                          </option>
                          {activeCategories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-3">
                        <label
                          htmlFor="prod-brand-input"
                          className="block text-xs font-bold text-gray-300 mb-1.5"
                        >
                          الماركة / المصنّع (اختياري)
                        </label>
                        <input
                          id="prod-brand-input"
                          type="text"
                          maxLength={80}
                          value={productForm.brand}
                          onChange={(e) => {
                            setProductForm((prev) => ({ ...prev, brand: e.target.value }));
                            setIsProductFormDirty(true);
                          }}
                          placeholder="Hikvision, Dahua, Sony..."
                          className="w-full min-h-[46px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 3. Pricing & Integrated Discount Settings */}
                  <div className="space-y-4 pt-5 border-t border-white/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="block text-xs sm:text-sm font-extrabold text-[#D4AF37]">
                          3. التسعير وإعدادات الخصم والعرض
                        </span>
                        <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">
                          حدد السعر الأساسي للمنتج، ويمكنك تفعيل خصم بنسبة مئوية أو مبلغ ثابت أو إدخال السعر بعد الخصم مباشرة مع جدولة تاريخ العرض.
                        </p>
                      </div>

                      {productForm.discountEnabled && (
                        <button
                          type="button"
                          onClick={() => handleSelectDiscountMode('none')}
                          className="inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-xl bg-[#0B0B0B] hover:bg-[#1E1E1E] border border-white/15 px-3.5 py-1.5 text-xs font-bold text-gray-300 hover:text-[#D4AF37] whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <RotateCcw className="h-3.5 w-3.5 text-[#D4AF37] shrink-0" aria-hidden="true" />
                          <span>إلغاء الخصم والعودة للسعر الأساسي</span>
                        </button>
                      )}
                    </div>

                    {/* Base Price + 3-Way Discount Mode Segmented Control */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                      <div className="lg:col-span-5">
                        <label
                          htmlFor="prod-base-price-input"
                          className="block text-xs font-bold text-[#D4AF37] mb-1.5"
                        >
                          {productForm.discountEnabled
                            ? 'السعر الأساسي قبل الخصم (ج.م) *'
                            : 'السعر الأساسي للمنتج (ج.م) *'}
                        </label>
                        <div className="relative">
                          <input
                            id="prod-base-price-input"
                            type="number"
                            required
                            min="0.01"
                            max="1000000"
                            step="0.01"
                            dir="ltr"
                            value={basePriceDraft}
                            onChange={(e) => handleBasePriceChange(e.target.value)}
                            placeholder="1250"
                            className="w-full min-h-[46px] rounded-xl bg-[#0B0B0B] border border-[#D4AF37]/35 pl-14 pr-4 py-2.5 text-sm font-bold text-white text-right tabular-nums placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]"
                          />
                          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#D4AF37]">
                            ج.م
                          </span>
                        </div>
                      </div>

                      <div className="lg:col-span-7">
                        <span className="block text-xs font-bold text-gray-300 mb-1.5">
                          حالة ونوع الخصم على المنتج
                        </span>
                        <div
                          role="group"
                          aria-label="اختيار نظام الخصم للمنتج"
                          className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#0B0B0B] border border-white/15"
                        >
                          <button
                            type="button"
                            onClick={() => handleSelectDiscountMode('none')}
                            className={`min-h-[42px] rounded-lg px-2.5 py-2 text-xs font-extrabold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              !productForm.discountEnabled
                                ? 'bg-[#D4AF37] text-[#0B0B0B]'
                                : 'text-gray-300 hover:text-white'
                            }`}
                          >
                            بدون خصم
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelectDiscountMode('percentage')}
                            className={`min-h-[42px] rounded-lg px-2.5 py-2 text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              productForm.discountEnabled && currentDiscountDraft.discountType === 'percentage'
                                ? 'bg-[#0F4C5C] text-white'
                                : 'text-gray-300 hover:text-white'
                            }`}
                          >
                            <Percent className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span>نسبة مئوية (%)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSelectDiscountMode('fixed')}
                            className={`min-h-[42px] rounded-lg px-2.5 py-2 text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                              productForm.discountEnabled && currentDiscountDraft.discountType === 'fixed'
                                ? 'bg-[#0F4C5C] text-white'
                                : 'text-gray-300 hover:text-white'
                            }`}
                          >
                            <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                            <span>مبلغ ثابت (ج.م)</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Discount Configuration Controls */}
                    {productForm.discountEnabled && (
                      <div className="space-y-4 pt-2">
                        {/* Quick Percentage Presets */}
                        {currentDiscountDraft.discountType === 'percentage' && (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-semibold text-gray-400">
                              نسب خصم سريعة:
                            </span>
                            {[5, 10, 15, 20, 25, 30, 50].map((pct) => {
                              const isSelected = Number(discountValueDraft) === pct;
                              return (
                                <button
                                  key={pct}
                                  type="button"
                                  onClick={() => handleDiscountValueChange(String(pct), 'percentage')}
                                  className={`min-h-[34px] rounded-lg px-3 py-1 text-xs font-bold border transition-colors tabular-nums whitespace-nowrap shrink-0 cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#D4AF37] text-[#0B0B0B] border-[#D4AF37]'
                                      : 'bg-[#0B0B0B] text-gray-300 border-white/15 hover:border-[#D4AF37]/60 hover:text-white'
                                  }`}
                                >
                                  {pct}%
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Discount Value & Bidirectional Final Sale Price */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label
                              htmlFor="prod-discount-value-input"
                              className="block text-xs font-bold text-[#D4AF37] mb-1.5"
                            >
                              {currentDiscountDraft.discountType === 'percentage'
                                ? 'قيمة نسبة الخصم (%) — أقل من 100% *'
                                : 'قيمة مبلغ الخصم الثابت (ج.م) — أقل من السعر الأساسي *'}
                            </label>
                            <div className="relative">
                              <input
                                id="prod-discount-value-input"
                                type="number"
                                min="0.01"
                                max={
                                  currentDiscountDraft.discountType === 'percentage'
                                    ? '99.99'
                                    : basePriceDraft || '1000000'
                                }
                                step="0.01"
                                required={productForm.discountEnabled}
                                dir="ltr"
                                value={discountValueDraft}
                                onChange={(e) => handleDiscountValueChange(e.target.value)}
                                placeholder={
                                  currentDiscountDraft.discountType === 'percentage' ? '15' : '250'
                                }
                                className="w-full min-h-[46px] rounded-xl bg-[#0B0B0B] border border-[#D4AF37]/35 pl-14 pr-4 py-2.5 text-sm font-bold text-white text-right tabular-nums placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]"
                              />
                              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#D4AF37]">
                                {currentDiscountDraft.discountType === 'percentage' ? '%' : 'ج.م'}
                              </span>
                            </div>
                          </div>

                          <div>
                            <label
                              htmlFor="prod-final-price-input"
                              className="block text-xs font-bold text-gray-300 mb-1.5"
                            >
                              السعر النهائي بعد الخصم (ج.م) — يُحسب تلقائيًا أو عدّله مباشرة
                            </label>
                            <div className="relative">
                              <input
                                id="prod-final-price-input"
                                type="number"
                                min="0.01"
                                max={basePriceDraft || '1000000'}
                                step="0.01"
                                dir="ltr"
                                disabled={livePricingCalc.validBase <= 0}
                                value={finalPriceDraft}
                                onChange={(e) => handleFinalPriceChange(e.target.value)}
                                placeholder={
                                  livePricingCalc.validBase > 0
                                    ? 'مثال: 950'
                                    : 'أدخل السعر الأساسي أولًا'
                                }
                                className="w-full min-h-[46px] rounded-xl bg-[#0B0B0B] border border-white/15 disabled:opacity-50 pl-14 pr-4 py-2.5 text-sm font-bold text-emerald-300 text-right tabular-nums placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]"
                              />
                              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-400">
                                ج.م
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Optional Start & End Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label
                                htmlFor="prod-discount-start-date"
                                className="text-xs font-bold text-gray-300 flex items-center gap-1.5"
                              >
                                <Calendar className="h-3.5 w-3.5 text-[#D4AF37] shrink-0" aria-hidden="true" />
                                <span>تاريخ بداية الخصم (اختياري)</span>
                              </label>
                              {productForm.discountStartDate && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProductForm((prev) => ({ ...prev, discountStartDate: '' }));
                                    setIsProductFormDirty(true);
                                  }}
                                  className="text-[11px] font-semibold text-[#D4AF37] hover:underline cursor-pointer"
                                >
                                  مسح التاريخ
                                </button>
                              )}
                            </div>
                            <input
                              id="prod-discount-start-date"
                              type="date"
                              dir="ltr"
                              value={productForm.discountStartDate || ''}
                              onChange={(e) => {
                                setProductForm((prev) => ({
                                  ...prev,
                                  discountStartDate: e.target.value,
                                }));
                                setIsProductFormDirty(true);
                              }}
                              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-xs sm:text-sm text-white tabular-nums focus:outline-none focus:border-[#D4AF37]"
                            />
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label
                                htmlFor="prod-discount-end-date"
                                className="text-xs font-bold text-gray-300 flex items-center gap-1.5"
                              >
                                <Calendar className="h-3.5 w-3.5 text-[#D4AF37] shrink-0" aria-hidden="true" />
                                <span>تاريخ نهاية الخصم (اختياري)</span>
                              </label>
                              {productForm.discountEndDate && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProductForm((prev) => ({ ...prev, discountEndDate: '' }));
                                    setIsProductFormDirty(true);
                                  }}
                                  className="text-[11px] font-semibold text-[#D4AF37] hover:underline cursor-pointer"
                                >
                                  مسح التاريخ
                                </button>
                              )}
                            </div>
                            <input
                              id="prod-discount-end-date"
                              type="date"
                              dir="ltr"
                              value={productForm.discountEndDate || ''}
                              onChange={(e) => {
                                setProductForm((prev) => ({
                                  ...prev,
                                  discountEndDate: e.target.value,
                                }));
                                setIsProductFormDirty(true);
                              }}
                              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-xs sm:text-sm text-white tabular-nums focus:outline-none focus:border-[#D4AF37]"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Live Pricing & Savings Summary Strip */}
                    {livePricingCalc.validBase > 0 && (
                      <div className="rounded-xl bg-[#0B0B0B] border border-white/10 p-4 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm tabular-nums">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-gray-300">
                            <span>
                              السعر الأساسي:{' '}
                              <strong className="text-white">
                                {formatPriceEgp(livePricingCalc.validBase)} ج.م
                              </strong>
                            </span>

                            {productForm.discountEnabled &&
                              livePricingCalc.calc.valid &&
                              !livePricingCalc.inlineError && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="text-emerald-400 font-bold">
                                    توفير للعميل: {formatPriceEgp(livePricingCalc.calc.savings)} ج.م (خصم{' '}
                                    {livePricingCalc.calc.discountPercent}%)
                                  </span>
                                </>
                              )}
                          </div>

                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xs text-gray-400">السعر النهائي للعميل:</span>
                            <span className="text-base sm:text-lg font-extrabold text-[#D4AF37]">
                              {!productForm.discountEnabled
                                ? `${formatPriceEgp(livePricingCalc.validBase)} ج.م`
                                : livePricingCalc.calc.valid && !livePricingCalc.inlineError
                                  ? `${formatPriceEgp(livePricingCalc.calc.price)} ج.م`
                                  : 'يرجى ضبط قيمة الخصم'}
                            </span>
                          </div>
                        </div>

                        {livePricingCalc.inlineError ? (
                          <p className="text-xs font-semibold text-[#0F4C5C]">
                            {livePricingCalc.inlineError}
                          </p>
                        ) : productForm.discountEnabled && livePricingCalc.calc.valid ? (
                          <p className="text-xs text-gray-400">
                            حالة العرض عند الحفظ:{' '}
                            <strong className="text-gray-200">
                              {livePricingCalc.scheduleStatus === 'active' &&
                                'مفعّل — سيظهر بالسعر المخفّض مع شطب السعر القديم وفي قسم العروض فور الحفظ'}
                              {livePricingCalc.scheduleStatus === 'scheduled' &&
                                `مجدول — سيبدأ ظهور الخصم تلقائيًا يوم ${currentDiscountDraft.discountStartDate}`}
                              {livePricingCalc.scheduleStatus === 'expired' &&
                                `تاريخ النهاية (${currentDiscountDraft.discountEndDate}) قد مضى — سيعرض المتجر السعر الأساسي تلقائيًا`}
                            </strong>
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400">
                            يُعرض المنتج بالسعر الأساسي فقط دون شارة خصم — اختر «نسبة مئوية» أو «مبلغ ثابت» أعلاه لتفعيل عرض على المنتج.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Optional Descriptions */}
                  <div className="grid grid-cols-1 gap-5 pt-2 border-t border-white/10">
                    <div>
                      <label
                        htmlFor="prod-short-desc"
                        className="block text-xs font-bold text-gray-300 mb-1.5"
                      >
                        نبذة مختصرة للبطاقة (اختياري)
                      </label>
                      <input
                        id="prod-short-desc"
                        type="text"
                        maxLength={300}
                        value={productForm.shortDescription}
                        onChange={(e) => {
                          setProductForm((prev) => ({ ...prev, shortDescription: e.target.value }));
                          setIsProductFormDirty(true);
                        }}
                        placeholder="سطر توضيحي يظهر أسفل اسم المنتج في شبكة المنتجات..."
                        className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="prod-full-desc"
                        className="block text-xs font-bold text-gray-300 mb-1.5"
                      >
                        تفاصيل المنتج ووصفه الكامل (اختياري)
                      </label>
                      <textarea
                        id="prod-full-desc"
                        rows={4}
                        maxLength={3000}
                        value={productForm.description}
                        onChange={(e) => {
                          setProductForm((prev) => ({ ...prev, description: e.target.value }));
                          setIsProductFormDirty(true);
                        }}
                        placeholder="اكتب كافة تفاصيل المنتج، المميزات، ومحتويات العلبة..."
                        className="w-full rounded-xl bg-[#0B0B0B] border border-white/15 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>

                  {/* Optional Specs & Options Lists */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-white/10">
                    {/* Specs */}
                    <div className="space-y-2.5">
                      <label htmlFor="prod-spec-draft" className="block text-xs font-bold text-gray-300">
                        المواصفات الفنية بنقاط (اختياري)
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="prod-spec-draft"
                          type="text"
                          maxLength={200}
                          value={specInput}
                          onChange={(e) => setSpecInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = specInput.trim();
                              if (val && productForm.specs.length < 15) {
                                setProductForm((prev) => ({
                                  ...prev,
                                  specs: [...prev.specs, val],
                                }));
                                setSpecInput('');
                                setIsProductFormDirty(true);
                              }
                            }
                          }}
                          placeholder="أضف ميزة أو مواصفة..."
                          className="flex-1 min-h-[42px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = specInput.trim();
                            if (val && productForm.specs.length < 15) {
                              setProductForm((prev) => ({
                                ...prev,
                                specs: [...prev.specs, val],
                              }));
                              setSpecInput('');
                              setIsProductFormDirty(true);
                            }
                          }}
                          className="min-h-[42px] rounded-xl bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-white/15 px-3.5 py-2 text-xs font-bold text-[#D4AF37] whitespace-nowrap cursor-pointer"
                        >
                          إضافة
                        </button>
                      </div>
                      {productForm.specs.length > 0 && (
                        <ul className="space-y-1.5 pt-1">
                          {productForm.specs.map((sp, idx) => (
                            <li
                              key={`${sp}-${idx}`}
                              className="flex items-center justify-between gap-2 rounded-lg bg-[#0B0B0B] border border-white/10 px-3 py-1.5 text-xs text-gray-200"
                            >
                              <span className="truncate">{sp}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setProductForm((prev) => ({
                                    ...prev,
                                    specs: prev.specs.filter((_, i) => i !== idx),
                                  }));
                                  setIsProductFormDirty(true);
                                }}
                                aria-label={`حذف المواصفة ${sp}`}
                                className="text-[#0F4C5C] hover:text-[#0A3D4A] cursor-pointer"
                              >
                                <X className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {/* Options */}
                    <div className="space-y-2.5">
                      <label htmlFor="prod-option-draft" className="block text-xs font-bold text-gray-300">
                        خيارات الشراء كالموديل أو اللون (اختياري)
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="prod-option-draft"
                          type="text"
                          maxLength={80}
                          value={optionInput}
                          onChange={(e) => setOptionInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = optionInput.trim();
                              if (val && productForm.options.length < 10) {
                                setProductForm((prev) => ({
                                  ...prev,
                                  options: [...prev.options, val],
                                }));
                                setOptionInput('');
                                setIsProductFormDirty(true);
                              }
                            }
                          }}
                          placeholder="مثال: عدسة 3.6mm أو لون أبيض..."
                          className="flex-1 min-h-[42px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = optionInput.trim();
                            if (val && productForm.options.length < 10) {
                              setProductForm((prev) => ({
                                ...prev,
                                options: [...prev.options, val],
                              }));
                              setOptionInput('');
                              setIsProductFormDirty(true);
                            }
                          }}
                          className="min-h-[42px] rounded-xl bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-white/15 px-3.5 py-2 text-xs font-bold text-[#D4AF37] whitespace-nowrap cursor-pointer"
                        >
                          إضافة
                        </button>
                      </div>
                      {productForm.options.length > 0 && (
                        <ul className="space-y-1.5 pt-1">
                          {productForm.options.map((opt, idx) => (
                            <li
                              key={`${opt}-${idx}`}
                              className="flex items-center justify-between gap-2 rounded-lg bg-[#0B0B0B] border border-white/10 px-3 py-1.5 text-xs text-gray-200"
                            >
                              <span className="truncate">{opt}</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setProductForm((prev) => ({
                                    ...prev,
                                    options: prev.options.filter((_, i) => i !== idx),
                                  }));
                                  setIsProductFormDirty(true);
                                }}
                                aria-label={`حذف الخيار ${opt}`}
                                className="text-[#0F4C5C] hover:text-[#0A3D4A] cursor-pointer"
                              >
                                <X className="h-3.5 w-3.5" aria-hidden="true" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>

                  {/* Visibility, Stock, and Featured Switches */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-3 border-t border-white/10">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={productForm.isPublished}
                      onClick={() => {
                        setProductForm((prev) => ({ ...prev, isPublished: !prev.isPublished }));
                        setIsProductFormDirty(true);
                      }}
                      className={`min-h-[52px] rounded-xl px-4 py-3 border text-right flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        productForm.isPublished
                          ? 'bg-[#0B0B0B] border-[#D4AF37] text-white'
                          : 'bg-[#0B0B0B] border-white/15 text-gray-400'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-extrabold">حالة الظهور بالموقع</p>
                        <p className="text-[11px] text-[#D4AF37]">
                          {productForm.isPublished ? 'ظاهر لجميع الزوار' : 'مخفي عن الزوار'}
                        </p>
                      </div>
                      {productForm.isPublished ? (
                        <Eye className="h-4 w-4 text-[#D4AF37] shrink-0" aria-hidden="true" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-500 shrink-0" aria-hidden="true" />
                      )}
                    </button>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={productForm.inStock}
                      onClick={() => {
                        setProductForm((prev) => ({ ...prev, inStock: !prev.inStock }));
                        setIsProductFormDirty(true);
                      }}
                      className={`min-h-[52px] rounded-xl px-4 py-3 border text-right flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        productForm.inStock
                          ? 'bg-[#0B0B0B] border-[#D4AF37] text-white'
                          : 'bg-[#0B0B0B] border-white/15 text-gray-400'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-extrabold">حالة التوفر</p>
                        <p className="text-[11px] text-[#D4AF37]">
                          {productForm.inStock ? 'متوفر للطلب الفوري' : 'غير متوفر حاليًا'}
                        </p>
                      </div>
                      <Check
                        className={`h-4 w-4 shrink-0 ${
                          productForm.inStock ? 'text-emerald-400' : 'text-gray-600'
                        }`}
                        aria-hidden="true"
                      />
                    </button>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={productForm.isFeatured}
                      onClick={() => {
                        setProductForm((prev) => ({ ...prev, isFeatured: !prev.isFeatured }));
                        setIsProductFormDirty(true);
                      }}
                      className={`min-h-[52px] rounded-xl px-4 py-3 border text-right flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        productForm.isFeatured
                          ? 'bg-[#0B0B0B] border-[#D4AF37] text-white'
                          : 'bg-[#0B0B0B] border-white/15 text-gray-400'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-extrabold">تمييز بأعلى الرئيسية</p>
                        <p className="text-[11px] text-[#D4AF37]">
                          {productForm.isFeatured ? 'معروض كمنتج مميز' : 'منتج قياسي'}
                        </p>
                      </div>
                      <Star
                        className={`h-4 w-4 shrink-0 ${
                          productForm.isFeatured ? 'text-[#D4AF37]' : 'text-gray-600'
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>

                  {/* Form Action Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-white/10">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <button
                        type="submit"
                        disabled={savingProduct || uploadingImages}
                        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] disabled:opacity-55 border border-[#D4AF37]/70 px-6 py-3 text-sm font-extrabold text-white transition-colors whitespace-nowrap cursor-pointer"
                      >
                        {savingProduct ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Check className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
                        )}
                        <span>
                          {savingProduct
                            ? 'جاري الحفظ في Firestore...'
                            : editingProductId
                              ? 'حفظ تعديلات المنتج سحابيًا'
                              : 'إضافة المنتج وحفظه سحابيًا'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenLivePreview}
                        className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#0B0B0B] hover:bg-[#1E1E1E] border border-[#D4AF37]/50 px-5 py-3 text-xs sm:text-sm font-bold text-[#D4AF37] transition-colors whitespace-nowrap cursor-pointer"
                      >
                        <Eye className="h-4 w-4" aria-hidden="true" />
                        <span>معاينة قبل الحفظ</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      disabled={savingProduct}
                      onClick={handleCancelProductEdits}
                      className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-white/15 px-5 py-3 text-xs sm:text-sm font-semibold text-gray-300 transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <RotateCcw className="h-4 w-4" aria-hidden="true" />
                      <span>إلغاء التعديلات</span>
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}

          {/* ================================================================ */}
          {/* SECTION 3: PRICES & DISCOUNTS MANAGEMENT                         */}
          {/* ================================================================ */}
          {activeTab === 'discounts' && (
            <section aria-labelledby="dev-discounts-heading" className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
                <div>
                  <h2 id="dev-discounts-heading" className="text-xl sm:text-2xl font-extrabold text-white">
                    إدارة الأسعار والخصومات
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1">
                    يمكنك ضبط إعدادات الخصم مباشرة أثناء رفع وإضافة منتج جديد، أو تعديل خصم أي منتج حالي من القائمة أدناه.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => openAddProductForm({ enableDiscount: true })}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] border border-[#D4AF37]/70 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Upload className="h-4 w-4 text-[#D4AF37] shrink-0" aria-hidden="true" />
                  <span>رفع منتج جديد مع خصم</span>
                </button>
              </div>

              {/* Clean Metric Summary Strip */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
                {[
                  { label: 'إجمالي المنتجات', value: discountMetrics.total, accent: 'text-white' },
                  { label: 'خصومات نشطة الآن', value: discountMetrics.active, accent: 'text-[#D4AF37]' },
                  { label: 'خصومات مجدولة', value: discountMetrics.scheduled, accent: 'text-amber-300' },
                  { label: 'خصومات منتهية', value: discountMetrics.expired, accent: 'text-gray-400' },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl bg-[#141414] border border-[#D4AF37]/25 p-4"
                  >
                    <p className="text-xs text-gray-400">{stat.label}</p>
                    <p className={`text-2xl font-extrabold mt-1 tabular-nums ${stat.accent}`}>
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Search & Filter */}
              <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-md">
                  <label htmlFor="dev-discount-search" className="sr-only">
                    البحث عن منتج لإعداد الخصم
                  </label>
                  <Search
                    className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]"
                    aria-hidden="true"
                  />
                  <input
                    id="dev-discount-search"
                    type="search"
                    value={discountSearch}
                    onChange={(e) => setDiscountSearch(e.target.value)}
                    placeholder="ابحث باسم المنتج لضبط الخصم..."
                    className="w-full min-h-[44px] rounded-xl bg-[#141414] border border-white/15 pr-10 pl-3.5 py-2 text-xs sm:text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#141414] border border-white/10">
                  {(
                    [
                      ['all', 'الكل'],
                      ['active', 'نشط الآن'],
                      ['scheduled', 'مجدول'],
                      ['expired', 'منتهي'],
                      ['none', 'بدون خصم'],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setDiscountFilter(key)}
                      className={`min-h-[38px] rounded-lg px-3 py-1.5 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
                        discountFilter === key
                          ? 'bg-[#D4AF37] text-[#0B0B0B]'
                          : 'text-gray-300 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Discount Table */}
              {filteredDiscountProducts.length === 0 ? (
                <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-10 text-center text-sm text-gray-400">
                  لا توجد منتجات تطابق فلتر الخصومات المحدد.
                </div>
              ) : (
                <div className="divide-y divide-white/10 rounded-2xl bg-[#141414] border border-[#D4AF37]/25 overflow-hidden">
                  {filteredDiscountProducts.map((product) => {
                    const status = getDiscountScheduleStatus(product);
                    const effectivePrice = getEffectiveProductPrice(product);
                    const basePrice =
                      product.originalPrice > 0 ? product.originalPrice : product.price;

                    return (
                      <div
                        key={product.id}
                        className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-white/[0.02]"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <ProductImage
                            src={product.images[0]}
                            alt={product.name}
                            containerClassName="h-14 w-14 shrink-0 rounded-xl bg-[#0B0B0B] border border-[#D4AF37]/25 p-1"
                          />
                          <div className="min-w-0">
                            <h3 className="text-sm font-extrabold text-white truncate">
                              {product.name}
                            </h3>
                            <p className="text-xs text-gray-400 mt-0.5 tabular-nums">
                              السعر الأساسي: {formatPriceEgp(basePrice)} ج.م · السعر الفعلي الآن:{' '}
                              <strong className="text-[#D4AF37]">
                                {formatPriceEgp(effectivePrice)} ج.م
                              </strong>
                            </p>
                            <p className="text-[11px] text-gray-400 mt-0.5 tabular-nums">
                              {status === 'active' &&
                                `خصم نشط (${calculateDiscountPercent(basePrice, effectivePrice)}%)`}
                              {status === 'scheduled' &&
                                `مجدول ليبدأ في ${product.discountStartDate}`}
                              {status === 'expired' &&
                                `انتهى في ${product.discountEndDate} — يعرض السعر الأساسي`}
                              {status === 'disabled' && 'لا يوجد خصم مفعّل'}
                              {product.discountEndDate && status === 'active'
                                ? ` · ينتهي ${product.discountEndDate}`
                                : ''}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setDiscountModalProduct(product)}
                            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] border border-[#D4AF37]/60 px-4 py-2 text-xs font-extrabold text-white whitespace-nowrap cursor-pointer"
                          >
                            <Tag className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
                            <span>السعر والخصم</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ================================================================ */}
          {/* SECTION 4: PHONES & WHATSAPP                                     */}
          {/* ================================================================ */}
          {activeTab === 'phones' && (
            <PhonesWhatsAppSection
              configDraft={configDraft}
              isSiteConfigDirty={isSiteConfigDirty}
              savingSiteConfig={savingSiteConfig}
              onUpdateField={updateConfigField}
              onSaveSubmit={handleSaveConfigSubmit}
              onCancelChanges={handleCancelConfigChanges}
              onValidationError={(message) => setGlobalBanner({ type: 'error', message })}
            />
          )}

          {/* ================================================================ */}
          {/* SECTION 5: SOCIAL MEDIA LINKS                                    */}
          {/* ================================================================ */}
          {activeTab === 'social' && (
            <SocialLinksSection
              configDraft={configDraft}
              isSiteConfigDirty={isSiteConfigDirty}
              savingSiteConfig={savingSiteConfig}
              onUpdateField={updateConfigField}
              onSaveSubmit={handleSaveConfigSubmit}
              onCancelChanges={handleCancelConfigChanges}
              onValidationError={(message) => setGlobalBanner({ type: 'error', message })}
            />
          )}

          {/* ================================================================ */}
          {/* SECTION 6: ADDRESSES, BRANCHES & GOOGLE MAPS                     */}
          {/* ================================================================ */}
          {activeTab === 'branches' && (
            <BranchesMapsSection
              configDraft={configDraft}
              isSiteConfigDirty={isSiteConfigDirty}
              savingSiteConfig={savingSiteConfig}
              onUpdateField={updateConfigField}
              onSaveSubmit={handleSaveConfigSubmit}
              onCancelChanges={handleCancelConfigChanges}
              onValidationError={(message) => setGlobalBanner({ type: 'error', message })}
            />
          )}

          {/* ================================================================ */}
          {/* SECTION 7: SITE IDENTITY & ABOUT US COPY                         */}
          {/* ================================================================ */}
          {activeTab === 'site-info' && (
            <SiteAndAboutSection
              configDraft={configDraft}
              isSiteConfigDirty={isSiteConfigDirty}
              savingSiteConfig={savingSiteConfig}
              onUpdateField={updateConfigField}
              onSaveSubmit={handleSaveConfigSubmit}
              onCancelChanges={handleCancelConfigChanges}
            />
          )}

          {activeTab === 'essential-products' && (
            <EssentialProductsSection
              configDraft={configDraft}
              isSiteConfigDirty={isSiteConfigDirty}
              savingSiteConfig={savingSiteConfig}
              onUpdateField={updateConfigField}
              onSaveSubmit={handleSaveConfigSubmit}
              onCancelChanges={handleCancelConfigChanges}
            />
          )}

          {/* ================================================================ */}
          {/* SECTION 8: CONTENT & SECTION VISIBILITY SETTINGS                 */}
          {/* ================================================================ */}
          {activeTab === 'sections' && (
            <ContentSectionsSettings
              configDraft={configDraft}
              isSiteConfigDirty={isSiteConfigDirty}
              savingSiteConfig={savingSiteConfig}
              onUpdateField={updateConfigField}
              onSaveSubmit={handleSaveConfigSubmit}
              onCancelChanges={handleCancelConfigChanges}
            />
          )}

          {activeTab === 'ratings' && (
            <RatingsSection
              siteConfig={configDraft}
              onSaveSiteConfig={async (updates) => {
                await onSaveSiteConfig(
                  sanitizeSiteConfig(
                    { ...configDraft, ...updates },
                    currentUser?.email || 'developer'
                  )
                );
              }}
            />
          )}

          {/* ================================================================ */}
          {/* SECTION 9: ACCOUNT SETTINGS & SESSION LOGOUT                     */}
          {/* ================================================================ */}
          {activeTab === 'account' && (
            <AccountSettingsSection
              currentUser={currentUser}
              siteConfig={siteConfig}
              onRefreshAuth={onRefreshAuth}
              onLogout={handleSecureLogout}
            />
          )}
        </main>
      </div>

      {/* ==================================================================== */}
      {/* MODALS: DISCOUNT MODAL, LIVE PREVIEW, & DELETE CONFIRMATIONS         */}
      {/* ==================================================================== */}

      <DiscountModal
        product={discountModalProduct}
        onClose={() => setDiscountModalProduct(null)}
        onSaveDiscount={async (productId, payload, successMessage) => {
          await onSaveProductDiscount(productId, payload);
          setGlobalBanner({ type: 'success', message: successMessage });
        }}
      />

      {/* Live Product Preview Modal Before Saving */}
      {previewProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="معاينة المنتج قبل الحفظ"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewProduct(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-[#141414] border border-[#D4AF37]/45 p-5 space-y-4 text-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-extrabold text-[#D4AF37]">معاينة المنتج قبل الحفظ</h3>
              <button
                type="button"
                onClick={() => setPreviewProduct(null)}
                aria-label="إغلاق المعاينة"
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="relative">
              {isDiscountActive(previewProduct) && (
                <span className="absolute top-3 right-3 z-20 rounded-lg bg-[#0F4C5C] border border-[#D4AF37]/60 px-2.5 py-1 text-xs font-extrabold text-white tabular-nums">
                  خصم{' '}
                  {calculateDiscountPercent(
                    previewProduct.originalPrice,
                    getEffectiveProductPrice(previewProduct)
                  )}
                  %
                </span>
              )}
              <ProductImage
                src={previewProduct.images[0]}
                alt={previewProduct.name}
                containerClassName="aspect-square w-full rounded-xl bg-[#0B0B0B] border border-[#D4AF37]/25 p-3"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-[#D4AF37]">
                {[previewProduct.brand, previewProduct.category].filter(Boolean).join(' · ')}
              </p>
              <h4 className="text-lg font-extrabold text-white">{previewProduct.name}</h4>
              {previewProduct.shortDescription && (
                <p className="text-xs text-gray-300 leading-relaxed">
                  {previewProduct.shortDescription}
                </p>
              )}
              <div className="flex flex-wrap items-baseline gap-2 pt-2 tabular-nums">
                <span className="text-xl font-extrabold text-[#D4AF37]">
                  {formatPriceEgp(getEffectiveProductPrice(previewProduct))} ج.م
                </span>
                {isDiscountActive(previewProduct) && (
                  <>
                    <span className="text-xs text-gray-500 line-through">
                      {formatPriceEgp(previewProduct.originalPrice)} ج.م
                    </span>
                    <span className="text-xs font-bold text-emerald-400">
                      (توفير{' '}
                      {formatPriceEgp(
                        calculateSavingsAmount(
                          previewProduct.originalPrice,
                          getEffectiveProductPrice(previewProduct)
                        )
                      )}{' '}
                      ج.م)
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-gray-400">
                الحالة: {previewProduct.isPublished ? 'ظاهر للزوار' : 'مخفي'} ·{' '}
                {previewProduct.inStock ? 'متوفر' : 'غير متوفر'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setPreviewProduct(null)}
              className="w-full min-h-[44px] rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] border border-[#D4AF37]/60 text-xs font-extrabold text-white cursor-pointer"
            >
              إغلاق المعاينة ومتابعة الحفظ
            </button>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Dialog */}
      {confirmDeleteProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-del-prod-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#141414] border border-[#0F4C5C] p-6 space-y-4 text-gray-100">
            <h3 id="confirm-del-prod-title" className="text-base sm:text-lg font-extrabold text-white">
              تأكيد حذف المنتج نهائيًا
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              هل أنت متأكد من حذف المنتج{' '}
              <strong className="text-[#D4AF37]">«{confirmDeleteProduct.name}»</strong>؟ سيتم إزالته
              فورًا من قاعدة البيانات السحابية ومن واجهة المتجر لجميع الزوار.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                disabled={deletingProduct}
                onClick={() => setConfirmDeleteProduct(null)}
                className="min-h-[42px] rounded-xl bg-[#1E1E1E] border border-white/15 px-4 py-2 text-xs font-bold text-gray-300 cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                disabled={deletingProduct}
                onClick={handleConfirmDeleteProduct}
                className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] px-5 py-2 text-xs font-extrabold text-white cursor-pointer disabled:opacity-50"
              >
                {deletingProduct && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                <span>نعم، حذف المنتج</span>
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer
        showVisitorCounter={true}
        isDark={true}
        onNavigateAbout={async () => {
          await handleSecureLogout();
          if (typeof window !== 'undefined') window.location.hash = '#about';
        }}
      />
    </div>
  );
}
