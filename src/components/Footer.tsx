import {
  ArrowLeft,
  Clock,
  ExternalLink,
  LayoutDashboard,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
  Users,
} from 'lucide-react';
import { useSiteConfig } from '../contexts/SiteConfigContext';
import { PARTNER_INFO } from '../types/store';
import { buildWhatsAppLinkFromPhone } from '../utils/siteConfig';

import { VisitorCounter } from './VisitorCounter';
import { RatingStatsDisplay } from './RatingStatsDisplay';

interface FooterProps {
  onAdminButtonClick?: () => void;
  onNavigateAbout?: () => void;
  showAboutSection?: boolean;
  showVisitorCounter?: boolean;
  isDark?: boolean;
  onOpenRatingModal?: () => void;
}

export function Footer({
  onAdminButtonClick,
  onNavigateAbout,
  showAboutSection = true,
  showVisitorCounter = false,
  isDark = false,
  onOpenRatingModal,
}: FooterProps = {}) {
  const siteConfig = useSiteConfig();

  const extraStoreChannels = siteConfig.contactChannels.filter(
    (ch) =>
      ch.owner === 'store' &&
      ch.id !== 'ch-store-orders' &&
      ch.id !== 'ch-store-aftersales'
  );
  const extraPartnerChannels = siteConfig.contactChannels.filter(
    (ch) => ch.owner === 'partner' && ch.id !== 'ch-partner-maintenance'
  );
  const extraStoreSocialLinks = (siteConfig.socialLinks || []).filter(
    (sl) => sl.owner === 'store' && Boolean(sl.url)
  );
  const extraPartnerSocialLinks = (siteConfig.socialLinks || []).filter(
    (sl) => sl.owner === 'partner' && Boolean(sl.url)
  );
  const extraBranches = siteConfig.branches.filter((br) => br.id !== 'branch-sharm-main');

  const partnerOrder1Wa = buildWhatsAppLinkFromPhone(siteConfig.partnerOrderPhone1);
  const partnerOrder2Wa = buildWhatsAppLinkFromPhone(siteConfig.partnerOrderPhone2);
  const partnerMaintenanceWa = buildWhatsAppLinkFromPhone(siteConfig.partnerMaintenancePhone);
  const partnerMaintenanceNewWa = buildWhatsAppLinkFromPhone('01005089640');
  const partnerAfterSalesWa = buildWhatsAppLinkFromPhone(siteConfig.partnerAfterSalesPhone);

  return (
    <footer className={`${isDark ? 'bg-[#0B0B0B]' : 'bg-[#081A33]'} text-white border-t ${isDark ? 'border-[#D4AF37]/35' : 'border-[#163663]'}`}>
      {/* 1. قسم «تواصل معنا» */}
      <div
        id="footer-contact"
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-12 sm:pb-16"
      >
        <div className="mb-8 sm:mb-10">
          {siteConfig.contactSectionSubtitle && (
            <p className={`text-xs sm:text-sm font-bold ${isDark ? 'text-[#D4AF37]' : 'text-[#38BDF8]'} mb-1.5`}>
              {siteConfig.contactSectionSubtitle}
            </p>
          )}
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            {siteConfig.contactSectionTitle || 'تواصل معنا'}
          </h2>
        </div>

        {/* Official Contact Cards */}
        <div
          className={`grid grid-cols-1 ${
            siteConfig.showPartnerCard ? 'lg:grid-cols-2' : 'lg:grid-cols-1'
          } gap-6 lg:gap-8`}
        >
          {/* Card 1: المحلاوي ستور | El Mahlawy Store */}
          <div className={`flex flex-col justify-between rounded-3xl ${isDark ? 'bg-[#0B0B0B]' : 'bg-[#0E264A]'} border ${isDark ? 'border-[#D4AF37]/30' : 'border-[#1E3F73]'} p-6 sm:p-7 shadow-xs`}>
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl">
                  <img
                    src="/logo.png"
                    alt={siteConfig.storeName}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-contain"
                  />
                </span>
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white">
                    {siteConfig.storeName}
                    {siteConfig.storeSubtitle ? (
                      <>
                        {' '}
                        <span className={isDark ? 'text-[#D4AF37]' : 'text-[#38BDF8]'}>|</span>{' '}
                        <bdi>{siteConfig.storeSubtitle}</bdi>
                      </>
                    ) : null}
                  </h3>
                  {siteConfig.tagline && (
                    <p className="text-xs text-[#BAE6FD]">{siteConfig.tagline}</p>
                  )}
                </div>
              </div>

              {siteConfig.address && (
                <div className="space-y-2 mb-3">
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    <strong className="text-white">العنوان:</strong> {siteConfig.address}
                  </p>
                  {siteConfig.googleMapsUrl && (
                    <div>
                      <a
                        href={siteConfig.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#0284C7] hover:from-[#1E40AF] hover:to-[#0369A1] text-white px-3.5 py-2 text-xs font-extrabold transition-all active:scale-95 shadow-md border border-white/10"
                      >
                        <MapPin className="h-4 w-4 text-[#7DD3FC] shrink-0" aria-hidden="true" />
                        <span>موقعنا على خرائط Google</span>
                        <ExternalLink className="h-3.5 w-3.5 text-white/80 shrink-0" aria-hidden="true" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {siteConfig.workingHours && (
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#BAE6FD] mb-4">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[#38BDF8] shrink-0" aria-hidden="true" />
                    <span>{siteConfig.workingHours}</span>
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3 pt-2 border-t border-[#1E3F73]">
              <div className="flex items-center justify-between gap-2 text-xs text-[#BAE6FD]">
                <span>رقم الطلبات والاتصال</span>
                <a
                  href={`tel:${siteConfig.primaryPhone}`}
                  dir="ltr"
                  className={`font-num text-sm font-bold text-white ${isDark ? 'hover:text-[#D4AF37]' : 'hover:text-[#38BDF8]'}`}
                >
                  {siteConfig.primaryPhone}
                </a>
              </div>

              {siteConfig.secondaryPhone && (
                <div className="flex items-center justify-between gap-2 text-xs text-[#BAE6FD]">
                  <span>خدمة ما بعد البيع</span>
                  <a
                    href={`tel:${siteConfig.secondaryPhone}`}
                    dir="ltr"
                    className="font-num text-sm font-bold text-white hover:text-[#38BDF8]"
                  >
                    {siteConfig.secondaryPhone}
                  </a>
                </div>
              )}

              {extraStoreChannels.map((ch) => (
                <div
                  key={ch.id}
                  className="flex items-center justify-between gap-2 text-xs text-[#BAE6FD] bg-white/6 px-3 py-2 rounded-xl"
                >
                  <span>{ch.label}</span>
                  <div className="flex items-center gap-2.5 font-num text-sm font-bold">
                    <a
                      href={`tel:${ch.phone}`}
                      dir="ltr"
                      className="inline-flex items-center gap-1 text-white hover:text-[#38BDF8]"
                    >
                      <Phone className="h-3.5 w-3.5 text-[#38BDF8]" aria-hidden="true" />
                      <span>{ch.phone}</span>
                    </a>
                    {ch.whatsappUrl && (
                      <a
                        href={ch.whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#25D366] hover:text-white text-xs font-extrabold"
                      >
                        واتساب
                      </a>
                    )}
                  </div>
                </div>
              ))}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {siteConfig.whatsappUrl && (
                  <a
                    href={siteConfig.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#22bf5b] px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white transition-colors"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>واتساب الطلبات</span>
                  </a>
                )}

                {siteConfig.afterSalesWhatsAppUrl && (
                  <a
                    href={siteConfig.afterSalesWhatsAppUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl ${isDark ? 'bg-[#0F4C5C]' : 'bg-[#0284C7]'} ${isDark ? 'hover:bg-[#0A3D4A]' : 'hover:bg-[#0369A1]'} px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white transition-colors border ${isDark ? 'border-[#D4AF37]/50' : 'border-transparent'}`}
                  >
                    <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>ما بعد البيع</span>
                  </a>
                )}
              </div>

              {(siteConfig.facebookUrl ||
                siteConfig.instagramUrl ||
                extraStoreSocialLinks.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {siteConfig.facebookUrl && (
                    <a
                      href={siteConfig.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-white/6 hover:bg-white/12 border border-[#254C88] px-4 py-2 text-xs sm:text-sm font-bold text-[#E0F2FE] transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-[#38BDF8] shrink-0" aria-hidden="true" />
                      <span>صفحة {siteConfig.storeName} على Facebook</span>
                    </a>
                  )}
                  {siteConfig.instagramUrl && (
                    <a
                      href={siteConfig.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-white/6 hover:bg-white/12 border border-[#254C88] px-4 py-2 text-xs sm:text-sm font-bold text-[#E0F2FE] transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-[#38BDF8] shrink-0" aria-hidden="true" />
                      <span>Instagram الرسمي</span>
                    </a>
                  )}
                  {extraStoreSocialLinks.map((sl) => (
                    <a
                      key={sl.id}
                      href={sl.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-white/6 hover:bg-white/12 border border-[#254C88] px-4 py-2 text-xs sm:text-sm font-bold text-[#E0F2FE] transition-colors"
                    >
                      <ExternalLink className="h-4 w-4 text-[#38BDF8] shrink-0" aria-hidden="true" />
                      <span>{sl.label}</span>
                    </a>
                  ))}
                </div>
              )}

              {siteConfig.closingPhrase && (
                <div className="text-center pt-2">
                  <span className="text-xs font-bold text-[#38BDF8]">
                    ✨ {siteConfig.closingPhrase}
                  </span>
                </div>
              )}
              {showVisitorCounter && (
                <div className="text-center pt-4">
                  <VisitorCounter />
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Infinity Corp | Smart Home & Technical Solutions */}
          {siteConfig.showPartnerCard && (
            <div className={`flex flex-col justify-between rounded-3xl ${isDark ? 'bg-[#0B0B0B]' : 'bg-[#0E264A]'} border ${isDark ? 'border-[#D4AF37]/30' : 'border-[#1E3F73]'} p-6 sm:p-7 shadow-xs`}>
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
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                      <path d="m9 12 2 2 4-4" />
                    </svg>
                  </span>
                  <div>
                    <h3 className="text-lg sm:text-xl font-extrabold text-white">
                      <bdi>{siteConfig.partnerName}</bdi>
                      {siteConfig.partnerSubtitle ? (
                        <>
                          {' '}
                          <span className="text-[#38BDF8]">|</span>{' '}
                          <bdi>{siteConfig.partnerSubtitle}</bdi>
                        </>
                      ) : null}
                    </h3>
                    {siteConfig.partnerRoleTitle && (
                      <p className="text-xs text-[#BAE6FD]">{siteConfig.partnerRoleTitle}</p>
                    )}
                  </div>
                </div>

                {siteConfig.partnerServiceScopeText && (
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-4">
                    <strong className="text-white">نطاق الخدمة بجنوب سيناء:</strong>{' '}
                    {siteConfig.partnerServiceScopeText}
                  </p>
                )}
              </div>

              <div className="space-y-3 pt-2 border-t border-[#1E3F73]">
                {(siteConfig.partnerOrderPhone1 || siteConfig.partnerOrderPhone2) && (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#BAE6FD]">
                    <span>طلبات الشراء والاستفسارات</span>
                    <div dir="ltr" className="flex items-center gap-1.5 font-num text-sm font-bold">
                      {siteConfig.partnerOrderPhone1 && (
                        <a
                          href={`tel:${siteConfig.partnerOrderPhone1}`}
                          className="text-white hover:text-[#38BDF8]"
                        >
                          {siteConfig.partnerOrderPhone1}
                        </a>
                      )}
                      {siteConfig.partnerOrderPhone1 && siteConfig.partnerOrderPhone2 && (
                        <span className="text-[#38BDF8]/60">/</span>
                      )}
                      {siteConfig.partnerOrderPhone2 && (
                        <a
                          href={`tel:${siteConfig.partnerOrderPhone2}`}
                          className="text-white hover:text-[#38BDF8]"
                        >
                          {siteConfig.partnerOrderPhone2}
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {siteConfig.partnerMaintenancePhone && (
                  <div className="flex items-center justify-between gap-2 text-xs text-[#BAE6FD]">
                    <span>التركيب والصيانة الدورية</span>
                    <a
                      href={`tel:${siteConfig.partnerMaintenancePhone}`}
                      dir="ltr"
                      className="font-num text-sm font-bold text-white hover:text-[#38BDF8]"
                    >
                      {siteConfig.partnerMaintenancePhone}
                    </a>
                  </div>
                )}



                {extraPartnerChannels.map((ch) => (
                  <div
                    key={ch.id}
                    className="flex items-center justify-between gap-2 text-xs text-[#BAE6FD] bg-white/6 px-3 py-2 rounded-xl"
                  >
                    <span>{ch.label}</span>
                    <div className="flex items-center gap-2.5 font-num text-sm font-bold">
                      <a
                        href={`tel:${ch.phone}`}
                        dir="ltr"
                        className="inline-flex items-center gap-1 text-white hover:text-[#38BDF8]"
                      >
                        <Phone className="h-3.5 w-3.5 text-[#38BDF8]" aria-hidden="true" />
                        <span>{ch.phone}</span>
                      </a>
                      {ch.whatsappUrl && (
                        <a
                          href={ch.whatsappUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#25D366] hover:text-white text-xs font-extrabold"
                        >
                          واتساب
                        </a>
                      )}
                    </div>
                  </div>
                ))}

                {(partnerOrder1Wa || partnerOrder2Wa) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    {partnerOrder1Wa && (
                      <a
                        href={partnerOrder1Wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#22bf5b] px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white transition-colors"
                      >
                        <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>واتساب الطلبات 1</span>
                      </a>
                    )}
                    {partnerOrder2Wa && (
                      <a
                        href={partnerOrder2Wa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#22bf5b] px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white transition-colors"
                      >
                        <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>واتساب الطلبات 2</span>
                      </a>
                    )}
                    {partnerMaintenanceNewWa && (
                      <a
                        href={partnerMaintenanceNewWa}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl ${isDark ? 'bg-[#0F4C5C]' : 'bg-[#0284C7]'} ${isDark ? 'hover:bg-[#0A3D4A]' : 'hover:bg-[#0369A1]'} px-4 py-2.5 text-xs sm:text-sm font-extrabold text-white transition-colors border ${isDark ? 'border-[#D4AF37]/50' : 'border-transparent'}`}
                      >
                        <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>واتساب التركيب والصيانة</span>
                      </a>
                    )}
                  </div>
                )}

                {(siteConfig.partnerFacebookUrl || extraPartnerSocialLinks.length > 0) && (
                  <div
                    className={`grid grid-cols-1 ${
                      siteConfig.partnerFacebookUrl && extraPartnerSocialLinks.length > 0
                        ? 'sm:grid-cols-2'
                        : ''
                    } gap-2`}
                  >
                    {siteConfig.partnerFacebookUrl && (
                      <a
                        href={siteConfig.partnerFacebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-white/6 hover:bg-white/12 border border-[#254C88] px-4 py-2 text-xs sm:text-sm font-bold text-[#E0F2FE] transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 text-[#38BDF8] shrink-0" aria-hidden="true" />
                        <span>صفحة {siteConfig.partnerName} على Facebook</span>
                      </a>
                    )}
                    {extraPartnerSocialLinks.map((sl) => (
                      <a
                        key={sl.id}
                        href={sl.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-white/6 hover:bg-white/12 border border-[#254C88] px-4 py-2 text-xs sm:text-sm font-bold text-[#E0F2FE] transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 text-[#38BDF8] shrink-0" aria-hidden="true" />
                        <span>{sl.label}</span>
                      </a>
                    ))}
                  </div>
                )}

                {(siteConfig.closingPhrase || PARTNER_INFO.closingPhrase) && (
                  <div className="text-center pt-2">
                    <span className="text-xs font-bold text-[#38BDF8]">
                      ✨ {siteConfig.closingPhrase || PARTNER_INFO.closingPhrase}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Additional Branches (rendered automatically when extra branches are configured) */}
        {extraBranches.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#1E3F73]">
            <h3 className="text-base sm:text-lg font-extrabold text-white mb-4">
              فروع ومواقع إضافية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {extraBranches.map((br) => (
                <div
                  key={br.id}
                  className="rounded-2xl bg-[#0E264A] border border-[#1E3F73] p-4 space-y-2 text-xs text-slate-200"
                >
                  <p className="text-sm font-extrabold text-white">{br.name}</p>
                  <p className="leading-relaxed">{br.address}</p>
                  {br.workingHours && <p className="text-[#BAE6FD]">المواعيد: {br.workingHours}</p>}
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    {br.phone && (
                      <a
                        href={`tel:${br.phone}`}
                        dir="ltr"
                        className="font-num font-bold text-white hover:text-[#38BDF8]"
                      >
                        {br.phone}
                      </a>
                    )}
                    {br.mapUrl && (
                      <a
                        href={br.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-bold text-[#38BDF8] hover:text-white"
                      >
                        <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>موقعنا على خرائط Google</span>
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. زر ومعاينة «من نحن | About Us» للانتقال إلى الصفحة المستقلة */}
      {showAboutSection && siteConfig.showAboutBanner && (
        <div className="border-t border-[#1E3F73] bg-gradient-to-r from-[#0B1F3A] via-[#1545A3] to-[#0284C7] py-10 px-4 text-center text-white">
          <div className="mx-auto max-w-4xl space-y-3.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-extrabold text-[#7DD3FC] border border-white/15">
              <Sparkles className="h-4 w-4 text-[#38BDF8]" />
              <span>
                {siteConfig.storeName} × <bdi>{siteConfig.partnerName}</bdi>
              </span>
            </div>
            <h3 className="text-lg sm:text-2xl font-extrabold text-white">
              تعرّف على كافة تفاصيل {siteConfig.storeName} وشريك النجاح{' '}
              <bdi>{siteConfig.partnerName}</bdi>
            </h3>
            <p className="text-xs sm:text-sm text-[#E0F2FE] max-w-2xl mx-auto font-medium leading-relaxed">
              اضغط على الزر أدناه للانتقال إلى الصفحة المستقلة لعرض معلومات المتجر، والمنتجات،
              والخدمات الفنية، ونطاق العمل، والعناوين وأرقام التواصل بالكامل.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onNavigateAbout) {
                    onNavigateAbout();
                  } else if (typeof window !== 'undefined') {
                    window.location.hash = '#about';
                  }
                }}
                className="inline-flex min-h-[50px] items-center justify-center gap-3 rounded-2xl bg-white hover:bg-[#F0F9FF] text-[#0B1F3A] active:scale-95 px-7 py-3 text-sm sm:text-base font-extrabold shadow-xl hover:shadow-2xl transition-all cursor-pointer group"
              >
                <Users className="h-5 w-5 text-[#1D4ED8] group-hover:scale-110 transition-transform" />
                <span>من نحن | About Us</span>
                <ArrowLeft className="h-5 w-5 text-[#0284C7] group-hover:-translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2.5. قسم تقييمات الزوار ورأيهم بالموقع */}
      {siteConfig.showRatingsSection !== false && (
        <div className={`border-t ${isDark ? 'border-[#D4AF37]/30' : 'border-[#1E3F73]'} py-8 px-4`}>
          <div className="mx-auto max-w-7xl">
            <RatingStatsDisplay onOpenRatingModal={onOpenRatingModal} isDark={isDark} />
          </div>
        </div>
      )}

      {/* 3. التذييل النهائي للموقع (Footer) */}
      <div className={`border-t ${isDark ? 'border-[#D4AF37]/40' : 'border-[#163663]'} ${isDark ? 'bg-[#050505]' : 'bg-[#061426]'}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-3xl">
              <p className="text-base font-extrabold text-white">
                {siteConfig.storeName} × <bdi>{siteConfig.partnerName}</bdi>
              </p>
              <p className="text-xs sm:text-sm text-[#BAE6FD]/90 leading-relaxed">
                منتجات متنوعة، وحلول تقنية متكاملة، وتركيب احترافي، ودعم فني وخدمة ما بعد البيع
                وفقًا لشروط كل خدمة.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs sm:text-sm font-bold text-[#38BDF8]">
                تابعونا لمعرفة أحدث المنتجات والخدمات وكل جديد!
              </p>
              {onOpenRatingModal && siteConfig.showRatingsSection !== false && (
                <button
                  type="button"
                  onClick={onOpenRatingModal}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#1D4ED8] to-[#0284C7] hover:from-[#1E40AF] hover:to-[#0369A1] text-white px-3.5 py-1.5 text-xs font-extrabold transition-transform active:scale-95 cursor-pointer shadow-md"
                >
                  ⭐ قيّم تجربتك
                </button>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#122C52] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
            <p>
              © {new Date().getFullYear()} {siteConfig.storeName}
              {siteConfig.storeSubtitle ? (
                <>
                  {' '}
                  | <bdi>{siteConfig.storeSubtitle}</bdi>
                </>
              ) : null}
              . {siteConfig.copyrightText}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <VisitorCounter />
              <span className="text-[#BAE6FD]/75">
                شركاء النجاح: <bdi>{siteConfig.partnerName}</bdi>
                {siteConfig.partnerSubtitle ? (
                  <>
                    {' '}
                    · <bdi>{siteConfig.partnerSubtitle}</bdi>
                  </>
                ) : null}
              </span>
              {onAdminButtonClick && (
                <button
                  type="button"
                  onClick={onAdminButtonClick}
                  style={{ display: 'none' }}
                  className="hidden inline-flex items-center gap-1.5 rounded-lg bg-white/5 hover:bg-white/10 px-2.5 py-1 text-xs font-bold text-[#BAE6FD] transition-colors cursor-pointer"
                >
                  <LayoutDashboard className="h-3.5 w-3.5 text-[#38BDF8]" />
                  <span>إعدادات المطور</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}


