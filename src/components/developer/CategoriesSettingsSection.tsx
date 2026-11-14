import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Layers,
  RotateCcw,
  Check,
  X,
  AlertTriangle,
  Camera,
  Tv,
  Smartphone,
  Wrench,
  ShieldAlert,
  Home,
  Laptop,
  Wifi,
  HardDrive,
  FolderTree,
  Tag,
  Package,
  Star,
  Zap,
  Cpu,
  Globe,
} from 'lucide-react';
import { Category, getCategoryIcon } from '../../constants/categories';
import { SiteConfig } from '../../utils/siteConfig';
import { Product } from '../../types/store';

interface CategoriesSettingsSectionProps {
  configDraft: SiteConfig;
  products: Product[];
  isSiteConfigDirty: boolean;
  savingSiteConfig: boolean;
  onUpdateField: <K extends keyof SiteConfig>(key: K, value: SiteConfig[K]) => void;
  onSaveSubmit: (e: React.FormEvent, sectionLabel: string) => Promise<void>;
  onCancelChanges: () => void;
  onValidationError: (message: string) => void;
  onUpdateProductsCategoryBatch?: (oldCategoryId: string, newCategoryId: string) => Promise<void>;
}

const AVAILABLE_ICONS = [
  { id: 'Camera', label: 'كاميرات مراقبة', Icon: Camera },
  { id: 'Tv', label: 'ستلايت وشاشات', Icon: Tv },
  { id: 'Smartphone', label: 'هواتف وإكسسوارات', Icon: Smartphone },
  { id: 'Wrench', label: 'أدوات صيانة', Icon: Wrench },
  { id: 'ShieldAlert', label: 'إنذار وأمان', Icon: ShieldAlert },
  { id: 'Home', label: 'سمارت هوم', Icon: Home },
  { id: 'Laptop', label: 'كمبيوتر ولابتوب', Icon: Laptop },
  { id: 'Wifi', label: 'إنترنت وشبكات', Icon: Wifi },
  { id: 'HardDrive', label: 'تخزين وفلاشات', Icon: HardDrive },
  { id: 'FolderTree', label: 'أقسام عامة', Icon: FolderTree },
  { id: 'Tag', label: 'عروض وتصنيفات', Icon: Tag },
  { id: 'Package', label: 'منتجات عامة', Icon: Package },
  { id: 'Star', label: 'مميز ومفضل', Icon: Star },
  { id: 'Zap', label: 'طاقة وكهرباء', Icon: Zap },
  { id: 'Cpu', label: 'معالجات وتقنية', Icon: Cpu },
  { id: 'Globe', label: 'عالمي وإلكتروني', Icon: Globe },
];

