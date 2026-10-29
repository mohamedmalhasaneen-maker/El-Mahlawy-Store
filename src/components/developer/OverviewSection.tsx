import {
  Edit3,
  Eye,
  EyeOff,
  FileText,
  Globe,
  MapPin,
  Package,
  Percent,
  Phone,
  Plus,
  ShieldCheck,
  SlidersHorizontal,
  Tag,
} from 'lucide-react';
import { Product } from '../../types/store';
import { PRODUCT_CATEGORIES } from '../../constants/categories';
import {
  calculateDiscountPercent,
  formatPriceEgp,
  getDiscountScheduleStatus,
  getEffectiveProductPrice,
  isDiscountActive,
} from '../../utils/catalogLogic';
import { SiteConfig } from '../../utils/siteConfig';
import { ProductImage } from '../ProductImage';

export type DeveloperSectionId =
  | 'overview'
  | 'products'
  | 'discounts'
  | 'phones'
  | 'social'
  | 'branches'
  | 'site-info'
  | 'essential-products'
  | 'sections'
  | 'account';

interface OverviewSectionProps {
  products: Product[];
  siteConfig: SiteConfig;
  developerEmail: string;
  developerUid: string;
  onNavigateSection: (section: DeveloperSectionId) => void;
  onAddNewProduct: () => void;
  onEditProduct: (product: Product) => void;
  onConfigureDiscount: (product: Product) => void;
  uncategorizedProducts?: Product[];
}

