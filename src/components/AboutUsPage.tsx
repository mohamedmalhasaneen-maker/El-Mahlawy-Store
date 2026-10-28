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
  Phone,
  Radio,
  ShieldCheck,
  Sparkles,
  Truck,
  Volume2,
  Wrench,
} from 'lucide-react';
import { PARTNER_INFO, STORE_INFO } from '../types/store';
import { Footer } from './Footer';

interface AboutUsPageProps {
  onBackToStore: () => void;
  onAdminButtonClick?: () => void;
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

export function AboutUsPage({ onBackToStore, onAdminButtonClick }: AboutUsPageProps) {
  return (
    <div className="min-h-screen bg-white text-[#0B1F3A] flex flex-col">
      {/* Top Standalone Header Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#D8EEFB]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={onBackToStore}
            className="inline-flex items-center gap-2 text-sm sm:text-base font-extrabold text-[#0B1F3A] hover:text-[#1D4ED8] transition-colors cursor-pointer"
          >
            <img
              src="/logo.png"
              alt={STORE_INFO.storeName}
              className="h-9 w-9 rounded-xl object-contain shadow-xs bg-white"
            />
            <span>
              {STORE_INFO.storeName} <span className="text-[#0284C7]">|</span>{' '}
              <bdi className="text-[#1E3A8A]">{STORE_INFO.storeSubtitle}</bdi>
            </span>
          </button>

          <button
            type="button"
            onClick={onBackToStore}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#F2FAFF] hover:bg-[#E2F3FE] border border-[#CBE7FA] px-4 py-2 text-xs sm:text-sm font-extrabold text-[#1D4ED8] transition-colors cursor-pointer"
          >
            <ArrowRight className="h-4 w-4" />
            <span>العودة إلى الصفحة الرئيسية</span>
          </button>
        </div>
      </header>

      <main className="flex-1 space-y-0">
        {/* HERO BANNER */}
        <section className="bg-gradient-to-r from-[#0B1F3A] via-[#1D4ED8] to-[#0284C7] text-white py-12 sm:py-16 px-4">
          <div className="mx-auto max-w-5xl text-center space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-extrabold text-[#7DD3FC] border border-white/15">
              <Sparkles className="h-4 w-4 text-[#38BDF8]" />
              <span>صفحة مستقلة · من نحن | About Us</span>
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              المحلاوي ستور <span className="text-[#7DD3FC]">×</span> Infinity Corp
            </h1>

            <p className="text-sm sm:text-lg text-[#E0F2FE] max-w-3xl mx-auto font-medium leading-relaxed">
              تعرّف على معلومات المحلاوي ستور وشريك النجاح شركة Infinity Corp بالكامل، وتصفّح منتجاتنا، وخدماتنا الفنية، ونطاق عملنا، وعناويننا وأرقام التواصل المباشرة.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={onBackToStore}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-white hover:bg-[#F0F9FF] text-[#0B1F3A] px-5 py-2.5 text-xs sm:text-sm font-extrabold shadow-lg transition-colors cursor-pointer"
              >
                <Home className="h-4 w-4 text-[#1D4ED8]" />
                <span>تصفح المنتجات في الصفحة الرئيسية</span>
              </button>
            </div>
          </div>
        </section>

        {/* 1. EL MAHLAWY STORE SECTION */}
        <section className="bg-white py-12 sm:py-16 border-b border-[#D8EEFB]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Header Badge & Title */}
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-lg bg-[#F2FAFF] border border-[#CBE7FA] px-3 py-1 text-xs font-bold text-[#1D4ED8]">
                <Package className="h-3.5 w-3.5" />
                <span>المتجر الرسمي والبيع المباشر</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]">
                المحلاوي ستور | <bdi className="text-[#0284C7]">El Mahlawy Store</bdi>
              </h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
                المحلاوي ستور هو وجهتك لشراء الأجهزة والمعدات ومستلزمات الأنظمة الفنية بأسعار تنافسية، مع توفير مجموعة متنوعة من المنتجات التي تلبي احتياجات الأفراد والشركات والمحلات والمنشآت التجارية. نوفر الشحن لجميع محافظات مصر، بالإضافة إلى خدمة التوصيل داخل شرم الشيخ.
              </p>
            </div>

            {/* Products Grid */}
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#0B1F3A] mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#0284C7]" />
                <span>منتجاتنا الأساسية والمتنوعة</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {STORE_PRODUCTS_LIST.map(({ title, description, Icon }) => (
                  <div
                    key={title}
                    className="rounded-2xl bg-[#F2FAFF] border border-[#CBE7FA] p-5 flex flex-col justify-between hover:border-[#0284C7] transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-[#D8EEFB] text-[#1D4ED8] shadow-xs">
                          <Icon className="h-5 w-5" />
                        </span>
                        <h4 className="text-sm sm:text-base font-extrabold text-[#0B1F3A]">
                          {title}
                        </h4>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
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
              <div className="rounded-2xl bg-white border border-[#CBE7FA] p-5 space-y-2.5 shadow-xs">
                <div className="flex items-center gap-2 text-[#1D4ED8] font-extrabold text-sm">
                  <MapPin className="h-4.5 w-4.5 shrink-0 text-[#0284C7]" />
                  <span>عنوان المتجر</span>
                </div>
                <p className="text-xs sm:text-sm text-[#0B1F3A] font-semibold leading-relaxed">
                  {STORE_INFO.address}
                </p>
              </div>

              {/* Shipping & Delivery */}
              <div className="rounded-2xl bg-white border border-[#CBE7FA] p-5 space-y-2.5 shadow-xs">
                <div className="flex items-center gap-2 text-[#1D4ED8] font-extrabold text-sm">
                  <Truck className="h-4.5 w-4.5 shrink-0 text-[#0284C7]" />
                  <span>الشحن والتوصيل</span>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-[#0B1F3A] font-medium">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>📦 شحن متاح لجميع محافظات مصر.</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    <span>🛵 توصيل داخل شرم الشيخ عن طريق الدليفري.</span>
                  </li>
                </ul>
              </div>

              {/* Customer Support */}
              <div className="rounded-2xl bg-white border border-[#CBE7FA] p-5 space-y-2.5 shadow-xs">
                <div className="flex items-center gap-2 text-[#1D4ED8] font-extrabold text-sm">
                  <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-[#0284C7]" />
                  <span>خدمة العملاء وما بعد البيع</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  مساعدة العملاء في معرفة المواصفات والأسعار. تتوفر إمكانية الاستبدال أو الاسترجاع وفقًا لسياسة المتجر وشروط الضمان المعلنة.
                </p>
              </div>

              {/* Store Direct Contact Card */}
              <div className="rounded-2xl bg-[#0B1F3A] text-white p-5 space-y-3 flex flex-col justify-between shadow-xs">
                <div>
                  <p className="text-xs font-extrabold text-[#7DD3FC] mb-1">
                    تواصل مع المحلاوي ستور
                  </p>
                  <div className="flex items-center justify-between text-xs font-bold bg-white/10 px-3 py-2 rounded-xl mb-2">
                    <span className="text-[#BAE6FD]">رقم الاتصال:</span>
                    <a
                      href={`tel:${STORE_INFO.primaryPhone}`}
                      dir="ltr"
                      className="font-num text-white hover:text-[#7DD3FC]"
                    >
                      {STORE_INFO.primaryPhone}
                    </a>
                  </div>
                </div>

                <a
                  href={STORE_INFO.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#22bf5b] px-3 py-2.5 text-xs sm:text-sm font-extrabold text-white transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>تواصل عبر واتساب الطلبات</span>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* 2. INFINITY CORP SECTION */}
        <section className="bg-[#F2FAFF] py-12 sm:py-16 border-b border-[#D8EEFB]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
            {/* Header Identity */}
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-lg bg-white border border-[#CBE7FA] px-3 py-1 text-xs font-bold text-[#1D4ED8]">
                <Award className="h-3.5 w-3.5 text-[#0284C7]" />
                <span>شركاء النجاح | Infinity Corp</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]">
                شركة Infinity Corp للتركيبات الفنية والصيانة
              </h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
                تُعد Infinity Corp شركة متخصصة في التركيبات الفنية والصيانة الدورية وخدمة ما بعد البيع للأنظمة التي تقوم بتركيبها، وتقدم خدماتها للأفراد والشركات والفنادق والمنتجعات السياحية والمحلات التجارية داخل محافظة جنوب سيناء.
              </p>
            </div>

            {/* Technical Services Grid */}
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-[#0B1F3A] mb-4 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-[#1D4ED8]" />
                <span>الخدمات الفنية المتخصصة</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {INFINITY_SERVICES_LIST.map(({ num, title, description, Icon }) => (
                  <div
                    key={title}
                    className="rounded-2xl bg-white border border-[#CBE7FA] p-5 flex flex-col justify-between shadow-xs hover:border-[#1D4ED8] transition-colors"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2FAFF] border border-[#D8EEFB] text-[#1D4ED8]">
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="font-num text-xs font-extrabold bg-[#F2FAFF] border border-[#CBE7FA] px-2.5 py-1 rounded-lg text-[#1D4ED8]">
                          خدمة #{num}
                        </span>
                      </div>
                      <h4 className="text-sm sm:text-base font-extrabold text-[#0B1F3A]">
                        {title}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scope, Maintenance & Infinity Corp Contact Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              {/* Scope */}
              <div className="rounded-2xl bg-white border border-[#CBE7FA] p-5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-[#1D4ED8] font-extrabold text-sm">
                  <MapPin className="h-4.5 w-4.5 text-[#0284C7]" />
                  <span>📍 نطاق خدماتنا في جنوب سيناء</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  نقدم خدماتنا في المدن التالية:
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  {PARTNER_INFO.serviceScope.map((city) => (
                    <span
                      key={city}
                      className="rounded-lg bg-[#F2FAFF] border border-[#CBE7FA] px-3 py-1 text-xs font-bold text-[#0B1F3A]"
                    >
                      {city}
                    </span>
                  ))}
                </div>
              </div>

              {/* Maintenance & Support */}
              <div className="rounded-2xl bg-white border border-[#CBE7FA] p-5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2 text-[#1D4ED8] font-extrabold text-sm">
                  <Wrench className="h-4.5 w-4.5 text-[#0284C7]" />
                  <span>🛠️ الصيانة وخدمة ما بعد البيع</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
                  نوفر الدعم الفني خلال فترة الضمان وفقًا لشروطه، والتشخيص عن بُعد متى أمكن، وإرسال فني متخصص عند الحاجة، بالإضافة إلى خدمات الصيانة الدورية للأنظمة التي قامت الشركة بتركيبها.
                </p>
              </div>

              {/* Infinity Corp Direct Contacts */}
              <div className="rounded-2xl bg-[#0E264A] border border-[#1E3F73] text-white p-5 space-y-3 shadow-xs flex flex-col justify-between">
                <div className="space-y-2">
                  <p className="text-xs font-extrabold text-[#7DD3FC]">أرقام التواصل مع Infinity Corp (اضغط لفتح واتساب)</p>
                  <div className="space-y-2 text-xs font-bold">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 bg-white/10 px-3 py-2 rounded-xl">
                      <span className="text-[#BAE6FD]">طلبات الشراء والاستفسارات:</span>
                      <div className="flex items-center gap-2 font-num">
                        <a
                          href={`https://wa.me/20${PARTNER_INFO.orderPhones[0]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-white hover:text-[#25D366] transition-colors"
                          title={`فتح واتساب لـ ${PARTNER_INFO.orderPhones[0]}`}
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                          <span>{PARTNER_INFO.orderPhones[0]}</span>
                        </a>
                        <span className="text-white/40">/</span>
                        <a
                          href={`https://wa.me/20${PARTNER_INFO.orderPhones[1]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-white hover:text-[#25D366] transition-colors"
                          title={`فتح واتساب لـ ${PARTNER_INFO.orderPhones[1]}`}
                        >
                          <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                          <span>{PARTNER_INFO.orderPhones[1]}</span>
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-white/10 px-3 py-2 rounded-xl">
                      <span className="text-[#BAE6FD]">التركيب والصيانة الدورية:</span>
                      <a
                        href={`https://wa.me/20${PARTNER_INFO.maintenancePhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        dir="ltr"
                        className="inline-flex items-center gap-1 font-num text-white hover:text-[#25D366] transition-colors"
                        title={`فتح واتساب لـ ${PARTNER_INFO.maintenancePhone}`}
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                        <span>{PARTNER_INFO.maintenancePhone}</span>
                      </a>
                    </div>

                    <div className="flex items-center justify-between bg-white/10 px-3 py-2 rounded-xl">
                      <span className="text-[#BAE6FD]">خدمة ما بعد البيع:</span>
                      <a
                        href={`https://wa.me/20${PARTNER_INFO.afterSalesPhone}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        dir="ltr"
                        className="inline-flex items-center gap-1 font-num text-white hover:text-[#25D366] transition-colors"
                        title={`فتح واتساب لـ ${PARTNER_INFO.afterSalesPhone}`}
                      >
                        <MessageCircle className="h-3.5 w-3.5 text-[#25D366]" />
                        <span>{PARTNER_INFO.afterSalesPhone}</span>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <a
                    href={PARTNER_INFO.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[38px] w-full items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 text-xs font-bold text-white transition-colors"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-[#7DD3FC]" />
                    <span>صفحة Infinity Corp على Facebook</span>
                  </a>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 3. OUR VISION SECTION */}
        <section className="bg-gradient-to-br from-[#0B1F3A] via-[#1545A3] to-[#0284C7] text-white py-12 sm:py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8 text-center">
            <div className="max-w-3xl space-y-3 mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-extrabold text-[#7DD3FC] border border-white/15">
                <Award className="h-4 w-4 text-[#38BDF8]" />
                <span>رؤيتنا | Our Vision</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                تقديم تجربة فنية متكاملة وموثوقة
              </h2>
              <p className="text-sm sm:text-base text-[#E0F2FE] leading-relaxed font-medium">
                نسعى إلى توفير المنتجات والأجهزة الفنية المناسبة، وتقديم خدمات تركيب وصيانة موثوقة، مع الاهتمام بجودة الخدمة وسهولة التواصل مع العملاء.
              </p>
            </div>

            <div className="pt-4 flex justify-center">
              <button
                type="button"
                onClick={onBackToStore}
                className="inline-flex min-h-[50px] items-center justify-center gap-3 rounded-2xl bg-white hover:bg-[#F0F9FF] text-[#0B1F3A] active:scale-95 px-8 py-3 text-sm sm:text-base font-extrabold shadow-xl transition-all cursor-pointer"
              >
                <ArrowRight className="h-5 w-5 text-[#1D4ED8]" />
                <span>العودة إلى المتجر والصفحة الرئيسية</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer onAdminButtonClick={onAdminButtonClick} showAboutSection={false} />
    </div>
  );
}
