import { useState } from 'react';
import {
  Check,
  Edit3,
  ExternalLink,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {
  CONTACT_OWNER_LABELS,
  ContactChannelOwner,
  MAX_SOCIAL_LINKS,
  SOCIAL_PLATFORM_LABELS,
  SiteConfig,
  SocialLinkItem,
  SocialPlatform,
  isValidOptionalHttpUrl,
} from '../../utils/siteConfig';

interface SocialLinksSectionProps {
  configDraft: SiteConfig;
  isSiteConfigDirty: boolean;
  savingSiteConfig: boolean;
  onUpdateField: <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => void;
  onSaveSubmit: (e: React.FormEvent, sectionLabel: string) => Promise<void>;
  onCancelChanges: () => void;
  onValidationError: (message: string) => void;
}

export function SocialLinksSection({
  configDraft,
  isSiteConfigDirty,
  savingSiteConfig,
  onUpdateField,
  onSaveSubmit,
  onCancelChanges,
  onValidationError,
}: SocialLinksSectionProps) {
  const [linkDraft, setLinkDraft] = useState<SocialLinkItem | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);

  const socialLinks = configDraft.socialLinks || [];

  const startNewSocialLink = () => {
    setEditingIndex(null);
    setLinkDraft({
      id: `social-${Date.now()}`,
      platform: 'tiktok',
      label: '',
      owner: 'store',
      url: '',
    });
  };

  const handleConfirmSocialLink = () => {
    if (!linkDraft) return;
    const trimmedLabel = linkDraft.label.trim() || SOCIAL_PLATFORM_LABELS[linkDraft.platform];
    const trimmedUrl = linkDraft.url.trim();

    if (!trimmedUrl || !isValidOptionalHttpUrl(trimmedUrl)) {
      onValidationError('يرجى إدخال رابط صحيح يبدأ بـ https:// أو http://.');
      return;
    }

    const normalized: SocialLinkItem = {
      ...linkDraft,
      label: trimmedLabel.slice(0, 120),
      url: trimmedUrl.slice(0, 600),
    };

    const next = [...socialLinks];
    if (editingIndex !== null && editingIndex >= 0) {
      next[editingIndex] = normalized;
    } else {
      next.push(normalized);
    }
    onUpdateField('socialLinks', next.slice(0, MAX_SOCIAL_LINKS));
    setLinkDraft(null);
    setEditingIndex(null);
  };

  return (
    <form
      onSubmit={(e) => void onSaveSubmit(e, 'روابط التواصل الاجتماعي')}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            إدارة روابط التواصل الاجتماعي
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            تحكم في روابط Facebook وInstagram وتيك توك ويوتيوب وتيليجرام وكافة المنصات الرسمية.
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

      {/* 1. Primary Official Social Pages */}
      <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 sm:p-6 space-y-5">
        <h3 className="text-base font-extrabold text-[#D4AF37]">
          01. الصفحات الرسمية الأساسية في المتجر والفوتر
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="cfg-fb-url" className="text-xs font-bold text-gray-300">
                رابط صفحة Facebook الرسمية للمتجر
              </label>
              {configDraft.facebookUrl && isValidOptionalHttpUrl(configDraft.facebookUrl) && (
                <a
                  href={configDraft.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D4AF37] hover:underline"
                >
                  <span>اختبار الرابط</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              )}
            </div>
            <input
              id="cfg-fb-url"
              type="url"
              dir="ltr"
              value={configDraft.facebookUrl}
              onChange={(e) => onUpdateField('facebookUrl', e.target.value)}
              placeholder="https://www.facebook.com/..."
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-xs sm:text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="cfg-ig-url" className="text-xs font-bold text-gray-300">
                رابط صفحة Instagram الرسمية للمتجر (اختياري)
              </label>
              {configDraft.instagramUrl && isValidOptionalHttpUrl(configDraft.instagramUrl) && (
                <a
                  href={configDraft.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D4AF37] hover:underline"
                >
                  <span>اختبار الرابط</span>
                  <ExternalLink className="h-3 w-3" aria-hidden="true" />
                </a>
              )}
            </div>
            <input
              id="cfg-ig-url"
              type="url"
              dir="ltr"
              value={configDraft.instagramUrl}
              onChange={(e) => onUpdateField('instagramUrl', e.target.value)}
              placeholder="https://www.instagram.com/..."
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-xs sm:text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="cfg-p-fb" className="text-xs font-bold text-gray-300">
                رابط صفحة شريك النجاح ({configDraft.partnerName || 'Infinity Corp'}) على Facebook
              </label>
              {configDraft.partnerFacebookUrl &&
                isValidOptionalHttpUrl(configDraft.partnerFacebookUrl) && (
                  <a
                    href={configDraft.partnerFacebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D4AF37] hover:underline"
                  >
                    <span>اختبار الرابط</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
            </div>
            <input
              id="cfg-p-fb"
              type="url"
              dir="ltr"
              value={configDraft.partnerFacebookUrl}
              onChange={(e) => onUpdateField('partnerFacebookUrl', e.target.value)}
              placeholder="https://www.facebook.com/..."
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-xs sm:text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>
      </div>

      {/* 2. Dynamic Additional Social Platforms */}
      <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-[#D4AF37]">
              02. منصات وروابط اجتماعية إضافية ({socialLinks.length}/{MAX_SOCIAL_LINKS})
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              أضف قنوات إضافية مثل TikTok أو YouTube أو Telegram أو موقع إلكتروني لتظهر في بطاقات
              التواصل.
            </p>
          </div>

          <button
            type="button"
            disabled={socialLinks.length >= MAX_SOCIAL_LINKS}
            onClick={startNewSocialLink}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#0B0B0B] hover:bg-[#1E1E1E] disabled:opacity-45 border border-[#D4AF37]/50 px-4 py-2 text-xs font-bold text-[#D4AF37] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>إضافة رابط منصة جديدة</span>
          </button>
        </div>

        {linkDraft && (
          <div className="rounded-xl bg-[#0B0B0B] border border-[#D4AF37]/50 p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              <div>
                <label htmlFor="sl-platform" className="block text-xs font-bold text-[#D4AF37] mb-1">
                  المنصة
                </label>
                <select
                  id="sl-platform"
                  value={linkDraft.platform}
                  onChange={(e) => {
                    const nextPlatform = e.target.value as SocialPlatform;
                    setLinkDraft((prev) =>
                      prev
                        ? {
                            ...prev,
                            platform: nextPlatform,
                            label: prev.label || SOCIAL_PLATFORM_LABELS[nextPlatform],
                          }
                        : null
                    );
                  }}
                  className="w-full min-h-[42px] rounded-lg bg-[#141414] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  {Object.entries(SOCIAL_PLATFORM_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="sl-owner" className="block text-xs font-bold text-[#D4AF37] mb-1">
                  تابع لـ
                </label>
                <select
                  id="sl-owner"
                  value={linkDraft.owner}
                  onChange={(e) =>
                    setLinkDraft((prev) =>
                      prev ? { ...prev, owner: e.target.value as ContactChannelOwner } : null
                    )
                  }
                  className="w-full min-h-[42px] rounded-lg bg-[#141414] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  {Object.entries(CONTACT_OWNER_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="sl-label" className="block text-xs font-bold text-[#D4AF37] mb-1">
                  اسم الزر الظاهر للعملاء *
                </label>
                <input
                  id="sl-label"
                  type="text"
                  maxLength={120}
                  value={linkDraft.label}
                  onChange={(e) =>
                    setLinkDraft((prev) => (prev ? { ...prev, label: e.target.value } : null))
                  }
                  placeholder="مثال: حساب المحلاوي ستور على TikTok"
                  className="w-full min-h-[42px] rounded-lg bg-[#141414] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-4">
                <label htmlFor="sl-url" className="block text-xs font-bold text-[#D4AF37] mb-1">
                  الرابط الكامل (https://...) *
                </label>
                <input
                  id="sl-url"
                  type="url"
                  dir="ltr"
                  maxLength={600}
                  value={linkDraft.url}
                  onChange={(e) =>
                    setLinkDraft((prev) => (prev ? { ...prev, url: e.target.value } : null))
                  }
                  placeholder="https://www.tiktok.com/@..."
                  className="w-full min-h-[42px] rounded-lg bg-[#141414] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmSocialLink}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#0F4C5C] hover:bg-[#0A3D4A] px-4 py-2 text-xs font-extrabold text-white cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>تأكيد الرابط في القائمة</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setLinkDraft(null);
                  setEditingIndex(null);
                }}
                className="inline-flex min-h-[40px] items-center rounded-lg bg-[#1A1A1A] px-3.5 py-2 text-xs font-semibold text-gray-300 cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-white/10 rounded-xl bg-[#0B0B0B] border border-white/10">
          {socialLinks.length === 0 ? (
            <p className="p-4 text-xs text-gray-400 text-center">
              لا توجد منصات إضافية مسجلة حاليًا (يتم عرض روابط Facebook وInstagram الأساسية أعلاه).
            </p>
          ) : (
            socialLinks.map((sl, idx) => (
              <div
                key={sl.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-white truncate">{sl.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {SOCIAL_PLATFORM_LABELS[sl.platform]} · {CONTACT_OWNER_LABELS[sl.owner]} ·{' '}
                    <bdi className="text-[#D4AF37]">{sl.url}</bdi>
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={sl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`فتح رابط ${sl.label}`}
                    className="inline-flex min-h-[38px] items-center gap-1 rounded-lg bg-[#141414] hover:bg-[#1E1E1E] border border-white/15 px-2.5 py-1.5 text-xs font-bold text-[#D4AF37]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingIndex(idx);
                      setLinkDraft({ ...sl });
                    }}
                    aria-label={`تعديل رابط ${sl.label}`}
                    className="inline-flex min-h-[38px] items-center gap-1 rounded-lg bg-[#1A1A1A] hover:bg-[#242424] border border-white/15 px-3 py-1.5 text-xs font-bold text-gray-200 cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
                    <span>تعديل</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteIdx(idx)}
                    aria-label={`حذف رابط ${sl.label}`}
                    className="inline-flex min-h-[38px] items-center gap-1 rounded-lg bg-[#0F4C5C]/15 hover:bg-[#0F4C5C] border border-[#0F4C5C]/50 px-3 py-1.5 text-xs font-bold text-[#A0D2EB] hover:text-white cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Save / Cancel Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <button
          type="submit"
          disabled={savingSiteConfig}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] disabled:opacity-55 border border-[#D4AF37]/70 px-6 py-3 text-sm font-extrabold text-white transition-colors whitespace-nowrap cursor-pointer"
        >
          {savingSiteConfig ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
          )}
          <span>
            {savingSiteConfig
              ? 'جاري الحفظ السحابي...'
              : 'حفظ روابط التواصل الاجتماعي سحابيًا'}
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

      {/* Delete Social Link Confirmation Modal */}
      {confirmDeleteIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="تأكيد حذف الرابط الاجتماعي"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#141414] border border-[#0F4C5C] p-6 space-y-4 text-gray-100">
            <h3 className="text-base font-extrabold text-white">تأكيد حذف رابط التواصل</h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              هل تريد حذف «{socialLinks[confirmDeleteIdx]?.label}»؟ تذكّر الضغط على «حفظ روابط
              التواصل الاجتماعي سحابيًا» لتثبيت التغيير.
            </p>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDeleteIdx(null)}
                className="min-h-[42px] rounded-xl bg-[#1E1E1E] border border-white/15 px-4 py-2 text-xs font-bold text-gray-300 cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateField(
                    'socialLinks',
                    socialLinks.filter((_, idx) => idx !== confirmDeleteIdx)
                  );
                  setConfirmDeleteIdx(null);
                }}
                className="min-h-[42px] rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] px-5 py-2 text-xs font-extrabold text-white cursor-pointer"
              >
                حذف الرابط
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
