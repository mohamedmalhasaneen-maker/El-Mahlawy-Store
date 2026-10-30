import { useState, useRef } from 'react';
import {
  Camera,
  Check,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Package,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import { EssentialCategoryItem, SiteConfig } from '../../utils/siteConfig';

interface EssentialProductsSectionProps {
  configDraft: SiteConfig;
  isSiteConfigDirty: boolean;
  savingSiteConfig: boolean;
  onUpdateField: <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => void;
  onSaveSubmit: (e: React.FormEvent, sectionLabel: string) => Promise<void>;
  onCancelChanges: () => void;
}

export function EssentialProductsSection({
  configDraft,
  isSiteConfigDirty,
  savingSiteConfig,
  onUpdateField,
  onSaveSubmit,
  onCancelChanges,
}: EssentialProductsSectionProps) {
  const [uploadingCatId, setUploadingCatId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const categories = configDraft.essentialCategories || [];

  const handleFileSelect = async (categoryId: string, file?: File) => {
    if (!file) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validate type & size (max 5MB)
    if (!file.type.startsWith('image/')) {
      setErrorMsg('يرجى اختيار ملف صورة صالح (JPEG, PNG, WebP).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('حجم الصورة يتجاوز الحد الأقصى المسموح به (5 ميجابايت).');
      return;
    }

    setUploadingCatId(categoryId);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'elmahlawy-store');

    try {
      const response = await fetch('https://api.cloudinary.com/v1_1/obvb7rtp/image/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (!response.ok || !data.secure_url) {
        throw new Error(data.error?.message || 'فشل رفع الصورة إلى Cloudinary.');
      }

      const secureUrl = data.secure_url;
      const updated = categories.map((cat) =>
        cat.id === categoryId ? { ...cat, imageUrl: secureUrl } : cat
      );
      onUpdateField('essentialCategories', updated);
      setSuccessMsg('تم رفع الصورة بنجاح وتحديث الفئة. لا تنسَ الضغط على زر الحفظ أدناه لحفظ التغييرات في النظام.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'حدث خطأ أثناء رفع الصورة.');
    } finally {
      setUploadingCatId(null);
      if (fileInputRefs.current[categoryId]) {
        fileInputRefs.current[categoryId]!.value = '';
      }
    }
  };

  const handleDeleteImage = (categoryId: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في حذف صورة هذه الفئة؟')) return;
    const updated = categories.map((cat) =>
      cat.id === categoryId ? { ...cat, imageUrl: '' } : cat
    );
    onUpdateField('essentialCategories', updated);
    setSuccessMsg('تمت إزالة الصورة بنجاح. اضغط على حفظ التغييرات لتأكيد الحفظ.');
  };

  const handleUpdateCategoryName = (categoryId: string, name: string) => {
    const updated = categories.map((cat) =>
      cat.id === categoryId ? { ...cat, name } : cat
    );
    onUpdateField('essentialCategories', updated);
  };

  const handleUpdateCategoryOrder = (categoryId: string, orderStr: string) => {
    const parsed = parseInt(orderStr, 10);
    const order = Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
    const updated = categories.map((cat) =>
      cat.id === categoryId ? { ...cat, order } : cat
    );
    updated.sort((a, b) => a.order - b.order);
    onUpdateField('essentialCategories', updated);
  };

  return (
    <form
      onSubmit={(e) => void onSaveSubmit(e, 'إدارة صور المنتجات الأساسية والمتنوعة')}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            إدارة صور المنتجات الأساسية والمتنوعة
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            إدارة صور وأسماء وترتيب الفئات السبع الأساسية التي تظهر في صفحة «من نحن» وتُحفظ سحابيًا عبر Cloudinary وFirebase.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isSiteConfigDirty && (
            <button
              type="button"
              onClick={onCancelChanges}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] border border-white/20 px-4 py-2 text-xs font-bold text-gray-300 cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>إلغاء التغييرات</span>
            </button>
          )}

          <button
            type="submit"
            disabled={savingSiteConfig}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] border border-[#D4AF37] px-5 py-2 text-xs sm:text-sm font-extrabold text-white transition-colors disabled:opacity-50 cursor-pointer"
          >
            {savingSiteConfig ? (
              <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" aria-hidden="true" />
            ) : (
              <Check className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
            )}
            <span>حفظ التغييرات سحابيًا</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div role="alert" className="rounded-xl bg-red-950/50 border border-red-500/50 p-4 text-xs sm:text-sm text-red-200">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div role="alert" className="rounded-xl bg-emerald-950/50 border border-emerald-500/50 p-4 text-xs sm:text-sm text-emerald-200 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat, index) => {
          const isUploading = uploadingCatId === cat.id;
          return (
            <div
              key={cat.id}
              className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail / Image Preview */}
                <div className="relative h-20 w-20 shrink-0 rounded-xl bg-[#0B0B0B] border border-white/15 overflow-hidden flex items-center justify-center">
                  {cat.imageUrl ? (
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <Camera className="h-7 w-7 text-gray-500" aria-hidden="true" />
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 mb-1">
                      اسم الفئة #{index + 1}
                    </label>
                    <input
                      type="text"
                      value={cat.name}
                      onChange={(e) => handleUpdateCategoryName(cat.id, e.target.value)}
                      className="w-full min-h-[40px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-24">
                      <label className="block text-[11px] font-bold text-gray-400 mb-1">
                        الترتيب
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="99"
                        value={cat.order}
                        onChange={(e) => handleUpdateCategoryOrder(cat.id, e.target.value)}
                        className="w-full min-h-[38px] rounded-xl bg-[#0B0B0B] border border-white/15 px-2.5 py-1 text-xs font-bold text-white text-center focus:outline-none focus:border-[#D4AF37]"
                      />
                    </div>

                    <div className="flex-1 pt-4">
                      <input
                        type="file"
                        accept="image/*"
                        ref={(el) => {
                          fileInputRefs.current[cat.id] = el;
                        }}
                        onChange={(e) => handleFileSelect(cat.id, e.target.files?.[0])}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRefs.current[cat.id]?.click()}
                  className="inline-flex min-h-[38px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] border border-[#D4AF37]/50 px-3 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />
                  ) : cat.imageUrl ? (
                    <ImagePlus className="h-4 w-4 text-[#D4AF37]" />
                  ) : (
                    <Upload className="h-4 w-4 text-[#D4AF37]" />
                  )}
                  <span>{cat.imageUrl ? 'تغيير الصورة' : 'إضافة صورة'}</span>
                </button>

                {cat.imageUrl && (
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => handleDeleteImage(cat.id)}
                    className="inline-flex min-h-[38px] items-center justify-center gap-1 rounded-xl bg-red-950/40 hover:bg-red-900/50 border border-red-500/30 px-3 py-1.5 text-xs font-bold text-red-300 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>حذف</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </form>
  );
}
