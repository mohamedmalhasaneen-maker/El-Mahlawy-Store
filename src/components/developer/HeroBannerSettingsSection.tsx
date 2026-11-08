import { Check, ImagePlus, Loader2, RotateCcw, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { SiteConfig } from '../../utils/siteConfig';

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
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadImage = async (file: File) => {
    setUploadingImage(true);
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
      alert(err instanceof Error ? err.message : 'تعذر رفع الصورة السحابية');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <form
      onSubmit={(e) => void onSaveSubmit(e, 'إعدادات البانر الرئيسي (Hero Banner)')}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <ImagePlus className="h-6 w-6 text-[#D4AF37]" aria-hidden="true" />
            <span>إعدادات وتخصيص البانر الرئيسي (Hero Banner)</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            خصص مظهر البانر الرئيسي لأعلى الصفحة الرئيسية: لون ثابت، تدرج لوني، أو صورة خلفية سحابية من Cloudinary مع ضبط التغشية والموضع.
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

      {/* 1. Background Type & Main Styles */}
      <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 sm:p-6 space-y-5">
        <h3 className="text-base font-extrabold text-[#D4AF37]">
          01. نوع خلفية البانر الرئيسي
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { id: 'gradient', label: 'تدرج لوني (Gradient)', desc: 'دمج لونين بأسلوب عصري' },
            { id: 'color', label: 'لون ثابت (Solid Color)', desc: 'لون خلفية موحد وهادئ' },
            { id: 'image', label: 'صورة خلفية (Cloudinary)', desc: 'صورة سحابية بدقة عالية' },
          ].map((type) => {
            const active = configDraft.heroBgType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => onUpdateField('heroBgType', type.id as any)}
                className={`p-4 rounded-xl border text-right transition-colors cursor-pointer space-y-1 ${
                  active
                    ? 'bg-[#0F4C5C]/20 border-[#D4AF37] text-white shadow-[0_0_15px_rgba(212,175,55,0.15)]'
                    : 'bg-[#0B0B0B] border-white/10 hover:border-white/25 text-gray-300'
                }`}
              >
                <p className="text-sm font-extrabold text-[#D4AF37]">{type.label}</p>
                <p className="text-xs text-gray-400">{type.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Color / Gradient Options */}
        {(configDraft.heroBgType === 'gradient' || configDraft.heroBgType === 'color') && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            <div>
              <label htmlFor="cfg-hero-color-1" className="block text-xs font-bold text-gray-300 mb-1.5">
                اللون الأساسي {configDraft.heroBgType === 'gradient' ? '(البداية)' : ''}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="cfg-hero-color-1"
                  type="color"
                  value={configDraft.heroBgColor || '#0B2354'}
                  onChange={(e) => onUpdateField('heroBgColor', e.target.value)}
                  className="h-11 w-14 rounded-lg bg-[#0B0B0B] border border-white/15 cursor-pointer p-1"
                />
                <input
                  type="text"
                  dir="ltr"
                  value={configDraft.heroBgColor || '#0B2354'}
                  onChange={(e) => onUpdateField('heroBgColor', e.target.value)}
                  className="flex-1 min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            {configDraft.heroBgType === 'gradient' && (
              <>
                <div>
                  <label htmlFor="cfg-hero-color-2" className="block text-xs font-bold text-gray-300 mb-1.5">
                    اللون الثاني (النهاية)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="cfg-hero-color-2"
                      type="color"
                      value={configDraft.heroBgColor2 || '#0EA5E9'}
                      onChange={(e) => onUpdateField('heroBgColor2', e.target.value)}
                      className="h-11 w-14 rounded-lg bg-[#0B0B0B] border border-white/15 cursor-pointer p-1"
                    />
                    <input
                      type="text"
                      dir="ltr"
                      value={configDraft.heroBgColor2 || '#0EA5E9'}
                      onChange={(e) => onUpdateField('heroBgColor2', e.target.value)}
                      className="flex-1 min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="cfg-hero-gradient-dir" className="block text-xs font-bold text-gray-300 mb-1.5">
                    اتجاه التدرج اللوني
                  </label>
                  <select
                    id="cfg-hero-gradient-dir"
                    value={configDraft.heroBgGradientDirection || 'to-bl'}
                    onChange={(e) => onUpdateField('heroBgGradientDirection', e.target.value)}
                    className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                  >
                    <option value="to-r">من اليسار إلى اليمين (To Right)</option>
                    <option value="to-l">من اليمين إلى اليسار (To Left)</option>
                    <option value="to-t">من الأسفل للأعلى (To Top)</option>
                    <option value="to-b">من الأعلى للأسفل (To Bottom)</option>
                    <option value="to-br">من أعلى اليسار لأسفل اليمين</option>

                    <option value="to-bl">من أعلى اليمين لأسفل اليسار</option>
                  </select>
                </div>
              </>
            )}
          </div>
        )}

        {/* Image Options */}
        {configDraft.heroBgType === 'image' && (
          <div className="space-y-4 pt-2">
            <div>
              <label htmlFor="cfg-hero-bg-image-url" className="block text-xs font-bold text-gray-300 mb-1.5">
                رابط صورة خلفية البانر المباشر (HTTPS)
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  id="cfg-hero-bg-image-url"
                  type="url"
                  dir="ltr"
                  value={configDraft.heroBgImage || ''}
                  onChange={(e) => onUpdateField('heroBgImage', e.target.value)}
                  placeholder="https://res.cloudinary.com/..."
                  className="flex-1 min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]"
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files?.[0]) void handleUploadImage(e.target.files[0]);
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] border border-[#D4AF37]/60 px-4 py-2 text-xs font-bold text-white whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                >
                  {uploadingImage ? (
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
                  ) : (
                    <Upload className="h-4 w-4 text-[#D4AF37] shrink-0" aria-hidden="true" />
                  )}
                  <span>{uploadingImage ? 'جاري الرفع...' : 'رفع صورة من جهازك'}</span>
                </button>
              </div>
            </div>

            {configDraft.heroBgImage && (
              <div className="rounded-xl bg-[#0B0B0B] border border-white/15 p-3 flex items-center gap-4">
                <img
                  src={configDraft.heroBgImage}
                  alt="معاينة خلفية البانر"
                  className="h-16 w-28 rounded-lg object-cover border border-white/20 shrink-0 bg-black"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">صورة الخلفية المحددة حاليًا</p>
                  <p className="text-[11px] text-gray-400 truncate dir-ltr font-mono mt-0.5">
                    {configDraft.heroBgImage}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateField('heroBgImage', '')}
                  className="text-xs font-bold text-[#0F4C5C] hover:underline cursor-pointer"
                >
                  حذف الصورة
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cfg-hero-fit" className="block text-xs font-bold text-gray-300 mb-1.5">
                  طريقة احتواء الصورة (Background Fit)
                </label>
                <select
                  id="cfg-hero-fit"
                  value={configDraft.heroBgFit || 'cover'}
                  onChange={(e) => onUpdateField('heroBgFit', e.target.value as any)}
                  className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="cover">تغطية كاملة (Cover - الموصى بها)</option>
                  <option value="contain">احتواء كامل دون قص (Contain)</option>
                </select>
              </div>

              <div>
                <label htmlFor="cfg-hero-position" className="block text-xs font-bold text-gray-300 mb-1.5">
                  موضع تركيز الصورة (Position)
                </label>
                <select
                  id="cfg-hero-position"
                  value={configDraft.heroBgPosition || 'center'}
                  onChange={(e) => onUpdateField('heroBgPosition', e.target.value as any)}
                  className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="center">المنتصف (Center)</option>
                  <option value="top">الأعلى (Top)</option>
                  <option value="bottom">الأسفل (Bottom)</option>
                  <option value="right">اليمين (Right)</option>
                  <option value="left">اليسار (Left)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Dark Overlay & Opacity Settings */}
      <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 sm:p-6 space-y-5">
        <h3 className="text-base font-extrabold text-[#D4AF37]">
          02. طبقة التغشية الداكنة والشفافية (Overlay & Transparency)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cfg-hero-overlay-color" className="block text-xs font-bold text-gray-300 mb-1.5">
              لون طبقة التغشية
            </label>
            <div className="flex items-center gap-2">
              <input
                id="cfg-hero-overlay-color"
                type="color"
                value={configDraft.heroOverlayColor || '#000000'}
                onChange={(e) => onUpdateField('heroOverlayColor', e.target.value)}
                className="h-11 w-14 rounded-lg bg-[#0B0B0B] border border-white/15 cursor-pointer p-1"
              />
              <input
                type="text"
                dir="ltr"
                value={configDraft.heroOverlayColor || '#000000'}
                onChange={(e) => onUpdateField('heroOverlayColor', e.target.value)}
                className="flex-1 min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="cfg-hero-overlay-opacity" className="text-xs font-bold text-gray-300">
                درجة الشفافية والتظليل (Opacity)
              </label>
              <span className="text-xs font-extrabold text-[#D4AF37] tabular-nums">
                {Math.round((configDraft.heroOverlayOpacity ?? 0.2) * 100)}%
              </span>
            </div>
            <input
              id="cfg-hero-overlay-opacity"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={configDraft.heroOverlayOpacity ?? 0.2}
              onChange={(e) => onUpdateField('heroOverlayOpacity', parseFloat(e.target.value))}
              className="w-full accent-[#D4AF37] cursor-pointer"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              تساعد طبقة التغشية الداكنة على زيادة وضوح وسهولة قراءة النصوص البيضاء والذهبية على البانر.
            </p>
          </div>
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