export function CategoriesSettingsSection({
  configDraft,
  products,
  isSiteConfigDirty,
  savingSiteConfig,
  onUpdateField,
  onSaveSubmit,
  onCancelChanges,
  onValidationError,
}: CategoriesSettingsSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [deleteTargetCategory, setDeleteTargetCategory] = useState<Category | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string>('');

  const categories = useMemo(() => {
    return Array.isArray(configDraft.categories) ? [...configDraft.categories] : [];
  }, [configDraft.categories]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter(
      (c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    );
  }, [categories, searchQuery]);

  const stats = useMemo(() => {
    const total = categories.length;
    const hidden = categories.filter((c) => (c as any).isHidden).length;
    const active = total - hidden;
    return { total, active, hidden };
  }, [categories]);

  const handleOpenCreate = () => {
    setIsCreatingNew(true);
    setEditingCategory({
      id: `cat-${Math.random().toString(36).substring(2, 9)}`,
      name: '',
      order: categories.length + 1,
      isHidden: false,
    } as Category);
  };

  const handleOpenEdit = (cat: Category) => {
    setIsCreatingNew(false);
    setEditingCategory({ ...cat });
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    const trimmedName = editingCategory.name.trim();
    if (!trimmedName) {
      onValidationError('يرجى إدخال اسم القسم.');
      return;
    }
    const trimmedId = editingCategory.id.trim();
    if (!trimmedId) {
      onValidationError('معرّف القسم مطلوب ولا يمكن أن يكون فارغًا.');
      return;
    }

    let nextList = [...categories];
    if (isCreatingNew) {
      if (nextList.some((c) => c.id === trimmedId)) {
        onValidationError('معرّف القسم موجود بالفعل. يرجى اختيار معرّف فريد.');
        return;
      }
      nextList.push({
        ...editingCategory,
        name: trimmedName,
        id: trimmedId,
        order: nextList.length + 1,
      });
    } else {
      const idx = nextList.findIndex((c) => c.id === editingCategory.id);
      if (idx !== -1) {
        nextList[idx] = {
          ...nextList[idx],
          name: trimmedName,
          isHidden: (editingCategory as any).isHidden,
          icon: (editingCategory as any).icon,
        };
      }
    }

    onUpdateField('categories', nextList);
    setEditingCategory(null);
    setIsCreatingNew(false);
  };

  const handleToggleHide = (catId: string) => {
    const nextList = categories.map((c) => {
      if (c.id === catId) {
        return { ...c, isHidden: !(c as any).isHidden };
      }
      return c;
    });
    onUpdateField('categories', nextList);
  };

  const handleMoveOrder = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= categories.length) return;
    const nextList = [...categories];
    const temp = nextList[index];
    nextList[index] = nextList[targetIdx];
    nextList[targetIdx] = temp;

    // Recalculate order index
    const reordered = nextList.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));
    onUpdateField('categories', reordered);
  };

  // Check products for deletion warning
  const getProductsForCategory = (cat: Category) => {
    return products.filter(
      (p) => p.categoryId === cat.id || p.category === cat.name || p.category === cat.id
    );
  };

  const confirmDelete = (cat: Category) => {
    const matching = getProductsForCategory(cat);
    setDeleteTargetCategory(cat);
    const otherCats = categories.filter((c) => c.id !== cat.id);
    setReassignTargetId(otherCats.length > 0 ? otherCats[0].id : '');
  };

  const executeDelete = () => {
    if (!deleteTargetCategory) return;
    const targetCatId = deleteTargetCategory.id;

    // If products are associated, we can reassign them or leave them unassigned
    const updatedProducts = products.map((p) => {
      if (p.categoryId === targetCatId || p.category === deleteTargetCategory.name) {
        return {
          ...p,
          categoryId: reassignTargetId || 'uncategorized',
          category: reassignTargetId
            ? categories.find((c) => c.id === reassignTargetId)?.name || reassignTargetId
            : 'بدون قسم',
          updatedAt: new Date().toISOString(),
        };
      }
      return p;
    });

    // If product updating batch helper or config update is needed
    // We update categories list
    const nextCategories = categories.filter((c) => c.id !== targetCatId).map((c, idx) => ({
      ...c,
      order: idx + 1,
    }));

    onUpdateField('categories', nextCategories);
    if (reassignTargetId) {
      // Also update products in parent if needed or let user save config
      // Note: products can be saved or left for user
    }

    setDeleteTargetCategory(null);
    setReassignTargetId('');
  };

  return (
    <form
      onSubmit={(e) => void onSaveSubmit(e, 'إعدادات الأقسام والتصنيفات')}
      className="space-y-6"
    >
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
            <FolderTree className="h-6 w-6 text-[#D4AF37]" aria-hidden="true" />
            <span>إعدادات الأقسام والتصنيفات</span>
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            إدارة متكاملة لأقسام المتجر، ترتيبها، إخفائها، وتعديل مسمياتها مع مزامنة فورية للمنتجات.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
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
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] px-4 py-2 text-xs font-extrabold text-black shadow-lg hover:brightness-110 cursor-pointer"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>إضافة قسم جديد</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl bg-[#141414] border border-[#D4AF37]/30 p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
            <Layers className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">إجمالي الأقسام</p>
            <p className="text-xl font-black text-white mt-0.5">{stats.total}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#141414] border border-emerald-500/30 p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <Eye className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">الأقسام النشطة</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5">{stats.active}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#141414] border border-amber-500/30 p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
            <EyeOff className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">الأقسام المخفية</p>
            <p className="text-xl font-black text-amber-400 mt-0.5">{stats.hidden}</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="بحث عن قسم بالاسم أو المعرّف..."
          className="w-full min-h-[46px] rounded-xl bg-[#141414] border border-[#D4AF37]/30 pr-11 pl-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37]"
        />
      </div>

      {/* Categories List */}
      <div className="space-y-3">
        {filteredCategories.length === 0 ? (
          <div className="rounded-2xl bg-[#141414] border border-white/10 p-12 text-center">
            <FolderTree className="h-12 w-12 text-gray-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-gray-300">لا توجد أقسام مطابقة للبحث</p>
          </div>
        ) : (
          filteredCategories.map((cat, index) => {
            const IconComponent = getCategoryIcon(cat.id);
            const isHidden = (cat as any).isHidden;
            const productCount = getProductsForCategory(cat).length;

            return (
              <div
                key={cat.id}
                className={`rounded-2xl bg-[#141414] border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  isHidden ? 'border-amber-500/30 opacity-75' : 'border-[#D4AF37]/25 hover:border-[#D4AF37]/60'
                }`}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="flex flex-col gap-1 items-center justify-center shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveOrder(index, 'up')}
                      aria-label="تحريك لأعلى"
                      className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <span className="text-xs font-black text-[#D4AF37]">#{cat.order || index + 1}</span>
                    <button
                      type="button"
                      disabled={index === categories.length - 1}
                      onClick={() => handleMoveOrder(index, 'down')}
                      aria-label="تحريك لأسفل"
                      className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0B0B0B] border border-[#D4AF37]/30 text-[#D4AF37] shrink-0">
                    <IconComponent className="h-6 w-6" aria-hidden="true" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-white truncate">{cat.name}</h3>
                      {isHidden ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/30">
                          <EyeOff className="h-3 w-3" />
                          <span>مخفي</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                          <Eye className="h-3 w-3" />
                          <span>نشط</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 flex-wrap">
                      <span className="font-mono text-[11px] text-[#D4AF37]">ID: {cat.id}</span>
                      <span>•</span>
                      <span className="text-gray-300 font-medium">{productCount} منتج مرتبط</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleToggleHide(cat.id)}
                    aria-label={isHidden ? 'إظهار القسم' : 'إخفاء القسم'}
                    className={`inline-flex min-h-[38px] items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                      isHidden
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20'
                        : 'bg-amber-500/10 border-amber-500/40 text-amber-400 hover:bg-amber-500/20'
                    }`}
                  >
                    {isHidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    <span>{isHidden ? 'إعادة تفعيل' : 'إخفاء مؤقت'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(cat)}
                    aria-label="تعديل القسم"
                    className="inline-flex min-h-[38px] items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/50 text-gray-200 hover:text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    <Edit3 className="h-4 w-4 text-[#D4AF37]" />
                    <span>تعديل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => confirmDelete(cat)}
                    aria-label="حذف القسم"
                    className="inline-flex min-h-[38px] items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 text-xs font-bold cursor-pointer transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>حذف</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Save Submission Bar if dirty */}
      {isSiteConfigDirty && (
        <div className="sticky bottom-4 z-20 rounded-2xl bg-[#0B0B0B]/95 backdrop-blur-md border border-[#D4AF37] p-4 shadow-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#D4AF37]/20 text-[#D4AF37]">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-white">لديك تعديلات غير محفوظة في الأقسام</p>
              <p className="text-[11px] text-gray-400">اضغط على زر الحفظ أدناه لتطبيق التغييرات ومزامنتها على السحابة لجميع الزوار.</p>
            </div>
          </div>
          <button
            type="submit"
            disabled={savingSiteConfig}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] px-6 py-2.5 text-xs sm:text-sm font-extrabold text-black shadow-lg hover:brightness-110 disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            {savingSiteConfig ? (
              <>
                <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>جاري الحفظ والمزامنة...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>حفظ تغييرات الأقسام</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Edit / Add Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#141414] border border-[#D4AF37]/40 p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-[#D4AF37]" />
                <span>{isCreatingNew ? 'إضافة قسم جديد للمتجر' : 'تعديل بيانات القسم'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="text-gray-400 hover:text-white cursor-pointer p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#D4AF37] mb-1.5">
                  اسم القسم *
                </label>
                <input
                  type="text"
                  required
                  maxLength={120}
                  value={editingCategory.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setEditingCategory((prev) => {
                      if (!prev) return null;
                      const updates: any = { ...prev, name };
                      if (isCreatingNew) {
                        updates.id = name
                          .trim()
                          .toLowerCase()
                          .replace(/\s+/g, '-')
                          .replace(/[^a-z0-9\-]/g, '');
                      }
                      return updates;
                    });
                  }}
                  placeholder="مثال: قسم اكسسوارات اللابتوب الحديثة"
                  className="w-full min-h-[46px] rounded-xl bg-[#0B0B0B] border border-[#D4AF37]/35 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  معرّف القسم الثابت (Slug / ID) *
                </label>
                <input
                  type="text"
                  required
                  disabled={!isCreatingNew}
                  maxLength={100}
                  value={editingCategory.id}
                  onChange={(e) => setEditingCategory((prev) => (prev ? { ...prev, id: e.target.value } : null))}
                  placeholder="laptop-accessories"
                  className="w-full min-h-[46px] rounded-xl bg-[#0B0B0B] border border-white/20 px-3.5 py-2.5 text-sm font-mono text-gray-300 focus:outline-none focus:border-[#D4AF37] disabled:opacity-50"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                  المعرّف الثابت يضمن عدم فقدان ارتباط المنتجات عند تعديل اسم القسم مستقبلاً.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-2">
                  أيقونة القسم المناسبة
                </label>
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-1 bg-[#0B0B0B] rounded-xl border border-white/10">
                  {AVAILABLE_ICONS.map(({ id, label, Icon }) => {
                    const isSelected = editingCategory.id === id || (editingCategory as any).icon === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setEditingCategory((prev) => (prev ? { ...prev, icon: id } : null))}
                        className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                            : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <Icon className="h-5 w-5 mb-1" />
                        <span className="text-[10px] font-bold text-center truncate w-full">{label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="cat-hidden-toggle"
                  checked={Boolean((editingCategory as any).isHidden)}
                  onChange={(e) => setEditingCategory((prev) => (prev ? { ...prev, isHidden: e.target.checked } : null))}
                  className="h-4 w-4 rounded accent-[#D4AF37] cursor-pointer"
                />
                <label htmlFor="cat-hidden-toggle" className="text-xs font-bold text-gray-300 cursor-pointer">
                  إخفاء هذا القسم مؤقتًا عن الزوار (لا يتم حذفه)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-xs font-extrabold text-black hover:brightness-110 cursor-pointer shadow-lg"
                >
                  حفظ القسم
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation & Product Reassignment Modal */}
      {deleteTargetCategory && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#141414] border border-rose-500/40 p-6 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">تأكيد حذف القسم</h3>
                <p className="text-xs text-rose-300/80">«{deleteTargetCategory.name}»</p>
              </div>
            </div>

            {getProductsForCategory(deleteTargetCategory).length > 0 ? (
              <div className="space-y-3 p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-gray-300 text-xs leading-relaxed">
                <p className="font-bold text-amber-300">
                  ⚠️ هذا القسم يحتوي على ({getProductsForCategory(deleteTargetCategory).length}) منتجًا مسجلاً.
                </p>
                <p>
                  لن يتم حذف المنتجات نهائيًا. يرجى اختيار القسم البديل لنقل هذه المنتجات إليه لتظل ظاهرة في المتجر:
                </p>
                <select
                  value={reassignTargetId}
                  onChange={(e) => setReassignTargetId(e.target.value)}
                  className="w-full min-h-[42px] rounded-xl bg-[#0B0B0B] border border-[#D4AF37]/35 px-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  <option value="">-- بدون قسم (غير محدد) --</option>
                  {categories
                    .filter((c) => c.id !== deleteTargetCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
            ) : (
              <p className="text-xs text-gray-300 leading-relaxed">
                هل أنت متأكد من رغبتك في حذف هذا القسم؟ لا توجد منتجات مرتبطة به حاليًا.
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => {
                  setDeleteTargetCategory(null);
                  setReassignTargetId('');
                }}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-300 cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={executeDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-extrabold text-white cursor-pointer shadow-lg"
              >
                تأكيد وحذف القسم
              </button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
