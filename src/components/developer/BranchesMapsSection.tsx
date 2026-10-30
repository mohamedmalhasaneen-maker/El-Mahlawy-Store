import { useState } from 'react';
import {
  Check,
  Edit3,
  ExternalLink,
  Loader2,
  MapPin,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import {
  BranchLocationItem,
  MAX_BRANCHES,
  OFFICIAL_GOOGLE_MAPS_URL,
  OFFICIAL_STORE_COORDINATES,
  SiteConfig,
  isShortGoogleMapsUrl,
  isValidOptionalHttpUrl,
  normalizeGoogleMapsUrlInput,
} from '../../utils/siteConfig';

interface BranchesMapsSectionProps {
  configDraft: SiteConfig;
  isSiteConfigDirty: boolean;
  savingSiteConfig: boolean;
  onUpdateField: <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => void;
  onSaveSubmit: (e: React.FormEvent, sectionLabel: string) => Promise<void>;
  onCancelChanges: () => void;
  onValidationError: (message: string) => void;
}

export function BranchesMapsSection({
  configDraft,
  isSiteConfigDirty,
  savingSiteConfig,
  onUpdateField,
  onSaveSubmit,
  onCancelChanges,
  onValidationError,
}: BranchesMapsSectionProps) {
  const [branchDraft, setBranchDraft] = useState<BranchLocationItem | null>(null);
  const [editingBranchIndex, setEditingBranchIndex] = useState<number | null>(null);
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);

  const [resolvingMapField, setResolvingMapField] = useState<'main' | 'branch' | null>(null);

  const resolveMapInputValue = async (
    rawValue: string,
    target: 'main' | 'branch'
  ): Promise<string> => {
    const trimmed = rawValue.trim();
    if (!trimmed) return '';
    if (isShortGoogleMapsUrl(trimmed)) {
      setResolvingMapField(target);
      try {
        const res = await fetch('/api/resolve-map-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: trimmed }),
        });
        const data = (await res.json()) as { directUrl?: string; error?: string };
        if (res.ok && data.directUrl) {
          return data.directUrl;
        }
        onValidationError(
          data.error ||
            'تعذر تحويل الرابط المختصر تلقائيًا. يرجى إدخال الإحداثيات أو رابط Google Maps المباشر.'
        );
        return trimmed;
      } catch {
        onValidationError(
          'تعذر تحويل الرابط المختصر. يرجى استخدام رابط Google Maps المباشر بدلًا من maps.app.goo.gl.'
        );
        return trimmed;
      } finally {
        setResolvingMapField(null);
      }
    }
    return normalizeGoogleMapsUrlInput(trimmed, trimmed);
  };

  const startNewBranch = () => {
    setEditingBranchIndex(null);
    setBranchDraft({
      id: `branch-${Date.now()}`,
      name: '',
      address: '',
      mapUrl: '',
      workingHours: '',
      phone: '',
    });
  };

  const handleConfirmBranch = async () => {
    if (!branchDraft) return;
    if (!branchDraft.name.trim() || !branchDraft.address.trim()) {
      onValidationError('يرجى إدخال اسم الفرع والعنوان التفصيلي قبل الإضافة.');
      return;
    }
    let resolvedBranchMapUrl = branchDraft.mapUrl.trim();
    if (resolvedBranchMapUrl) {
      resolvedBranchMapUrl = await resolveMapInputValue(resolvedBranchMapUrl, 'branch');
    }
    if (isShortGoogleMapsUrl(resolvedBranchMapUrl)) {
      onValidationError(
        'لا يُسمح بحفظ رابط مختصر (maps.app.goo.gl) لتجنب خطأ Dynamic Link Not Found؛ يرجى إدخال رابط مباشر أو إحداثيات.'
      );
      return;
    }
    if (!isValidOptionalHttpUrl(resolvedBranchMapUrl)) {
      onValidationError('رابط خريطة الفرع غير صالح؛ يجب أن يبدأ بـ https:// أو http://.');
      return;
    }
    const normalized: BranchLocationItem = {
      ...branchDraft,
      name: branchDraft.name.trim(),
      address: branchDraft.address.trim(),
      mapUrl: resolvedBranchMapUrl,
      workingHours: branchDraft.workingHours.trim(),
      phone: branchDraft.phone.trim(),
    };
    const next = [...configDraft.branches];
    if (editingBranchIndex !== null && editingBranchIndex >= 0) {
      next[editingBranchIndex] = normalized;
    } else {
      next.push(normalized);
    }
    onUpdateField('branches', next.slice(0, MAX_BRANCHES));
    setBranchDraft(null);
    setEditingBranchIndex(null);
  };

  return (
    <form
      onSubmit={(e) => void onSaveSubmit(e, 'العنوان والفروع والخرائط')}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            إدارة العنوان والفروع والخرائط
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            تحديث العنوان الرئيسي وروابط Google Maps ومواعيد العمل وسياسات الشحن والفروع الإضافية.
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

      {/* 1. Primary Address, Google Maps, Hours & Policies */}
      <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 sm:p-6 space-y-5">
        <h3 className="text-base font-extrabold text-[#D4AF37]">
          01. العنوان الرئيسي ومواعيد العمل وسياسات التوصيل والضمان
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="cfg-address" className="block text-xs font-bold text-gray-300 mb-1.5">
              عنوان المتجر الرئيسي
            </label>
            <textarea
              id="cfg-address"
              rows={2}
              maxLength={1000}
              value={configDraft.address}
              onChange={(e) => onUpdateField('address', e.target.value)}
              className="w-full rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
              <label htmlFor="cfg-maps-url" className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
                <span>رابط الموقع الجغرافي الرسمي على خرائط Google</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onUpdateField('googleMapsUrl', OFFICIAL_GOOGLE_MAPS_URL)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-[#38BDF8] hover:underline cursor-pointer"
                >
                  <span>استعادة الرابط الرسمي</span>
                </button>
                {configDraft.googleMapsUrl && isValidOptionalHttpUrl(configDraft.googleMapsUrl) && (
                  <a
                    href={configDraft.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#D4AF37] hover:underline"
                  >
                    <span>فتح الخريطة</span>
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
            <input
              id="cfg-maps-url"
              type="url"
              dir="ltr"
              maxLength={600}
              value={configDraft.googleMapsUrl}
              onChange={(e) => {
                const val = e.target.value;
                onUpdateField('googleMapsUrl', val);
                if (isShortGoogleMapsUrl(val)) {
                  void resolveMapInputValue(val, 'main').then((resolved) => {
                    if (resolved && resolved !== val) {
                      onUpdateField('googleMapsUrl', resolved);
                    }
                  });
                }
              }}
              onBlur={(e) => {
                const val = e.target.value.trim();
                if (val && !isShortGoogleMapsUrl(val)) {
                  const normalized = normalizeGoogleMapsUrlInput(val, val);
                  if (normalized !== val) {
                    onUpdateField('googleMapsUrl', normalized);
                  }
                }
              }}
              placeholder={OFFICIAL_GOOGLE_MAPS_URL}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
            <p className="mt-1.5 text-[11px] text-gray-400 leading-relaxed">
              {resolvingMapField === 'main' ? (
                <span className="text-[#38BDF8] font-bold">
                  جاري استخراج الإحداثيات وتحويل الرابط المختصر إلى رابط Google Maps مباشر...
                </span>
              ) : (
                <>
                  الإحداثيات المعتمدة للمتجر:{' '}
                  <bdi className="font-mono text-gray-300">{OFFICIAL_STORE_COORDINATES}</bdi> — يتم
                  استخدام رابط مباشر لتجنب خطأ الروابط المختصرة على الهواتف.
                </>
              )}
            </p>
          </div>

          <div>
            <label
              htmlFor="cfg-working-hours"
              className="block text-xs font-bold text-gray-300 mb-1.5"
            >
              مواعيد العمل الرسمية
            </label>
            <input
              id="cfg-working-hours"
              type="text"
              maxLength={300}
              value={configDraft.workingHours}
              onChange={(e) => onUpdateField('workingHours', e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label htmlFor="cfg-shipping" className="block text-xs font-bold text-gray-300 mb-1.5">
              ملخص الشحن والتوصيل للمحافظات وشرم الشيخ
            </label>
            <textarea
              id="cfg-shipping"
              rows={2}
              maxLength={1500}
              value={configDraft.shippingSummary}
              onChange={(e) => onUpdateField('shippingSummary', e.target.value)}
              className="w-full rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label
              htmlFor="cfg-aftersales"
              className="block text-xs font-bold text-gray-300 mb-1.5"
            >
              سياسة الضمان وخدمة ما بعد البيع
            </label>
            <textarea
              id="cfg-aftersales"
              rows={2}
              maxLength={2500}
              value={configDraft.afterSalesPolicy}
              onChange={(e) => onUpdateField('afterSalesPolicy', e.target.value)}
              className="w-full rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label
              htmlFor="cfg-contact-title"
              className="block text-xs font-bold text-gray-300 mb-1.5"
            >
              عنوان قسم التواصل بالفوتر
            </label>
            <input
              id="cfg-contact-title"
              type="text"
              maxLength={200}
              value={configDraft.contactSectionTitle}
              onChange={(e) => onUpdateField('contactSectionTitle', e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label
              htmlFor="cfg-contact-sub"
              className="block text-xs font-bold text-gray-300 mb-1.5"
            >
              العنوان الفرعي لقسم التواصل
            </label>
            <input
              id="cfg-contact-sub"
              type="text"
              maxLength={400}
              value={configDraft.contactSectionSubtitle}
              onChange={(e) => onUpdateField('contactSectionSubtitle', e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>
      </div>

      {/* 2. Dynamic Branches Manager */}
      <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-[#D4AF37]">
              02. الفروع والمواقع الجغرافية ({configDraft.branches.length}/{MAX_BRANCHES})
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              أضف أو عدّل فروع المتجر مع رابط الخريطة ورقم الهاتف ومواعيد العمل لكل فرع.
            </p>
          </div>
          <button
            type="button"
            disabled={configDraft.branches.length >= MAX_BRANCHES}
            onClick={startNewBranch}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#0B0B0B] hover:bg-[#1E1E1E] disabled:opacity-45 border border-[#D4AF37]/50 px-4 py-2 text-xs font-bold text-[#D4AF37] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            <span>إضافة فرع جديد</span>
          </button>
        </div>

        {branchDraft && (
          <div className="rounded-xl bg-[#0B0B0B] border border-[#D4AF37]/50 p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label htmlFor="br-name" className="block text-xs font-bold text-[#D4AF37] mb-1">
                  اسم الفرع *
                </label>
                <input
                  id="br-name"
                  type="text"
                  maxLength={120}
                  value={branchDraft.name}
                  onChange={(e) =>
                    setBranchDraft((prev) => (prev ? { ...prev, name: e.target.value } : null))
                  }
                  placeholder="مثال: فرع شرم الشيخ — الرويسات"
                  className="w-full min-h-[42px] rounded-lg bg-[#141414] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label htmlFor="br-phone" className="block text-xs font-bold text-gray-300 mb-1">
                  هاتف الفرع (اختياري)
                </label>
                <input
                  id="br-phone"
                  type="text"
                  dir="ltr"
                  maxLength={30}
                  value={branchDraft.phone}
                  onChange={(e) =>
                    setBranchDraft((prev) => (prev ? { ...prev, phone: e.target.value } : null))
                  }
                  className="w-full min-h-[42px] rounded-lg bg-[#141414] border border-white/15 px-3 py-2 text-xs text-white tabular-nums focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="br-address" className="block text-xs font-bold text-[#D4AF37] mb-1">
                  العنوان التفصيلي *
                </label>
                <input
                  id="br-address"
                  type="text"
                  maxLength={1000}
                  value={branchDraft.address}
                  onChange={(e) =>
                    setBranchDraft((prev) => (prev ? { ...prev, address: e.target.value } : null))
                  }
                  className="w-full min-h-[42px] rounded-lg bg-[#141414] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label htmlFor="br-map" className="block text-xs font-bold text-gray-300 mb-1">
                  رابط Google Maps للفرع (اختياري)
                </label>
                <input
                  id="br-map"
                  type="url"
                  dir="ltr"
                  maxLength={600}
                  value={branchDraft.mapUrl}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBranchDraft((prev) => (prev ? { ...prev, mapUrl: val } : null));
                    if (isShortGoogleMapsUrl(val)) {
                      void resolveMapInputValue(val, 'branch').then((resolved) => {
                        if (resolved && resolved !== val) {
                          setBranchDraft((prev) =>
                            prev ? { ...prev, mapUrl: resolved } : null
                          );
                        }
                      });
                    }
                  }}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val && !isShortGoogleMapsUrl(val)) {
                      const normalized = normalizeGoogleMapsUrlInput(val, val);
                      if (normalized !== val) {
                        setBranchDraft((prev) =>
                          prev ? { ...prev, mapUrl: normalized } : null
                        );
                      }
                    }
                  }}
                  placeholder={OFFICIAL_GOOGLE_MAPS_URL}
                  className="w-full min-h-[42px] rounded-lg bg-[#141414] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label htmlFor="br-hours" className="block text-xs font-bold text-gray-300 mb-1">
                  مواعيد عمل الفرع (اختياري)
                </label>
                <input
                  id="br-hours"
                  type="text"
                  maxLength={300}
                  value={branchDraft.workingHours}
                  onChange={(e) =>
                    setBranchDraft((prev) =>
                      prev ? { ...prev, workingHours: e.target.value } : null
                    )
                  }
                  className="w-full min-h-[42px] rounded-lg bg-[#141414] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={resolvingMapField === 'branch'}
                onClick={() => void handleConfirmBranch()}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#0F4C5C] hover:bg-[#0A3D4A] disabled:opacity-55 px-4 py-2 text-xs font-extrabold text-white cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>تأكيد الفرع في القائمة</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setBranchDraft(null);
                  setEditingBranchIndex(null);
                }}
                className="inline-flex min-h-[40px] items-center rounded-lg bg-[#1A1A1A] px-3.5 py-2 text-xs font-semibold text-gray-300 cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-white/10 rounded-xl bg-[#0B0B0B] border border-white/10">
          {configDraft.branches.length === 0 ? (
            <p className="p-4 text-xs text-gray-400 text-center">لا توجد فروع مضافة حاليًا.</p>
          ) : (
            configDraft.branches.map((br, idx) => (
              <div
                key={br.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-white truncate">{br.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{br.address}</p>
                  {(br.workingHours || br.phone) && (
                    <p className="text-[11px] text-[#D4AF37] mt-0.5 tabular-nums">
                      {[br.workingHours, br.phone].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {br.mapUrl && isValidOptionalHttpUrl(br.mapUrl) && (
                    <a
                      href={br.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`فتح خريطة ${br.name}`}
                      className="inline-flex min-h-[38px] items-center gap-1 rounded-lg bg-[#141414] hover:bg-[#1E1E1E] border border-white/15 px-2.5 py-1.5 text-xs font-bold text-[#D4AF37]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBranchIndex(idx);
                      setBranchDraft({ ...br });
                    }}
                    aria-label={`تعديل فرع ${br.name}`}
                    className="inline-flex min-h-[38px] items-center gap-1 rounded-lg bg-[#1A1A1A] hover:bg-[#242424] border border-white/15 px-3 py-1.5 text-xs font-bold text-gray-200 cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
                    <span>تعديل</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteIdx(idx)}
                    aria-label={`حذف فرع ${br.name}`}
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
            {savingSiteConfig ? 'جاري الحفظ السحابي...' : 'حفظ العنوان والفروع والخرائط سحابيًا'}
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

      {/* Delete Branch Confirmation Modal */}
      {confirmDeleteIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="تأكيد حذف الفرع"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#141414] border border-[#0F4C5C] p-6 space-y-4 text-gray-100">
            <h3 className="text-base font-extrabold text-white">تأكيد حذف الفرع</h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              هل تريد حذف فرع «{configDraft.branches[confirmDeleteIdx]?.name}»؟ تذكّر الضغط على
              «حفظ العنوان والفروع والخرائط سحابيًا» لتثبيت التغيير.
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
                    'branches',
                    configDraft.branches.filter((_, idx) => idx !== confirmDeleteIdx)
                  );
                  setConfirmDeleteIdx(null);
                }}
                className="min-h-[42px] rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] px-5 py-2 text-xs font-extrabold text-white cursor-pointer"
              >
                حذف الفرع
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
