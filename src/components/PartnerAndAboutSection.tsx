import {
  Award,
  BellRing,
  Camera,
  CheckCircle2,
  ExternalLink,
  Flame,
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
import { useSiteConfig } from '../contexts/SiteConfigContext';
import { PARTNER_INFO, STORE_INFO } from '../types/store';

const STORE_PRODUCTS_LIST = [
  {
    title: 'كاميرات المراقبة',
    description: 'كاميرات IP وAnalog، وأجهزة التسجيل، ومستلزمات التوصيل.',
    Icon: Camera,
  },
  {
    title: 'الستالايت والرسيفرات',
    description: 'رسيفرات متنوعة، وأطباق الدش، والعدسات، والريموتات، والكابلات، ومستلزمات الدش المركزي.',
    Icon: Radio,
  },
  {
    title: 'أنظمة الصوتيات',
    description: 'سماعات السقف والسماعات المعلقة ومستلزمات أنظمة الصوت والسويس سيستم.',
    Icon: Volume2,
  },
  {
    title: 'إضاءة LED Profile',
    description: 'بروفايلات الإضاءة الديكورية ومستلزمات التركيب والتوصيل.',
    Icon: Lightbulb,
  },
  {
    title: 'أنظمة الإنذار المبكر',
    description: 'أجهزة الإنذار والاستشعار ومستلزماتها.',
    Icon: BellRing,
  },
  {
    title: 'أنظمة إنذار الحريق',
    description: 'كواشف الدخان والحرارة، وأجهزة التنبيه، ولوحات التحكم ومستلزماتها.',
    Icon: Flame,
  },
];

const INFINITY_SERVICES_LIST = [
  {
    num: '1',
    title: 'تركيب كاميرات المراقبة',
    description: 'تركيب كاميرات المراقبة بنظامي IP وAnalog، وتجهيز أنظمة التسجيل والمشاهدة عن بُعد، وصيانة الأنظمة التي قامت الشركة بتركيبها.',
    Icon: Camera,
  },
  {
    num: '2',
    title: 'أنظمة الستالايت والدش المركزي',
    description: 'تركيب وصيانة أنظمة الدش العادي والمركزي للمنازل والفنادق والمنتجعات والقرى السياحية.',
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
    description: 'تنفيذ وتركيب إضاءة البروفايل الديكورية للأسقف والحوائط والمنازل والمحلات، مع توفير حلول تناسب طبيعة كل مكان والميزانية المتاحة.',
    Icon: Lightbulb,
  },
  {
    num: '5',
    title: 'أنظمة الإنذار المبكر',
    description: 'تركيب وتجهيز أنظمة الإنذار وأجهزة الاستشعار والتنبيه المناسبة للمباني والمنشآت.',
    Icon: BellRing,
  },
  {
    num: '6',
    title: 'أنظمة إنذار الحريق',
    description: 'تركيب وتجهيز أنظمة إنذار الحريق وكواشف الدخان والحرارة وأجهزة التنبيه، وفقًا لمتطلبات السلامة والمعايير المعمول بها.',
    Icon: Flame,
  },
];

export function PartnerAndAboutSection() {
  const siteConfig = useSiteConfig();
  return (
    <div id="about-us" className="space-y-0">
      {/* HEADER BANNER */}
      <section className="bg-gradient-to-r from-[#0B1F3A] via-[#1D4ED8] to-[#0284C7] text-white py-12 sm:py-16 border-t border-b border-[#38BDF8]/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-extrabold text-[#7DD3FC] border border-white/15">
            <Sparkles className="h-4 w-4 text-[#38BDF8]" />
            <span>من نحن | About Us</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            المحلاوي ستور <span className="text-[#7DD3FC]">×</span> Infinity Corp
          </h1>
          <p className="text-sm sm:text-base text-[#E0F2FE] max-w-2xl mx-auto font-medium leading-relaxed">
            كل احتياجاتك من الأجهزة والأنظمة الفنية في مكان واحد! نوفر لك جودة المنتجات والأسعار التنافسية والتركيبات الفنية المعتمدة.
          </p>
        </div>
      </section>

      {/* 1. SECTION 1: EL MAHLAWY STORE */}
      <section
        id="about-store"
        aria-labelledby="about-store-heading"
        className="bg-white py-12 sm:py-16 border-b border-[#D8EEFB]"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Top Brand Identity */}
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-lg bg-[#F2FAFF] border border-[#CBE7FA] px-3 py-1 text-xs font-bold text-[#1D4ED8]">
              <Package className="h-3.5 w-3.5" />
              <span>المتجر الرسمي والبيع المباشر</span>
            </div>
            <h2
              id="about-store-heading"
              className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]"
            >
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
                  className="rounded-2xl bg-[#F2FAFF] border border-[#CBE7FA] p-4 sm:p-5 flex flex-col justify-between hover:border-[#0284C7] transition-colors"
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

          {/* Info Details Grid: Shipping, Address, After Sales, Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {/* Address */}
            <div className="rounded-2xl bg-white border border-[#CBE7FA] p-4 space-y-2 shadow-xs flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[#1D4ED8] font-extrabold text-xs sm:text-sm">
                  <MapPin className="h-4 w-4 shrink-0 text-[#0284C7]" />
                  <span>عنوان المتجر والموقع الجغرافي</span>
                </div>
                <p className="text-xs sm:text-sm text-[#0B1F3A] font-semibold leading-relaxed">
                  {siteConfig.address || STORE_INFO.address}
                </p>
              </div>
              {siteConfig.googleMapsUrl && (
                <a
                  href={siteConfig.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[38px] items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] px-3 py-2 text-xs font-extrabold text-white transition-colors mt-2"
                >
                  <MapPin className="h-4 w-4 text-[#7DD3FC] shrink-0" aria-hidden="true" />
                  <span>موقعنا على خرائط Google</span>
                  <ExternalLink className="h-3.5 w-3.5 text-white/80 shrink-0" aria-hidden="true" />
                </a>
              )}
            </div>

            {/* Shipping & Delivery */}
            <div className="rounded-2xl bg-white border border-[#CBE7FA] p-4 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-[#1D4ED8] font-extrabold text-xs sm:text-sm">
                <Truck className="h-4 w-4 shrink-0 text-[#0284C7]" />
                <span>الشحن والتوصيل</span>
              </div>
              <ul className="space-y-1.5 text-xs sm:text-sm text-[#0B1F3A] font-medium">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>📦 شحن إلى جميع محافظات مصر.</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>🛵 توصيل داخل شرم الشيخ عن طريق الدليفري.</span>
                </li>
              </ul>
            </div>

            {/* Customer Service & After Sales */}
            <div className="rounded-2xl bg-white border border-[#CBE7FA] p-4 space-y-2 shadow-xs">
              <div className="flex items-center gap-2 text-[#1D4ED8] font-extrabold text-xs sm:text-sm">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#0284C7]" />
                <span>خدمة العملاء وما بعد البيع</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                مساعدة العملاء في معرفة المواصفات والأسعار. تتوفر إمكانية الاستبدال أو الاسترجاع وفقًا لسياسة المتجر وشروط الضمان.
              </p>
            </div>

            {/* Direct Contact Card */}
            <div className="rounded-2xl bg-[#0B1F3A] text-white p-4 space-y-3 flex flex-col justify-between shadow-xs">
              <div>
                <p className="text-xs font-extrabold text-[#7DD3FC] mb-1">تواصل مع المحلاوي ستور</p>
                <div className="flex items-center justify-between text-xs font-bold bg-white/10 px-3 py-2 rounded-xl mb-2">
                  <span className="text-[#BAE6FD]">طلبات الشراء:</span>
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
                className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#22bf5b] px-3 py-2 text-xs font-extrabold text-white transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                <span>تواصل عبر واتساب الطلبات</span>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 2. SECTION 2: INFINITY CORP */}
      <section
        id="infinity-corp"
        aria-labelledby="infinity-corp-heading"
        className="bg-[#F2FAFF] py-12 sm:py-16 border-b border-[#D8EEFB]"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          {/* Top Identity */}
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-lg bg-white border border-[#CBE7FA] px-3 py-1 text-xs font-bold text-[#1D4ED8]">
              <Award className="h-3.5 w-3.5 text-[#0284C7]" />
              <span>شريك النجاح | Infinity Corp</span>
            </div>
            <h2
              id="infinity-corp-heading"
              className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]"
            >
              شركة Infinity Corp للتركيبات الفنية والصيانة
            </h2>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
              تُعد Infinity Corp شركة متخصصة في التركيبات الفنية والصيانة الدورية وخدمة ما بعد البيع للأنظمة التي تقوم بتركيبها، وتقدم خدماتها للأفراد والشركات والفنادق والمنتجعات السياحية والمحلات التجارية داخل محافظة جنوب سيناء.
            </p>
          </div>

          {/* 6 Technical Services Grid */}
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-[#0B1F3A] mb-4 flex items-center gap-2">
              <Wrench className="h-5 w-5 text-[#1D4ED8]" />
              <span>خدماتنا الفنية المتخصصة</span>
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

          {/* Scope, Maintenance & Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            {/* Scope */}
            <div className="rounded-2xl bg-white border border-[#CBE7FA] p-5 space-y-3 shadow-xs">
              <div className="flex items-center gap-2 text-[#1D4ED8] font-extrabold text-sm">
                <MapPin className="h-4.5 w-4.5 text-[#0284C7]" />
                <span>📍 نطاق خدماتنا</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                نقدم خدماتنا في جميع أنحاء جنوب سيناء:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {PARTNER_INFO.serviceScope.map((city) => (
                  <span
                    key={city}
                    className="rounded-lg bg-[#F2FAFF] border border-[#CBE7FA] px-2.5 py-1 text-xs font-bold text-[#0B1F3A]"
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
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
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

      {/* 3. SECTION 3: OUR VISION (رؤيتنا) */}
      <section
        id="our-vision"
        className="bg-gradient-to-br from-[#0B1F3A] via-[#1545A3] to-[#0284C7] text-white py-12 sm:py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="max-w-3xl space-y-3 text-center mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-extrabold text-[#7DD3FC] border border-white/15">
              <Award className="h-4 w-4 text-[#38BDF8]" />
              <span>رؤيتنا | Our Vision</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              هدفنا تقديم تجربة فنية متكاملة وموثوقة
            </h2>
            <p className="text-sm sm:text-base text-[#E0F2FE] leading-relaxed font-medium">
              نسعى إلى توفير المنتجات والأجهزة الفنية المناسبة، وتقديم خدمات تركيب وصيانة موثوقة، مع الاهتمام بجودة الخدمة وسهولة التواصل مع العملاء.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* El Mahlawy Card */}
            <div className="rounded-3xl bg-white/10 border border-white/20 p-6 space-y-3 backdrop-blur-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1D4ED8] text-white font-extrabold text-lg">
                  1
                </span>
                <h3 className="text-lg font-extrabold text-white">
                  المحلاوي ستور | <bdi className="text-[#7DD3FC]">El Mahlawy Store</bdi>
                </h3>
              </div>
              <p className="text-sm text-[#E0F2FE] font-medium leading-relaxed">
                منتجات متنوعة، وأسعار تنافسية، وشحن لجميع محافظات مصر.
              </p>
            </div>

            {/* Infinity Corp Card */}
            <div className="rounded-3xl bg-white/10 border border-white/20 p-6 space-y-3 backdrop-blur-xs">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0284C7] text-white font-extrabold text-lg">
                  2
                </span>
                <h3 className="text-lg font-extrabold text-white">
                  Infinity Corp
                </h3>
              </div>
              <p className="text-sm text-[#E0F2FE] font-medium leading-relaxed">
                حلول فنية وتركيبات وصيانة ودعم ما بعد البيع في جنوب سيناء.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
