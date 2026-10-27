import { ExternalLink, MessageCircle, Phone } from 'lucide-react';
import { PARTNER_INFO, STORE_INFO } from '../types/store';

export function Footer() {
  return (
    <footer
      id="footer-contact"
      className="bg-[#081A33] text-white border-t border-[#163663]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
        {/* Section Heading: تواصل معنا */}
        <div className="mb-10">
          <p className="text-xs sm:text-sm font-bold text-[#38BDF8] mb-1.5">
            قنوات التواصل الرسمية والمباشرة
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">تواصل معنا</h2>
        </div>

        {/* Dual Official Contact Cards: El Mahlawy Store & Infinity Corp */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-12">
          {/* Card 1: المحلاوي ستور | El Mahlawy Store */}
          <div className="flex flex-col justify-between rounded-3xl bg-[#0E264A] border border-[#1E3F73] p-6 sm:p-7">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1D4ED8] to-[#38BDF8] text-white"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                    <path d="M3 6h18" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white">
                    {STORE_INFO.storeName} <span className="text-[#38BDF8]">|</span>{' '}
                    <bdi>{STORE_INFO.storeSubtitle}</bdi>
                  </h3>
                  <p className="text-xs text-[#BAE6FD]">{STORE_INFO.tagline}</p>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-4">
                <strong className="text-white">العنوان:</strong> {STORE_INFO.address}
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-[#1E3F73]">
              <div className="flex items-center justify-between gap-2 text-xs text-[#BAE6FD]">
                <span>رقم الطلبات والاتصال</span>
                <a
                  href={`tel:${STORE_INFO.primaryPhone}`}
                  dir="ltr"
                  className="font-num text-sm font-bold text-white hover:text-[#38BDF8]"
                >
                  {STORE_INFO.primaryPhone}
                </a>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-[#BAE6FD]">
                <span>خدمة ما بعد البيع</span>
                <a
                  href={`tel:${STORE_INFO.secondaryPhone}`}
                  dir="ltr"
                  className="font-num text-sm font-bold text-white hover:text-[#38BDF8]"
                >
                  {STORE_INFO.secondaryPhone}
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
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
                  <span>ما بعد البيع</span>
                </a>
              </div>

              <a
                href={STORE_INFO.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-white/6 hover:bg-white/12 border border-[#254C88] px-4 py-2 text-xs sm:text-sm font-bold text-[#E0F2FE] transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-[#38BDF8] shrink-0" aria-hidden="true" />
                <span>صفحة المحلاوي ستور على Facebook</span>
              </a>

              <div className="text-center pt-2">
                <span className="text-xs font-bold text-[#38BDF8]">✨ {STORE_INFO.closingPhrase}</span>
              </div>
            </div>
          </div>

          {/* Card 2: Infinity Corp | Smart Home & Technical Solutions */}
          <div className="flex flex-col justify-between rounded-3xl bg-[#0E264A] border border-[#1E3F73] p-6 sm:p-7">
            <div>
              <div className="mb-3">
                <p className="text-xs font-bold text-[#38BDF8] mb-0.5">{PARTNER_INFO.roleTitle}</p>
                <h3 className="text-lg sm:text-xl font-extrabold text-white">
                  <bdi>{PARTNER_INFO.partnerName}</bdi> <span className="text-[#38BDF8]">|</span>{' '}
                  <bdi className="text-sm sm:text-base font-bold text-[#BAE6FD]">
                    {PARTNER_INFO.partnerSubtitle}
                  </bdi>
                </h3>
              </div>

              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-4">
                نطاق الخدمة بجنوب سيناء: <span className="text-[#38BDF8] font-bold">{PARTNER_INFO.serviceScope.join('، ')}</span>
              </p>
            </div>

            <div className="space-y-3 pt-2 border-t border-[#1E3F73]">
              <div className="flex items-center justify-between gap-2 text-xs text-[#BAE6FD]">
                <span>طلبات الشراء والاستفسارات</span>
                <span dir="ltr" className="font-num text-xs font-bold text-white">
                  {PARTNER_INFO.orderPhones.join(' / ')}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-[#BAE6FD]">
                <span>التركيب والصيانة الدورية</span>
                <a
                  href={`tel:${PARTNER_INFO.maintenancePhone}`}
                  dir="ltr"
                  className="font-num text-xs font-bold text-white hover:text-[#38BDF8]"
                >
                  {PARTNER_INFO.maintenancePhone}
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <a
                  href={PARTNER_INFO.orderWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#22bf5b] px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white transition-colors"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>واتساب الطلبات</span>
                </a>

                <a
                  href={PARTNER_INFO.maintenanceWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#0284C7] hover:bg-[#0369A1] px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white transition-colors"
                >
                  <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>واتساب الصيانة</span>
                </a>
              </div>

              <a
                href={PARTNER_INFO.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-white/6 hover:bg-white/12 border border-[#254C88] px-4 py-2 text-xs sm:text-sm font-bold text-[#E0F2FE] transition-colors"
              >
                <ExternalLink className="h-4 w-4 text-[#38BDF8] shrink-0" aria-hidden="true" />
                <span>صفحة Infinity Corp على Facebook</span>
              </a>

              <div className="text-center pt-2">
                <span className="text-xs font-bold text-[#38BDF8]">✨ {PARTNER_INFO.closingPhrase}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Closing Partnership Summary & Copyright */}
        <div className="border-t border-[#163663] pt-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <p className="text-base font-extrabold text-white">
                المحلاوي ستور × <bdi>Infinity Corp</bdi>
              </p>
              <p className="text-xs sm:text-sm text-[#BAE6FD]/90 leading-relaxed">
                منتجات متنوعة، وحلول تقنية متكاملة، وتركيب احترافي، ودعم فني وخدمة ما بعد البيع
                وفقًا لشروط كل خدمة.
              </p>
            </div>

            <p className="text-xs sm:text-sm font-bold text-[#38BDF8]">
              تابعونا لمعرفة أحدث المنتجات والخدمات وكل جديد!
            </p>
          </div>

          <div className="pt-4 border-t border-[#122C52] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
            <p>
              © {new Date().getFullYear()} {STORE_INFO.storeName} |{' '}
              <bdi>{STORE_INFO.storeSubtitle}</bdi>. جميع الحقوق محفوظة.
            </p>
            <p className="text-[#BAE6FD]/75">
              شركاء النجاح: <bdi>{PARTNER_INFO.partnerName}</bdi> ·{' '}
              <bdi>{PARTNER_INFO.partnerSubtitle}</bdi>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
