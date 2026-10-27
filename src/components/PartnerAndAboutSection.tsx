import {
  BellRing,
  Camera,
  CheckCircle2,
  ExternalLink,
  Home,
  KeyRound,
  Lightbulb,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Radio,
  ShieldCheck,
  Truck,
  Wrench,
} from 'lucide-react';
import { PARTNER_INFO, STORE_INFO } from '../types/store';

const STORE_OFFERINGS = [
  'عرض المنتجات والأجهزة المتاحة.',
  'عرض صور المنتجات وتفاصيلها ومواصفاتها.',
  'استعراض أحدث المنتجات والموديلات.',
  'مساعدة العملاء على التعرف على الإمكانيات واختيار المنتجات المناسبة.',
  'استقبال استفسارات العملاء عن المنتجات والأسعار والتوافر.',
];

const INFINITY_SERVICES = [
  {
    title: 'أنظمة المنزل الذكي (Smart Home)',
    description: 'تجهيز وتركيب أنظمة التحكم الذكي في المنزل والأجهزة المتوافقة.',
    Icon: Home,
  },
  {
    title: 'كاميرات المراقبة',
    description: 'توريد وتركيب وتجهيز أنظمة المراقبة.',
    Icon: Camera,
  },
  {
    title: 'أنظمة الستالايت',
    description: 'تركيب وتجهيز أنظمة الستالايت.',
    Icon: Radio,
  },
  {
    title: 'إنذار الحريق (Fire Alarm)',
    description: 'توريد وتركيب وتجهيز أنظمة الإنذار.',
    Icon: BellRing,
  },
  {
    title: 'التحكم في الدخول (Access Control)',
    description: 'تركيب أنظمة التحكم في الدخول وفقًا لاحتياجات المكان.',
    Icon: KeyRound,
  },
  {
    title: 'التحكم الذكي في الإضاءة والأجهزة المنزلية',
    description: 'تجهيز حلول تساعد على التحكم في الأجهزة والإنارة بصورة ذكية.',
    Icon: Lightbulb,
  },
  {
    title: 'الصيانة والدعم الفني',
    description: 'تقديم خدمات الصيانة والمساعدة الفنية للأنظمة التي تتولى الشركة تنفيذها.',
    Icon: Wrench,
  },
  {
    title: 'الضمان وخدمة ما بعد البيع',
    description: 'وفقًا لشروط الضمان وطبيعة كل منتج أو خدمة.',
    Icon: ShieldCheck,
  },
];

