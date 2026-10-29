import {
  ArrowRight,
  Award,
  BellRing,
  Camera,
  CheckCircle2,
  ExternalLink,
  Flame,
  Home,
  Lightbulb,
  MapPin,
  MessageCircle,
  Package,
  Radio,
  ShieldCheck,
  Sparkles,
  Truck,
  Volume2,
  Wrench,
} from 'lucide-react';
import { useSiteConfig } from '../contexts/SiteConfigContext';
import { PARTNER_INFO } from '../types/store';
import { buildWhatsAppLinkFromPhone, parsePartnerScopeList } from '../utils/siteConfig';
import { ThemeToggle } from './ThemeToggle';
import { Footer } from './Footer';

interface AboutUsPageProps {
  onBackToStore: () => void;
  onAdminButtonClick?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
}

const STORE_PRODUCTS_LIST = [
  {
    title: 'كاميرات المراقبة',
    description: 'كاميرات IP وAnalog متطورة، وأجهزة التسجيل DVR/NVR، ومستلزمات التوصيل والتركيب.',
    Icon: Camera,
  },
  {
    title: 'الستالايت والرسيفرات',
    description: 'رسيفرات متنوعة عالية الدقة، وأطباق الدش، والعدسات، والريموتات، والكابلات، ومستلزمات الدش المركزي.',
    Icon: Radio,
  },
  {
    title: 'أنظمة الصوتيات',
    description: 'سماعات السقف المعلقة، والمكبرات، ومستلزمات أنظمة الصوت والسويس سيستم للمحلات والمنشآت.',
    Icon: Volume2,
  },
  {
    title: 'إضاءة LED Profile',
    description: 'بروفايلات الإضاءة الديكورية الحديثة ومستلزمات التركيب والتوصيل للأسقف والحوائط.',
    Icon: Lightbulb,
  },
  {
    title: 'أنظمة الإنذار المبكر',
    description: 'أجهزة الإنذار والاستشعار والتنبيه لحماية المنازل والمحلات والشركات.',
    Icon: BellRing,
  },
  {
    title: 'أنظمة إنذار الحريق',
    description: 'كواشف الدخان والحرارة، وأجهزة التنبيه الصوتية والضوئية، ولوحات التحكم ومستلزماتها.',
    Icon: Flame,
  },
];

const INFINITY_SERVICES_LIST = [
  {
    num: '1',
    title: 'تركيب كاميرات المراقبة',
    description: 'تركيب كاميرات المراقبة بنظامي IP وAnalog، وتجهيز أنظمة التسجيل والمشاهدة عن بُعد عبر الموبايل، وصيانة الأنظمة التي قامت الشركة بتركيبها.',
    Icon: Camera,
  },
  {
    num: '2',
    title: 'أنظمة الستالايت والدش المركزي',
    description: 'تركيب وصيانة أنظمة الدش العادي والمركزي للمنازل، الفنادق، المنتجعات، والقرى السياحية.',
    Icon: Radio,
  },
  {
    num: '3',
    title: 'أنظمة الصوتيات والسويس سيستم',
    description: 'تركيب السماعات السقفية والمعلقة وتجهيز أنظمة الصوت للمحلات والفنادق والمنشآت التجارية.',
    Icon: Volume2,
  },
  {
    num: '4',
    title: 'تركيب إضاءة LED Profile',
    description: 'تنفيذ وتركيب إضاءة البروفايل الديكورية للأسقف والحوائط والمنازل والمحلات بأسلوب فني عالي الجودة يناسب كل مكان.',
    Icon: Lightbulb,
  },
  {
    num: '5',
    title: 'أنظمة الإنذار المبكر',
    description: 'تركيب وتجهيز أنظمة الإنذار وأجهزة الاستشعار والتنبيه لحماية المباني والمنشآت.',
    Icon: BellRing,
  },
  {
    num: '6',
    title: 'أنظمة إنذار الحريق وكواشفها',
    description: 'تركيب وتجهيز أنظمة إنذار الحريق وكواشف الدخان والحرارة وأجهزة التنبيه، وفقًا لمتطلبات السلامة والمعايير المعتمدة.',
    Icon: Flame,
  },
];

