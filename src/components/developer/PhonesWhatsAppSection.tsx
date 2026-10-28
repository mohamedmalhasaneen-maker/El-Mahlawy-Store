import { useState } from 'react';
import { Check, Edit3, Loader2, Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  CONTACT_OWNER_LABELS,
  CONTACT_ROLE_LABELS,
  ContactChannelItem,
  ContactChannelOwner,
  ContactChannelRole,
  MAX_CONTACT_CHANNELS,
  SiteConfig,
  buildWhatsAppLinkFromPhone,
} from '../../utils/siteConfig';

interface PhonesWhatsAppSectionProps {
  configDraft: SiteConfig;
  isSiteConfigDirty: boolean;
  savingSiteConfig: boolean;
  onUpdateField: <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => void;
  onSaveSubmit: (e: React.FormEvent, sectionLabel: string) => Promise<void>;
  onCancelChanges: () => void;
  onValidationError: (message: string) => void;
}

export function PhonesWhatsAppSection({
  configDraft,
  isSiteConfigDirty,
  savingSiteConfig,
  onUpdateField,
  onSaveSubmit,
  onCancelChanges,
  onValidationError,
}: PhonesWhatsAppSectionProps) {
  const [channelDraft, setChannelDraft] = useState<ContactChannelItem | null>(null);
  const [editingChannelIndex, setEditingChannelIndex] = useState<number | null>(null);
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState<number | null>(null);

  const startNewChannel = () => {
    setEditingChannelIndex(null);
    setChannelDraft({
      id: `ch-${Date.now()}`,
      label: '',
      role: 'orders',
      owner: 'store',
      phone: '',
      whatsappUrl: '',
    });
  };

  const handleConfirmDraft = () => {
    if (!channelDraft) return;
    if (!channelDraft.label.trim() || !channelDraft.phone.trim()) {
      onValidationError('يرجى إدخال المسمى التوضيحي ورقم الهاتف قبل إضافة قناة التواصل.');
      return;
    }
    const normalizedItem: ContactChannelItem = {
      ...channelDraft,
      label: channelDraft.label.trim(),
      phone: channelDraft.phone.trim(),
      whatsappUrl:
        channelDraft.whatsappUrl.trim() || buildWhatsAppLinkFromPhone(channelDraft.phone),
    };
    const next = [...configDraft.contactChannels];
    if (editingChannelIndex !== null && editingChannelIndex >= 0) {
      next[editingChannelIndex] = normalizedItem;
    } else {
      next.push(normalizedItem);
    }
    onUpdateField('contactChannels', next.slice(0, MAX_CONTACT_CHANNELS));
    setChannelDraft(null);
    setEditingChannelIndex(null);
  };

  return (
    <form
      onSubmit={(e) => void onSaveSubmit(e, 'أرقام الهاتف وواتساب')}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            إدارة أرقام الهاتف وواتساب
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            تحديث أرقام الطلبات وخدمة ما بعد البيع وأرقام واتساب المباشرة للمتجر وشريك النجاح.
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

      {/* 1. Primary Store Phones & WhatsApp */}
      <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 sm:p-6 space-y-5">
        <h3 className="text-base font-extrabold text-[#D4AF37]">
          01. أرقام المحلاوي ستور الأساسية وواتساب الطلبات
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="cfg-primary-phone"
              className="block text-xs font-bold text-gray-300 mb-1.5"
            >
              رقم الطلبات والاتصال الأساسي *
            </label>
            <input
              id="cfg-primary-phone"
              type="text"
              dir="ltr"
              required
              value={configDraft.primaryPhone}
              onChange={(e) => onUpdateField('primaryPhone', e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white tabular-nums focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label
              htmlFor="cfg-secondary-phone"
              className="block text-xs font-bold text-gray-300 mb-1.5"
            >
              رقم خدمة ما بعد البيع / هاتف إضافي
            </label>
            <input
              id="cfg-secondary-phone"
              type="text"
              dir="ltr"
              value={configDraft.secondaryPhone}
              onChange={(e) => onUpdateField('secondaryPhone', e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white tabular-nums focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label
              htmlFor="cfg-primary-wa"
              className="block text-xs font-bold text-gray-300 mb-1.5"
            >
              رقم واتساب لاستقبال طلبات السلة (بالكود الدولي) *
            </label>
            <input
              id="cfg-primary-wa"
              type="text"
              dir="ltr"
              required
              value={configDraft.primaryWhatsApp}
              onChange={(e) => onUpdateField('primaryWhatsApp', e.target.value)}
              placeholder="201210141187"
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white tabular-nums focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="cfg-wa-url" className="text-xs font-bold text-gray-300">
                رابط واتساب الطلبات المباشر
              </label>
              <button
                type="button"
                onClick={() =>
                  onUpdateField(
                    'whatsappUrl',
                    buildWhatsAppLinkFromPhone(configDraft.primaryPhone)
                  )
                }
                className="text-[11px] text-[#D4AF37] hover:underline cursor-pointer"
              >
                توليد تلقائي من الرقم الأساسي
              </button>
            </div>
            <input
              id="cfg-wa-url"
              type="url"
              dir="ltr"
              value={configDraft.whatsappUrl}
              onChange={(e) => onUpdateField('whatsappUrl', e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="cfg-aftersales-wa-url" className="text-xs font-bold text-gray-300">
                رابط واتساب ما بعد البيع
              </label>
              <button
                type="button"
                onClick={() =>
                  onUpdateField(
                    'afterSalesWhatsAppUrl',
                    buildWhatsAppLinkFromPhone(configDraft.secondaryPhone)
                  )
                }
                className="text-[11px] text-[#D4AF37] hover:underline cursor-pointer"
              >
                توليد من الرقم الإضافي
              </button>
            </div>
            <input
              id="cfg-aftersales-wa-url"
              type="url"
              dir="ltr"
              value={configDraft.afterSalesWhatsAppUrl}
              onChange={(e) => onUpdateField('afterSalesWhatsAppUrl', e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>
      </div>

      {/* 2. Partner (Infinity Corp) Phones */}
      <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 sm:p-6 space-y-5">
        <div>
          <h3 className="text-base font-extrabold text-[#D4AF37]">
            02. أرقام شريك النجاح ({configDraft.partnerName || 'Infinity Corp'})
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            تُحدّث تلقائيًا روابط الاتصال وواتساب الخاصة بقسم الشريك الفني في الفوتر وصفحة «من نحن».
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label htmlFor="cfg-p-order1" className="block text-xs font-bold text-gray-300 mb-1.5">
              رقم الطلبات الأول
            </label>
            <input
              id="cfg-p-order1"
              type="text"
              dir="ltr"
              value={configDraft.partnerOrderPhone1}
              onChange={(e) => onUpdateField('partnerOrderPhone1', e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white tabular-nums focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label htmlFor="cfg-p-order2" className="block text-xs font-bold text-gray-300 mb-1.5">
              رقم الطلبات الثاني
            </label>
            <input
              id="cfg-p-order2"
              type="text"
              dir="ltr"
              value={configDraft.partnerOrderPhone2}
              onChange={(e) => onUpdateField('partnerOrderPhone2', e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white tabular-nums focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label htmlFor="cfg-p-maint" className="block text-xs font-bold text-gray-300 mb-1.5">
              رقم التركيب والصيانة الدورية
            </label>
            <input
              id="cfg-p-maint"
              type="text"
              dir="ltr"
              value={configDraft.partnerMaintenancePhone}
              onChange={(e) => onUpdateField('partnerMaintenancePhone', e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white tabular-nums focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div>
            <label htmlFor="cfg-p-after" className="block text-xs font-bold text-gray-300 mb-1.5">
              رقم خدمة ما بعد البيع
            </label>
            <input
              id="cfg-p-after"
              type="text"
              dir="ltr"
              value={configDraft.partnerAfterSalesPhone}
              onChange={(e) => onUpdateField('partnerAfterSalesPhone', e.target.value)}
              className="w-full min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-sm text-white tabular-nums focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
        </div>
      </div>

      {/* 3. Dynamic Additional Contact Channels */}
      <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-[#D4AF37]">
              03. خطوط وأرقام التواصل المخصصة ({configDraft.contactChannels.length}/
              {MAX_CONTACT_CHANNELS})
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              أضف أو عدّل أو احذف أي رقم إضافي مع تحديد دوره والجهة التابع لها.
            </p>
          </div>
          <button
            type="button"
            disabled={configDraft.contactChannels.length >= MAX_CONTACT_CHANNELS}
            onClick={startNewChannel}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#0B0B0B] hover:bg-[#1E1E1E] disabled:opacity-45 border border-[#D4AF37]/50 px-4 py-2 text-xs font-bold text-[#D4AF37] whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>إضافة رقم تواصل جديد</span>
          </button>
        </div>

        {channelDraft && (
          <div className="rounded-xl bg-[#0B0B0B] border border-[#D4AF37]/50 p-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div>
                <label htmlFor="ch-label" className="block text-xs font-bold text-[#D4AF37] mb-1">
                  المسمى التوضيحي للرقم *
                </label>
                <input
                  id="ch-label"
                  type="text"
                  maxLength={120}
                  value={channelDraft.label}
                  onChange={(e) =>
                    setChannelDraft((prev) => (prev ? { ...prev, label: e.target.value } : null))
                  }
                  placeholder="مثال: مبيعات الشركات والفنادق"
                  className="w-full min-h-[42px] rounded-lg bg-[#141414] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label htmlFor="ch-role" className="block text-xs font-bold text-[#D4AF37] mb-1">
                  نوع الخدمة / الدور
                </label>
                <select
                  id="ch-role"
                  value={channelDraft.role}
                  onChange={(e) =>
                    setChannelDraft((prev) =>
                      prev ? { ...prev, role: e.target.value as ContactChannelRole } : null
                    )
                  }
                  className="w-full min-h-[42px] rounded-lg bg-[#141414] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  {Object.entries(CONTACT_ROLE_LABELS).map(([val, text]) => (
                    <option key={val} value={val}>
                      {text}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="ch-owner" className="block text-xs font-bold text-[#D4AF37] mb-1">
                  الجهة التابع لها الرقم
                </label>
                <select
                  id="ch-owner"
                  value={channelDraft.owner}
                  onChange={(e) =>
                    setChannelDraft((prev) =>
                      prev ? { ...prev, owner: e.target.value as ContactChannelOwner } : null
                    )
                  }
                  className="w-full min-h-[42px] rounded-lg bg-[#141414] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  {Object.entries(CONTACT_OWNER_LABELS).map(([val, text]) => (
                    <option key={val} value={val}>
                      {text}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="ch-phone" className="block text-xs font-bold text-[#D4AF37] mb-1">
                  رقم الهاتف *
                </label>
                <input
                  id="ch-phone"
                  type="text"
                  dir="ltr"
                  value={channelDraft.phone}
                  onChange={(e) =>
                    setChannelDraft((prev) => (prev ? { ...prev, phone: e.target.value } : null))
                  }
                  placeholder="01210141187"
                  className="w-full min-h-[42px] rounded-lg bg-[#141414] border border-white/15 px-3 py-2 text-xs text-white tabular-nums focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="ch-wa" className="block text-xs font-bold text-gray-300 mb-1">
                  رابط واتساب (يُولّد تلقائيًا إذا تُرك فارغًا)
                </label>
                <input
                  id="ch-wa"
                  type="url"
                  dir="ltr"
                  value={channelDraft.whatsappUrl}
                  onChange={(e) =>
                    setChannelDraft((prev) =>
                      prev ? { ...prev, whatsappUrl: e.target.value } : null
                    )
                  }
                  placeholder="https://wa.me/201210141187"
                  className="w-full min-h-[42px] rounded-lg bg-[#141414] border border-white/15 px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmDraft}
                className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg bg-[#0F4C5C] hover:bg-[#0A3D4A] px-4 py-2 text-xs font-extrabold text-white cursor-pointer"
              >
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
                <span>تأكيد الرقم في القائمة</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setChannelDraft(null);
                  setEditingChannelIndex(null);
                }}
                className="inline-flex min-h-[40px] items-center rounded-lg bg-[#1A1A1A] px-3.5 py-2 text-xs font-semibold text-gray-300 cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-white/10 rounded-xl bg-[#0B0B0B] border border-white/10">
          {configDraft.contactChannels.length === 0 ? (
            <p className="p-4 text-xs text-gray-400 text-center">
              لا توجد قنوات تواصل مخصصة حاليًا.
            </p>
          ) : (
            configDraft.contactChannels.map((ch, idx) => (
              <div
                key={ch.id}
                className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-white truncate">{ch.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5 tabular-nums">
                    {CONTACT_OWNER_LABELS[ch.owner]} · {CONTACT_ROLE_LABELS[ch.role]} ·{' '}
                    <bdi className="text-[#D4AF37] font-semibold">{ch.phone}</bdi>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingChannelIndex(idx);
                      setChannelDraft({ ...ch });
                    }}
                    aria-label={`تعديل رقم ${ch.label}`}
                    className="inline-flex min-h-[38px] items-center gap-1 rounded-lg bg-[#1A1A1A] hover:bg-[#242424] border border-white/15 px-3 py-1.5 text-xs font-bold text-gray-200 cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
                    <span>تعديل</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteIdx(idx)}
                    aria-label={`حذف رقم ${ch.label}`}
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
            {savingSiteConfig ? 'جاري الحفظ السحابي...' : 'حفظ أرقام الهاتف وواتساب سحابيًا'}
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

      {/* Delete Channel Confirmation Modal */}
      {confirmDeleteIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="تأكيد حذف رقم التواصل"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4"
        >
          <div className="w-full max-w-md rounded-2xl bg-[#141414] border border-[#0F4C5C] p-6 space-y-4 text-gray-100">
            <h3 className="text-base font-extrabold text-white">تأكيد حذف رقم التواصل</h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              هل تريد حذف «{configDraft.contactChannels[confirmDeleteIdx]?.label}»؟ تذكّر الضغط على
              «حفظ أرقام الهاتف وواتساب سحابيًا» لتثبيت التغيير لجميع الزوار.
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
                    'contactChannels',
                    configDraft.contactChannels.filter((_, idx) => idx !== confirmDeleteIdx)
                  );
                  setConfirmDeleteIdx(null);
                }}
                className="min-h-[42px] rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] px-5 py-2 text-xs font-extrabold text-white cursor-pointer"
              >
                حذف الرقم
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