export function OverviewSection({
  products,
  siteConfig,
  developerEmail,
  developerUid,
  onNavigateSection,
  onAddNewProduct,
  onEditProduct,
  onConfigureDiscount,
  uncategorizedProducts = [],
}: OverviewSectionProps) {
  let publishedCount = 0;
  let hiddenCount = 0;
  let activeDiscountCount = 0;
  let scheduledDiscountCount = 0;
  let outOfStockCount = 0;

  for (const product of products) {
    if (product.isPublished) publishedCount += 1;
    else hiddenCount += 1;

    if (!product.inStock) outOfStockCount += 1;

    const status = getDiscountScheduleStatus(product);
    if (status === 'active') activeDiscountCount += 1;
    else if (status === 'scheduled') scheduledDiscountCount += 1;
  }

  const totalSocialCount =
    [siteConfig.facebookUrl, siteConfig.instagramUrl, siteConfig.partnerFacebookUrl].filter((u) =>
      Boolean((u || '').trim())
    ).length + (siteConfig.socialLinks?.length || 0);

  const visibleSectionsCount = [
    siteConfig.showHeroSpotlight,
    siteConfig.showValueStrip,
    siteConfig.showOffersSection,
    siteConfig.showShippingSection,
    siteConfig.showPartnerCard,
    siteConfig.showAboutBanner,
  ].filter(Boolean).length;

  const recentProducts = products.slice(0, 5);

  const quickActions: Array<{
    title: string;
    description: string;
    Icon: typeof Package;
    onClick: () => void;
  }> = [
    {
      title: 'رفع وإضافة منتج جديد',
      description: 'رفع صور المنتج السحابية وتحديد السعر الأساسي وإعدادات الخصم والمواصفات في صفحة واحدة.',
      Icon: Plus,
      onClick: onAddNewProduct,
    },
    {
      title: 'إدارة الأسعار والخصومات',
      description: 'تعديل السعر الأساسي أو تفعيل نسبة خصم أو مبلغ ثابت وتواريخ العرض.',
      Icon: Percent,
      onClick: () => onNavigateSection('discounts'),
    },
    {
      title: 'أرقام الهاتف وواتساب',
      description: 'تحديث أرقام الطلبات والصيانة وما بعد البيع للمتجر وInfinity Corp.',
      Icon: Phone,
      onClick: () => onNavigateSection('phones'),
    },
    {
      title: 'روابط التواصل الاجتماعي',
      description: 'إدارة صفحات فيسبوك وإنستغرام وتيك توك والمنصات الرسمية.',
      Icon: Globe,
      onClick: () => onNavigateSection('social'),
    },
    {
      title: 'العنوان والفروع والخرائط',
      description: 'تعديل العنوان الرئيسي وروابط Google Maps ومواعيد العمل والفروع.',
      Icon: MapPin,
      onClick: () => onNavigateSection('branches'),
    },
    {
      title: 'معلومات الموقع ومن نحن',
      description: 'تحديث اسم المتجر، الوصف التعريفي، ونصوص صفحة «من نحن» والرؤية.',
      Icon: FileText,
      onClick: () => onNavigateSection('site-info'),
    },
  ];

  return (
    <section aria-labelledby="dev-overview-heading" className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div>
          <h2 id="dev-overview-heading" className="text-xl sm:text-2xl font-extrabold text-white">
            لوحة المعلومات الرئيسية
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            ملخص شامل لحالة المنتجات والخصومات وقنوات التواصل وإعدادات متجر {siteConfig.storeName}.
          </p>
        </div>

        <button
          type="button"
          onClick={onAddNewProduct}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] border border-[#D4AF37]/70 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
          <span>رفع وإضافة منتج جديد</span>
        </button>
      </div>

      {uncategorizedProducts.length > 0 && (
        <div className="rounded-2xl bg-amber-950/30 border border-amber-500/50 p-5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <SlidersHorizontal className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white">منتجات بحاجة لمراجعة القسم ({uncategorizedProducts.length})</h3>
              <p className="text-xs sm:text-sm text-gray-300 mt-1 leading-relaxed">
                تم رصد منتجات لا تنتمي لأي من الأقسام الستة الرسمية المعتمدة حديثًا. يرجى تعديلها وتحديد القسم الصحيح لتظهر للزوار في الفلاتر الجديدة.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {uncategorizedProducts.slice(0, 4).map((p) => (
              <button
                key={p.id}
                onClick={() => onEditProduct(p)}
                className="flex items-center gap-3 p-2 rounded-xl bg-[#0B0B0B] border border-white/10 hover:border-amber-500/50 transition-colors text-right cursor-pointer"
              >
                <ProductImage src={p.images[0]} alt={p.name} containerClassName="h-10 w-10 shrink-0 rounded-lg bg-white/5 p-1" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{p.name}</p>
                  <p className="text-[10px] text-amber-400">القسم الحالي: {p.category || 'غير محدد'}</p>
                </div>
              </button>
            ))}
          </div>
          {uncategorizedProducts.length > 4 && (
            <p className="text-[10px] text-gray-400 text-center italic">... وهناك {uncategorizedProducts.length - 4} منتجات أخرى بحاجة للمراجعة</p>
          )}
        </div>
      )}

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>إجمالي المنتجات المسجلة</span>
            <Package className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
            {products.length}
          </p>
          <p className="text-xs text-gray-400 tabular-nums">
            <span className="text-emerald-400 font-semibold">{publishedCount} ظاهر</span>
            <span aria-hidden="true"> · </span>
            <span>{hiddenCount} مخفي</span>
            {outOfStockCount > 0 ? (
              <>
                <span aria-hidden="true"> · </span>
                <span className="text-[#A0D2EB]">{outOfStockCount} غير متوفر</span>
              </>
            ) : null}
          </p>
        </div>

        <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>العروض والخصومات الفعّالة</span>
            <Percent className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-[#D4AF37] tabular-nums">
            {activeDiscountCount}
          </p>
          <p className="text-xs text-gray-400 tabular-nums">
            {scheduledDiscountCount > 0
              ? `${scheduledDiscountCount} عرض مجدول قادم`
              : 'تُحدّث تلقائيًا في قسم العروض'}
          </p>
        </div>

        <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>قنوات التواصل والفروع</span>
            <Phone className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-white tabular-nums">
            {siteConfig.contactChannels.length + siteConfig.branches.length}
          </p>
          <p className="text-xs text-gray-400 tabular-nums">
            {siteConfig.contactChannels.length} قناة هاتف · {siteConfig.branches.length} فرع ·{' '}
            {totalSocialCount} رابط اجتماعي
          </p>
        </div>

        <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>الأقسام وحماية الحساب</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          </div>
          <p className="text-base sm:text-lg font-extrabold text-emerald-400 truncate">
            جلسة مطور موثّقة
          </p>
          <p className="text-xs text-gray-400 truncate tabular-nums">
            {visibleSectionsCount}/6 أقسام مفعّلة ·{' '}
            <bdi className="text-gray-300">{developerEmail || developerUid.slice(0, 10)}</bdi>
          </p>
        </div>
      </div>

      {/* Quick Control Shortcuts */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#D4AF37]">الوصول السريع لأقسام الإدارة</h3>
          <button
            type="button"
            onClick={() => onNavigateSection('sections')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-300 hover:text-[#D4AF37] transition-colors cursor-pointer"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
            <span>إظهار أو إخفاء أقسام الواجهة</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {quickActions.map(({ title, description, Icon, onClick }) => (
            <button
              key={title}
              type="button"
              onClick={onClick}
              className="rounded-2xl bg-[#141414] hover:bg-[#1A1A1A] border border-white/10 hover:border-[#D4AF37]/60 p-4 text-right transition-colors flex items-start gap-3.5 cursor-pointer"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B0B0B] border border-[#D4AF37]/40 text-[#D4AF37]">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 space-y-1">
                <p className="text-sm font-extrabold text-white">{title}</p>
                <p className="text-xs text-gray-400 leading-relaxed">{description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Products Quick Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#D4AF37]">أحدث المنتجات في المتجر</h3>
          <button
            type="button"
            onClick={() => onNavigateSection('products')}
            className="text-xs font-bold text-gray-300 hover:text-[#D4AF37] transition-colors cursor-pointer"
          >
            عرض كل المنتجات ({products.length})
          </button>
        </div>

        {recentProducts.length === 0 ? (
          <div className="rounded-2xl bg-[#141414] border border-white/10 p-8 text-center space-y-3">
            <p className="text-sm font-bold text-white">لا توجد منتجات مسجلة في الكتالوج حاليًا</p>
            <p className="text-xs text-gray-400">
              ابدأ بإضافة أول منتج مع صوره وسعره ليظهر لجميع زوار الموقع فورًا.
            </p>
            <button
              type="button"
              onClick={onAddNewProduct}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] border border-[#D4AF37]/60 px-4 py-2 text-xs font-extrabold text-white cursor-pointer"
            >
              <Plus className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
              <span>إضافة أول منتج</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/10 rounded-2xl bg-[#141414] border border-white/10 overflow-hidden">
            {recentProducts.map((product) => {
              const effectivePrice = getEffectiveProductPrice(product);
              const activeDiscount = isDiscountActive(product);
              return (
                <div
                  key={product.id}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <ProductImage
                      src={product.images[0]}
                      alt={product.name}
                      containerClassName="h-12 w-12 shrink-0 rounded-xl bg-[#0B0B0B] border border-[#D4AF37]/25 p-1"
                    />
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-extrabold text-white truncate">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 flex flex-wrap items-center gap-1.5 tabular-nums">
                        <span className="text-[#D4AF37] font-bold">
                          {formatPriceEgp(effectivePrice)} ج.م
                        </span>
                        {activeDiscount && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-emerald-400 font-semibold">
                              خصم {calculateDiscountPercent(product.originalPrice, effectivePrice)}%
                            </span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          {product.isPublished ? (
                            <>
                              <Eye className="h-3 w-3 text-emerald-400" aria-hidden="true" />
                              <span className="text-emerald-400">ظاهر</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 text-amber-400" aria-hidden="true" />
                              <span className="text-amber-400">مخفي</span>
                            </>
                          )}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onConfigureDiscount(product)}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#0B0B0B] hover:bg-[#1E1E1E] border border-[#D4AF37]/40 px-3 py-1.5 text-xs font-bold text-[#D4AF37] whitespace-nowrap cursor-pointer"
                    >
                      <Tag className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>السعر والخصم</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditProduct(product)}
                      className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#1E1E1E] hover:bg-[#2A2A2A] border border-white/15 px-3 py-1.5 text-xs font-bold text-white whitespace-nowrap cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
                      <span>تعديل</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