export function AboutUsPage({ onBackToStore, onAdminButtonClick, isDark = false, onToggleTheme }: AboutUsPageProps) {
  const siteConfig = useSiteConfig();
  const partnerScopeList = parsePartnerScopeList(siteConfig.partnerServiceScopeText);
  const effectiveScope =
    partnerScopeList.length > 0 ? partnerScopeList : PARTNER_INFO.serviceScope;
  const partnerOrderWa = buildWhatsAppLinkFromPhone(siteConfig.partnerOrderPhone1);
  const partnerMaintWa = buildWhatsAppLinkFromPhone(siteConfig.partnerMaintenancePhone);
  const partnerMaintenanceNewWa = buildWhatsAppLinkFromPhone('01005089640');
  const storeSocialLinks = (siteConfig.socialLinks || []).filter(
    (sl) => sl.owner === 'store' && Boolean(sl.url)
  );
  const partnerSocialLinks = (siteConfig.socialLinks || []).filter(
    (sl) => sl.owner === 'partner' && Boolean(sl.url)
  );

  return (
    <div className="min-h-screen bg-white dark:bg-[#071326] text-[#0B1F3A] dark:text-[#F0F9FF] flex flex-col transition-colors">
      {/* Top Standalone Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#081A33]/95 backdrop-blur-md border-b border-[#D8EEFB] dark:border-[#163663]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={onBackToStore}
            className="inline-flex items-center gap-2 text-sm sm:text-base font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF] hover:text-[#1D4ED8] dark:hover:text-[#38BDF8] transition-colors cursor-pointer"
          >
            <img
              src="/logo.png"
              alt={siteConfig.storeName}
              referrerPolicy="no-referrer"
              className="h-9 w-9 rounded-xl object-contain shadow-xs bg-white"
            />
            <span>
              {siteConfig.storeName}
              {siteConfig.storeSubtitle ? (
                <>
                  {' '}
                  <span className="text-[#1D4ED8] dark:text-[#38BDF8]">|</span>{' '}
                  <bdi className="font-bold text-[#1E3A8A] dark:text-[#7DD3FC]">{siteConfig.storeSubtitle}</bdi>
                </>
              ) : null}
            </span>
          </button>

          <div className="flex items-center gap-2">
            {onToggleTheme && <ThemeToggle isDark={isDark} onToggle={onToggleTheme} />}
            <button
              type="button"
              onClick={onBackToStore}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#F2FAFF] dark:bg-[#0E264A] hover:bg-[#E2F3FE] dark:hover:bg-[#153666] border border-[#CBE7FA] dark:border-[#1E3F73] px-4 py-2 text-xs sm:text-sm font-extrabold text-[#1D4ED8] dark:text-[#E0F2FE] transition-colors cursor-pointer"
            >
              <ArrowRight className="h-4 w-4" />
              <span>العودة للرئيسية</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 space-y-0">
        {/* HERO BANNER */}
        <section className="bg-gradient-to-r from-[#0B0B0B] via-[#082E38] to-[#0B0B0B] text-white py-12 sm:py-16 px-4 border-b border-[#D4AF37]">
          <div className="mx-auto max-w-5xl text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#0F4C5C]/20 px-4 py-1.5 text-xs font-extrabold text-[#D4AF37] border border-[#D4AF37]/50">
              <Sparkles className="h-4 w-4 text-[#D4AF37]" />
              <span>من نحن | About Us</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              {siteConfig.aboutHeroTitle || `${siteConfig.storeName} × ${siteConfig.partnerName}`}
            </h1>

            <p className="text-sm sm:text-lg text-gray-300 max-w-3xl mx-auto font-medium leading-relaxed">
              {siteConfig.aboutHeroSubtitle}
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={onBackToStore}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] text-white px-5 py-2.5 text-xs sm:text-sm font-extrabold shadow-lg border border-[#D4AF37] transition-colors cursor-pointer"
              >
                <Home className="h-4 w-4" />
                <span>الرئيسية</span>
              </button>
            </div>
          </div>
        </section>

        {/* 1. EL MAHLAWY STORE SECTION */}
        <section className="bg-[#0B0B0B] py-12 sm:py-16 border-b border-[#D4AF37]/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Header Badge & Title */}
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-lg bg-[#0F4C5C]/10 border border-[#D4AF37] px-3 py-1 text-xs font-bold text-[#D4AF37]">
                <Package className="h-3.5 w-3.5" />
                <span>المتجر الرسمي</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                {siteConfig.storeName}
                {siteConfig.storeSubtitle ? (
                  <>
                    {' '}
                    | <bdi className="text-[#D4AF37]">{siteConfig.storeSubtitle}</bdi>
                  </>
                ) : null}
              </h2>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-medium">
                {siteConfig.aboutStoreIntro}
              </p>
            </div>

            {/* Products Grid */}
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#D4AF37] mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                <span>منتجاتنا الأساسية والمتنوعة</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {STORE_PRODUCTS_LIST.map(({ title, description, Icon }) => (
                  <div
                    key={title}
                    className="rounded-2xl bg-[#1A1A1A] border border-[#D4AF37]/30 p-5 flex flex-col justify-between hover:border-[#D4AF37] transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0B0B0B] border border-[#D4AF37] text-[#D4AF37] shadow-xs">
                          <Icon className="h-5 w-5" />
                        </span>
                        <h4 className="text-sm sm:text-base font-extrabold text-white">
                          {title}
                        </h4>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-400 leading-relaxed pt-1">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Details Cards: Address, Delivery, Customer Service, Direct Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {/* Address */}
              <div className="rounded-2xl bg-[#1A1A1A] border border-[#D4AF37]/30 p-5 space-y-2.5 shadow-xs">
                <div className="flex items-center gap-2 text-[#D4AF37] font-extrabold text-sm">
                  <MapPin className="h-4.5 w-4.5 shrink-0" />
                  <span>عنوان المتجر</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-200 font-semibold leading-relaxed">
                  {siteConfig.address}
                </p>
              </div>

              {/* Shipping & Delivery */}
              <div className="rounded-2xl bg-[#1A1A1A] border border-[#D4AF37]/30 p-5 space-y-2.5 shadow-xs">
                <div className="flex items-center gap-2 text-[#D4AF37] font-extrabold text-sm">
                  <Truck className="h-4.5 w-4.5 shrink-0" />
                  <span>الشحن والتوصيل</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-300 font-medium leading-relaxed">
                  <CheckCircle2 className="inline h-4 w-4 text-[#D4AF37] ml-1.5" />
                  {siteConfig.shippingSummary}
                </p>
              </div>

              {/* Customer Support */}
              <div className="rounded-2xl bg-[#1A1A1A] border border-[#D4AF37]/30 p-5 space-y-2.5 shadow-xs">
                <div className="flex items-center gap-2 text-[#D4AF37] font-extrabold text-sm">
                  <ShieldCheck className="h-4.5 w-4.5 shrink-0" />
                  <span>خدمة ما بعد البيع</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-medium">
                  {siteConfig.afterSalesPolicy}
                </p>
              </div>

              {/* Store Direct Contact Card */}
              <div className="rounded-2xl bg-[#0F4C5C] text-white p-5 space-y-3 flex flex-col justify-between shadow-xs border border-[#D4AF37]">
                <div>
                  <p className="text-xs font-extrabold text-[#D4AF37] mb-1">
                    تواصل معنا
                  </p>
                  <div className="flex items-center justify-between text-xs font-bold bg-black/20 px-3 py-2 rounded-xl mb-2">
                    <span className="text-gray-200">هاتف:</span>
                    <a
                      href={`tel:${siteConfig.primaryPhone}`}
                      dir="ltr"
                      className="font-num text-white hover:text-[#D4AF37]"
                    >
                      {siteConfig.primaryPhone}
                    </a>
                  </div>
                </div>

                <div className="space-y-2">
                  <a
                    href={siteConfig.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-black hover:bg-[#1A1A1A] px-3 py-2.5 text-xs sm:text-sm font-extrabold text-white border border-[#D4AF37] transition-colors"
                  >
                    <MessageCircle className="h-4 w-4 text-[#25D366]" />
                    <span>واتساب الطلبات</span>
                  </a>
                  {storeSocialLinks.map((sl) => (
                    <a
                      key={sl.id}
                      href={sl.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-xl bg-black/40 hover:bg-black px-3 py-2 text-xs font-bold text-[#D4AF37] border border-[#D4AF37]/60 transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{sl.label}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. INFINITY CORP SECTION */}
        <section className="bg-[#0B0B0B] py-12 sm:py-16 border-b border-[#D4AF37]/30">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-lg bg-[#0F4C5C]/10 border border-[#D4AF37] px-3 py-1 text-xs font-bold text-[#D4AF37]">
                <Award className="h-3.5 w-3.5" />
                <span>شركاء النجاح | <bdi>{siteConfig.partnerName}</bdi></span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                شركة <bdi>{siteConfig.partnerName}</bdi> للتركيبات الفنية
              </h2>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-medium">
                {siteConfig.aboutPartnerIntro}
              </p>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#D4AF37] mb-4 flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                <span>الخدمات الفنية</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {INFINITY_SERVICES_LIST.map(({ num, title, description, Icon }) => (
                  <div
                    key={title}
                    className="rounded-2xl bg-[#1A1A1A] border border-[#D4AF37]/30 p-5 flex flex-col justify-between shadow-xs hover:border-[#D4AF37] transition-colors"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B0B0B] border border-[#D4AF37] text-[#D4AF37]">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="font-num text-xs font-extrabold bg-[#0B0B0B] border border-[#D4AF37] px-2.5 py-1 rounded-lg text-[#D4AF37]">
                          خدمة #{num}
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-extrabold text-white">
                        {title}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              <div className="rounded-2xl bg-[#1A1A1A] border border-[#D4AF37]/30 p-5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-[#D4AF37] font-extrabold text-sm">
                  <MapPin className="h-4.5 w-4.5" />
                  <span>نطاق خدماتنا</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {effectiveScope.map((city) => (
                    <span
                      key={city}
                      className="rounded-lg bg-[#0B0B0B] border border-[#D4AF37] px-3 py-1 text-xs font-bold text-[#D4AF37]"
                    >
                      {city}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-[#1A1A1A] border border-[#D4AF37]/30 p-5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-[#D4AF37] font-extrabold text-sm">
                  <Wrench className="h-4.5 w-4.5" />
                  <span>الصيانة</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-400 leading-relaxed font-medium">
                  نوفر الدعم الفني خلال فترة الضمان، والتشخيص عن بُعد، وإرسال فني متخصص عند الحاجة، بالإضافة إلى خدمات الصيانة الدورية.
                </p>
              </div>

              <div className="rounded-2xl bg-[#0F4C5C] border border-[#D4AF37] text-white p-5 space-y-3 shadow-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-extrabold text-[#D4AF37]">
                    تواصل مع <bdi>{siteConfig.partnerName}</bdi>
                  </p>
                  <div className="space-y-2 text-xs font-bold">
                    {partnerOrderWa && (
                      <div className="flex items-center justify-between gap-1 bg-black/20 px-3 py-2 rounded-xl">
                        <span className="text-gray-300">الطلبات:</span>
                        <a
                          href={partnerOrderWa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white hover:text-[#D4AF37]"
                        >
                          واتساب
                        </a>
                      </div>
                    )}
                    {partnerMaintWa && (
                      <div className="flex items-center justify-between bg-black/20 px-3 py-2 rounded-xl">
                        <span className="text-gray-300">الصيانة:</span>
                        <a
                          href={partnerMaintWa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white hover:text-[#D4AF37]"
                        >
                          واتساب
                        </a>
                      </div>
                    )}
                    {partnerMaintenanceNewWa && (
                      <div className="flex items-center justify-between bg-black/20 px-3 py-2 rounded-xl">
                        <span className="text-gray-300">التركيب والصيانة:</span>
                        <a
                          href={partnerMaintenanceNewWa}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white hover:text-[#D4AF37]"
                        >
                          01005089640
                        </a>
                      </div>
                    )}
                    {partnerSocialLinks.map((sl) => (
                      <a
                        key={sl.id}
                        href={sl.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[38px] w-full items-center justify-center gap-1.5 rounded-xl bg-black/40 hover:bg-black px-3 py-2 text-xs font-bold text-[#D4AF37] border border-[#D4AF37]/60 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{sl.label}</span>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. OUR VISION SECTION */}
        <section className="bg-gradient-to-br from-[#0B0B0B] via-[#082E38] to-[#0B0B0B] text-white py-12 sm:py-16 border-t border-[#D4AF37]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 text-center">
            <div className="max-w-3xl space-y-3 mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full bg-[#0F4C5C]/20 px-4 py-1.5 text-xs font-extrabold text-[#D4AF37] border border-[#D4AF37]/50">
                <Award className="h-4 w-4 text-[#D4AF37]" />
                <span>رؤيتنا | Vision</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                {siteConfig.visionTitle}
              </h2>
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-medium">
                {siteConfig.visionDescription}
              </p>
            </div>

            <div className="pt-4 flex justify-center">
              <button
                type="button"
                onClick={onBackToStore}
                className="inline-flex min-h-[50px] items-center justify-center gap-3 rounded-2xl bg-[#0F4C5C] hover:bg-[#0A3D4A] text-white active:scale-95 px-8 py-3 text-sm sm:text-base font-extrabold shadow-xl border border-[#D4AF37] transition-all cursor-pointer"
              >
                <ArrowRight className="h-5 w-5" />
                <span>العودة للمتجر</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer onAdminButtonClick={onAdminButtonClick} showAboutSection={false} isDark={true} />
    </div>
  );
}

