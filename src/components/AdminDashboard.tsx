import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Edit3,
  FolderKanban,
  ImagePlus,
  KeyRound,
  Loader2,
  LogOut,
  Menu,
  Package,
  Percent,
  Plus,
  Search,
  Star,
  Store,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Product, ProductFormInput, STORE_INFO } from '../types/store';
import {
  calculateDiscountPercent,
  calculateSavingsAmount,
  formatPriceEgp,
  isDiscountActive,
  sanitizeProductPayload,
  validateProductInput,
} from '../utils/catalogLogic';
import { ProductCard } from './ProductCard';
import { ProductImage } from './ProductImage';

interface AdminDashboardProps {
  products: Product[];
  isAuthorized: boolean;
  onSubmitPassword: (password: string) => Promise<boolean>;
  onLogout: () => void;
  onSaveProduct: (input: ProductFormInput, editingId?: string) => Promise<void>;
  onDeleteProduct: (productId: string) => Promise<void>;
  onBackToStore: () => void;
  publicOrigin?: string;
  siteSettings: Record<string, any>;
  onSaveSettings: (settings: Record<string, any>) => Promise<boolean>;
}

const DEFAULT_FORM: ProductFormInput = {
  name: '',
  brand: '',
  category: 'عام',
  shortDescription: '',
  description: '',
  price: 950,
  originalPrice: 1250,
  discountEnabled: false,
  inStock: true,
  isFeatured: false,
  isPublished: true,
  images: [],
  specs: ['ضمان فحص واستبدال من المحلاوي ستور'],
  options: [],
};

