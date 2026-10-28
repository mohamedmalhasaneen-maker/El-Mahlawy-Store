import { Check, Loader2, RotateCcw } from 'lucide-react';
import { SiteConfig } from '../../utils/siteConfig';

interface SiteAndAboutSectionProps {
  configDraft: SiteConfig;
  isSiteConfigDirty: boolean;
  savingSiteConfig: boolean;
  onUpdateField: <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => void;
  onSaveSubmit: (e: React.FormEvent, sectionLabel: string) => Promise<void>;
  onCancelChanges: () => void;
}

export function SiteAndAboutSection({
  configDraft,
  isSiteConfigDirty,
  savingSiteConfig,
  onUpdateField,
  onSaveSubmit,
  onCancelChanges,
}: SiteAndAboutSectionProps) {
  return (
    <form
      onSubmit={(e) => void onSaveSubmit(e, 'معلومات الموقع وصفحة «من نحن»')}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            إدارة معلومات الموقع وصفحة «من نحن»
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            عدّل اسم المتجر، الوصف التعريفي، بيانات SEO، ونصوص صفحة «من نحن | About Us» وشريك النجاح
            Infinity Corp.
          </p>
        </div>

        {isSiteConfigDirty && (
          <button
            type="button"
            onClick={onCancelChanges}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] border border-white/20 px-4 py-2 text-xs font-bold text-gray-300 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span>إلغاء التغييرات</span>
          </button>
        )}
      </div>

      {/* 1. Store Identity, Hero Copy & SEO */}
      <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 sm:p-6 space-y-5">
        <h3 className="text-base font-extrabold text-[#D4AF37]">
          01. هوية المتجر ونصوص الصفحة الرئيسية ومحركات البحث (SEO)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cfg-store-name" className="block text-xs font-bold text-gray-300 mb-1.5">
              اسم الموقع بالعربية *
            </label>
            <input
              id="cfg-store-name"
              type="text"
              required
              maxLength={100}
              value={configDraft.storeName}
              onChange={(e) => onUpdateField('storeName', e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label htmlFor="cfg-store-sub" className="block text-xs font-bold text-gray-300 mb-1.5">
              الاسم الإنجليزي المرافق
            </label>
            <input
              id="cfg-store-sub"
              type="text"
              dir="ltr"
              maxLength={100}
              value={configDraft.storeSubtitle}
              onChange={(e) => onUpdateField('storeSubtitle', e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="cfg-tagline" className="block text-xs font-bold text-gray-300 mb-1.5">
              الشعار الترحيبي الرئيسي (Hero Tagline)
            </label>
            <input
              id="cfg-tagline"
              type="text"
              maxLength={200}
              value={configDraft.tagline}
              onChange={(e) => onUpdateField('tagline', e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="cfg-hero-desc" className="block text-xs font-bold text-gray-300 mb-1.5">
              الوصف التعريفي بأعلى الصفحة الرئيسية
            </label>
            <textarea
              id="cfg-hero-desc"
              rows={3}
              maxLength={600}
              value={configDraft.heroDescription}
              onChange={(e) => onUpdateField('heroDescription', e.target.value)}
              className="w-full rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="cfg-announcement" className="block text-xs font-bold text-gray-300 mb-1.5">
              شريط إعلان علوي اختياري (اتركه فارغًا لإخفائه)
            </label>
            <input
              id="cfg-announcement"
              type="text"
              maxLength={240}
              value={configDraft.announcementText}
              onChange={(e) => onUpdateField('announcementText', e.target.value)}
              placeholder="مثال: عروض خاصة لفترة محدودة — شحن سريع لجميع محافظات مصر"
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label htmlFor="cfg-contact-title" className="block text-xs font-bold text-gray-300 mb-1.5">
              عنوان قسم «تواصل معنا» بالفوتر
            </label>
            <input
              id="cfg-contact-title"
              type="text"
              maxLength={120}
              value={configDraft.contactSectionTitle}
              onChange={(e) => onUpdateField('contactSectionTitle', e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label htmlFor="cfg-contact-sub" className="block text-xs font-bold text-gray-300 mb-1.5">
              العنوان الفرعي لقسم «تواصل معنا»
            </label>
            <input
              id="cfg-contact-sub"
              type="text"
              maxLength={200}
              value={configDraft.contactSectionSubtitle}
              onChange={(e) => onUpdateField('contactSectionSubtitle', e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label htmlFor="cfg-seo-title" className="block text-xs font-bold text-gray-300 mb-1.5">
              عنوان المتصفح ومحركات البحث (SEO Title)
            </label>
            <input
              id="cfg-seo-title"
              type="text"
              maxLength={140}
              value={configDraft.seoTitle}
              onChange={(e) => onUpdateField('seoTitle', e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label htmlFor="cfg-copyright" className="block text-xs font-bold text-gray-300 mb-1.5">
              نص حقوق الملكية + العبارة الختامية
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                id="cfg-copyright"
                type="text"
                maxLength={200}
                value={configDraft.copyrightText}
                onChange={(e) => onUpdateField('copyrightText', e.target.value)}
                placeholder="جميع الحقوق محفوظة."
                className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              />
              <input
                type="text"
                aria-label="العبارة الختامية"
                maxLength={160}
                value={configDraft.closingPhrase}
                onChange={(e) => onUpdateField('closingPhrase', e.target.value)}
                placeholder="وما تنساش تصلي على النبي ﷺ"
                className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label htmlFor="cfg-seo-desc" className="block text-xs font-bold text-gray-300 mb-1.5">
              وصف الموقع لمحركات البحث (Meta Description)
            </label>
            <textarea
              id="cfg-seo-desc"
              rows={2}
              maxLength={400}
              value={configDraft.seoDescription}
              onChange={(e) => onUpdateField('seoDescription', e.target.value)}
              className="w-full rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>
      </div>

      {/* 2. About Us, Partner Infinity Corp & Vision */}
      <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 sm:p-6 space-y-5">
        <h3 className="text-base font-extrabold text-[#D4AF37]">
          02. محتوى صفحة «من نحن | About Us» وشريك النجاح والرؤية
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="cfg-about-title" className="block text-xs font-bold text-gray-300 mb-1.5">
              عنوان صفحة «من نحن» الرئيسي
            </label>
            <input
              id="cfg-about-title"
              type="text"
              maxLength={160}
              value={configDraft.aboutHeroTitle}
              onChange={(e) => onUpdateField('aboutHeroTitle', e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="cfg-about-sub" className="block text-xs font-bold text-gray-300 mb-1.5">
              مقدمة صفحة «من نحن» أسفل العنوان
            </label>
            <textarea
              id="cfg-about-sub"
              rows={2}
              maxLength={500}
              value={configDraft.aboutHeroSubtitle}
              onChange={(e) => onUpdateField('aboutHeroSubtitle', e.target.value)}
              className="w-full rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="cfg-about-store" className="block text-xs font-bold text-gray-300 mb-1.5">
              النبذة التعريفية للمحلاوي ستور
            </label>
            <textarea
              id="cfg-about-store"
              rows={3}
              maxLength={1200}
              value={configDraft.aboutStoreIntro}
              onChange={(e) => onUpdateField('aboutStoreIntro', e.target.value)}
              className="w-full rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label htmlFor="cfg-partner-name" className="block text-xs font-bold text-gray-300 mb-1.5">
              اسم شريك النجاح الفني
            </label>
            <input
              id="cfg-partner-name"
              type="text"
              maxLength={100}
              value={configDraft.partnerName}
              onChange={(e) => onUpdateField('partnerName', e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label htmlFor="cfg-partner-sub" className="block text-xs font-bold text-gray-300 mb-1.5">
              الاسم الفرعي أو التخصص بالإنجليزية
            </label>
            <input
              id="cfg-partner-sub"
              type="text"
              dir="ltr"
              maxLength={120}
              value={configDraft.partnerSubtitle}
              onChange={(e) => onUpdateField('partnerSubtitle', e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label htmlFor="cfg-partner-role" className="block text-xs font-bold text-gray-300 mb-1.5">
              المسمى الوظيفي للشريك في بطاقة التواصل
            </label>
            <input
              id="cfg-partner-role"
              type="text"
              maxLength={120}
              value={configDraft.partnerRoleTitle}
              onChange={(e) => onUpdateField('partnerRoleTitle', e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label htmlFor="cfg-partner-scope" className="block text-xs font-bold text-gray-300 mb-1.5">
              مدن نطاق خدمة الشريك الفني (افصل بفاصلة)
            </label>
            <input
              id="cfg-partner-scope"
              type="text"
              maxLength={300}
              value={configDraft.partnerServiceScopeText}
              onChange={(e) => onUpdateField('partnerServiceScopeText', e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="cfg-about-partner" className="block text-xs font-bold text-gray-300 mb-1.5">
              النبذة التعريفية لشركة الشريك الفني (Infinity Corp)
            </label>
            <textarea
              id="cfg-about-partner"
              rows={3}
              maxLength={1200}
              value={configDraft.aboutPartnerIntro}
              onChange={(e) => onUpdateField('aboutPartnerIntro', e.target.value)}
              className="w-full rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label htmlFor="cfg-vision-title" className="block text-xs font-bold text-gray-300 mb-1.5">
              عنوان قسم الرؤية
            </label>
            <input
              id="cfg-vision-title"
              type="text"
              maxLength={160}
              value={configDraft.visionTitle}
              onChange={(e) => onUpdateField('visionTitle', e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label htmlFor="cfg-vision-desc" className="block text-xs font-bold text-gray-300 mb-1.5">
              نص قسم الرؤية
            </label>
            <input
              id="cfg-vision-desc"
              type="text"
              maxLength={800}
              value={configDraft.visionDescription}
              onChange={(e) => onUpdateField('visionDescription', e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>
      </div>

      {/* Save / Cancel Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <button
          type="submit"
          disabled={savingSiteConfig}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#C62828] hover:bg-red-800 disabled:opacity-55 border border-[#D4AF37]/70 px-6 py-3 text-sm font-extrabold text-white transition-colors whitespace-nowrap cursor-pointer"
        >
          {savingSiteConfig ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
          )}
          <span>
            {savingSiteConfig
              ? 'جاري الحفظ السحابي...'
              : 'حفظ معلومات الموقع وصفحة «من نحن» سحابيًا'}
          </span>
        </button>

        <button
          type="button"
          disabled={savingSiteConfig || !isSiteConfigDirty}
          onClick={onCancelChanges}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] disabled:opacity-40 border border-white/15 px-5 py-3 text-xs sm:text-sm font-semibold text-gray-300 whitespace-nowrap cursor-pointer"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>إلغاء التغييرات</span>
        </button>
      </div>
    </form>
  );
}
