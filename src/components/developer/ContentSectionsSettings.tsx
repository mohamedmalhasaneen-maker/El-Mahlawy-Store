import { Check, Eye, EyeOff, Loader2, RotateCcw } from 'lucide-react';
import { SiteConfig } from '../../utils/siteConfig';

interface ContentSectionsSettingsProps {
  configDraft: SiteConfig;
  isSiteConfigDirty: boolean;
  savingSiteConfig: boolean;
  onUpdateField: <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => void;
  onSaveSubmit: (e: React.FormEvent, sectionLabel: string) => Promise<void>;
  onCancelChanges: () => void;
}

const SECTION_TOGGLE_ITEMS: ReadonlyArray<{
  key:
    | 'showHeroSpotlight'
    | 'showValueStrip'
    | 'showOffersSection'
    | 'showShippingSection'
    | 'showPartnerCard'
    | 'showAboutBanner';
  title: string;
  description: string;
}> = [
  {
    key: 'showHeroSpotlight',
    title: 'بطاقة أحدث منتج مميز في بانر الرئيسية',
    description: 'تعرض المنتج المميز بجوار النص الترحيبي في أعلى الواجهة الرئيسية للمتجر.',
  },
  {
    key: 'showValueStrip',
    title: 'شريط مميزات المتجر والشراكة أسفل البانر',
    description: 'يوضح مميزات الشحن والضمان والشراكة الفنية مع Infinity Corp.',
  },
  {
    key: 'showOffersSection',
    title: 'قسم العروض والخصومات في الصفحة الرئيسية',
    description: 'يعرض شبكة مخصصة لجميع المنتجات التي تحتوي على خصم فعّال حاليًا.',
  },
  {
    key: 'showShippingSection',
    title: 'بطاقة معلومات الشحن والتوصيل على الهواتف',
    description: 'تعرض ملخص الشحن السريع لمحافظات مصر أسفل المنتجات على شاشات الموبايل.',
  },
  {
    key: 'showPartnerCard',
    title: 'بطاقة شريك النجاح Infinity Corp في قسم تواصل معنا',
    description: 'تعرض بطاقة التواصل الرسمية لشركة Infinity Corp بجانب بطاقة المحلاوي ستور.',
  },
  {
    key: 'showAboutBanner',
    title: 'بانر الانتقال لصفحة «من نحن | About Us» أعلى الفوتر',
    description: 'يعرض زر الانتقال السريع إلى صفحة من نحن المستقلة في أسفل الصفحة الرئيسية.',
  },
];

export function ContentSectionsSettings({
  configDraft,
  isSiteConfigDirty,
  savingSiteConfig,
  onUpdateField,
  onSaveSubmit,
  onCancelChanges,
}: ContentSectionsSettingsProps) {
  const enabledCount = SECTION_TOGGLE_ITEMS.filter((item) => configDraft[item.key]).length;

  return (
    <form
      onSubmit={(e) => void onSaveSubmit(e, 'إعدادات المحتوى والأقسام')}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            إعدادات المحتوى والأقسام
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 tabular-nums">
            تحكم فوري في إظهار أو إخفاء أقسام الواجهة العامة للزوار ({enabledCount}/
            {SECTION_TOGGLE_ITEMS.length} أقسام ظاهرة حاليًا).
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

      <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
          <h3 className="text-base font-extrabold text-[#D4AF37]">
            أقسام الواجهة الرئيسية والفوتر
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                for (const item of SECTION_TOGGLE_ITEMS) {
                  if (!configDraft[item.key]) {
                    onUpdateField(item.key, true);
                  }
                }
              }}
              className="rounded-lg bg-[#0B0B0B] hover:bg-[#1E1E1E] border border-[#D4AF37]/40 px-3 py-1.5 text-xs font-bold text-[#D4AF37] cursor-pointer"
            >
              إظهار الكل
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {SECTION_TOGGLE_ITEMS.map((item) => {
            const enabled = configDraft[item.key];
            return (
              <button
                key={item.key}
                type="button"
                role="switch"
                aria-checked={enabled}
                onClick={() => onUpdateField(item.key, !enabled)}
                className={`min-h-[76px] rounded-xl p-4 border text-right flex items-start justify-between gap-3 cursor-pointer transition-colors ${
                  enabled
                    ? 'bg-[#0B0B0B] border-[#D4AF37] text-white'
                    : 'bg-[#0B0B0B] border-white/15 text-gray-400 hover:border-white/30'
                }`}
              >
                <div className="space-y-1 min-w-0">
                  <p className="text-xs sm:text-sm font-extrabold">{item.title}</p>
                  <p className="text-[11px] sm:text-xs text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <span
                  className={`inline-flex items-center gap-1 text-xs font-extrabold whitespace-nowrap shrink-0 pt-0.5 ${
                    enabled ? 'text-[#D4AF37]' : 'text-gray-500'
                  }`}
                >
                  {enabled ? (
                    <>
                      <Eye className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
                      <span>ظاهر</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-4 w-4 text-gray-500" aria-hidden="true" />
                      <span>مخفي</span>
                    </>
                  )}
                </span>
              </button>
            );
          })}
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
            {savingSiteConfig ? 'جاري الحفظ السحابي...' : 'حفظ إعدادات الأقسام سحابيًا'}
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
