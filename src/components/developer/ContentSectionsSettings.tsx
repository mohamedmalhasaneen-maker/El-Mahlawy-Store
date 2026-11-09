import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  Edit3,
  Eye,
  EyeOff,
  FolderPlus,
  Layers,
  Loader2,
  Package,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import { PRODUCT_CATEGORIES, getOrderedCategories } from '../../constants/categories';
import { MAX_CATEGORIES, SiteConfig, StoreCategoryItem } from '../../utils/siteConfig';
import { Product } from '../../types/store';

interface ContentSectionsSettingsProps {
  configDraft: SiteConfig;
  isSiteConfigDirty: boolean;
  savingSiteConfig: boolean;
  onUpdateField: <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => void;
  onSaveSubmit: (e: React.FormEvent, sectionLabel: string) => Promise<void>;
  onCancelChanges: () => void;
  products?: Product[];
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
  products = [],
}: ContentSectionsSettingsProps) {
  // Modal & Form States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StoreCategoryItem | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<StoreCategoryItem | null>(null);

  // Add Category Inputs
  const [newCategoryName, setNewCategoryName] = useState('');
  const [customIdInput, setCustomIdInput] = useState('');
  const [useCustomId, setUseCustomId] = useState(false);

  // Edit Category Inputs
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryOrder, setEditCategoryOrder] = useState<number>(1);

  // Feedback Messages
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const orderedCategories = useMemo(
    () => getOrderedCategories(configDraft.categories),
    [configDraft.categories]
  );
  const enabledCount = SECTION_TOGGLE_ITEMS.filter((item) => configDraft[item.key]).length;

  // Map product counts per category ID or category name
  const productCountByCategoryId = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of products) {
      const catId = p.categoryId || p.category;
      if (catId) {
        counts.set(catId, (counts.get(catId) || 0) + 1);
      }
    }
    return counts;
  }, [products]);

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
    setFeedback(null);
    commitCategories(next);
  };

  const handleOpenAddModal = () => {
    setNewCategoryName('');
    setCustomIdInput('');
    setUseCustomId(false);
    setFeedback(null);
    setIsAddModalOpen(true);
  };

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newCategoryName.trim();
    if (cleanName.length < 1 || cleanName.length > 80) {
      setFeedback({ type: 'error', message: 'يرجى إدخال اسم قسم صحيح بين حرف و 80 حرفًا.' });
      return;
    }
    if (orderedCategories.length >= MAX_CATEGORIES) {
      setFeedback({ type: 'error', message: `الحد الأقصى المسموح به هو ${MAX_CATEGORIES} قسمًا.` });
      return;
    }
    if (orderedCategories.some((c) => c.name.trim().toLowerCase() === cleanName.toLowerCase())) {
      setFeedback({ type: 'error', message: 'يوجد قسم مسجّل بنفس هذا الاسم بالفعل.' });
      return;
    }

    let finalId = `cat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    if (useCustomId && customIdInput.trim()) {
      const cleanId = customIdInput.trim().toLowerCase().replace(/[^a-z0-9_\-]/g, '-');
      if (cleanId.length < 1 || cleanId.length > 60) {
        setFeedback({ type: 'error', message: 'معرّف القسم المخصص يجب أن يتكون من أحرف إنجليزية وأرقام بين 1 و60 حرفًا.' });
        return;
      }
      if (orderedCategories.some((c) => c.id === cleanId)) {
        setFeedback({ type: 'error', message: `معرّف القسم المخصص (${cleanId}) مستخدم بالفعل.` });
        return;
      }
      finalId = cleanId;
    }

    const next: StoreCategoryItem[] = [
      ...orderedCategories,
      {
        id: finalId,
        name: cleanName,
        order: orderedCategories.length + 1,
      },
    ];

    commitCategories(next);
    setIsAddModalOpen(false);
    setNewCategoryName('');
    setFeedback({ type: 'success', message: `تمت إضافة قسم «${cleanName}» بنجاح. اضغط «حفظ الأقسام سحابيًا» للتأكيد.` });
  };

  const handleOpenEditModal = (cat: StoreCategoryItem) => {
    setEditingCategory(cat);
    setEditCategoryName(cat.name);
    setEditCategoryOrder(cat.order);
    setFeedback(null);
  };

  const handleEditCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    const cleanName = editCategoryName.trim();
    if (cleanName.length < 1 || cleanName.length > 80) {
      setFeedback({ type: 'error', message: 'يرجى إدخال اسم قسم بين حرف و80 حرفًا.' });
      return;
    }

    const duplicateName = orderedCategories.find(
      (c) => c.id !== editingCategory.id && c.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (duplicateName) {
      setFeedback({ type: 'error', message: 'يوجد قسم آخر مستخدم لنفس هذا الاسم.' });
      return;
    }

    let nextList = orderedCategories.map((c) =>
      c.id === editingCategory.id ? { ...c, name: cleanName } : c
    );

    // Re-order if order changed
    const targetOrder = Math.max(1, Math.min(orderedCategories.length, Math.round(editCategoryOrder)));
    if (targetOrder !== editingCategory.order) {
      const filtered = nextList.filter((c) => c.id !== editingCategory.id);
      const targetCat = nextList.find((c) => c.id === editingCategory.id)!;
      filtered.splice(targetOrder - 1, 0, targetCat);
      nextList = filtered;
    }

    commitCategories(nextList);
    setEditingCategory(null);
    setFeedback({ type: 'success', message: `تم تحديث بيانات قسم «${cleanName}» بنجاح.` });
  };

  const handleConfirmDelete = () => {
    if (!deletingCategory) return;
    if (orderedCategories.length <= 1) {
      setFeedback({ type: 'error', message: 'يجب الاحتفاظ بقسم واحد على الأقل في المتجر.' });
      setDeletingCategory(null);
      return;
    }

    const next = orderedCategories.filter((c) => c.id !== deletingCategory.id);
    commitCategories(next);
    const deletedName = deletingCategory.name;
    setDeletingCategory(null);
    setFeedback({ type: 'success', message: `تم حذف قسم «${deletedName}» بنجاح.` });
  };

  const handleResetDefaultCategories = () => {
    commitCategories(PRODUCT_CATEGORIES.map((c) => ({ ...c })));
    setFeedback({ type: 'success', message: 'تم استعادة الترتيب والأسماء الافتراضية للأقسام الستة الأساسية.' });
  };

  return (
    <form
      onSubmit={(e) => void onSaveSubmit(e, 'إعدادات المحتوى وأقسام المنتجات')}
      className="space-y-6"
    >
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/30">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Layers className="h-6 w-6 text-[#D4AF37]" aria-hidden="true" />
            <span>إدارة وتصميم أقسام المنتجات</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 tabular-nums">
            التحكم الكامل في إضافة وتعديل وإعادة ترتيب الأقسام ({orderedCategories.length} أقسام)
            وإظهار أقسام الواجهة ({enabledCount}/{SECTION_TOGGLE_ITEMS.length} ظاهرة).
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
          {isSiteConfigDirty && (
            <button
              type="button"
              onClick={onCancelChanges}
              className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] border border-white/20 px-4 py-2 text-xs font-bold text-gray-300 transition-colors whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>إلغاء التغييرات</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] border border-[#D4AF37]/60 px-4 py-2 text-xs font-extrabold text-white transition-colors whitespace-nowrap shadow-lg cursor-pointer"
          >
            <FolderPlus className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
            <span>إضافة قسم جديد</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          role="alert"
          className={`flex items-center justify-between gap-3 rounded-2xl px-5 py-3.5 text-xs sm:text-sm font-semibold border backdrop-blur-md transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
              : 'bg-[#0F4C5C]/20 border-[#0F4C5C] text-[#A0D2EB]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <Check className="h-4 w-4 text-emerald-400 shrink-0" aria-hidden="true" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-[#38BDF8] shrink-0" aria-hidden="true" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-gray-400 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* 01. Glassmorphism Product Categories Grid */}
      <div className="rounded-2xl bg-[#141414]/90 backdrop-blur-md border border-[#D4AF37]/30 p-5 sm:p-6 space-y-5 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <SlidersHorizontal className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
            <h3 className="text-base font-extrabold text-[#D4AF37]">
              01. أقسام المتجر وترتيب ظهورها للعملاء
            </h3>
            <span className="rounded-lg bg-[#0B0B0B] border border-[#D4AF37]/40 px-2.5 py-0.5 text-xs font-bold text-gray-300 tabular-nums">
              {orderedCategories.length} / {MAX_CATEGORIES}
            </span>
          </div>

          <button
            type="button"
            onClick={handleResetDefaultCategories}
            className="rounded-lg bg-[#0B0B0B] hover:bg-[#1E1E1E] border border-[#D4AF37]/40 px-3 py-1.5 text-xs font-bold text-[#D4AF37] transition-colors cursor-pointer"
          >
            استعادة الترتيب الافتراضي للأقسام
          </button>
        </div>

        <p className="text-xs text-gray-400 leading-relaxed">
          يمكنك إعادة ترتيب ظهور الأقسام باستخدام أزرار الترتيب (أعلى / أسفل)، أو تعديل اسم القسم،
          أو إضافة قسم مخصص جديد. سيظهر الترتيب فوراً لجميع الزوار بعد الضغط على «حفظ سحابيًا».
        </p>

        {/* Categories Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {orderedCategories.map((cat, idx) => {
            const isBuiltIn = PRODUCT_CATEGORIES.some((def) => def.id === cat.id);
            const count = productCountByCategoryId.get(cat.id) || productCountByCategoryId.get(cat.name) || 0;

            return (
              <div
                key={cat.id}
                className="group relative rounded-xl bg-[#0B0B0B]/90 hover:bg-[#0F0F0F] border border-white/15 hover:border-[#D4AF37]/60 p-4 transition-all duration-200 shadow-md flex flex-col justify-between gap-3"
              >
                {/* Top Row: Index Badge, Name, ID & Product Count */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#141414] border border-[#D4AF37]/50 text-xs font-extrabold text-[#D4AF37] tabular-nums shadow-inner">
                      #{idx + 1}
                    </span>
                    <div className="min-w-0 space-y-1">
                      <h4 className="text-sm font-extrabold text-white truncate leading-snug group-hover:text-[#D4AF37] transition-colors">
                        {cat.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] text-gray-400 flex-wrap">
                        <span className="font-mono bg-[#141414] px-2 py-0.5 rounded border border-white/10 text-gray-400">
                          <bdi>{cat.id}</bdi>
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-gray-300 font-semibold tabular-nums">
                          <Package className="h-3 w-3 text-[#D4AF37]" aria-hidden="true" />
                          <span>{count} منتج</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {isBuiltIn && (
                    <span className="rounded-md bg-[#0F4C5C]/20 border border-[#0F4C5C]/50 px-2 py-0.5 text-[10px] font-bold text-[#A0D2EB] shrink-0">
                      أساسي
                    </span>
                  )}
                </div>

                {/* Bottom Row: Controls & Actions */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                  {/* Reorder Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveCategory(idx, 'up')}
                      aria-label={`تحريك ${cat.name} لأعلى`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#141414] hover:bg-[#1E1E1E] disabled:opacity-30 border border-white/15 text-gray-300 cursor-pointer transition-colors"
                    >
                      <ArrowUp className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      disabled={idx === orderedCategories.length - 1}
                      onClick={() => handleMoveCategory(idx, 'down')}
                      aria-label={`تحريك ${cat.name} لأسفل`}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#141414] hover:bg-[#1E1E1E] disabled:opacity-30 border border-white/15 text-gray-300 cursor-pointer transition-colors"
                    >
                      <ArrowDown className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Edit & Delete Action Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(cat)}
                      className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-[#141414] hover:bg-[#1E1E1E] border border-white/15 px-3 py-1.5 text-xs font-bold text-gray-200 hover:text-[#D4AF37] transition-colors cursor-pointer"
                    >
                      <Edit3 className="h-3.5 w-3.5 text-[#D4AF37]" aria-hidden="true" />
                      <span>تعديل</span>
                    </button>

                    <button
                      type="button"
                      disabled={orderedCategories.length <= 1}
                      onClick={() => setDeletingCategory(cat)}
                      className="inline-flex min-h-[34px] items-center gap-1.5 rounded-lg bg-[#0F4C5C]/20 hover:bg-[#0F4C5C] disabled:opacity-30 border border-[#0F4C5C]/60 px-3 py-1.5 text-xs font-bold text-[#A0D2EB] hover:text-white transition-colors cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 02. Storefront Section Visibility Toggles */}
      <div className="rounded-2xl bg-[#141414]/90 backdrop-blur-md border border-[#D4AF37]/30 p-5 sm:p-6 space-y-4 shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/10">
          <h3 className="text-base font-extrabold text-[#D4AF37]">
            02. إظهار وإخفاء أقسام الواجهة الرئيسية والفوتر
          </h3>
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
                className={`min-h-[76px] rounded-xl p-4 border text-right flex items-start justify-between gap-3 cursor-pointer transition-all ${
                  enabled
                    ? 'bg-[#0B0B0B] border-[#D4AF37] text-white shadow-md'
                    : 'bg-[#0B0B0B]/70 border-white/15 text-gray-400 hover:border-white/30'
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

      {/* Cloud Save & Cancel Floating Action Bar */}
      <div className="sticky bottom-4 z-20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 rounded-2xl bg-[#0B0B0B]/95 border border-[#D4AF37]/50 p-4 backdrop-blur-lg shadow-2xl">
        <button
          type="submit"
          disabled={savingSiteConfig}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] disabled:opacity-55 border border-[#D4AF37]/70 px-6 py-3 text-sm font-extrabold text-white transition-all shadow-xl cursor-pointer"
        >
          {savingSiteConfig ? (
            <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" aria-hidden="true" />
          ) : (
            <Check className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
          )}
          <span>
            {savingSiteConfig
              ? 'جاري التحقق والتخزين السحابي...'
              : 'حفظ الأقسام وإعدادات المحتوى سحابيًا'}
          </span>
        </button>

        <button
          type="button"
          disabled={savingSiteConfig || !isSiteConfigDirty}
          onClick={onCancelChanges}
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] disabled:opacity-40 border border-white/15 px-5 py-3 text-xs sm:text-sm font-semibold text-gray-300 whitespace-nowrap cursor-pointer transition-colors"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          <span>إلغاء التغييرات غير المحفوظة</span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* MODAL 1: ADD NEW CATEGORY                                            */}
      {/* ==================================================================== */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="إضافة قسم منتجات جديد"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddModalOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-[#141414] border border-[#D4AF37]/50 p-6 space-y-5 shadow-2xl text-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <FolderPlus className="h-5 w-5 text-[#D4AF37]" aria-hidden="true" />
                <h3 className="text-base sm:text-lg font-extrabold text-white">إضافة قسم منتجات جديد</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleAddCategorySubmit} className="space-y-4">
              <div>
                <label htmlFor="modal-cat-name-input" className="block text-xs font-bold text-[#D4AF37] mb-1.5">
                  اسم القسم المعروض للعملاء *
                </label>
                <input
                  id="modal-cat-name-input"
                  type="text"
                  required
                  maxLength={80}
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="مثال: قسم أنظمة الإنتركوم والصوتيات..."
                  className="w-full min-h-[46px] rounded-xl bg-[#0B0B0B] border border-[#D4AF37]/35 px-4 py-2.5 text-sm font-semibold text-white placeholder:text-gray-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              {/* Custom ID Toggle */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2.5 text-xs text-gray-300 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomId}
                    onChange={(e) => setUseCustomId(e.target.checked)}
                    className="h-4 w-4 rounded bg-[#0B0B0B] border-white/20 text-[#0F4C5C] focus:ring-0"
                  />
                  <span>تحديد معرّف مخصص (Custom ID)</span>
                </label>

                {useCustomId && (
                  <div>
                    <input
                      type="text"
                      maxLength={60}
                      value={customIdInput}
                      onChange={(e) => setCustomIdInput(e.target.value)}
                      placeholder="intercom-systems"
                      dir="ltr"
                      className="w-full min-h-[42px] rounded-xl bg-[#0B0B0B] border border-white/20 px-3.5 py-2 text-xs font-mono text-white placeholder:text-gray-600 focus:outline-none focus:border-[#D4AF37]"
                    />
                    <p className="text-[11px] text-gray-400 mt-1">
                      أحرف إنجليزية صغيرة وأرقام وشرطات فقط.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="min-h-[44px] rounded-xl bg-[#0B0B0B] hover:bg-[#1E1E1E] border border-white/15 px-4 py-2 text-xs font-bold text-gray-300 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] border border-[#D4AF37]/60 px-5 py-2 text-xs font-extrabold text-white cursor-pointer"
                >
                  إضافة القسم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 2: EDIT EXISTING CATEGORY                                      */}
      {/* ==================================================================== */}
      {editingCategory && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="تعديل قسم منتجات"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingCategory(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-[#141414] border border-[#D4AF37]/50 p-6 space-y-5 shadow-2xl text-gray-100">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Edit3 className="h-5 w-5 text-[#D4AF37]" aria-hidden="true" />
                <h3 className="text-base sm:text-lg font-extrabold text-white">تعديل بيانات القسم</h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleEditCategorySubmit} className="space-y-4">
              <div>
                <label htmlFor="edit-modal-cat-name" className="block text-xs font-bold text-[#D4AF37] mb-1.5">
                  اسم القسم *
                </label>
                <input
                  id="edit-modal-cat-name"
                  type="text"
                  required
                  maxLength={80}
                  value={editCategoryName}
                  onChange={(e) => setEditCategoryName(e.target.value)}
                  className="w-full min-h-[46px] rounded-xl bg-[#0B0B0B] border border-[#D4AF37]/35 px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 items-center">
                <div>
                  <label htmlFor="edit-modal-cat-order" className="block text-xs font-bold text-gray-300 mb-1.5">
                    الترتيب (المركز)
                  </label>
                  <input
                    id="edit-modal-cat-order"
                    type="number"
                    min={1}
                    max={orderedCategories.length}
                    value={editCategoryOrder}
                    onChange={(e) => setEditCategoryOrder(Number(e.target.value))}
                    className="w-full min-h-[42px] rounded-xl bg-[#0B0B0B] border border-white/20 px-3.5 py-2 text-xs font-bold text-white text-center tabular-nums focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="space-y-1">
                  <span className="block text-xs font-bold text-gray-400">معرّف القسم الداخلي</span>
                  <span className="block font-mono text-xs text-gray-300 bg-[#0B0B0B] border border-white/10 px-2.5 py-2 rounded-xl truncate">
                    <bdi>{editingCategory.id}</bdi>
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="min-h-[44px] rounded-xl bg-[#0B0B0B] hover:bg-[#1E1E1E] border border-white/15 px-4 py-2 text-xs font-bold text-gray-300 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] border border-[#D4AF37]/60 px-5 py-2 text-xs font-extrabold text-white cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* MODAL 3: CONFIRM DELETE CATEGORY                                     */}
      {/* ==================================================================== */}
      {deletingCategory && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="تأكيد حذف القسم"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeletingCategory(null);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-[#141414] border border-[#0F4C5C] p-6 space-y-5 shadow-2xl text-gray-100">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0F4C5C]/20 border border-[#0F4C5C] text-[#38BDF8]">
                <AlertTriangle className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-base font-extrabold text-white">تأكيد حذف القسم</h3>
                <p className="text-xs text-gray-400">هل أنت تأكد من رغبتك في حذف قسم «{deletingCategory.name}»؟</p>
              </div>
            </div>

            <p className="text-xs text-gray-300 leading-relaxed bg-[#0B0B0B] border border-white/10 p-3.5 rounded-xl">
              لن يتم حذف المنتجات التابعة للقسم، ولكنها ستظهر ضمن «منتجات بدون قسم» في لوحة الإدارة إلى أن تقوم بإعادة تصنيفها.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="min-h-[44px] rounded-xl bg-[#0B0B0B] hover:bg-[#1E1E1E] border border-white/15 px-4 py-2 text-xs font-bold text-gray-300 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="min-h-[44px] rounded-xl bg-[#0F4C5C] hover:bg-[#0A3D4A] border border-[#D4AF37]/60 px-5 py-2 text-xs font-extrabold text-white cursor-pointer"
              >
                تأكيد الحذف
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
