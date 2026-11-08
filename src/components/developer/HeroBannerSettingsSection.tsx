import {
  AlertCircle,
  ArrowDownLeft,
  Check,
  CheckCircle2,
  Eye,
  ImagePlus,
  Info,
  Layers,
  Loader2,
  Maximize2,
  MessageCircle,
  Monitor,
  Palette,
  RefreshCw,
  RotateCcw,
  Search,
  Sliders,
  Smartphone,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import React, { useRef, useState } from 'react';
import { DEFAULT_SITE_CONFIG, SiteConfig } from '../../utils/siteConfig';

interface HeroBannerSettingsSectionProps {
  configDraft: SiteConfig;
  isSiteConfigDirty: boolean;
  savingSiteConfig: boolean;
  onUpdateField: <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => void;
  onSaveSubmit: (e: React.FormEvent, sectionLabel: string) => Promise<void>;
  onCancelChanges: () => void;
  onResetToDefaults?: () => void;
}

const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/obvb7rtp/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'elmahlawy-store';

// Curated solid palette matching Elmahlawy Store branding
const BRAND_SOLID_PALETTE = [
  { name: 'كحلي المحلاوي الأصلي', hex: '#0B2354' },
  { name: 'أزرق نيلي ملكي', hex: '#164BB0' },
  { name: 'أزرق مائي سحابي', hex: '#0EA5E9' },
  { name: 'كحلي ليلي داكن', hex: '#071739' },
  { name: 'فاحم فخم', hex: '#111827' },
  { name: 'تركواز بحري', hex: '#0D9488' },
  { name: 'أزرق كهربائي', hex: '#2563EB' },
  { name: 'رمادي غامق أنيق', hex: '#1E293B' },
];

// Curated gradient presets
const BRAND_GRADIENT_PRESETS = [
  {
    name: 'تدرج المحلاوي ستور الرسمي (الافتراضي)',
    c1: '#0B2354',
    c2: '#0EA5E9',
    dir: 'to-bl',
  },
  {
    name: 'الأزرق الملكي العميق',
    c1: '#071739',
    c2: '#164BB0',
    dir: 'to-br',
  },
  {
    name: 'أمواج البحر الهندسية',
    c1: '#0F4C5C',
    c2: '#0EA5E9',
    dir: 'to-r',
  },
  {
    name: 'الفخامة المظلمة Modern Dark',
    c1: '#0B132B',
    c2: '#1C2541',
    dir: 'to-b',
  },
];

// Gradient directions
const GRADIENT_DIRECTIONS = [
  { id: 'to-bl', label: 'من أعلى اليمين لأسفل اليسار (الافتراضي ↙)', css: 'to bottom left' },
  { id: 'to-br', label: 'من أعلى اليسار لأسفل اليمين (↘)', css: 'to bottom right' },
  { id: 'to-r', label: 'أفقي من اليسار إلى اليمين (→)', css: 'to right' },
  { id: 'to-l', label: 'أفقي من اليمين إلى اليسار (←)', css: 'to left' },
  { id: 'to-b', label: 'رأسي من الأعلى للأسفل (↓)', css: 'to bottom' },
  { id: 'to-t', label: 'رأسي من الأسفل للأعلى (↑)', css: 'to top' },
  { id: 'to-tl', label: 'قطري من أسفل اليمين لأعلى اليسار (↖)', css: 'to top left' },
  { id: 'to-tr', label: 'قطري من أسفل اليسار لأعلى اليمين (↗)', css: 'to top right' },
];

export function HeroBannerSettingsSection({
  configDraft,
  isSiteConfigDirty,
  savingSiteConfig,
  onUpdateField,
  onSaveSubmit,
  onCancelChanges,
  onResetToDefaults,
}: HeroBannerSettingsSectionProps) {
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showFullPreviewModal, setShowFullPreviewModal] = useState<boolean>(false);
  const [previewDeviceMode, setPreviewDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [resetConfirmOpen, setResetConfirmOpen] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to compute banner style dynamically
  const computeBannerPreviewStyle = (): React.CSSProperties => {
    if (configDraft.heroBgType === 'image' && configDraft.heroBgImage) {
      return {
        backgroundImage: `url(${configDraft.heroBgImage})`,
        backgroundSize: configDraft.heroBgFit || 'cover',
        backgroundPosition: configDraft.heroBgPosition || 'center',
        backgroundRepeat: 'no-repeat',
      };
    }

    if (configDraft.heroBgType === 'color') {
      return {
        backgroundColor: configDraft.heroBgColor || '#0B2354',
      };
    }

    const c1 = configDraft.heroBgColor || '#0B2354';
    const c2 = configDraft.heroBgColor2 || '#0EA5E9';
    const dir = configDraft.heroBgGradientDirection || 'to-bl';
    const dirObj = GRADIENT_DIRECTIONS.find((d) => d.id === dir);
    const cssDir = dirObj ? dirObj.css : 'to bottom left';

    if (c1.toLowerCase() === '#0b2354' && c2.toLowerCase() === '#0ea5e9' && (dir === 'to-bl' || !dir)) {
      return {
        backgroundImage: `linear-gradient(${cssDir}, #0B2354, #164BB0, #0EA5E9)`,
      };
    }

    return {
      backgroundImage: `linear-gradient(${cssDir}, ${c1}, ${c2})`,
    };
  };

  // Upload handler with validation
  const handleUploadImage = async (file: File) => {
    setUploadError(null);

    if (!file.type.startsWith('image/')) {
      setUploadError('يرجى اختيار ملف صورة صالح (JPG, PNG, WEBP, AVIF).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('حجم الصورة كبير جدًا. يرجى اختيار صورة أقل من 10 ميجابايت.');
      return;
    }

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
        throw new Error('لم تُرجع خدمة Cloudinary رابط صورة سحابي آمن.');
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'تعذر رفع الصورة السحابية');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Restore official default settings
  const handleExecuteResetToDefaults = () => {
    if (onResetToDefaults) {
      onResetToDefaults();
    } else {
      onUpdateField('heroBgType', DEFAULT_SITE_CONFIG.heroBgType);
      onUpdateField('heroBgColor', DEFAULT_SITE_CONFIG.heroBgColor);
      onUpdateField('heroBgColor2', DEFAULT_SITE_CONFIG.heroBgColor2);
      onUpdateField('heroBgGradientDirection', DEFAULT_SITE_CONFIG.heroBgGradientDirection);
      onUpdateField('heroBgImage', DEFAULT_SITE_CONFIG.heroBgImage);
      onUpdateField('heroBgFit', DEFAULT_SITE_CONFIG.heroBgFit);
      onUpdateField('heroBgPosition', DEFAULT_SITE_CONFIG.heroBgPosition);
      onUpdateField('heroOverlayColor', DEFAULT_SITE_CONFIG.heroOverlayColor);
      onUpdateField('heroOverlayOpacity', DEFAULT_SITE_CONFIG.heroOverlayOpacity);
    }
    setResetConfirmOpen(false);
    setSaveStatus({
      type: 'success',
      message: 'تم استعادة إعدادات وتنسيق البانر الافتراضي الأصلي للمتجر. اضغط «حفظ التغييرات» لتثبيته سحابيًا.',
    });
  };

  const handleFormSubmitInternal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus(null);
    try {
      await onSaveSubmit(e, 'إعدادات البانر الرئيسي (Hero Banner)');
      setSaveStatus({
        type: 'success',
        message: 'تم حفظ إعدادات البانر الرئيسي وتأكيد كتابتها في Firestore بنجاح.',
      });
    } catch (err) {
      setSaveStatus({
        type: 'error',
        message: err instanceof Error ? err.message : 'فشل حفظ إعدادات البانر في Firestore.',
      });
    }
  };

  return (
    <form onSubmit={handleFormSubmitInternal} className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl bg-[#141414]/90 backdrop-blur-xl border border-[#D4AF37]/30 p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0F4C5C]/30 border border-[#D4AF37]/50 text-[#D4AF37] shadow-inner">
            <ImagePlus className="h-6 w-6" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              إعدادات وتخصيص البانر الرئيسي
            </h2>
            <p className="text-xs sm:text-sm text-gray-300 mt-0.5">
              تحكم كامل في مظهر وخلفية البانر الرئيسي المحتوي على شريط البحث (لون ثابت، تدرج لوني، أو صورة سحابية مع طبقة التعتيم).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFullPreviewModal(true)}
            className="inline-flex min-h-[40px] items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 px-3.5 py-2 text-xs font-bold text-white transition-all cursor-pointer"
          >
            <Eye className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
            <span>معاينة واقعية</span>
          </button>
        </div>
      </div>

      {/* Global Status Banner if present */}
      {saveStatus && (
        <div
          role="alert"
          className={`rounded-2xl p-4 border flex items-start gap-3 text-xs sm:text-sm font-semibold transition-all shadow-lg ${
            saveStatus.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
              : 'bg-red-950/60 border-red-500/50 text-red-200'
          }`}
        >
          {saveStatus.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" aria-hidden="true" />
          )}
          <div className="space-y-0.5">
            <p className="font-bold">{saveStatus.type === 'success' ? 'تمت العملية بنجاح' : 'تنبيه'}</p>
            <p className="text-xs opacity-90">{saveStatus.message}</p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. بطاقة معاينة البانر                                                    */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-[#141414]/90 backdrop-blur-xl border border-[#D4AF37]/25 p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] font-bold text-xs">
              01
            </span>
            <h3 className="text-base font-extrabold text-[#D4AF37] flex items-center gap-2">
              <Eye className="h-4 w-4" aria-hidden="true" />
              <span>بطاقة معاينة البانر المباشرة</span>
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#0B0B0B] rounded-lg p-0.5 border border-white/10">
              <button
                type="button"
                onClick={() => setPreviewDeviceMode('desktop')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                  previewDeviceMode === 'desktop' ? 'bg-[#0F4C5C] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Monitor className="h-3.5 w-3.5" aria-hidden="true" />
                <span>كمبيوتر</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDeviceMode('mobile')}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer ${
                  previewDeviceMode === 'mobile' ? 'bg-[#0F4C5C] text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" aria-hidden="true" />
                <span>موبايل</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowFullPreviewModal(true)}
              className="p-1.5 rounded-lg bg-[#0B0B0B] border border-white/10 text-gray-300 hover:text-white cursor-pointer"
              title="تكبير المعاينة"
            >
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Live Preview Container */}
        <div
          className={`mx-auto overflow-hidden rounded-2xl border border-white/20 shadow-2xl transition-all duration-300 relative ${
            previewDeviceMode === 'mobile' ? 'max-w-[360px]' : 'w-full'
          }`}
        >
          {/* Simulated Browser Bar */}
          <div className="bg-[#0B1528] px-3.5 py-2 text-[11px] text-gray-400 border-b border-white/10 flex items-center justify-between">
            <span className="truncate font-mono">https://elmahlawy-store.vercel.app/</span>
            <span className="flex items-center gap-1.5 text-[#38BDF8] text-[10px] font-bold">
              <span className="h-2 w-2 rounded-full bg-[#38BDF8] animate-pulse" />
              معاينة حية فورية
            </span>
          </div>

          {/* Rendered Live Hero Banner */}
          <div
            className="relative p-6 sm:p-10 text-white min-h-[300px] flex flex-col justify-center overflow-hidden transition-all duration-300"
            style={computeBannerPreviewStyle()}
          >
            {/* Dynamic Dark Overlay */}
            <div
              className="absolute inset-0 pointer-events-none z-0 transition-all duration-200"
              style={{
                backgroundColor: configDraft.heroOverlayColor || '#000000',
                opacity: typeof configDraft.heroOverlayOpacity === 'number' ? configDraft.heroOverlayOpacity : 0.2,
              }}
            />

            {/* Geometric Contour Vectors (visible in color and gradient modes) */}
            {configDraft.heroBgType !== 'image' && (
              <svg
                aria-hidden="true"
                viewBox="0 0 1440 560"
                fill="none"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 h-full w-full opacity-25 z-0"
              >
                <circle cx="180" cy="90" r="240" stroke="#BAE6FD" strokeWidth="1.5" />
                <circle cx="180" cy="90" r="340" stroke="#7DD3FC" strokeWidth="1" />
                <path
                  d="M-100 430 C 320 310, 680 540, 1120 390 C 1300 330, 1420 380, 1540 350"
                  stroke="#E0F2FE"
                  strokeWidth="1.5"
                />
              </svg>
            )}

            {/* Interactive Mock Content */}
            <div className="relative z-10 max-w-xl space-y-3.5">
              <p className="text-xs font-bold text-[#BAE6FD] tracking-wide">
                {configDraft.storeName || 'المحلاوي ستور'} | <bdi>{configDraft.storeSubtitle || 'Elmahlawy Store'}</bdi>
              </p>

              <h3 className="text-xl sm:text-2xl font-black text-white leading-snug drop-shadow-md">
                {configDraft.tagline || 'متجرك الموثوق للأجهزة وأنظمة التكييف والحلول الهندسية'}
              </h3>

              {/* Realistic Search Bar Mockup */}
              <div className="relative flex items-center rounded-2xl bg-white p-1.5 shadow-[0_10px_30px_rgba(0,0,0,0.25)] max-w-lg">
                <Search className="mr-2.5 ml-2 h-4 w-4 text-[#1D4ED8] shrink-0" aria-hidden="true" />
                <input
                  type="text"
                  readOnly
                  placeholder="ابحث في المنتجات والأجهزة والموديلات المتاحة..."
                  className="w-full bg-transparent text-xs sm:text-sm text-[#0B1F3A] placeholder:text-slate-400 focus:outline-none"
                />
                <span className="min-h-[36px] rounded-xl bg-[#1D4ED8] px-4 py-1.5 text-xs font-bold text-white flex items-center justify-center shrink-0">
                  بحث
                </span>
              </div>

              {/* Action Buttons Mockup */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <span className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-white px-4 py-1.5 text-xs font-black text-[#0F294A] shadow-md">
                  <span>تصفح المنتجات</span>
                  <ArrowDownLeft className="h-3.5 w-3.5 text-[#1D4ED8]" aria-hidden="true" />
                </span>
                <span className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl bg-white/20 border border-white/30 px-3.5 py-1.5 text-xs font-bold text-white">
                  <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>واتساب الأعمال</span>
                </span>
              </div>
            </div>
          </div>

          {/* Status info bar */}
          <div className="bg-[#141414] px-4 py-2 border-t border-white/10 flex items-center justify-between text-[11px] text-gray-400">
            <span>
              النوع:{' '}
              <strong className="text-[#D4AF37]">
                {configDraft.heroBgType === 'gradient'
                  ? 'تدرج لوني'
                  : configDraft.heroBgType === 'color'
                  ? 'لون ثابت'
                  : 'صورة سحابية'}
              </strong>
            </span>
            <span>تعتيم التظليل: {Math.round((configDraft.heroOverlayOpacity ?? 0.2) * 100)}%</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. بطاقة اختيار الخلفية                                                   */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-[#141414]/90 backdrop-blur-xl border border-[#D4AF37]/25 p-5 sm:p-6 shadow-xl space-y-5">
        <div className="border-b border-white/10 pb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] font-bold text-xs">
            02
          </span>
          <div>
            <h3 className="text-base font-extrabold text-[#D4AF37] flex items-center gap-2">
              <Palette className="h-4 w-4" aria-hidden="true" />
              <span>بطاقة اختيار الخلفية (لون ثابت / تدرج لوني / صورة سحابية)</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              حدد مصدر ونمط الخلفية التي ترغب في تطبيقها على البانر الرئيسي.
            </p>
          </div>
        </div>

        {/* Background Source Selector Tabs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              id: 'gradient',
              title: 'تدرج لوني',
              sub: 'Gradient (الافتراضي)',
              desc: 'دمج عصري بين لونين متناسقين',
            },
            {
              id: 'color',
              title: 'لون ثابت',
              sub: 'Solid Color',
              desc: 'لون خلفية موحد وهادئ وأنيق',
            },
            {
              id: 'image',
              title: 'صورة خلفية',
              sub: 'Cloudinary Image',
              desc: 'صورة سحابية عالية الدقة والوضوح',
            },
          ].map((type) => {
            const active = configDraft.heroBgType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => onUpdateField('heroBgType', type.id as any)}
                className={`p-4 rounded-xl border text-right transition-all cursor-pointer relative ${
                  active
                    ? 'bg-[#0F4C5C]/30 border-[#D4AF37] text-white shadow-[0_0_20px_rgba(212,175,55,0.2)]'
                    : 'bg-[#0B0B0B] border-white/10 hover:border-white/25 text-gray-300'
                }`}
              >
                {active && (
                  <span className="absolute top-2.5 left-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4AF37] text-[#0B0B0B]">
                    <Check className="h-2.5 w-2.5 stroke-[3]" aria-hidden="true" />
                  </span>
                )}
                <p className="text-sm font-extrabold text-[#D4AF37]">{type.title}</p>
                <p className="text-[11px] text-gray-400 font-medium">{type.sub}</p>
                <p className="text-[11px] text-gray-400 mt-1">{type.desc}</p>
              </button>
            );
          })}
        </div>

        {/* Option A: Solid Color Mode */}
        {configDraft.heroBgType === 'color' && (
          <div className="rounded-xl bg-[#0B0B0B] border border-white/10 p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cfg-hero-color-picker" className="block text-xs font-bold text-gray-300 mb-1.5">
                  اختر اللون المخصص (Color Picker)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="cfg-hero-color-picker"
                    type="color"
                    value={configDraft.heroBgColor || '#0B2354'}
                    onChange={(e) => onUpdateField('heroBgColor', e.target.value)}
                    className="h-11 w-14 rounded-xl bg-[#141414] border border-white/20 cursor-pointer p-1 shrink-0"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={configDraft.heroBgColor || '#0B2354'}
                    onChange={(e) => onUpdateField('heroBgColor', e.target.value)}
                    placeholder="#0B2354"
                    className="flex-1 min-h-[44px] rounded-xl bg-[#141414] border border-white/15 px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  معاينة عينة اللون
                </label>
                <div className="flex items-center gap-3 min-h-[44px] rounded-xl bg-[#141414] border border-white/15 px-3.5 py-2">
                  <span
                    className="h-7 w-7 rounded-lg border border-white/20 shrink-0 shadow-inner"
                    style={{ backgroundColor: configDraft.heroBgColor || '#0B2354' }}
                  />
                  <span className="text-xs text-gray-300 font-mono">
                    {configDraft.heroBgColor || '#0B2354'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-400 mb-2">ألوان مقترحة متوافقة مع هوية المحلاوي ستور:</p>
              <div className="flex flex-wrap gap-2">
                {BRAND_SOLID_PALETTE.map((pal) => (
                  <button
                    key={pal.hex}
                    type="button"
                    onClick={() => onUpdateField('heroBgColor', pal.hex)}
                    className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs text-white transition-all cursor-pointer ${
                      (configDraft.heroBgColor || '').toLowerCase() === pal.hex.toLowerCase()
                        ? 'border-[#D4AF37] bg-white/15 shadow-sm'
                        : 'border-white/10 bg-[#141414] hover:border-white/30'
                    }`}
                  >
                    <span
                      className="h-3 w-3 rounded-full border border-white/30 shrink-0"
                      style={{ backgroundColor: pal.hex }}
                    />
                    <span>{pal.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Option B: Gradient Mode */}
        {configDraft.heroBgType === 'gradient' && (
          <div className="rounded-xl bg-[#0B0B0B] border border-white/10 p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Color 1 */}
              <div>
                <label htmlFor="cfg-grad-c1" className="block text-xs font-bold text-gray-300 mb-1.5">
                  اللون الأول (بداية التدرج)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="cfg-grad-c1"
                    type="color"
                    value={configDraft.heroBgColor || '#0B2354'}
                    onChange={(e) => onUpdateField('heroBgColor', e.target.value)}
                    className="h-11 w-14 rounded-xl bg-[#141414] border border-white/20 cursor-pointer p-1 shrink-0"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={configDraft.heroBgColor || '#0B2354'}
                    onChange={(e) => onUpdateField('heroBgColor', e.target.value)}
                    className="flex-1 min-h-[44px] rounded-xl bg-[#141414] border border-white/15 px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              {/* Color 2 */}
              <div>
                <label htmlFor="cfg-grad-c2" className="block text-xs font-bold text-gray-300 mb-1.5">
                  اللون الثاني (نهاية التدرج)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="cfg-grad-c2"
                    type="color"
                    value={configDraft.heroBgColor2 || '#0EA5E9'}
                    onChange={(e) => onUpdateField('heroBgColor2', e.target.value)}
                    className="h-11 w-14 rounded-xl bg-[#141414] border border-white/20 cursor-pointer p-1 shrink-0"
                  />
                  <input
                    type="text"
                    dir="ltr"
                    value={configDraft.heroBgColor2 || '#0EA5E9'}
                    onChange={(e) => onUpdateField('heroBgColor2', e.target.value)}
                    className="flex-1 min-h-[44px] rounded-xl bg-[#141414] border border-white/15 px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            {/* Direction */}
            <div>
              <label htmlFor="cfg-grad-direction" className="block text-xs font-bold text-gray-300 mb-1.5">
                اتجاه التدرج اللوني
              </label>
              <select
                id="cfg-grad-direction"
                value={configDraft.heroBgGradientDirection || 'to-bl'}
                onChange={(e) => onUpdateField('heroBgGradientDirection', e.target.value)}
                className="w-full min-h-[44px] rounded-xl bg-[#141414] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              >
                {GRADIENT_DIRECTIONS.map((dir) => (
                  <option key={dir.id} value={dir.id}>
                    {dir.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Gradient Presets */}
            <div>
              <p className="text-xs font-bold text-gray-400 mb-2">تدرجات جاهزة متناسقة:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {BRAND_GRADIENT_PRESETS.map((p) => {
                  const isSelected =
                    (configDraft.heroBgColor || '').toLowerCase() === p.c1.toLowerCase() &&
                    (configDraft.heroBgColor2 || '').toLowerCase() === p.c2.toLowerCase() &&
                    (configDraft.heroBgGradientDirection || 'to-bl') === p.dir;

                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => {
                        onUpdateField('heroBgColor', p.c1);
                        onUpdateField('heroBgColor2', p.c2);
                        onUpdateField('heroBgGradientDirection', p.dir);
                      }}
                      className={`p-2.5 rounded-xl border text-right transition-all flex items-center gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-[#0F4C5C]/35 border-[#D4AF37] text-white shadow-sm'
                          : 'bg-[#141414] border-white/10 hover:border-white/25 text-gray-300'
                      }`}
                    >
                      <span
                        className="h-8 w-12 rounded-lg border border-white/20 shrink-0 shadow-inner"
                        style={{ backgroundImage: `linear-gradient(to right, ${p.c1}, ${p.c2})` }}
                      />
                      <span className="text-xs font-bold truncate">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Option C: Image Mode */}
        {configDraft.heroBgType === 'image' && (
          <div className="rounded-xl bg-[#0B0B0B] border border-white/10 p-4 space-y-4">
            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files?.[0]) {
                  void handleUploadImage(e.dataTransfer.files[0]);
                }
              }}
              className={`rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                isDragOver
                  ? 'border-[#D4AF37] bg-[#0F4C5C]/20 shadow-[0_0_20px_rgba(212,175,55,0.25)]'
                  : 'border-white/20 bg-[#141414]/70 hover:border-white/35'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) void handleUploadImage(e.target.files[0]);
                }}
                className="hidden"
              />

              <div className="flex flex-col items-center justify-center space-y-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0F4C5C]/40 border border-[#D4AF37]/50 text-[#D4AF37]">
                  {uploadingImage ? (
                    <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
                  ) : (
                    <Upload className="h-6 w-6" aria-hidden="true" />
                  )}
                </div>

                <div>
                  <p className="text-sm font-bold text-white">
                    {uploadingImage ? 'جاري رفع الصورة سحابيًا...' : 'اسحب الصورة وأفلتها هنا أو اضغط للرفع'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    يدعم JPG, PNG, WEBP, AVIF مع رفع سحابي آمن عبر Cloudinary
                  </p>
                </div>

                <button
                  type="button"
                  disabled={uploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] border border-[#D4AF37]/60 px-5 py-2 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50"
                >
                  <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{uploadingImage ? 'جاري الرفع السحابي...' : 'رفع صورة من الجهاز'}</span>
                </button>
              </div>
            </div>

            {uploadError && (
              <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-200">
                {uploadError}
              </div>
            )}

            {/* Direct Image URL input */}
            <div>
              <label htmlFor="cfg-hero-img-direct-url" className="block text-xs font-bold text-gray-300 mb-1.5">
                رابط الصورة السحابي المباشر (HTTPS)
              </label>
              <input
                id="cfg-hero-img-direct-url"
                type="url"
                dir="ltr"
                value={configDraft.heroBgImage || ''}
                onChange={(e) => onUpdateField('heroBgImage', e.target.value)}
                placeholder="https://res.cloudinary.com/obvb7rtp/image/upload/..."
                className="w-full min-h-[44px] rounded-xl bg-[#141414] border border-white/15 px-3.5 py-2 text-sm text-white placeholder:text-gray-500 font-mono focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            {/* Active Image Card with thumbnail, replace and delete */}
            {configDraft.heroBgImage && (
              <div className="rounded-xl bg-[#141414] border border-white/15 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={configDraft.heroBgImage}
                    alt="خلفية البانر المحددة"
                    className="h-14 w-24 rounded-lg object-cover border border-white/20 bg-black shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">تم تحديد الصورة السحابية بنجاح</p>
                    <p className="text-[11px] text-gray-400 font-mono truncate dir-ltr mt-0.5">
                      {configDraft.heroBgImage}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
                  >
                    <RefreshCw className="h-3 w-3" aria-hidden="true" />
                    <span>استبدال</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateField('heroBgImage', '');
                      onUpdateField('heroBgType', 'gradient');
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/70 border border-red-500/40 px-3 py-1.5 text-xs font-bold text-red-200 cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" aria-hidden="true" />
                    <span>حذف الصورة والعودة للتدرج</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. بطاقة ضبط الصورة وطبقة التعتيم                                         */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-[#141414]/90 backdrop-blur-xl border border-[#D4AF37]/25 p-5 sm:p-6 shadow-xl space-y-5">
        <div className="border-b border-white/10 pb-3 flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] font-bold text-xs">
            03
          </span>
          <div>
            <h3 className="text-base font-extrabold text-[#D4AF37] flex items-center gap-2">
              <Sliders className="h-4 w-4" aria-hidden="true" />
              <span>بطاقة ضبط الصورة وطبقة التعتيم لضمان وضوح شريط البحث</span>
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              تحكم في طريقة احتواء الصورة، موضعها، وشفافية التظليل لحماية مقروئية النصوص والأزرار.
            </p>
          </div>
        </div>

        {/* If Image: Fit & Position */}
        {configDraft.heroBgType === 'image' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cfg-hero-image-fit" className="block text-xs font-bold text-gray-300 mb-1.5">
                طريقة احتواء الصورة (Background Fit)
              </label>
              <select
                id="cfg-hero-image-fit"
                value={configDraft.heroBgFit || 'cover'}
                onChange={(e) => onUpdateField('heroBgFit', e.target.value as any)}
                className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="cover">تغطية كاملة (Cover - الموصى بها)</option>
                <option value="contain">احتواء كامل دون قص (Contain)</option>
              </select>
            </div>

            <div>
              <label htmlFor="cfg-hero-image-position" className="block text-xs font-bold text-gray-300 mb-1.5">
                موضع تركيز الصورة (Position)
              </label>
              <select
                id="cfg-hero-image-position"
                value={configDraft.heroBgPosition || 'center'}
                onChange={(e) => onUpdateField('heroBgPosition', e.target.value as any)}
                className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="center">الوسط (Center - الموصى بها)</option>
                <option value="top">الأعلى (Top)</option>
                <option value="bottom">الأسفل (Bottom)</option>
                <option value="right">اليمين (Right)</option>
                <option value="left">اليسار (Left)</option>
              </select>
            </div>
          </div>
        )}

        {/* Overlay Color & Opacity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="cfg-hero-overlay-picker" className="block text-xs font-bold text-gray-300 mb-1.5">
              لون طبقة التعتيم والتظليل
            </label>
            <div className="flex items-center gap-2">
              <input
                id="cfg-hero-overlay-picker"
                type="color"
                value={configDraft.heroOverlayColor || '#000000'}
                onChange={(e) => onUpdateField('heroOverlayColor', e.target.value)}
                className="h-11 w-14 rounded-xl bg-[#0B0B0B] border border-white/20 cursor-pointer p-1 shrink-0"
              />
              <input
                type="text"
                dir="ltr"
                value={configDraft.heroOverlayColor || '#000000'}
                onChange={(e) => onUpdateField('heroOverlayColor', e.target.value)}
                className="flex-1 min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="cfg-hero-opacity-range" className="text-xs font-bold text-gray-300">
                درجة التعتيم (Opacity)
              </label>
              <span className="text-xs font-extrabold text-[#D4AF37] tabular-nums">
                {Math.round((configDraft.heroOverlayOpacity ?? 0.2) * 100)}%
              </span>
            </div>
            <input
              id="cfg-hero-opacity-range"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={configDraft.heroOverlayOpacity ?? 0.2}
              onChange={(e) => onUpdateField('heroOverlayOpacity', parseFloat(e.target.value))}
              className="w-full accent-[#D4AF37] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>0% (بدون تعتيم)</span>
              <span>20% (الافتراضي الرسمي)</span>
              <span>100% (تعتيم كامل)</span>
            </div>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0B0B0B] border border-white/10 flex items-start gap-2.5 text-xs text-gray-300">
          <Info className="h-4 w-4 text-[#38BDF8] shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            توضع طبقة التعتيم والتظليل لحماية تباين شريط البحث الأبيض والعناوين المضيئة. القيمة الموصى بها هي <strong>20% إلى 40%</strong>.
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. بطاقة إدارة التغييرات                                                  */}
      {/* ========================================================================= */}
      <div className="rounded-2xl bg-[#141414]/90 backdrop-blur-xl border border-[#D4AF37]/35 p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="border-b border-white/10 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#D4AF37]/15 text-[#D4AF37] font-bold text-xs">
              04
            </span>
            <h3 className="text-base font-extrabold text-[#D4AF37] flex items-center gap-2">
              <Layers className="h-4 w-4" aria-hidden="true" />
              <span>بطاقة إدارة التغييرات وحفظ الإعدادات</span>
            </h3>
          </div>
          <span className="text-xs text-gray-400">
            {isSiteConfigDirty ? 'يوجد تعديلات غير محفوظة' : 'الإعدادات متطابقة مع السحابة'}
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          {/* Main Action: Save Changes */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={savingSiteConfig}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] disabled:opacity-55 border border-[#D4AF37] px-6 py-2.5 text-sm font-black text-white transition-all shadow-[0_0_20px_rgba(212,175,55,0.25)] cursor-pointer"
            >
              {savingSiteConfig ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Check className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
              )}
              <span>{savingSiteConfig ? 'جاري الحفظ في Firestore...' : 'حفظ التغييرات سحابيًا'}</span>
            </button>

            {/* Preview button */}
            <button
              type="button"
              onClick={() => setShowFullPreviewModal(true)}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 px-5 py-2.5 text-sm font-bold text-white transition-all cursor-pointer"
            >
              <Eye className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
              <span>معاينة واقعية</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Cancel Changes */}
            <button
              type="button"
              disabled={savingSiteConfig || !isSiteConfigDirty}
              onClick={() => {
                onCancelChanges();
                setSaveStatus({
                  type: 'success',
                  message: 'تم إلغاء التغييرات واستعادة آخر نسخة محفوظة سحابيًا.',
                });
              }}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#0B0B0B] hover:bg-[#1A1A1A] disabled:opacity-40 border border-white/15 px-4 py-2.5 text-xs sm:text-sm font-semibold text-gray-300 transition-all cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>إلغاء التغييرات</span>
            </button>

            {/* Restore Original Default Appearance */}
            <button
              type="button"
              onClick={() => setResetConfirmOpen(true)}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#0B2354]/40 hover:bg-[#0B2354]/70 border border-[#0EA5E9]/50 px-4 py-2.5 text-xs sm:text-sm font-bold text-[#E0F2FE] transition-all cursor-pointer"
              title="الرجوع إلى خلفية وألوان المحلاوي ستور الأصلية"
            >
              <RefreshCw className="h-4 w-4 text-[#38BDF8]" aria-hidden="true" />
              <span>استعادة المظهر الأصلي</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Reset to Defaults */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-[#141414] border border-[#D4AF37]/40 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#D4AF37]">
              <RefreshCw className="h-6 w-6" aria-hidden="true" />
              <h4 className="text-lg font-bold text-white">استعادة المظهر والتنسيق الأصلي للبانر؟</h4>
            </div>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              سيتم إعادة إعدادات البانر الرئيسي فورًا إلى التصميم الأصلي المعتمد للمتجر:
              <br />
              • التدرج اللوني الرسمي للمحلاوي ستور (كحلي <strong>#0B2354</strong> إلى أزرق <strong>#0EA5E9</strong>).
              <br />
              • اتجاه التدرج القطري الرسمي <strong>to-bl</strong>.
              <br />
              • إزالة أي صورة مخصصة وإعادة التعتيم إلى <strong>20%</strong>.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setResetConfirmOpen(false)}
                className="rounded-xl bg-white/10 hover:bg-white/15 px-4 py-2 text-xs font-bold text-gray-300 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleExecuteResetToDefaults}
                className="rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] border border-[#D4AF37] px-4 py-2 text-xs font-bold text-white cursor-pointer"
              >
                تأكيد الاستعادة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Interactive Realistic Preview Modal */}
      {showFullPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-lg overflow-y-auto">
          <div className="w-full max-w-5xl rounded-3xl bg-[#0B132B] border border-white/20 shadow-2xl overflow-hidden my-auto space-y-0">
            {/* Modal Header */}
            <div className="bg-[#141414] px-5 py-3.5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="text-xs font-bold text-white mr-3">معاينة البانر الرئيسي بالحجم الكامل كما يظهر للزوار</span>
              </div>
              <button
                type="button"
                onClick={() => setShowFullPreviewModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Realistic Banner Simulation */}
            <div
              className="relative text-white min-h-[380px] p-8 sm:p-12 lg:p-16 flex flex-col justify-center overflow-hidden"
              style={computeBannerPreviewStyle()}
            >
              {/* Overlay */}
              <div
                className="absolute inset-0 pointer-events-none z-0"
                style={{
                  backgroundColor: configDraft.heroOverlayColor || '#000000',
                  opacity: typeof configDraft.heroOverlayOpacity === 'number' ? configDraft.heroOverlayOpacity : 0.2,
                }}
              />

              {/* Water Curves if not image */}
              {configDraft.heroBgType !== 'image' && (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 1440 560"
                  fill="none"
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute inset-0 h-full w-full opacity-25 z-0"
                >
                  <circle cx="180" cy="90" r="240" stroke="#BAE6FD" strokeWidth="1.5" />
                  <circle cx="180" cy="90" r="340" stroke="#7DD3FC" strokeWidth="1" />
                  <path
                    d="M-100 430 C 320 310, 680 540, 1120 390 C 1300 330, 1420 380, 1540 350"
                    stroke="#E0F2FE"
                    strokeWidth="1.5"
                  />
                </svg>
              )}

              <div className="relative z-10 max-w-2xl space-y-4">
                <p className="text-xs sm:text-sm font-bold text-[#BAE6FD] tracking-wide">
                  {configDraft.storeName || 'المحلاوي ستور'} | <bdi>{configDraft.storeSubtitle || 'Elmahlawy Store'}</bdi>
                </p>

                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white leading-tight drop-shadow-md">
                  {configDraft.tagline || 'متجرك الموثوق للأجهزة وأنظمة التكييف والحلول الهندسية'}
                </h2>

                <p className="text-xs sm:text-sm text-[#E0F2FE] max-w-xl leading-relaxed">
                  {configDraft.heroDescription ||
                    'نقدم لك تشكيلة متميزة من الأجهزة الكهربائية وأنظمة التكييف مع ضمان موثوق وخدمة عملاء على مدار الساعة.'}
                </p>

                {/* Search Bar Simulation */}
                <div className="relative flex items-center rounded-2xl bg-white p-2 shadow-2xl max-w-xl">
                  <Search className="mr-3 ml-2 h-5 w-5 text-[#1D4ED8] shrink-0" aria-hidden="true" />
                  <input
                    type="text"
                    readOnly
                    placeholder="ابحث في المنتجات والأجهزة والموديلات المتاحة..."
                    className="w-full bg-transparent text-sm text-[#0B1F3A] placeholder:text-slate-400 focus:outline-none"
                  />
                  <span className="rounded-xl bg-[#1D4ED8] px-5 py-2 text-xs font-bold text-white shrink-0">
                    بحث
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 pt-2">
                  <span className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs sm:text-sm font-extrabold text-[#0F294A] shadow-md">
                    <span>تصفح المنتجات</span>
                    <ArrowDownLeft className="h-4 w-4 text-[#1D4ED8]" aria-hidden="true" />
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-xl bg-white/18 border border-white/35 px-4 py-2.5 text-xs sm:text-sm font-bold text-white">
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    <span>واتساب الأعمال</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-[#141414] px-6 py-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-gray-400">
                هذه المعاينة تعكس بدقة 100% شكل البانر الحقيقي لشاشات الزوار عند الحفظ.
              </span>
              <button
                type="button"
                onClick={() => setShowFullPreviewModal(false)}
                className="rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] border border-[#D4AF37]/50 px-5 py-2 text-xs font-bold text-white cursor-pointer"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