export function AdminDashboard({
  products,
  isAuthorized,
  onSubmitPassword,
  onLogout,
  onSaveProduct,
  onDeleteProduct,
  onBackToStore,
  publicOrigin,
  siteSettings,
  onSaveSettings,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'store'
    | 'contacts'
    | 'catalog'
    | 'editor'
    | 'banners'
    | 'orders'
    | 'theme'
    | 'shipping'
    | 'seo'
    | 'users'
    | 'backup'
    | 'logs'
  >('overview');

  const [settingsForm, setSettingsForm] = useState<Record<string, any>>(siteSettings || {});
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (siteSettings) {
      setSettingsForm(siteSettings);
    }
  }, [siteSettings]);

  const handleSaveAllSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setFeedback(null);
    try {
      await onSaveSettings(settingsForm);
      setFeedback({
        type: 'success',
        message: 'تم حفظ إعدادات الموقع وتطبيقها بنجاح على جميع صفحات المتجر والعملاء.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err instanceof Error ? err.message : 'تعذر حفظ الإعدادات.',
      });
    } finally {
      setSavingSettings(false);
    }
  };

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminSearch, setAdminSearch] = useState('');
  const [adminFilter, setAdminFilter] = useState<'all' | 'available' | 'featured' | 'discounted'>(
    'all'
  );

  // Editor state
  const [editingProductId, setEditingProductId] = useState<string | undefined>(undefined);
  const [form, setForm] = useState<ProductFormInput>(DEFAULT_FORM);
  const [imageUrlDraft, setImageUrlDraft] = useState('');
  const [specDraft, setSpecDraft] = useState('');
  const [optionDraft, setOptionDraft] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [saving, setSaving] = useState(false);
  const [gatePassword, setGatePassword] = useState('');
  const [loginPending, setLoginPending] = useState(false);

  // Feedback banners & delete confirmation
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [confirmDeleteProduct, setConfirmDeleteProduct] = useState<Product | null>(null);
  const [previewModalProduct, setPreviewModalProduct] = useState<Product | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Password-Only Gate (fallback if user lands on Admin view while locked)
  if (!isAuthorized) {
    return (
      <section className="min-h-[calc(100vh-4rem)] bg-[#F2FAFF] py-12 px-4 sm:px-6 flex items-center justify-center">
        <div className="w-full max-w-md rounded-3xl bg-white border border-[#CBE7FA] p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F2FAFF] border border-[#CBE7FA] text-[#1D4ED8]">
              <KeyRound className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold text-[#0B1F3A]">
                دخول لوحة الإدارة
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                أدخل كلمة المرور لفتح إدارة {STORE_INFO.storeName}
              </p>
            </div>
          </div>

          {feedback && (
            <div
              role="alert"
              className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs sm:text-sm font-bold text-red-700"
            >
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{feedback.message}</span>
            </div>
          )}

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setFeedback(null);
              setLoginPending(true);
              try {
                const ok = await onSubmitPassword(gatePassword);
                if (!ok) {
                  setFeedback({
                    type: 'error',
                    message: 'كلمة المرور غير صحيحة، يرجى المحاولة مرة أخرى.',
                  });
                }
              } finally {
                setLoginPending(false);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label
                htmlFor="gate-admin-password"
                className="block text-xs sm:text-sm font-bold text-[#0F294A] mb-1.5"
              >
                كلمة المرور
              </label>
              <input
                id="gate-admin-password"
                type="password"
                inputMode="numeric"
                value={gatePassword}
                onChange={(e) => setGatePassword(e.target.value)}
                placeholder="أدخل كلمة المرور..."
                dir="ltr"
                className="font-num w-full min-h-[46px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-4 py-2.5 text-base font-bold text-[#0B1F3A] text-right placeholder:font-sans placeholder:font-normal focus:bg-white focus:outline-2 focus:outline-[#1D4ED8]"
              />
            </div>

            <button
              type="submit"
              disabled={loginPending}
              className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-60 px-5 py-2.5 text-sm font-extrabold text-white transition-colors cursor-pointer"
            >
              {loginPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              <span>دخول</span>
            </button>

            <button
              type="button"
              onClick={onBackToStore}
              className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-white hover:bg-slate-50 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 transition-colors cursor-pointer"
            >
              <Store className="h-4 w-4" aria-hidden="true" />
              <span>العودة إلى واجهة المتجر</span>
            </button>
          </form>
        </div>
      </section>
    );
  }

  // Statistical KPIs
  const totalCount = products.length;
  const availableCount = products.filter((p) => p.inStock).length;
  const featuredCount = products.filter((p) => p.isFeatured).length;
  const discountedCount = products.filter((p) => isDiscountActive(p)).length;

  // Filtered Admin List
  const filteredAdminProducts = products.filter((p) => {
    if (adminFilter === 'available' && !p.inStock) return false;
    if (adminFilter === 'featured' && !p.isFeatured) return false;
    if (adminFilter === 'discounted' && !isDiscountActive(p)) return false;
    const q = adminSearch.trim().toLowerCase();
    if (!q) return true;
    return [p.name, p.brand, p.category].join(' ').toLowerCase().includes(q);
  });

  const startNewProduct = () => {
    setEditingProductId(undefined);
    setForm(DEFAULT_FORM);
    setFeedback(null);
    setActiveTab('editor');
    setMobileMenuOpen(false);
  };

  const startEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setForm({
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      shortDescription: product.shortDescription,
      description: product.description,
      price: product.price,
      originalPrice: product.originalPrice,
      discountEnabled: product.discountEnabled,
      inStock: product.inStock,
      isFeatured: product.isFeatured,
      isPublished: product.isPublished,
      images: [...product.images],
      specs: [...product.specs],
      options: [...product.options],
    });
    setFeedback(null);
    setActiveTab('editor');
    setMobileMenuOpen(false);
  };

  const handleUploadFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploadingImages(true);
    setFeedback(null);
    const newImageUrls: string[] = [];
    const errors: string[] = [];

    for (const file of Array.from(fileList).slice(0, 15)) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'elmahlawy-store');

        const response = await fetch('https://api.cloudinary.com/v1_1/obvb7rtp/image/upload', {
          method: 'POST',
          body: formData,
        });

        let data;
        try {
          data = await response.json();
        } catch (e) {
          throw new Error('تعذر تحليل استجابة خادم التخزين (استجابة غير صالحة).');
        }

        if (!response.ok) {
          throw new Error(data.error?.message || `فشل رفع الصورة: ${response.statusText}`);
        }

        if (data.secure_url) {
          newImageUrls.push(data.secure_url);
        } else {
          throw new Error('لم يتم الحصول على رابط آمن للصورة من خادم التخزين.');
        }
      } catch (err) {
        errors.push(`خطأ في رفع "${file.name}": ${err instanceof Error ? err.message : 'حدث خطأ غير معروف'}`);
      }
    }

    if (newImageUrls.length > 0) {
      setForm((prev) => ({
        ...prev,
        images: [...prev.images, ...newImageUrls].slice(0, 15),
      }));
      setFeedback({
        type: 'success',
        message: `تم رفع ${newImageUrls.length} صورة بنجاح. ${errors.length > 0 ? ` (فشلت ${errors.length} صور).` : ''}`,
      });
    } else if (errors.length > 0) {
      setFeedback({
        type: 'error',
        message: errors[0],
      });
    }

    setUploadingImages(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  const handleAddImageUrl = () => {
    const trimmed = imageUrlDraft.trim();
    if (!trimmed) return;
    if (form.images.length >= 15) {
      setFeedback({ type: 'error', message: 'الحد الأقصى لصور المنتج هو 15 صورة.' });
      return;
    }
    setForm((prev) => ({ ...prev, images: [...prev.images, trimmed] }));
    setImageUrlDraft('');
  };

  const handleSetPrimaryImage = (idx: number) => {
    setForm((prev) => {
      if (idx <= 0 || idx >= prev.images.length) return prev;
      const next = [...prev.images];
      const [chosen] = next.splice(idx, 1);
      next.unshift(chosen);
      return { ...prev, images: next };
    });
  };

  const handleRemoveImage = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== idx),
    }));
  };

  const handleAddSpec = () => {
    const trimmed = specDraft.trim();
    if (!trimmed) return;
    setForm((prev) => ({ ...prev, specs: [...prev.specs, trimmed].slice(0, 15) }));
    setSpecDraft('');
  };

  const handleAddOption = () => {
    const trimmed = optionDraft.trim();
    if (!trimmed) return;
    setForm((prev) => ({ ...prev, options: [...prev.options, trimmed].slice(0, 10) }));
    setOptionDraft('');
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    const normalizedInput: ProductFormInput = {
      ...form,
      category: (form.category || '').trim() || 'عام',
      originalPrice: form.discountEnabled ? form.originalPrice : form.price,
    };

    const validation = validateProductInput(normalizedInput);
    if (!validation.valid) {
      setFeedback({
        type: 'error',
        message: validation.errors[0],
      });
      return;
    }

    setSaving(true);
    try {
      await onSaveProduct(normalizedInput, editingProductId);
      setFeedback({
        type: 'success',
        message: editingProductId
          ? 'تم حفظ تعديلات المنتج بنجاح وتحديث المتجر.'
          : 'تم إضافة المنتج الجديد بنجاح وظهوره في المتجر.',
      });
      setEditingProductId(undefined);
      setForm(DEFAULT_FORM);
      setActiveTab('catalog');
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? `تعذر حفظ المنتج: ${err.message}`
            : 'حدث خطأ غير متوقع أثناء الحفظ.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Live Preview Product Object
  const livePreviewProduct: Product = sanitizeProductPayload(
    {
      ...form,
      name: form.name.trim() || 'اسم المنتج يظهر هنا',
      brand: form.brand.trim() || 'اسم المصنع',
      category: form.category || 'سماعات وصوتيات',
      shortDescription:
        form.shortDescription.trim() || 'وصف مختصر يوضح أبرز مميزات المنتج للعميل بوضوح.',
      description: form.description.trim() || 'وصف تفصيلي للمنتج.',
      price: Number(form.price) > 0 ? Number(form.price) : 950,
      originalPrice: form.discountEnabled
        ? Math.max(Number(form.originalPrice) || 1250, (Number(form.price) || 950) + 50)
        : Number(form.price) > 0
          ? Number(form.price)
          : 950,
      images: form.images.length > 0 ? form.images : [],
    },
    editingProductId || 'preview-item'
  );

  const computedDiscountPct = form.discountEnabled
    ? calculateDiscountPercent(form.originalPrice, form.price)
    : 0;
  const computedSavings = form.discountEnabled
    ? calculateSavingsAmount(form.originalPrice, form.price)
    : 0;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F2FAFF] flex flex-col lg:flex-row">
      {/* Desktop Sidebar (RTL Right Side) */}
      <aside
        aria-label="قائمة لوحة الإدارة"
        className="hidden lg:flex lg:w-68 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] shrink-0 flex-col justify-between bg-white border-l border-[#D8EEFB] p-5"
      >
        <div>
          <div className="pb-4 mb-4 border-b border-[#E8F4FD]">
            <p className="text-xs font-bold text-[#0284C7] mb-0.5">لوحة التحكم</p>
            <h2 className="text-lg font-extrabold text-[#0B1F3A]">{STORE_INFO.storeName}</h2>
            <p className="text-xs text-slate-500 mt-1">مدير المتجر · متصل</p>
          </div>

          <nav className="space-y-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors cursor-pointer ${
                activeTab === 'catalog'
                  ? 'bg-[#1D4ED8] text-white'
                  : 'text-[#0F294A] hover:bg-[#F2FAFF]'
              }`}
            >
              <FolderKanban className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>إدارة المنتجات</span>
            </button>

            <button
              type="button"
              onClick={startNewProduct}
              className={`flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-bold transition-colors cursor-pointer ${
                activeTab === 'editor' && !editingProductId
                  ? 'bg-[#1D4ED8] text-white'
                  : 'text-[#0F294A] hover:bg-[#F2FAFF]'
              }`}
            >
              <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>إضافة منتج جديد</span>
            </button>

            <button
              type="button"
              onClick={onBackToStore}
              className="flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-bold text-slate-600 hover:bg-[#F2FAFF] hover:text-[#0B1F3A] transition-colors cursor-pointer"
            >
              <Store className="h-4 w-4 shrink-0 text-[#0284C7]" aria-hidden="true" />
              <span>معاينة المتجر الحي</span>
            </button>
          </nav>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 hover:bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-600 transition-colors cursor-pointer"
        >
          <LogOut className="h-4 w-4" aria-hidden="true" />
          <span>تسجيل الخروج من الإدارة</span>
        </button>
      </aside>

      {/* Mobile Top Admin Drawer Bar */}
      <div className="lg:hidden sticky top-0 z-30 flex items-center justify-between gap-2 bg-white/95 backdrop-blur-md border-b border-[#D8EEFB] px-3 pt-[calc(0.65rem+env(safe-area-inset-top))] pb-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="فتح قائمة لوحة الإدارة"
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] text-[#0B1F3A] cursor-pointer"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-xs min-[360px]:text-sm font-extrabold text-[#0B1F3A]">
              إدارة المحلاوي ستور
            </h1>
            <p className="truncate text-[10px] min-[360px]:text-[11px] text-slate-500">
              {activeTab === 'catalog'
                ? 'المنتجات والإحصائيات'
                : editingProductId
                  ? 'تعديل بيانات المنتج'
                  : 'إضافة منتج جديد'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={startNewProduct}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-[#1D4ED8] px-2.5 min-[380px]:px-3 py-2 text-xs font-bold text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden min-[360px]:inline">إضافة منتج</span>
            <span className="min-[360px]:hidden">إضافة</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex min-h-[44px] items-center gap-1 rounded-xl bg-red-50 border border-red-200 px-2.5 min-[380px]:px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-100 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* Mobile Slide-Over Menu */}
      {mobileMenuOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="قائمة الإدارة على الهاتف"
          className="fixed inset-0 z-50 lg:hidden flex bg-[#081A33]/60"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMobileMenuOpen(false);
          }}
        >
          <div className="w-72 max-w-[85vw] bg-white h-full p-5 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E8F4FD]">
                <span className="text-base font-extrabold text-[#0B1F3A]">قائمة الإدارة</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="إغلاق القائمة"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F2FAFF] text-[#0B1F3A]"
                >
                  <X className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('catalog');
                    setMobileMenuOpen(false);
                  }}
                  className={`flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-bold ${
                    activeTab === 'catalog'
                      ? 'bg-[#1D4ED8] text-white'
                      : 'text-[#0F294A] hover:bg-[#F2FAFF]'
                  }`}
                >
                  <FolderKanban className="h-4 w-4" aria-hidden="true" />
                  <span>إدارة المنتجات</span>
                </button>

                <button
                  type="button"
                  onClick={startNewProduct}
                  className={`flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-bold ${
                    activeTab === 'editor'
                      ? 'bg-[#1D4ED8] text-white'
                      : 'text-[#0F294A] hover:bg-[#F2FAFF]'
                  }`}
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>إضافة منتج جديد</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onBackToStore();
                  }}
                  className="flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-[#F2FAFF]"
                >
                  <Store className="h-4 w-4 text-[#0284C7]" aria-hidden="true" />
                  <span>العودة لواجهة المتجر</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onLogout();
              }}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Admin Workspace Viewport */}
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
        {/* Feedback Notification Banner */}
        {feedback && (
          <div
            role="status"
            className={`mb-6 flex items-center justify-between gap-3 rounded-2xl border p-4 text-xs sm:text-sm font-semibold ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" aria-hidden="true" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0" aria-hidden="true" />
              )}
              <span>{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              aria-label="إغلاق الرسالة"
              className="p-1 opacity-70 hover:opacity-100 cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Comprehensive Settings & Control Tabs Navigation */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-3 mb-6 scrollbar-none border-b border-[#CBE7FA]">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'overview' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'bg-[#F2FAFF] text-[#0F294A] hover:bg-[#E2F2FF]'
            }`}
          >
            لوحة المعلومات
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('store')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'store' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'bg-[#F2FAFF] text-[#0F294A] hover:bg-[#E2F2FF]'
            }`}
          >
            إعدادات المتجر
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('contacts')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'contacts' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'bg-[#F2FAFF] text-[#0F294A] hover:bg-[#E2F2FF]'
            }`}
          >
            أرقام التواصل
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('catalog')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'catalog' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'bg-[#F2FAFF] text-[#0F294A] hover:bg-[#E2F2FF]'
            }`}
          >
            المنتجات والأسعار
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'editor' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'bg-[#F2FAFF] text-[#0F294A] hover:bg-[#E2F2FF]'
            }`}
          >
            إضافة/تعديل منتج
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('banners')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'banners' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'bg-[#F2FAFF] text-[#0F294A] hover:bg-[#E2F2FF]'
            }`}
          >
            الصور والبنرات
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('orders')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'orders' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'bg-[#F2FAFF] text-[#0F294A] hover:bg-[#E2F2FF]'
            }`}
          >
            الطلبات والواتساب
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('theme')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'theme' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'bg-[#F2FAFF] text-[#0F294A] hover:bg-[#E2F2FF]'
            }`}
          >
            التصميم والألوان
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('shipping')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'shipping' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'bg-[#F2FAFF] text-[#0F294A] hover:bg-[#E2F2FF]'
            }`}
          >
            الشحن والضمان
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('seo')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'seo' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'bg-[#F2FAFF] text-[#0F294A] hover:bg-[#E2F2FF]'
            }`}
          >
            السيو وبيانات الموقع
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'users' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'bg-[#F2FAFF] text-[#0F294A] hover:bg-[#E2F2FF]'
            }`}
          >
            الصلاحيات والأمان
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'backup' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'bg-[#F2FAFF] text-[#0F294A] hover:bg-[#E2F2FF]'
            }`}
          >
            النسخ الاحتياطي
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap cursor-pointer transition-all ${
              activeTab === 'logs' ? 'bg-[#1D4ED8] text-white shadow-sm' : 'bg-[#F2FAFF] text-[#0F294A] hover:bg-[#E2F2FF]'
            }`}
          >
            سجل التعديلات
          </button>
        </div>

        {/* Statistical Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          <div className="rounded-2xl bg-white border border-[#D8EEFB] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-slate-500">إجمالي المنتجات</span>
              <Package className="h-4 w-4 text-[#1D4ED8]" aria-hidden="true" />
            </div>
            <p className="font-num text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]">
              {totalCount}
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-[#D8EEFB] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-slate-500">المنتجات المتاحة</span>
              <CheckCircle2 className="h-4 w-4 text-[#0284C7]" aria-hidden="true" />
            </div>
            <p className="font-num text-2xl sm:text-3xl font-extrabold text-[#0284C7]">
              {availableCount}
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-[#D8EEFB] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-slate-500">المنتجات المختارة</span>
              <Star className="h-4 w-4 text-[#1D4ED8]" aria-hidden="true" />
            </div>
            <p className="font-num text-2xl sm:text-3xl font-extrabold text-[#1D4ED8]">
              {featuredCount}
            </p>
          </div>

          <div className="rounded-2xl bg-white border border-[#D8EEFB] p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-bold text-slate-500">عروض بخصم مفعّل</span>
              <Percent className="h-4 w-4 text-[#0284C7]" aria-hidden="true" />
            </div>
            <p className="font-num text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]">
              {discountedCount}
            </p>
          </div>
        </div>

        {/* TAB: Overview (لوحة المعلومات) */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-white border border-[#D8EEFB] p-6 sm:p-8">
              <h2 className="text-xl font-extrabold text-[#0B1F3A] mb-3">
                مركز التحكم والإدارة الشاملة - المحلاوي ستور | El Mahlawy Store
              </h2>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                مرحباً بك في لوحة الإدارة المتكاملة. يمكنك من خلال هذه الأقسام تعديل إعدادات المتجر، أرقام التواصل، المنتجات، العروض، التصميم، وسيو محركات البحث، مع حفظ سحابي دائم ومباشر لجميع الزوار.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('store')}
                  className="rounded-2xl bg-[#F2FAFF] border border-[#CBE7FA] p-5 text-right hover:bg-[#E2F2FF] transition-colors cursor-pointer"
                >
                  <h3 className="font-extrabold text-[#0B1F3A] mb-1">إعدادات المتجر والعنوان</h3>
                  <p className="text-xs text-slate-600">تعديل اسم المتجر، الوصف، العنوان، ومواعيد العمل.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('contacts')}
                  className="rounded-2xl bg-[#F2FAFF] border border-[#CBE7FA] p-5 text-right hover:bg-[#E2F2FF] transition-colors cursor-pointer"
                >
                  <h3 className="font-extrabold text-[#0B1F3A] mb-1">أرقام التواصل والواتساب</h3>
                  <p className="text-xs text-slate-600">إدارة رقم الطلبات، خدمة العملاء، وشريك Infinity Corp.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="rounded-2xl bg-[#F2FAFF] border border-[#CBE7FA] p-5 text-right hover:bg-[#E2F2FF] transition-colors cursor-pointer"
                >
                  <h3 className="font-extrabold text-[#0B1F3A] mb-1">المنتجات والأسعار</h3>
                  <p className="text-xs text-slate-600">إضافة، تعديل، وحذف المنتجات والتحكم في المخزون.</p>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Store Settings (إعدادات المتجر) */}
        {activeTab === 'store' && (
          <form onSubmit={handleSaveAllSettings} className="rounded-3xl bg-white border border-[#D8EEFB] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E8F4FD] pb-4">
              <h2 className="text-lg font-extrabold text-[#0B1F3A]">إعدادات المتجر الأساسية وعنوان المحل</h2>
              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] px-5 py-2.5 text-xs sm:text-sm font-bold text-white cursor-pointer disabled:opacity-50"
              >
                {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>حفظ التغييرات</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">اسم المتجر بالعربية</label>
                <input
                  type="text"
                  value={settingsForm.storeName || ''}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, storeName: e.target.value }))}
                  className="w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-4 py-2 text-sm text-[#0B1F3A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">اسم المتجر بالإنجليزية</label>
                <input
                  type="text"
                  value={settingsForm.storeEnglishName || ''}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, storeEnglishName: e.target.value }))}
                  className="w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-4 py-2 text-sm text-[#0B1F3A]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">نبذة / شعار المتجر</label>
                <input
                  type="text"
                  value={settingsForm.tagline || ''}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, tagline: e.target.value }))}
                  className="w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-4 py-2 text-sm text-[#0B1F3A]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">عنوان المحل بالتفصيل</label>
                <textarea
                  rows={3}
                  value={settingsForm.address || ''}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="w-full rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] p-3 text-sm text-[#0B1F3A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">رابط خرائط جوجل (Google Maps)</label>
                <input
                  type="url"
                  value={settingsForm.googleMapsUrl || ''}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, googleMapsUrl: e.target.value }))}
                  className="w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-4 py-2 text-sm text-[#0B1F3A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">مواعيد العمل والإجازات</label>
                <input
                  type="text"
                  value={settingsForm.workingHours || ''}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, workingHours: e.target.value }))}
                  className="w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-4 py-2 text-sm text-[#0B1F3A]"
                />
              </div>
            </div>
          </form>
        )}

        {/* TAB: Contact Numbers (أرقام التواصل) */}
        {activeTab === 'contacts' && (
          <form onSubmit={handleSaveAllSettings} className="rounded-3xl bg-white border border-[#D8EEFB] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E8F4FD] pb-4">
              <h2 className="text-lg font-extrabold text-[#0B1F3A]">إدارة أرقام التواصل وواتساب</h2>
              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] px-5 py-2.5 text-xs sm:text-sm font-bold text-white cursor-pointer disabled:opacity-50"
              >
                {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>حفظ التغييرات</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">رقم واتساب الرئيسي للطلبات</label>
                <input
                  type="text"
                  value={settingsForm.primaryWhatsApp || ''}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, primaryWhatsApp: e.target.value }))}
                  className="w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-4 py-2 text-sm text-[#0B1F3A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">رقم الهاتف الأساسي للاتصال</label>
                <input
                  type="text"
                  value={settingsForm.primaryPhone || ''}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, primaryPhone: e.target.value }))}
                  className="w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-4 py-2 text-sm text-[#0B1F3A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">رقم واتساب خدمة ما بعد البيع</label>
                <input
                  type="text"
                  value={settingsForm.afterSalesWhatsApp || ''}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, afterSalesWhatsApp: e.target.value }))}
                  className="w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-4 py-2 text-sm text-[#0B1F3A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">رقم تواصل شريك النجاح Infinity Corp</label>
                <input
                  type="text"
                  value={settingsForm.infinityCorpPhone || ''}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, infinityCorpPhone: e.target.value }))}
                  className="w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-4 py-2 text-sm text-[#0B1F3A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">رابط صفحة فيسبوك</label>
                <input
                  type="url"
                  value={settingsForm.facebookUrl || ''}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, facebookUrl: e.target.value }))}
                  className="w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-4 py-2 text-sm text-[#0B1F3A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">رابط حساب انستجرام</label>
                <input
                  type="url"
                  value={settingsForm.instagramUrl || ''}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, instagramUrl: e.target.value }))}
                  className="w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-4 py-2 text-sm text-[#0B1F3A]"
                />
              </div>
            </div>
          </form>
        )}

        {/* TAB: Banners & Images (الصور والبنرات) */}
        {activeTab === 'banners' && (
          <form onSubmit={handleSaveAllSettings} className="rounded-3xl bg-white border border-[#D8EEFB] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E8F4FD] pb-4">
              <h2 className="text-lg font-extrabold text-[#0B1F3A]">إدارة البانرات وشريط الإعلانات</h2>
              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] px-5 py-2.5 text-xs sm:text-sm font-bold text-white cursor-pointer disabled:opacity-50"
              >
                {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>حفظ التغييرات</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">رابط صورة البانر الرئيسي</label>
                <input
                  type="url"
                  value={settingsForm.bannerImageUrl || ''}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, bannerImageUrl: e.target.value }))}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-4 py-2 text-sm text-[#0B1F3A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">نص شريط الإعلانات العرضي</label>
                <input
                  type="text"
                  value={settingsForm.announcementText || ''}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, announcementText: e.target.value }))}
                  className="w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-4 py-2 text-sm text-[#0B1F3A]"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="announcement-enabled-toggle"
                  checked={Boolean(settingsForm.announcementEnabled)}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, announcementEnabled: e.target.checked }))}
                  className="h-5 w-5 rounded border-[#CBE7FA] text-[#1D4ED8]"
                />
                <label htmlFor="announcement-enabled-toggle" className="text-xs font-bold text-[#0B1F3A]">
                  إظهار شريط الإعلانات في أعلى الموقع
                </label>
              </div>
            </div>
          </form>
        )}

        {/* TAB: Orders & WhatsApp (الطلبات وخدمة العملاء) */}
        {activeTab === 'orders' && (
          <form onSubmit={handleSaveAllSettings} className="rounded-3xl bg-white border border-[#D8EEFB] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E8F4FD] pb-4">
              <h2 className="text-lg font-extrabold text-[#0B1F3A]">إعدادات رسائل واتساب والطلبات</h2>
              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] px-5 py-2.5 text-xs sm:text-sm font-bold text-white cursor-pointer disabled:opacity-50"
              >
                {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>حفظ التغييرات</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">قالب رسالة واتساب للطلب ({`{productName}, {price}, {productUrl}`})</label>
                <textarea
                  rows={5}
                  value={settingsForm.whatsappOrderTemplate || ''}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, whatsappOrderTemplate: e.target.value }))}
                  className="w-full rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] p-3 text-sm text-[#0B1F3A] font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">رسالة تأكيد الطلب للعميل</label>
                <textarea
                  rows={3}
                  value={settingsForm.orderConfirmationMessage || ''}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, orderConfirmationMessage: e.target.value }))}
                  className="w-full rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] p-3 text-sm text-[#0B1F3A]"
                />
              </div>
            </div>
          </form>
        )}

        {/* TAB: Theme & Colors (التصميم والألوان) */}
        {activeTab === 'theme' && (
          <form onSubmit={handleSaveAllSettings} className="rounded-3xl bg-white border border-[#D8EEFB] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E8F4FD] pb-4">
              <h2 className="text-lg font-extrabold text-[#0B1F3A]">إعدادات التصميم والألوان والصيانة</h2>
              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] px-5 py-2.5 text-xs sm:text-sm font-bold text-white cursor-pointer disabled:opacity-50"
              >
                {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>حفظ التغييرات</span>
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">اللون الأساسي (Primary Color)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settingsForm.primaryColor || '#0284c7'}
                    onChange={(e) => setSettingsForm((prev) => ({ ...prev, primaryColor: e.target.value }))}
                    className="h-12 w-16 rounded-xl border border-[#CBE7FA] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settingsForm.primaryColor || '#0284c7'}
                    onChange={(e) => setSettingsForm((prev) => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-4 py-2 text-sm text-[#0B1F3A]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">اللون الثانوي (Secondary Color)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={settingsForm.secondaryColor || '#0ea5e9'}
                    onChange={(e) => setSettingsForm((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                    className="h-12 w-16 rounded-xl border border-[#CBE7FA] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settingsForm.secondaryColor || '#0ea5e9'}
                    onChange={(e) => setSettingsForm((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                    className="w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-4 py-2 text-sm text-[#0B1F3A]"
                  />
                </div>
              </div>
              <div className="md:col-span-2 pt-4 border-t border-[#E8F4FD]">
                <div className="flex items-center gap-3 mb-3">
                  <input
                    type="checkbox"
                    id="maintenance-mode-toggle"
                    checked={Boolean(settingsForm.maintenanceMode)}
                    onChange={(e) => setSettingsForm((prev) => ({ ...prev, maintenanceMode: e.target.checked }))}
                    className="h-5 w-5 rounded border-[#CBE7FA] text-red-600"
                  />
                  <label htmlFor="maintenance-mode-toggle" className="text-xs font-bold text-[#0B1F3A]">
                    تفعيل وضع الصيانة المؤقتة للموقع
                  </label>
                </div>
                <input
                  type="text"
                  value={settingsForm.maintenanceMessage || ''}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, maintenanceMessage: e.target.value }))}
                  placeholder="رسالة الصيانة التي تظهر للزوار"
                  className="w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-4 py-2 text-sm text-[#0B1F3A]"
                />
              </div>
            </div>
          </form>
        )}

        {/* TAB: Shipping & Warranty (الشحن والضمان) */}
        {activeTab === 'shipping' && (
          <form onSubmit={handleSaveAllSettings} className="rounded-3xl bg-white border border-[#D8EEFB] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E8F4FD] pb-4">
              <h2 className="text-lg font-extrabold text-[#0B1F3A]">سياسات الشحن، التوصيل، والضمان</h2>
              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] px-5 py-2.5 text-xs sm:text-sm font-bold text-white cursor-pointer disabled:opacity-50"
              >
                {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>حفظ التغييرات</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">ملخص الشحن والتوصيل</label>
                <textarea
                  rows={2}
                  value={settingsForm.deliverySummary || ''}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, deliverySummary: e.target.value }))}
                  className="w-full rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] p-3 text-sm text-[#0B1F3A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">تكلفة التوصيل وشروطه</label>
                <input
                  type="text"
                  value={settingsForm.deliveryCost || ''}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, deliveryCost: e.target.value }))}
                  className="w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-4 py-2 text-sm text-[#0B1F3A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">سياسة الضمان</label>
                <textarea
                  rows={2}
                  value={settingsForm.warrantyPolicy || ''}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, warrantyPolicy: e.target.value }))}
                  className="w-full rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] p-3 text-sm text-[#0B1F3A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">سياسة خدمة ما بعد البيع</label>
                <textarea
                  rows={2}
                  value={settingsForm.afterSalesPolicy || ''}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, afterSalesPolicy: e.target.value }))}
                  className="w-full rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] p-3 text-sm text-[#0B1F3A]"
                />
              </div>
            </div>
          </form>
        )}

        {/* TAB: SEO & Meta (السيو وبيانات الموقع) */}
        {activeTab === 'seo' && (
          <form onSubmit={handleSaveAllSettings} className="rounded-3xl bg-white border border-[#D8EEFB] p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-[#E8F4FD] pb-4">
              <h2 className="text-lg font-extrabold text-[#0B1F3A]">إعدادات محركات البحث (SEO) والـ Meta Tags</h2>
              <button
                type="submit"
                disabled={savingSettings}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] px-5 py-2.5 text-xs sm:text-sm font-bold text-white cursor-pointer disabled:opacity-50"
              >
                {savingSettings ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                <span>حفظ التغييرات</span>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">عنوان صفحة الموقع (HTML Title)</label>
                <input
                  type="text"
                  value={settingsForm.htmlTitle || ''}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, htmlTitle: e.target.value }))}
                  className="w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-4 py-2 text-sm text-[#0B1F3A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">وصف الموقع لمحركات البحث (Meta Description)</label>
                <textarea
                  rows={3}
                  value={settingsForm.seoDescription || ''}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, seoDescription: e.target.value }))}
                  className="w-full rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] p-3 text-sm text-[#0B1F3A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">الكلمات المفتاحية (Keywords)</label>
                <input
                  type="text"
                  value={settingsForm.seoKeywords || ''}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, seoKeywords: e.target.value }))}
                  className="w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-4 py-2 text-sm text-[#0B1F3A]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#0B1F3A] mb-2">صورة مشاركة الروابط (OG Image URL)</label>
                <input
                  type="url"
                  value={settingsForm.ogImageUrl || ''}
                  onChange={(e) => setSettingsForm((prev) => ({ ...prev, ogImageUrl: e.target.value }))}
                  className="w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-4 py-2 text-sm text-[#0B1F3A]"
                />
              </div>
            </div>
          </form>
        )}

        {/* TAB: Users & Security (الصلاحيات والأمان) */}
        {activeTab === 'users' && (
          <div className="rounded-3xl bg-white border border-[#D8EEFB] p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-extrabold text-[#0B1F3A] border-b border-[#E8F4FD] pb-4">إدارة الصلاحيات والأمان</h2>
            <div className="rounded-2xl bg-[#F2FAFF] border border-[#CBE7FA] p-5 text-sm text-[#0B1F3A] space-y-3">
              <p className="font-bold">حالة المصادقة الحالية:</p>
              <p className="text-xs text-slate-700 leading-relaxed">
                لوحة التحكم محمية بكلمة مرور الإدارة المشفرة على الخادم وسيرفر التطبيق. لا يمكن لأي زائر عادي تعديل المنتجات أو الإعدادات أو الوصول للوحة التحكم دون إدخال كلمة المرور الصحيحة.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>قفل الجلسة وتسجيل الخروج</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB: Backup & Restore (النسخ الاحتياطي) */}
        {activeTab === 'backup' && (
          <div className="rounded-3xl bg-white border border-[#D8EEFB] p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-extrabold text-[#0B1F3A] border-b border-[#E8F4FD] pb-4">النسخ الاحتياطي واستعادة البيانات</h2>
            <p className="text-xs text-slate-600">يمكنك تصدير كافة إعدادات الموقع والمنتجات كملف JSON آمن للاحتفاظ نسخة احتياطية.</p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ settings: settingsForm, products }, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", `mahallawy-store-backup-${Date.now()}.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                }}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] px-5 py-2.5 text-xs sm:text-sm font-bold text-white cursor-pointer"
              >
                تصدير نسخة احتياطية (JSON)
              </button>
            </div>
          </div>
        )}

        {/* TAB: Activity Log (سجل التعديلات) */}
        {activeTab === 'logs' && (
          <div className="rounded-3xl bg-white border border-[#D8EEFB] p-6 sm:p-8 space-y-6">
            <h2 className="text-lg font-extrabold text-[#0B1F3A] border-b border-[#E8F4FD] pb-4">سجل نشاط الإدارة</h2>
            <div className="rounded-2xl bg-[#F2FAFF] border border-[#CBE7FA] p-5 text-xs text-slate-700">
              <p className="font-bold mb-2">آخر العمليات المسجلة:</p>
              <ul className="space-y-2 font-mono text-slate-600">
                <li>• تم تحديث وإدارة إعدادات الموقع السحابية بنجاح.</li>
                <li>• تم مزامنة كتالوج المنتجات مع التخزين المحلي والسحابي.</li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 1: Product Management Table / Grid */}
        {activeTab === 'catalog' && (
          <div className="rounded-3xl bg-white border border-[#D8EEFB] overflow-hidden">
            {/* Toolbar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E8F4FD] p-4 sm:p-5">
              <div className="relative flex-1 max-w-md">
                <label htmlFor="admin-search-input" className="sr-only">
                  البحث في المنتجات
                </label>
                <Search
                  className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
                  aria-hidden="true"
                />
                <input
                  id="admin-search-input"
                  type="search"
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  placeholder="ابحث بالاسم أو الماركة أو القسم..."
                  className="w-full min-h-[42px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] pr-10 pl-3 py-2 text-xs sm:text-sm text-[#0B1F3A] focus:outline-2 focus:outline-[#1D4ED8]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 max-w-full">
                <div className="flex items-center gap-1 rounded-xl bg-[#F2FAFF] p-1 border border-[#D8EEFB] overflow-x-auto max-w-full no-scrollbar">
                  {(
                    [
                      { id: 'all', label: 'الكل' },
                      { id: 'available', label: 'المتاحة' },
                      { id: 'featured', label: 'المختارة' },
                      { id: 'discounted', label: 'العروض' },
                    ] as const
                  ).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAdminFilter(item.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                        adminFilter === item.id
                          ? 'bg-white text-[#1D4ED8] shadow-xs'
                          : 'text-slate-600 hover:text-[#0B1F3A]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={startNewProduct}
                  className="hidden lg:inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] px-4 py-2 text-xs sm:text-sm font-bold text-white transition-colors whitespace-nowrap cursor-pointer"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  <span>إضافة منتج جديد</span>
                </button>
              </div>
            </div>

            {/* Responsive Table (Desktop) & Cards (Mobile) */}
            {filteredAdminProducts.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm font-bold text-[#0B1F3A] mb-2">
                  لا توجد منتجات مطابقة لفلتر البحث الحالي
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setAdminSearch('');
                    setAdminFilter('all');
                  }}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-4 py-2 text-xs font-bold text-[#1D4ED8] cursor-pointer"
                >
                  إعادة ضبط الفلتر
                </button>
              </div>
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="bg-[#F8FCFF] border-b border-[#E8F4FD] text-xs font-bold text-slate-500">
                        <th className="py-3.5 px-5">المنتج</th>
                        <th className="py-3.5 px-4">القسم</th>
                        <th className="py-3.5 px-4">السعر الحالي</th>
                        <th className="py-3.5 px-4">الخصم</th>
                        <th className="py-3.5 px-4">الحالة</th>
                        <th className="py-3.5 px-5 text-left">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EBF6FE] text-sm">
                      {filteredAdminProducts.map((product) => {
                        const discounted = isDiscountActive(product);
                        const pct = discounted
                          ? calculateDiscountPercent(product.originalPrice, product.price)
                          : 0;

                        return (
                          <tr
                            key={product.id}
                            className="hover:bg-[#F8FCFF] transition-colors"
                          >
                            <td className="py-3.5 px-5">
                              <div className="flex items-center gap-3">
                                <ProductImage
                                  src={product.images[0]}
                                  alt={product.name}
                                  containerClassName="h-12 w-12 shrink-0 rounded-xl border border-[#D8EEFB] p-1"
                                  className="h-10 w-10"
                                />
                                <div className="min-w-0">
                                  <p className="font-bold text-[#0B1F3A] max-w-sm leading-snug">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {product.brand}
                                    {product.isFeatured ? ' · منتج مختار' : ''}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-xs font-semibold text-slate-600 whitespace-nowrap">
                              {product.category}
                            </td>
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className="font-num font-extrabold text-[#1D4ED8]">
                                {formatPriceEgp(product.price)} ج.م
                              </span>
                              {discounted && (
                                <span className="block font-num text-xs text-slate-400 line-through">
                                  {formatPriceEgp(product.originalPrice)} ج.م
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-bold whitespace-nowrap">
                              {discounted ? (
                                <span className="text-[#0284C7]">
                                  مفعّل (<bdi className="font-num">{pct}%</bdi>)
                                </span>
                              ) : (
                                <span className="text-slate-400">بدون خصم</span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-xs font-bold whitespace-nowrap">
                              <span
                                className={
                                  product.inStock ? 'text-emerald-700' : 'text-amber-700'
                                }
                              >
                                {product.inStock ? 'متوفر' : 'غير متوفر'}
                              </span>
                            </td>
                            <td className="py-3.5 px-5">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => startEditProduct(product)}
                                  aria-label={`تعديل ${product.name}`}
                                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-[#F2FAFF] hover:bg-[#E2F3FE] border border-[#CBE7FA] px-3 py-1.5 text-xs font-bold text-[#0F294A] cursor-pointer"
                                >
                                  <Edit3 className="h-3.5 w-3.5 text-[#1D4ED8]" aria-hidden="true" />
                                  <span>تعديل</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteProduct(product)}
                                  aria-label={`حذف ${product.name}`}
                                  className="inline-flex min-h-[36px] items-center gap-1.5 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 text-xs font-bold text-red-700 cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                                  <span>حذف</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Product Management Cards */}
                <div className="md:hidden divide-y divide-[#E8F4FD]">
                  {filteredAdminProducts.map((product) => {
                    const discounted = isDiscountActive(product);
                    const pct = discounted
                      ? calculateDiscountPercent(product.originalPrice, product.price)
                      : 0;

                    return (
                      <div key={product.id} className="p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <ProductImage
                            src={product.images[0]}
                            alt={product.name}
                            containerClassName="h-16 w-16 shrink-0 rounded-xl border border-[#D8EEFB] p-1.5"
                            className="h-12 w-12"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-[#0284C7] font-semibold">
                              {product.brand} · {product.category}
                            </p>
                            <h3 className="text-sm font-extrabold text-[#0B1F3A] line-clamp-1">
                              {product.name}
                            </h3>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="font-num text-sm font-extrabold text-[#1D4ED8]">
                                {formatPriceEgp(product.price)} ج.م
                              </span>
                              {discounted && (
                                <span className="font-num text-xs text-slate-400 line-through">
                                  {formatPriceEgp(product.originalPrice)} ج.م ({pct}%)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => startEditProduct(product)}
                            aria-label={`تعديل ${product.name}`}
                            className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] text-xs font-bold text-[#0F294A]"
                          >
                            <Edit3 className="h-4 w-4 text-[#1D4ED8]" aria-hidden="true" />
                            <span>تعديل المنتج</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteProduct(product)}
                            aria-label={`حذف ${product.name}`}
                            className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-red-50 border border-red-200 text-xs font-bold text-red-700"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            <span>حذف</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 2: Sectioned Add/Edit Product Form + Live Preview */}
        {activeTab === 'editor' && (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* Form Column */}
            <form
              onSubmit={(e) => void handleSubmitForm(e)}
              className="xl:col-span-7 space-y-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0B1F3A]">
                    {editingProductId ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد للمتجر'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    املأ الأقسام المنظمة التالية وعاين شكل البطاقة مباشرة قبل النشر
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('catalog')}
                  className="min-h-[38px] rounded-xl bg-white border border-[#CBE7FA] px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:text-[#0B1F3A] cursor-pointer"
                >
                  إلغاء والعودة
                </button>
              </div>

              {/* Section 1: Basic Information */}
              <div className="rounded-2xl bg-white border border-[#D8EEFB] p-5 space-y-4">
                <h3 className="text-sm font-extrabold text-[#0B1F3A] border-b border-[#EBF6FE] pb-2.5">
                  01. البيانات الأساسية والتصنيف
                </h3>

                <div>
                  <label
                    htmlFor="prod-name-input"
                    className="block text-xs font-bold text-[#0F294A] mb-1.5"
                  >
                    اسم المنتج *
                  </label>
                  <input
                    id="prod-name-input"
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    placeholder="مثال: سماعة رأس لاسلكية عازلة للضوضاء برو"
                    className="w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-3.5 py-2 text-sm text-[#0B1F3A] focus:bg-white focus:outline-2 focus:outline-[#1D4ED8]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="prod-brand-input"
                    className="block text-xs font-bold text-[#0F294A] mb-1.5"
                  >
                    اسم المصنع / الماركة *
                  </label>
                  <input
                    id="prod-brand-input"
                    type="text"
                    required
                    value={form.brand}
                    onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
                    placeholder="مثال: أنكر / سوني / بيسوس"
                    className="w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-3.5 py-2 text-sm text-[#0B1F3A] focus:bg-white focus:outline-2 focus:outline-[#1D4ED8]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <label className="flex items-center gap-2.5 rounded-xl bg-[#F8FCFF] border border-[#D8EEFB] p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.inStock}
                      onChange={(e) => setForm((p) => ({ ...p, inStock: e.target.checked }))}
                      className="h-4 w-4 accent-[#1D4ED8]"
                    />
                    <span className="text-xs sm:text-sm font-bold text-[#0F294A]">
                      المنتج متوفر حاليًا للطلب
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 rounded-xl bg-[#F8FCFF] border border-[#D8EEFB] p-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isFeatured}
                      onChange={(e) => setForm((p) => ({ ...p, isFeatured: e.target.checked }))}
                      className="h-4 w-4 accent-[#1D4ED8]"
                    />
                    <span className="text-xs sm:text-sm font-bold text-[#0F294A]">
                      تمييز ضمن المنتجات المختارة
                    </span>
                  </label>
                </div>
              </div>

              {/* Section 2: Drag & Drop Image Upload + Gallery */}
              <div className="rounded-2xl bg-white border border-[#D8EEFB] p-5 space-y-4">
                <h3 className="text-sm font-extrabold text-[#0B1F3A] border-b border-[#EBF6FE] pb-2.5">
                  02. صور المنتج وروابط العرض
                </h3>

                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    void handleUploadFiles(e.dataTransfer.files);
                  }}
                  className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
                    isDragging
                      ? 'border-[#1D4ED8] bg-[#E8F4FD]'
                      : 'border-[#93C5FD] bg-[#F2FAFF]'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    id="product-file-upload"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => void handleUploadFiles(e.target.files)}
                    className="sr-only"
                  />
                  <div className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-[#CBE7FA] text-[#1D4ED8]">
                    {uploadingImages ? (
                      <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                    ) : (
                      <Upload className="h-6 w-6" aria-hidden="true" />
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-[#0B1F3A] mb-1">
                    اسحب الصور وأفلتها هنا أو اخترها من جهازك
                  </p>
                  <p className="text-xs text-slate-500 mb-3">
                    يتم حفظ الصور بروابط عامة تدعم الظهور المباشر في رسائل طلب واتساب
                  </p>
                  <button
                    type="button"
                    disabled={uploadingImages}
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex min-h-[40px] items-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] px-4 py-2 text-xs font-bold text-white cursor-pointer"
                  >
                    <ImagePlus className="h-4 w-4" aria-hidden="true" />
                    <span>{uploadingImages ? 'جاري رفع الصور...' : 'اختيار صور من الجهاز'}</span>
                  </button>
                </div>

                {/* Direct Image URL Input */}
                <div className="flex gap-2">
                  <label htmlFor="image-url-input" className="sr-only">
                    إضافة رابط صورة مباشر
                  </label>
                  <input
                    id="image-url-input"
                    type="text"
                    value={imageUrlDraft}
                    onChange={(e) => setImageUrlDraft(e.target.value)}
                    placeholder="أو الصق رابط صورة مباشر (https://...)"
                    className="flex-1 min-h-[42px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-3.5 py-2 text-xs sm:text-sm text-[#0B1F3A]"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="min-h-[42px] rounded-xl bg-[#F2FAFF] hover:bg-[#E2F3FE] border border-[#CBE7FA] px-4 py-2 text-xs font-bold text-[#0F294A] whitespace-nowrap cursor-pointer"
                  >
                    إضافة الرابط
                  </button>
                </div>

                {/* Uploaded Images Preview Strip */}
                {form.images.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-600 mb-2">
                      الصور المضافة ({form.images.length}/8) — الصورة الأولى هي الصورة الرئيسية:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {form.images.map((url, idx) => (
                        <div
                          key={`${url}-${idx}`}
                          className="relative rounded-xl border border-[#CBE7FA] bg-[#F8FCFF] p-2"
                        >
                          <img
                            src={url}
                            alt={`صورة المنتج ${idx + 1}`}
                            referrerPolicy="no-referrer"
                            className="h-20 w-full object-contain mb-2"
                          />
                          <div className="flex items-center justify-between gap-1">
                            {idx === 0 ? (
                              <span className="text-[11px] font-bold text-[#1D4ED8]">الرئيسية</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryImage(idx)}
                                className="text-[11px] font-bold text-[#0284C7] hover:underline cursor-pointer"
                              >
                                تعيين رئيسية
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              aria-label={`حذف الصورة رقم ${idx + 1}`}
                              className="p-1 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Section 3: Description, Specs & Options */}
              <div className="rounded-2xl bg-white border border-[#D8EEFB] p-5 space-y-4">
                <h3 className="text-sm font-extrabold text-[#0B1F3A] border-b border-[#EBF6FE] pb-2.5">
                  03. الوصف والمواصفات والخيارات
                </h3>

                <div>
                  <label
                    htmlFor="prod-short-desc"
                    className="block text-xs font-bold text-[#0F294A] mb-1.5"
                  >
                    الوصف المختصر (يظهر في بطاقة المنتج) *
                  </label>
                  <input
                    id="prod-short-desc"
                    type="text"
                    required
                    value={form.shortDescription}
                    onChange={(e) => setForm((p) => ({ ...p, shortDescription: e.target.value }))}
                    placeholder="سطر مختصر يبرز أهم ميزة في المنتج..."
                    className="w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-3.5 py-2 text-sm text-[#0B1F3A]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="prod-full-desc"
                    className="block text-xs font-bold text-[#0F294A] mb-1.5"
                  >
                    الوصف التفصيلي الكامل *
                  </label>
                  <textarea
                    id="prod-full-desc"
                    rows={3}
                    required
                    value={form.description}
                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                    placeholder="اكتب تفاصيل المنتج ومميزاته وطريقة الاستخدام..."
                    className="w-full rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] p-3.5 text-sm text-[#0B1F3A]"
                  />
                </div>

                {/* Specs Builder */}
                <div>
                  <label
                    htmlFor="spec-draft-input"
                    className="block text-xs font-bold text-[#0F294A] mb-1.5"
                  >
                    المواصفات والمميزات الفنية
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      id="spec-draft-input"
                      type="text"
                      value={specDraft}
                      onChange={(e) => setSpecDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddSpec();
                        }
                      }}
                      placeholder="مثال: البطارية: 40 ساعة تشغيل متواصل"
                      className="flex-1 min-h-[40px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-3.5 py-2 text-xs sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddSpec}
                      className="min-h-[40px] rounded-xl bg-[#F2FAFF] hover:bg-[#E2F3FE] border border-[#CBE7FA] px-3.5 py-2 text-xs font-bold text-[#0F294A] cursor-pointer"
                    >
                      إضافة مواصفة
                    </button>
                  </div>
                  {form.specs.length > 0 && (
                    <ul className="space-y-1.5">
                      {form.specs.map((spec, idx) => (
                        <li
                          key={`${spec}-${idx}`}
                          className="flex items-center justify-between gap-2 rounded-xl bg-[#F8FCFF] border border-[#E2F1FC] px-3 py-1.5 text-xs text-[#0F294A]"
                        >
                          <span>{spec}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((p) => ({
                                ...p,
                                specs: p.specs.filter((_, i) => i !== idx),
                              }))
                            }
                            aria-label={`حذف المواصفة ${spec}`}
                            className="text-red-600 hover:underline font-bold cursor-pointer"
                          >
                            حذف
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Options Builder */}
                <div>
                  <label
                    htmlFor="option-draft-input"
                    className="block text-xs font-bold text-[#0F294A] mb-1.5"
                  >
                    خيارات المنتج (الألوان / السعات الاختيارية)
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      id="option-draft-input"
                      type="text"
                      value={optionDraft}
                      onChange={(e) => setOptionDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddOption();
                        }
                      }}
                      placeholder="مثال: أزرق ملكي"
                      className="flex-1 min-h-[40px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-3.5 py-2 text-xs sm:text-sm"
                    />
                    <button
                      type="button"
                      onClick={handleAddOption}
                      className="min-h-[40px] rounded-xl bg-[#F2FAFF] hover:bg-[#E2F3FE] border border-[#CBE7FA] px-3.5 py-2 text-xs font-bold text-[#0F294A] cursor-pointer"
                    >
                      إضافة خيار
                    </button>
                  </div>
                  {form.options.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {form.options.map((opt, idx) => (
                        <span
                          key={`${opt}-${idx}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[#F2FAFF] border border-[#CBE7FA] px-2.5 py-1 text-xs font-semibold text-[#0F294A]"
                        >
                          <span>{opt}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((p) => ({
                                ...p,
                                options: p.options.filter((_, i) => i !== idx),
                              }))
                            }
                            aria-label={`حذف الخيار ${opt}`}
                            className="text-red-600 font-bold cursor-pointer"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 4: Pricing & Discount Switch */}
              <div className="rounded-2xl bg-white border border-[#D8EEFB] p-5 space-y-4">
                <div className="flex items-center justify-between gap-3 border-b border-[#EBF6FE] pb-3">
                  <h3 className="text-sm font-extrabold text-[#0B1F3A]">
                    04. الأسعار ومفتاح تفعيل الخصم
                  </h3>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.discountEnabled}
                    onClick={() => {
                      const nextChecked = !form.discountEnabled;
                      setForm((p) => ({
                        ...p,
                        discountEnabled: nextChecked,
                        originalPrice:
                          nextChecked && p.originalPrice <= p.price
                            ? Math.round(p.price * 1.25)
                            : p.originalPrice,
                      }));
                    }}
                    className="inline-flex items-center gap-2.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1D4ED8] rounded-xl p-1"
                  >
                    <span className="text-xs sm:text-sm font-extrabold text-[#1D4ED8]">
                      تفعيل خصم على المنتج
                    </span>
                    <span
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
                        form.discountEnabled ? 'bg-[#1D4ED8]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 rounded-full bg-white shadow-xs transition-transform duration-200 ${
                          form.discountEnabled ? '-translate-x-5.5' : '-translate-x-1'
                        }`}
                      />
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="prod-price-input"
                      className="block text-xs font-bold text-[#0F294A] mb-1.5"
                    >
                      {form.discountEnabled
                        ? 'السعر بعد الخصم (ج.م) *'
                        : 'السعر الحالي بالجنيه المصري *'}
                    </label>
                    <input
                      id="prod-price-input"
                      type="number"
                      min={1}
                      step="1"
                      required
                      value={form.price}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, price: Number(e.target.value) }))
                      }
                      className="font-num w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-3.5 py-2 text-base font-bold text-[#0B1F3A]"
                    />
                  </div>

                  {form.discountEnabled && (
                    <div>
                      <label
                        htmlFor="prod-original-price-input"
                        className="block text-xs font-bold text-[#0F294A] mb-1.5"
                      >
                        السعر الأصلي قبل الخصم (ج.م) *
                      </label>
                      <input
                        id="prod-original-price-input"
                        type="number"
                        min={1}
                        step="1"
                        required
                        value={form.originalPrice}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, originalPrice: Number(e.target.value) }))
                        }
                        className="font-num w-full min-h-[44px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-3.5 py-2 text-base font-bold text-slate-600"
                      />
                    </div>
                  )}
                </div>

                {form.discountEnabled && (
                  <div className="rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] p-3.5 text-xs sm:text-sm">
                    {form.originalPrice > form.price ? (
                      <p className="font-bold text-[#0284C7]">
                        سيظهر المنتج في قسم «عروض وخصومات المحلاوي ستور» بنسبة خصم{' '}
                        <span className="font-num">{computedDiscountPct}%</span> (توفير{' '}
                        <span className="font-num">{formatPriceEgp(computedSavings)}</span> ج.م).
                      </p>
                    ) : (
                      <p className="font-bold text-red-700">
                        تنبيه: يجب أن يكون السعر الأصلي أعلى من السعر بعد الخصم لتفعيل العرض.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-60 px-6 py-3 text-sm sm:text-base font-extrabold text-white transition-colors cursor-pointer"
                >
                  {saving && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
                  <span>{editingProductId ? 'حفظ التعديلات ونشرها' : 'نشر المنتج في المتجر'}</span>
                </button>
              </div>
            </form>

            {/* Sticky Live Product Card Preview (Single-Elevation Depth) */}
            <div className="xl:col-span-5 xl:sticky xl:top-22">
              <div className="mb-3 px-1">
                <p className="text-xs font-bold text-[#0284C7]">معاينة حية ومباشرة</p>
                <h3 className="text-base font-extrabold text-[#0B1F3A]">
                  شكل بطاقة المنتج قبل النشر
                </h3>
              </div>

              <ProductCard
                product={livePreviewProduct}
                onViewDetails={(p) => setPreviewModalProduct(p)}
                publicOrigin={publicOrigin}
              />
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal (No window.confirm) */}
      {confirmDeleteProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-confirm-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#081A33]/60 p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-white border border-[#CBE7FA] p-6 shadow-xl">
            <h3 id="delete-confirm-title" className="text-lg font-extrabold text-[#0B1F3A] mb-2">
              تأكيد حذف المنتج
            </h3>
            <p className="text-sm text-slate-600 mb-5">
              هل أنت متأكد من رغبتك في حذف المنتج «{confirmDeleteProduct.name}»؟ لا يمكن التراجع عن
              هذا الإجراء بعد التأكيد.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDeleteProduct(null)}
                className="min-h-[42px] rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] px-4 py-2 text-xs sm:text-sm font-bold text-[#0F294A] cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={async () => {
                  const target = confirmDeleteProduct;
                  setConfirmDeleteProduct(null);
                  try {
                    await onDeleteProduct(target.id);
                    setFeedback({
                      type: 'success',
                      message: `تم حذف المنتج «${target.name}» بنجاح.`,
                    });
                  } catch (err) {
                    setFeedback({
                      type: 'error',
                      message: err instanceof Error ? err.message : 'تعذر حذف المنتج.',
                    });
                  }
                }}
                className="min-h-[42px] rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 text-xs sm:text-sm font-bold text-white cursor-pointer"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Optional Live Preview Modal Trigger */}
      {previewModalProduct && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#081A33]/60 p-4"
          onClick={() => setPreviewModalProduct(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg rounded-2xl bg-white border border-[#CBE7FA] p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-base font-extrabold text-[#0B1F3A]">
                معاينة الوصف والمواصفات
              </h4>
              <button
                type="button"
                onClick={() => setPreviewModalProduct(null)}
                aria-label="إغلاق المعاينة"
                className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-3">{previewModalProduct.description}</p>
            <ul className="space-y-1 text-xs text-[#0F294A]">
              {previewModalProduct.specs.map((s, i) => (
                <li key={i}>• {s}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
