import {
  Camera,
  HardDrive,
  Home,
  Laptop,
  Layers,
  LucideIcon,
  ShieldAlert,
  Smartphone,
  Tv,
  Wifi,
  Wrench,
} from 'lucide-react';

export interface Category {
  id: string;
  name: string;
  order: number;
  icon?: string;
  imageUrl?: string;
  isHidden?: boolean;
}

export const PRODUCT_CATEGORIES: Category[] = [
  { id: 'cctv', name: 'قسم كاميرات المراقبة', order: 1 },
  { id: 'satellite', name: 'قسم الستلايت', order: 2 },
  { id: 'mobile-accessories', name: 'قسم إكسسوارات الهاتف', order: 3 },
  { id: 'electrical-tools', name: 'قسم الأدوات الكهربائية', order: 4 },
  { id: 'early-warning', name: 'قسم أجهزة الإنذار المبكر', order: 5 },
  { id: 'smart-home', name: 'قسم السمارت هوم', order: 6 },
  { id: 'computer-accessories', name: 'اكسسوارات الكمبيوتر واللاب توب', order: 7 },
  { id: 'internet', name: 'الإنترنت', order: 8 },
  { id: 'memory-cards-flash', name: 'كروت الميموري SD والفلاشات', order: 9 },
];

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  cctv: Camera,
  satellite: Tv,
  'mobile-accessories': Smartphone,
  'electrical-tools': Wrench,
  'early-warning': ShieldAlert,
  'smart-home': Home,
  'computer-accessories': Laptop,
  internet: Wifi,
  'memory-cards-flash': HardDrive,
};

export function getCategoryIcon(idOrName: string): LucideIcon {
  const clean = (idOrName || '').trim();
  if (CATEGORY_ICON_MAP[clean]) {
    return CATEGORY_ICON_MAP[clean];
  }
  const resolvedId = getCategoryIdByName(clean);
  if (resolvedId && CATEGORY_ICON_MAP[resolvedId]) {
    return CATEGORY_ICON_MAP[resolvedId];
  }
  return Layers;
}

function normalizeArabicCategoryLabel(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/^قسم\s+/u, '')
    .replace(/[أإآ]/gu, 'ا')
    .replace(/ة/gu, 'ه')
    .replace(/ى/gu, 'ي')
    .replace(/\s+/gu, ' ');
}

export const getOrderedCategories = (
  customCategories?: ReadonlyArray<{ id: string; name: string; order?: number }>
): Category[] => {
  const source =
    Array.isArray(customCategories) && customCategories.length > 0
      ? customCategories
      : PRODUCT_CATEGORIES;

  const seenIds = new Set<string>();
  const result: Category[] = [];

  for (let idx = 0; idx < source.length; idx += 1) {
    const item = source[idx];
    if (!item?.id || seenIds.has(item.id)) continue;
    seenIds.add(item.id);
    result.push({
      id: item.id,
      name: item.name,
      order: typeof item.order === 'number' && Number.isFinite(item.order) ? item.order : idx + 1,
    });
  }

  // Seamlessly append any base category from PRODUCT_CATEGORIES that is missing
  for (const def of PRODUCT_CATEGORIES) {
    if (!seenIds.has(def.id)) {
      seenIds.add(def.id);
      result.push({
        id: def.id,
        name: def.name,
        order: def.order || result.length + 1,
      });
    }
  }

  return result.sort((a, b) => a.order - b.order);
};

export const getCategoryName = (
  idOrName: string,
  customCategories?: ReadonlyArray<{ id: string; name: string; order?: number }>
): string => {
  const clean = (idOrName || '').trim();
  if (!clean) return '';
  const list = getOrderedCategories(customCategories);
  const directMatch = list.find((c) => c.id === clean);
  if (directMatch) return directMatch.name;

  const fallbackDefault = PRODUCT_CATEGORIES.find((c) => c.id === clean);
  if (fallbackDefault) return fallbackDefault.name;

  const resolvedId = getCategoryIdByName(clean, list);
  if (resolvedId) {
    return (
      list.find((c) => c.id === resolvedId)?.name ||
      PRODUCT_CATEGORIES.find((c) => c.id === resolvedId)?.name ||
      clean
    );
  }

  return clean;
};

export const getCategoryIdByName = (
  nameOrId: string,
  customCategories?: ReadonlyArray<{ id: string; name: string; order?: number }>
): string => {
  const trimmed = (nameOrId || '').trim();
  if (!trimmed) return '';

  const list = getOrderedCategories(customCategories);
  const combined = [
    ...list,
    ...PRODUCT_CATEGORIES.filter((def) => !list.some((item) => item.id === def.id)),
  ];

  // 1. Direct ID match
  const byId = combined.find((c) => c.id === trimmed);
  if (byId) return byId.id;

  // 2. Exact name match
  const byExactName = combined.find((c) => c.name === trimmed);
  if (byExactName) return byExactName.id;

  // 3. Normalized Arabic label match (handles legacy values like "ادوات كهربائيه" without "قسم")
  const normTarget = normalizeArabicCategoryLabel(trimmed);
  if (normTarget) {
    const byNorm = combined.find((c) => normalizeArabicCategoryLabel(c.name) === normTarget);
    if (byNorm) return byNorm.id;
  }

  return '';
};
