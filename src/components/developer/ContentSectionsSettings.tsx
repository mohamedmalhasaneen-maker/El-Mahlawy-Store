import { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { PRODUCT_CATEGORIES, getOrderedCategories } from '../../constants/categories';
import { MAX_CATEGORIES, SiteConfig, StoreCategoryItem } from '../../utils/siteConfig';

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
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryFeedback, setCategoryFeedback] = useState<string | null>(null);

  const orderedCategories = getOrderedCategories(configDraft.categories);
  const enabledCount = SECTION_TOGGLE_ITEMS.filter((item) => configDraft[item.key]).length;

  const commitCategories = (nextList: StoreCategoryItem[]) => {
    const normalized = nextList.map((cat, idx) => ({
      ...cat,
      order: idx + 1,
    }));
    onUpdateField('categories', normalized);
  };

  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedCategories.length) return;
    const next = [...orderedCategories];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    setCategoryFeedback(null);
    commitCategories(next);
  };

  const handleRenameCategory = (id: string, name: string) => {
    const next = orderedCategories.map((cat) => (cat.id === id ? { ...cat, name } : cat));
    setCategoryFeedback(null);
    commitCategories(next);
  };

  const handleAddCategory = () => {
    const cleanName = newCategoryName.trim();
    if (cleanName.length < 2) {
      setCategoryFeedback('يرجى إدخال اسم قسم واضح لا يقل عن حرفين.');
      return;
    }
    if (orderedCategories.length >= MAX_CATEGORIES) {
      setCategoryFeedback(`الحد الأقصى لعدد الأقسام هو ${MAX_CATEGORIES} قسمًا.`);
      return;
    }
    if (orderedCategories.some((c) => c.name.trim() === cleanName)) {
      setCategoryFeedback('يوجد قسم مسجّل بنفس هذا الاسم بالفعل.');
      return;
    }

    const generatedId = `cat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const next: StoreCategoryItem[] = [
      ...orderedCategories,
      {
        id: generatedId,
        name: cleanName.slice(0, 80),
        order: orderedCategories.length + 1,
      },
    ];
    setNewCategoryName('');
    setCategoryFeedback(null);
    commitCategories(next);
  };

  const handleRemoveCategory = (id: string) => {
    if (orderedCategories.length <= 1) {
      setCategoryFeedback('يجب الاحتفاظ بقسم واحد على الأقل في المتجر.');
      return;
    }
    const next = orderedCategories.filter((cat) => cat.id !== id);
    setCategoryFeedback(null);
    commitCategories(next);
  };

  const handleResetDefaultCategories = () => {
    setCategoryFeedback(null);
    commitCategories(PRODUCT_CATEGORIES.map((c) => ({ ...c })));
  };

  return (
    <form
      onSubmit={(e) => void onSaveSubmit(e, 'إعدادات المحتوى وأقسام المنتجات')}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            إعدادات المحتوى والأقسام
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 tabular-nums">
            إدارة أقسام المنتجات وترتيبها في المتجر ({orderedCategories.length} أقسام) والتحكم في
            إظهار أو إخفاء أقسام الواجهة ({enabledCount}/{SECTION_TOGGLE_ITEMS.length} ظاهرة).
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

      {/* 01. Product Categories & Ordering */}
      <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
            <h3 className="text-base font-extrabold text-[#D4AF37]">
              01. أقسام المنتجات وترتيب ظهورها في المتجر
            </h3>
          </div>
          <button
            type="button"
            onClick={handleResetDefaultCategories}
            className="rounded-lg bg-[#0B0B0B] hover:bg-[#1E1E1E] border border-[#D4AF37]/40 px-3 py-1.5 text-xs font-bold text-[#D4AF37] cursor-pointer"
          >
            استعادة الترتيب الافتراضي للأقسام الستة
          </button>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed">
          يمكنك إعادة ترتيب الأقسام بالسهمين (أعلى/أسفل)، أو تعديل اسم القسم المعروض للعملاء، أو
          إضافة قسم جديد، ثم الضغط على زر الحفظ السحابي بالأسفل ليظهر الترتيب الجديد لجميع الزوار
          على كل المتصفحات والأجهزة.
        </p>

        {categoryFeedback && (
          <div className="rounded-xl bg-[#0F4C5C]/20 border border-[#0F4C5C] px-4 py-2.5 text-xs font-bold text-[#A0D2EB]">
            {categoryFeedback}
          </div>
        )}

        <div className="space-y-2.5">
          {orderedCategories.map((cat, idx) => {
            const isBuiltIn = PRODUCT_CATEGORIES.some((def) => def.id === cat.id);
            return (
              <div
                key={cat.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2.5 rounded-xl bg-[#0B0B0B] border border-white/15 p-3"
              >
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#141414] border border-[#D4AF37]/40 text-xs font-extrabold text-[#D4AF37] tabular-nums">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <label htmlFor={`cat-name-${cat.id}`} className="sr-only">
                      اسم القسم رقم {idx + 1}
                    </label>
                    <input
                      id={`cat-name-${cat.id}`}
                      type="text"
                      maxLength={80}
                      value={cat.name}
                      onChange={(e) => handleRenameCategory(cat.id, e.target.value)}
                      className="w-full min-h-[40px] rounded-lg bg-[#141414] border border-white/15 px-3 py-1.5 text-xs sm:text-sm font-bold text-white focus:outline-none focus:border-[#D4AF37]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-1.5 shrink-0">
                  <span className="font-mono text-[11px] text-gray-500 px-2">
                    <bdi>{cat.id}</bdi>
                  </span>

                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveCategory(idx, 'up')}
                    aria-label={`تحريك ${cat.name} لأعلى`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#141414] hover:bg-[#1E1E1E] disabled:opacity-35 border border-white/15 text-gray-200 cursor-pointer"
                  >
                    <ArrowUp className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    disabled={idx === orderedCategories.length - 1}
                    onClick={() => handleMoveCategory(idx, 'down')}
                    aria-label={`تحريك ${cat.name} لأسفل`}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#141414] hover:bg-[#1E1E1E] disabled:opacity-35 border border-white/15 text-gray-200 cursor-pointer"
                  >
                    <ArrowDown className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
                  </button>

                  {!isBuiltIn && orderedCategories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(cat.id)}
                      aria-label={`حذف القسم ${cat.name}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#0F4C5C]/20 hover:bg-[#0F4C5C] border border-[#0F4C5C]/70 text-[#A0D2EB] hover:text-white cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Custom Category Row */}
        <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-white/10">
          <label htmlFor="new-category-name-input" className="sr-only">
            إضافة قسم منتجات جديد
          </label>
          <input
            id="new-category-name-input"
            type="text"
            maxLength={80}
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCategory();
              }
            }}
            placeholder="إضافة قسم جديد (مثال: قسم أنظمة الإنتركوم والصوتيات)..."
            className="flex-1 min-h-[44px] rounded-xl bg-[#0B0B0B] border border-white/15 px-3.5 py-2 text-xs sm:text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] border border-[#D4AF37]/60 px-4 py-2 text-xs sm:text-sm font-extrabold text-white whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
            <span>إضافة قسم</span>
          </button>
        </div>
      </div>

      {/* 02. Storefront Section Visibility Toggles */}
      <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/25 p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
          <h3 className="text-base font-extrabold text-[#D4AF37]">
            02. إظهار وإخفاء أقسام الواجهة الرئيسية والفوتر
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
            {savingSiteConfig
              ? 'جاري الحفظ والتحقق من السحابة...'
              : 'حفظ الأقسام وإعدادات المحتوى سحابيًا'}
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