export function PartnerAndAboutSection() {
  return (
    <>
      {/* 1. First Section: El Mahlawy Store */}
      <section
        id="about-store"
        aria-labelledby="about-store-heading"
        className="bg-white border-t border-[#D8EEFB] py-14 sm:py-18"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
            {/* Right Column: Identity & Overview */}
            <div className="lg:col-span-6 space-y-5">
              <div>
                <p className="text-xs sm:text-sm font-bold text-[#0284C7] mb-1">
                  {STORE_INFO.storeName} · <bdi>{STORE_INFO.storeSubtitle}</bdi>
                </p>
                <h2
                  id="about-store-heading"
                  className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] leading-snug"
                  style={{ textWrap: 'balance' }}
                >
                  المحلاوي ستور | <bdi>El Mahlawy Store</bdi>
                </h2>
              </div>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                هو الاسم الرئيسي للموقع والوجهة المتخصصة في عرض المنتجات والأجهزة الحديثة، واستعراض
                أحدث الموديلات والصور والمواصفات والإمكانيات، لمساعدة العملاء على التعرف على
                المنتجات المتاحة واختيار الأنسب لاحتياجاتهم.
              </p>

              {/* Address Card */}
              <div className="rounded-2xl bg-[#F2FAFF] border border-[#CBE7FA] p-5 space-y-2">
                <div className="flex items-center gap-2 text-[#1D4ED8] font-extrabold text-sm sm:text-base">
                  <MapPin className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>📍 عنوان المحل</span>
                </div>
                <p className="text-sm sm:text-base text-[#0B1F3A] font-semibold leading-relaxed">
                  {STORE_INFO.address}
                </p>
              </div>





              {/* Contact & WhatsApp */}
              <div className="rounded-2xl bg-[#0B1F3A] text-white p-5 space-y-4">
                <div className="flex items-center gap-2 text-[#38BDF8] font-extrabold text-sm sm:text-base">
                  <Package className="h-5 w-5 shrink-0" aria-hidden="true" />
                  <span>📩 الحجز والاستفسارات</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-200">
                  يمكن للعملاء التواصل عبر رسائل صفحة المتجر أو من خلال WhatsApp:
                </p>

                <div className="space-y-2 text-xs sm:text-sm font-bold">
                  <div className="flex items-center justify-between bg-white/10 px-3.5 py-2.5 rounded-xl">
                    <span className="text-[#BAE6FD] flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-[#38BDF8]" />
                      <span>رقم التواصل والطلبات</span>
                    </span>
                    <a
                      href={`tel:${STORE_INFO.primaryPhone}`}
                      dir="ltr"
                      className="inline-flex items-center gap-1.5 font-num text-white hover:text-[#38BDF8] transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5 text-[#38BDF8]" />
                      <span>{STORE_INFO.primaryPhone}</span>
                    </a>
                  </div>
                  <div className="flex items-center justify-between bg-white/10 px-3.5 py-2.5 rounded-xl">
                    <span className="text-[#BAE6FD] flex items-center gap-1.5">
                      <Phone className="h-4 w-4 text-[#38BDF8]" />
                      <span>خدمة ما بعد البيع</span>
                    </span>
                    <a
                      href={`tel:${STORE_INFO.secondaryPhone}`}
                      dir="ltr"
                      className="inline-flex items-center gap-1.5 font-num text-white hover:text-[#38BDF8] transition-colors"
                    >
                      <Phone className="h-3.5 w-3.5 text-[#38BDF8]" />
                      <span>{STORE_INFO.secondaryPhone}</span>
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  <a
                    href={STORE_INFO.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#22bf5b] px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white transition-colors"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>واتساب الطلبات</span>
                  </a>

                  <a
                    href={STORE_INFO.afterSalesWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white transition-colors"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>واتساب ما بعد البيع</span>
                  </a>
                </div>

                <a
                  href={STORE_INFO.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-xs sm:text-sm font-bold text-white transition-colors"
                >
                  <ExternalLink className="h-4 w-4 text-[#38BDF8] shrink-0" aria-hidden="true" />
                  <span>صفحة المحلاوي ستور على Facebook</span>
                </a>
              </div>


            </div>

            {/* Left Column: 5 Store Offerings */}
            <div className="lg:col-span-6">
              <div className="rounded-3xl bg-[#F2FAFF] border border-[#D8EEFB] p-6 sm:p-8 sticky top-24">
                <p className="text-xs font-bold text-[#1D4ED8] mb-4">
                  ماذا يقدم المحلاوي ستور؟
                </p>

                <ul className="divide-y divide-[#DCEFFB]">
                  {STORE_OFFERINGS.map((item, idx) => (
                    <li
                      key={item}
                      className="flex items-start gap-3 py-3.5 first:pt-0 last:pb-0 text-sm sm:text-base font-semibold text-[#0B1F3A]"
                    >
                      <CheckCircle2
                        className="h-5 w-5 text-[#0284C7] shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                      <span className="flex-1 leading-relaxed">{item}</span>
                      <span className="font-num text-xs font-bold text-slate-400 pt-1">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Second Section: Infinity Corp – شريك النجاح */}
      <section
        id="infinity-corp"
        aria-labelledby="infinity-corp-heading"
        className="bg-[#F2FAFF] border-t border-[#D8EEFB] py-14 sm:py-18"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Partner Intro Header */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-end mb-10">
            <div className="lg:col-span-12 space-y-4">
              <p className="text-xs sm:text-sm font-bold text-[#0284C7]">
                {PARTNER_INFO.partnerSubtitle}
              </p>

              <h2
                id="infinity-corp-heading"
                className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A] leading-snug"
                style={{ textWrap: 'balance' }}
              >
                {PARTNER_INFO.roleTitle}
              </h2>

              <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                تعمل <strong className="font-bold text-[#0B1F3A]">Infinity Corp</strong> بصفتها شريك
                النجاح للمحلاوي ستور في تقديم الحلول التقنية والأنظمة الذكية وخدمات التركيب والتنفيذ
                والصيانة والدعم الفني.
              </p>

              {/* Service Scope & Delivery */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="rounded-2xl bg-white border border-[#CBE7FA] p-4 space-y-2">
                  <div className="flex items-center gap-2 text-[#1D4ED8] font-bold text-sm">
                    <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>📍 نطاق الخدمة في جنوب سيناء</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {PARTNER_INFO.serviceScope.map((city) => (
                      <span
                        key={city}
                        className="rounded-lg bg-[#F2FAFF] border border-[#D8EEFB] px-2.5 py-1 text-xs font-bold text-[#0B1F3A]"
                      >
                        {city}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-[#CBE7FA] p-4 space-y-2">
                  <div className="flex items-center gap-2 text-[#1D4ED8] font-bold text-sm">
                    <Truck className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>🚚 التوصيل والشحن</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed pt-1">
                    {PARTNER_INFO.deliveryScope}
                  </p>
                </div>
              </div>

              {/* After Sales Policy */}
              <div className="rounded-2xl bg-white border border-[#CBE7FA] p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-[#1D4ED8] font-bold text-sm">
                  <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>💬 خدمة ما بعد البيع</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {PARTNER_INFO.afterSalesPolicy}
                </p>
              </div>
            </div>


          </div>

          {/* 8 Services Grid */}
          <div className="mb-8 pt-4">
            <h3 className="text-base sm:text-lg font-extrabold text-[#0B1F3A] mb-5">
              خدمات <bdi>Infinity Corp</bdi> التقنية والفنية
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {INFINITY_SERVICES.map(({ title, description, Icon }) => (
                <div
                  key={title}
                  className="flex flex-col justify-between rounded-2xl bg-white border border-[#D8EEFB] p-5 transition-colors hover:border-[#7DD3FC] shadow-sm"
                >
                  <div>
                    <div className="mb-3.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] text-[#1D4ED8]">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h4 className="text-sm sm:text-base font-extrabold text-[#0B1F3A] leading-snug mb-2">
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

          <p className="text-xs sm:text-sm font-semibold text-[#0F294A] leading-relaxed border-t border-[#D8EEFB] pt-5">
            مع <bdi>Infinity Corp</bdi>، لا تقتصر الخدمة على شراء الجهاز فقط، بل تشمل أيضًا حلول
            التركيب والتنفيذ والدعم الفني بما يناسب احتياجات العميل.
          </p>
        </div>
      </section>

      {/* 3. Collaboration Summary Section */}
      <section
        id="partnership-section"
        aria-labelledby="partnership-heading"
        className="bg-gradient-to-bl from-[#0B2354] via-[#1545A3] to-[#0284C7] text-white py-14 sm:py-18"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-5 space-y-3">
              <p className="text-xs sm:text-sm font-bold text-[#BAE6FD]">
                تعاون متكامل لخدمة العميل
              </p>

              <h2
                id="partnership-heading"
                className="text-2xl sm:text-3xl font-extrabold text-white leading-snug"
                style={{ textWrap: 'balance' }}
              >
                المحلاوي ستور × <bdi>Infinity Corp</bdi>
              </h2>

              <p className="text-base sm:text-lg font-bold text-[#E0F2FE] leading-relaxed">
                منتجات تختارها، وحلول تنفذها، وخدمة تستمر معاك
              </p>
            </div>

            <div className="lg:col-span-7 space-y-4 text-sm sm:text-base text-[#E0F2FE]/95 leading-relaxed">
              <p>
                يجمع التعاون بين <strong className="font-extrabold text-white">المحلاوي ستور</strong>{' '}
                و<strong className="font-extrabold text-white">Infinity Corp</strong> بين عرض
                المنتجات والأجهزة ومساعدة العملاء على التعرف على مواصفاتها واختيار احتياجاتهم، وبين
                توفير خدمات الحلول التقنية والتركيب والتنفيذ والصيانة من خلال شريك النجاح.
              </p>

              <p>
                <strong className="font-extrabold text-white">المحلاوي ستور</strong> هو الوجهة
                الرئيسية لاستعراض المنتجات والتواصل بشأن الأسعار والتوافر، بينما تتولى{' '}
                <strong className="font-extrabold text-white">Infinity Corp</strong> تقديم خدمات
                الأنظمة الذكية والتركيبات والحلول الفنية التي تدخل ضمن نطاق خدماتها.
              </p>

              <p className="text-[#BAE6FD] font-semibold">
                هدفنا هو تقديم تجربة متكاملة وواضحة للعميل، من مرحلة التعرف على المنتجات واختيارها،
                إلى الاستفسار عن الخدمات المناسبة، ثم التركيب والدعم الفني عند الحاجة.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
