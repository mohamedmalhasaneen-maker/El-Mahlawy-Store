import { useState, useRef } from 'react';
import {
  Check,
  Image as ImageIcon,
  Loader2,
  Palette,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { SiteConfig, DEFAULT_SITE_CONFIG } from '../../utils/siteConfig';

interface HeroBannerSettingsSectionProps {
  configDraft: SiteConfig;
  isSiteConfigDirty: boolean;
  savingSiteConfig: boolean;
  onUpdateField: <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => void;
  onSaveSubmit: (e: React.FormEvent, sectionLabel: string) => Promise<void>;
  onCancelChanges: () => void;
}

const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/obvb7rtp/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'elmahlawy-store';

export function HeroBannerSettingsSection({
  configDraft,
  isSiteConfigDirty,
  savingSiteConfig,
  onUpdateField,
  onSaveSubmit,
  onCancelChanges,
}: HeroBannerSettingsSectionProps) {
  const [uploadingBgImage, setUploadingBgImage] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBgImage(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(CLOUDINARY_UPLOAD_URL, {
        method: 'POST',
        body: formData,
      });

      const rawText = await response.text();
      let data: { secure_url?: string; error?: { message?: string } };
      try {
        data = JSON.parse(rawText);
      } catch {
        throw new Error('استجابة غير صالحة من خدمة الرفع السحابي Cloudinary.');
      }

      if (!response.ok) {
        throw new Error(data.error?.message || `فشل رفع الصورة (${response.status})`);
      }

      if (typeof data.secure_url === 'string' && data.secure_url.startsWith('https://')) {
        onUpdateField('heroBgImage', data.secure_url);
        onUpdateField('heroBgType', 'image');
      } else {
        throw new Error('لم تُرجع خدمة Cloudinary رابط secure_url صالحًا.');
      }
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : 'حدث خطأ أثناء رفع صورة الخلفية سحابيًا.'
      );
    } finally {
      setUploadingBgImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleResetToDefault = () => {
    onUpdateField('heroBgType', DEFAULT_SITE_CONFIG.heroBgType);
    onUpdateField('heroBgColor', DEFAULT_SITE_CONFIG.heroBgColor);
    onUpdateField('heroBgColor2', DEFAULT_SITE_CONFIG.heroBgColor2);
    onUpdateField('heroBgGradientDirection', DEFAULT_SITE_CONFIG.heroBgGradientDirection);
    onUpdateField('heroBgImage', DEFAULT_SITE_CONFIG.heroBgImage);
    onUpdateField('heroBgFit', DEFAULT_SITE_CONFIG.heroBgFit);
    onUpdateField('heroBgPosition', DEFAULT_SITE_CONFIG.heroBgPosition);
    onUpdateField('heroOverlayColor', DEFAULT_SITE_CONFIG.heroOverlayColor);
    onUpdateField('heroOverlayOpacity', DEFAULT_SITE_CONFIG.heroOverlayOpacity);
  };

  // Compute background style for live preview
  const getPreviewBackgroundStyle = (): React.CSSProperties => {
    if (configDraft.heroBgType === 'image' && configDraft.heroBgImage) {
      return {
        backgroundImage: `url(${configDraft.heroBgImage})`,
        backgroundSize: configDraft.heroBgFit || 'cover',
        backgroundPosition: configDraft.heroBgPosition || 'center',
      };
    }
    if (configDraft.heroBgType === 'color') {
      return {
        backgroundColor: configDraft.heroBgColor || '#0B2354',
      };
    }
    // Gradient
    const c1 = configDraft.heroBgColor || '#0B2354';
    const c2 = configDraft.heroBgColor2 || '#0EA5E9';
    const dir = configDraft.heroBgGradientDirection || 'to-bl';
    return {
      backgroundImage: `linear-gradient(${dir}, ${c1}, ${c2})`,
    };
  };

  return (
    <form
      onSubmit={(e) => void onSaveSubmit(e, 'إعدادات البانر الرئيسي')}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            إعدادات البانر الرئيسي (Hero Banner)
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            تخصيص خلفية البانر الرئيسي في أعلى الصفحة الرئيسية (لون ثابت، تدرج لوني، أو صورة من Cloudinary مع ضبط الاحتواء والموضع والتغشية).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] border border-white/15 px-3.5 py-2 text-xs font-bold text-gray-300 whitespace-nowrap cursor-pointer"
          >
            <RotateCcw className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
            <span>إعادة ضبط افتراضي</span>
          </button>

          {isSiteConfigDirty && (
            <button
              type="button"
              onClick={onCancelChanges}
              className="inline-flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] border border-white/20 px-3.5 py-2 text-xs font-bold text-gray-300 whitespace-nowrap cursor-pointer"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span>إلغاء</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Preview Box */}
      <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/35 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-[#D4AF37] flex items-center gap-2">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>معاينة حية لشكل البانر الرئيسي</span>
          </h3>
          <span className="text-[10px] text-gray-400">التغييرات تظهر للزوار فور الحفظ السحابي</span>
        </div>

        <div
          className="relative rounded-xl overflow-hidden p-6 sm:p-10 border border-white/20 shadow-2xl transition-all"
          style={getPreviewBackgroundStyle()}
        >
          {/* Overlay Layer */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundColor: configDraft.heroOverlayColor || '#000000',
              opacity:
                typeof configDraft.heroOverlayOpacity === 'number'
                  ? configDraft.heroOverlayOpacity
                  : 0.2,
            }}
          />

          <div className="relative z-10 max-w-xl space-y-4">
            <p className="text-xs font-bold text-[#BAE6FD]">
              {configDraft.storeName} | <bdi>{configDraft.storeSubtitle}</bdi>
            </p>
            <h4 className="text-xl sm:text-2xl font-extrabold text-white text-balance">
              {configDraft.tagline}
            </h4>
            <p className="text-xs sm:text-sm text-[#E0F2FE] line-clamp-2">
              {configDraft.heroDescription}
            </p>
            {/* Simulated Search Bar */}
            <div className="flex items-center rounded-xl bg-white p-1.5 shadow-lg max-w-md">
              <span className="text-xs text-gray-400 px-3">🔍 ابحث في المنتجات والأجهزة...</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. Background Mode Selector */}
      <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 sm:p-6 space-y-5">
        <h3 className="text-base font-extrabold text-[#D4AF37]">
          01. اختيار نوع خلفية البانر الرئيسي
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => onUpdateField('heroBgType', 'gradient')}
            className={`flex items-center gap-3 p-4 rounded-xl border text-right transition-all cursor-pointer ${
              configDraft.heroBgType === 'gradient'
                ? 'bg-[#0F4C5C]/25 border-[#D4AF37] text-white shadow-lg'
                : 'bg-[#0B0B0B] border-white/15 text-gray-300 hover:border-white/30'
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#D4AF37]">
              <Palette className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold">تدرج لوني (Gradient)</p>
              <p className="text-xs text-gray-400 mt-0.5">لونين بتدرج احترافي</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onUpdateField('heroBgType', 'color')}
            className={`flex items-center gap-3 p-4 rounded-xl border text-right transition-all cursor-pointer ${
              configDraft.heroBgType === 'color'
                ? 'bg-[#0F4C5C]/25 border-[#D4AF37] text-white shadow-lg'
                : 'bg-[#0B0B0B] border-white/15 text-gray-300 hover:border-white/30'
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#D4AF37]">
              <span
                className="h-5 w-5 rounded-full border border-white/40"
                style={{ backgroundColor: configDraft.heroBgColor || '#0B2354' }}
              />
            </span>
            <div>
              <p className="text-sm font-bold">لون ثابت (Solid Color)</p>
              <p className="text-xs text-gray-400 mt-0.5">اختيار لون موحد للبانر</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => onUpdateField('heroBgType', 'image')}
            className={`flex items-center gap-3 p-4 rounded-xl border text-right transition-all cursor-pointer ${
              configDraft.heroBgType === 'image'
                ? 'bg-[#0F4C5C]/25 border-[#D4AF37] text-white shadow-lg'
                : 'bg-[#0B0B0B] border-white/15 text-gray-300 hover:border-white/30'
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-[#D4AF37]">
              <ImageIcon className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold">صورة خلفية (Image)</p>
              <p className="text-xs text-gray-400 mt-0.5">رفع صورة من جهازك</p>
            </div>
          </button>
        </div>

        {/* Conditional Controls based on heroBgType */}
        {configDraft.heroBgType === 'color' && (
          <div className="rounded-xl bg-[#0B0B0B] border border-white/15 p-4 space-y-3">
            <label className="block text-xs font-bold text-gray-300">
              اختر لون الخلفية الثابت
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={configDraft.heroBgColor || '#0B2354'}
                onChange={(e) => onUpdateField('heroBgColor', e.target.value)}
                className="h-11 w-20 rounded-xl bg-transparent cursor-pointer border border-white/20"
              />
              <input
                type="text"
                dir="ltr"
                maxLength={30}
                value={configDraft.heroBgColor || '#0B2354'}
                onChange={(e) => onUpdateField('heroBgColor', e.target.value)}
                placeholder="#0B2354"
                className="w-40 min-h-[42px] rounded-xl bg-[#141414] border border-white/15 px-3 text-sm text-white text-left font-mono focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>
        )}

        {configDraft.heroBgType === 'gradient' && (
          <div className="rounded-xl bg-[#0B0B0B] border border-white/15 p-4 space-y-4">
            <h4 className="text-xs font-bold text-gray-300">إعدادات التدرج اللوني</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  اللون الأول (بداية التدرج)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={configDraft.heroBgColor || '#0B2354'}
                    onChange={(e) => onUpdateField('heroBgColor', e.target.value)}
                    className="h-10 w-16 rounded-xl bg-transparent cursor-pointer border border-white/20"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={30}
                    value={configDraft.heroBgColor || '#0B2354'}
                    onChange={(e) => onUpdateField('heroBgColor', e.target.value)}
                    className="flex-1 min-h-[40px] rounded-xl bg-[#141414] border border-white/15 px-3 text-xs text-white font-mono text-left focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                  اللون الثاني (نهاية التدرج)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={configDraft.heroBgColor2 || '#0EA5E9'}
                    onChange={(e) => onUpdateField('heroBgColor2', e.target.value)}
                    className="h-10 w-16 rounded-xl bg-transparent cursor-pointer border border-white/20"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    maxLength={30}
                    value={configDraft.heroBgColor2 || '#0EA5E9'}
                    onChange={(e) => onUpdateField('heroBgColor2', e.target.value)}
                    className="flex-1 min-h-[40px] rounded-xl bg-[#141414] border border-white/15 px-3 text-xs text-white font-mono text-left focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">
                اتجاه التدرج (Gradient Direction)
              </label>
              <select
                value={configDraft.heroBgGradientDirection || 'to-bl'}
                onChange={(e) => onUpdateField('heroBgGradientDirection', e.target.value)}
                className="w-full min-h-[42px] rounded-xl bg-[#141414] border border-white/15 px-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="to-bl">إلى الأسفل اليسار (Diagonal Bottom-Left — افتراضي)</option>
                <option value="to-br">إلى الأسفل اليمين (Diagonal Bottom-Right)</option>
                <option value="to-r">من اليمين لليسار (To Right)</option>
                <option value="to-l">من اليسار لليمين (To Left)</option>
                <option value="to-t">من الأسفل للأعلى (To Top)</option>
                <option value="to-b">من الأعلى للأدنى (To Bottom)</option>
              </select>
            </div>
          </div>
        )}

        {configDraft.heroBgType === 'image' && (
          <div className="rounded-xl bg-[#0B0B0B] border border-white/15 p-4 space-y-4">
            <h4 className="text-xs font-bold text-gray-300">رفع أو إدخال صورة الخلفية</h4>

            {uploadError && (
              <div role="alert" className="rounded-xl bg-rose-950/50 border border-rose-500/50 px-4 py-3 text-xs text-rose-200">
                {uploadError}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => void handleFileUpload(e)}
                className="hidden"
                id="hero-bg-file-input"
              />
              <label
                htmlFor="hero-bg-file-input"
                className={`inline-flex min-h-[46px] flex-1 items-center justify-center gap-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] border border-[#D4AF37]/50 px-5 py-2.5 text-xs sm:text-sm font-bold text-white transition-colors cursor-pointer ${
                  uploadingBgImage ? 'opacity-60 pointer-events-none' : ''
                }`}
              >
                {uploadingBgImage ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" aria-hidden="true" />
                ) : (
                  <Upload className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
                )}
                <span>
                  {uploadingBgImage ? 'جاري الرفع إلى Cloudinary...' : 'رفع صورة جديدة من الجهاز'}
                </span>
              </label>

              {configDraft.heroBgImage && (
                <button
                  type="button"
                  onClick={() => onUpdateField('heroBgImage', '')}
                  className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-500/40 px-4 py-2.5 text-xs font-bold text-rose-200 cursor-pointer whitespace-nowrap"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  <span>إزالة الصورة</span>
                </button>
              )}
            </div>

            <div>
              <label htmlFor="hero-bg-url" className="block text-[11px] font-semibold text-gray-400 mb-1">
                أو أدخل رابط الصورة السحابي مباشرة (HTTPS)
              </label>
              <input
                id="hero-bg-url"
                type="url"
                dir="ltr"
                maxLength={600}
                value={configDraft.heroBgImage || ''}
                onChange={(e) => onUpdateField('heroBgImage', e.target.value)}
                placeholder="https://res.cloudinary.com/.../image.jpg"
                className="w-full min-h-[42px] rounded-xl bg-[#141414] border border-white/15 px-3 text-xs text-white text-left font-mono focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>
        )}
      </div>

      {/* 2. Image Display & Overlay Settings (Visible when image is enabled) */}
      {configDraft.heroBgType === 'image' && (
        <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 sm:p-6 space-y-4">
          <h3 className="text-base font-extrabold text-[#D4AF37]">
            02. إعدادات عرض الصورة وطبقة التغشية (Overlay)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                احتواء الصورة (Background Fit)
              </label>
              <select
                value={configDraft.heroBgFit || 'cover'}
                onChange={(e) => onUpdateField('heroBgFit', e.target.value as any)}
                className="w-full min-h-[42px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="cover">ملء البانر بالكامل (Cover — يملأ المساحة بدون تشويه)</option>
                <option value="contain">احتواء داخل البانر (Contain — إظهار الصورة كاملة)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                موضع الصورة (Background Position)
              </label>
              <select
                value={configDraft.heroBgPosition || 'center'}
                onChange={(e) => onUpdateField('heroBgPosition', e.target.value as any)}
                className="w-full min-h-[42px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="center">في المنتصف (Center)</option>
                <option value="top">الأعلى (Top)</option>
                <option value="bottom">أسفل (Bottom)</option>
                <option value="left">يسار (Left)</option>
                <option value="right">يمين (Right)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 mb-1.5">
                لون طبقة التغشية (Overlay Color)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={configDraft.heroOverlayColor || '#000000'}
                  onChange={(e) => onUpdateField('heroOverlayColor', e.target.value)}
                  className="h-10 w-16 rounded-xl bg-transparent cursor-pointer border border-white/20"
                />
                <input
                  type="text"
                  dir="ltr"
                  maxLength={30}
                  value={configDraft.heroOverlayColor || '#000000'}
                  onChange={(e) => onUpdateField('heroOverlayColor', e.target.value)}
                  className="flex-1 min-h-[40px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3 text-xs text-white font-mono text-left focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-300">
                  درجة شفافية التغشية (Overlay Opacity)
                </label>
                <span className="text-xs font-mono text-[#D4AF37]">
                  {Math.round((configDraft.heroOverlayOpacity ?? 0.2) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={configDraft.heroOverlayOpacity ?? 0.2}
                onChange={(e) => onUpdateField('heroOverlayOpacity', parseFloat(e.target.value))}
                className="w-full accent-[#D4AF37] cursor-pointer h-2 bg-[#0B0B0B] rounded-lg"
              />
              <p className="text-[10px] text-gray-400 mt-1">
                تزيد هذه الطبقة من وضوح النصوص وشريط البحث فوق خلفية الصورة.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Save / Cancel Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <button
          type="submit"
          disabled={savingSiteConfig || uploadingBgImage}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] disabled:opacity-55 border border-[#D4AF37]/70 px-6 py-3 text-sm font-extrabold text-white transition-colors whitespace-nowrap cursor-pointer"
        >
          {savingSiteConfig ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" aria-hidden="true" />
          ) : (
            <Check className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
          )}
          <span>
            {savingSiteConfig
              ? 'جاري الحفظ السحابي...'
              : 'حفظ إعدادات البانر الرئيسي سحابيًا'}
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
