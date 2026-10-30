import { PARTNER_INFO, STORE_INFO, ValidationResult } from '../types/store';
import { Category, PRODUCT_CATEGORIES } from '../constants/categories';

export type ContactChannelRole =
  | 'orders'
  | 'maintenance'
  | 'after_sales'
  | 'support'
  | 'general';

export type ContactChannelOwner = 'store' | 'partner';

export interface ContactChannelItem {
  id: string;
  label: string;
  role: ContactChannelRole;
  owner: ContactChannelOwner;
  phone: string;
  whatsappUrl: string;
}

export interface BranchLocationItem {
  id: string;
  name: string;
  address: string;
  mapUrl: string;
  workingHours: string;
  phone: string;
}

export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'youtube'
  | 'telegram'
  | 'x'
  | 'website'
  | 'other';

export interface SocialLinkItem {
  id: string;
  platform: SocialPlatform;
  label: string;
  owner: ContactChannelOwner;
  url: string;
}

export type StoreCategoryItem = Category;

export interface EssentialCategoryItem {
  id: string;
  name: string;
  imageUrl: string;
  order: number;
}

export const DEFAULT_ESSENTIAL_CATEGORIES: EssentialCategoryItem[] = [
  { id: 'surveillance', name: 'كاميرات المراقبة', imageUrl: '', order: 1 },
  { id: 'satellite', name: 'الستلايت', imageUrl: '', order: 2 },
  { id: 'receivers', name: 'الريسيفرات', imageUrl: '', order: 3 },
  { id: 'audio_systems', name: 'أنظمة الصوتيات', imageUrl: '', order: 4 },
  { id: 'led_profile', name: 'إضاءة LED بروفايل', imageUrl: '', order: 5 },
  { id: 'early_alarm', name: 'أنظمة الإنذار المبكر', imageUrl: '', order: 6 },
  { id: 'fire_alarm', name: 'أنظمة إنذار الحريق', imageUrl: '', order: 7 },
];

export interface SiteConfig {
  id: string;
  // 1. Site Identity & SEO
  storeName: string;
  storeSubtitle: string;
  tagline: string;
  heroDescription: string;
  announcementText: string;
  seoTitle: string;
  seoDescription: string;
  copyrightText: string;

  // 2. Contact Settings
  primaryPhone: string;
  secondaryPhone: string;
  primaryWhatsApp: string;
  whatsappUrl: string;
  afterSalesWhatsAppUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  address: string;
  googleMapsUrl: string;
  workingHours: string;
  shippingSummary: string;
  afterSalesPolicy: string;
  closingPhrase: string;
  contactSectionTitle: string;
  contactSectionSubtitle: string;

  // 3. Partner (Infinity Corp) Contact & Info
  partnerName: string;
  partnerSubtitle: string;
  partnerRoleTitle: string;
  partnerServiceScopeText: string;
  partnerOrderPhone1: string;
  partnerOrderPhone2: string;
  partnerMaintenancePhone: string;
  partnerAfterSalesPhone: string;
  partnerFacebookUrl: string;

  // 4. About Us Page Texts
  aboutHeroTitle: string;
  aboutHeroSubtitle: string;
  aboutStoreIntro: string;
  aboutPartnerIntro: string;
  visionTitle: string;
  visionDescription: string;

  // 5. Dynamic Lists (Bounded Native Firestore Maps)
  contactChannels: ContactChannelItem[];
  branches: BranchLocationItem[];
  socialLinks: SocialLinkItem[];
  categories: StoreCategoryItem[];
  essentialCategories: EssentialCategoryItem[];

  // 6. Section Visibility Toggles
  showHeroSpotlight: boolean;
  showValueStrip: boolean;
  showOffersSection: boolean;
  showShippingSection: boolean;
  showPartnerCard: boolean;
  showAboutBanner: boolean;
  showRatingsSection: boolean;

  // 7. Audit Metadata
  updatedBy: string;
  updatedAt: string;
}

export const CONTACT_ROLE_LABELS: Record<ContactChannelRole, string> = {
  orders: 'طلبات الشراء',
  maintenance: 'التركيب والصيانة الدورية',
  after_sales: 'خدمة ما بعد البيع',
  support: 'الدعم الفني',
  general: 'استفسارات عامة',
};

export const CONTACT_OWNER_LABELS: Record<ContactChannelOwner, string> = {
  store: 'المحلاوي ستور',
  partner: 'Infinity Corp',
};

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  telegram: 'Telegram',
  x: 'X (Twitter)',
  website: 'موقع إلكتروني',
  other: 'منصة أخرى',
};

export const MAX_CONTACT_CHANNELS = 20;
export const MAX_BRANCHES = 10;
export const MAX_SOCIAL_LINKS = 15;
export const MAX_CATEGORIES = 20;
export const MAX_FIRESTORE_DOC_SAFE_BYTES = 900_000;

export function estimateJsonUtf8Bytes(value: unknown): number {
  try {
    const serialized = JSON.stringify(value ?? {});
    if (typeof TextEncoder !== 'undefined') {
      return new TextEncoder().encode(serialized).length;
    }
    return serialized.length * 3;
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

export const OFFICIAL_GOOGLE_MAPS_URL = 'https://maps.app.goo.gl/cJpdFbt62cTr1hch9';

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  id: 'main',
  storeName: STORE_INFO.storeName,
  storeSubtitle: STORE_INFO.storeSubtitle,
  tagline: STORE_INFO.tagline,
  heroDescription:
    'الوجهة المتخصصة في عرض المنتجات والأجهزة الحديثة، واستعراض أحدث الموديلات والصور والمواصفات والإمكانيات، لمساعدة العملاء على التعرف على المنتجات المتاحة واختيار الأنسب لاحتياجاتهم.',
  announcementText: '',
  seoTitle: 'المحلاوي ستور | El Mahlawy Store',
  seoDescription:
    'المحلاوي ستور - تسوق أحدث المنتجات والإلكترونيات وحلول الأنظمة الفنية بشرم الشيخ وجميع محافظات مصر.',
  copyrightText: 'جميع الحقوق محفوظة.',

  primaryPhone: STORE_INFO.primaryPhone,
  secondaryPhone: STORE_INFO.secondaryPhone,
  primaryWhatsApp: STORE_INFO.primaryWhatsApp,
  whatsappUrl: STORE_INFO.whatsappUrl,
  afterSalesWhatsAppUrl: STORE_INFO.afterSalesWhatsAppUrl,
  facebookUrl: STORE_INFO.facebookUrl,
  instagramUrl: '',
  address: STORE_INFO.address,
  googleMapsUrl: OFFICIAL_GOOGLE_MAPS_URL,
  workingHours: 'يوميًا من 10:00 صباحًا حتى 11:00 مساءً',
  shippingSummary: STORE_INFO.shippingSummary,
  afterSalesPolicy: STORE_INFO.afterSalesPolicy,
  closingPhrase: STORE_INFO.closingPhrase,
  contactSectionTitle: 'تواصل معنا',
  contactSectionSubtitle: 'قنوات التواصل الرسمية والمباشرة',

  partnerName: PARTNER_INFO.partnerName,
  partnerSubtitle: PARTNER_INFO.partnerSubtitle,
  partnerRoleTitle: PARTNER_INFO.roleTitle,
  partnerServiceScopeText: PARTNER_INFO.serviceScope.join('، '),
  partnerOrderPhone1: PARTNER_INFO.orderPhones[0] || '01210141187',
  partnerOrderPhone2: PARTNER_INFO.orderPhones[1] || '01143677682',
  partnerMaintenancePhone: PARTNER_INFO.maintenancePhone,
  partnerAfterSalesPhone: PARTNER_INFO.afterSalesPhone,
  partnerFacebookUrl: PARTNER_INFO.facebookUrl,

  aboutHeroTitle: 'المحلاوي ستور × Infinity Corp',
  aboutHeroSubtitle:
    'تعرّف على معلومات المحلاوي ستور وشريك النجاح شركة Infinity Corp بالكامل، وتصفّح منتجاتنا، وخدماتنا الفنية، ونطاق عملنا، وعناويننا وأرقام التواصل المباشرة.',
  aboutStoreIntro:
    'المحلاوي ستور هو وجهتك لشراء الأجهزة والمعدات ومستلزمات الأنظمة الفنية بأسعار تنافسية، مع توفير مجموعة متنوعة من المنتجات التي تلبي احتياجات الأفراد والشركات والمحلات والمنشآت التجارية. نوفر الشحن لجميع محافظات مصر، بالإضافة إلى خدمة التوصيل داخل شرم الشيخ.',
  aboutPartnerIntro:
    'تُعد Infinity Corp شركة متخصصة في التركيبات الفنية والصيانة الدورية وخدمة ما بعد البيع للأنظمة التي تقوم بتركيبها، وتقدم خدماتها للأفراد والشركات والفنادق والمنتجعات السياحية والمحلات التجارية داخل محافظة جنوب سيناء.',
  visionTitle: 'تجربة فنية متكاملة وموثوقة',
  visionDescription:
    'نسعى إلى توفير المنتجات والأجهزة الفنية المناسبة، وتقديم خدمات تركيب وصيانة موثوقة، مع الاهتمام بجودة الخدمة.',

  contactChannels: [
    {
      id: 'ch-store-orders',
      label: 'رقم الطلبات والاتصال الأساسي',
      role: 'orders',
      owner: 'store',
      phone: STORE_INFO.primaryPhone,
      whatsappUrl: STORE_INFO.whatsappUrl,
    },
    {
      id: 'ch-store-aftersales',
      label: 'خدمة ما بعد البيع - المحلاوي ستور',
      role: 'after_sales',
      owner: 'store',
      phone: STORE_INFO.secondaryPhone,
      whatsappUrl: STORE_INFO.afterSalesWhatsAppUrl,
    },
    {
      id: 'ch-partner-maintenance',
      label: 'التركيب والصيانة الدورية - Infinity Corp',
      role: 'maintenance',
      owner: 'partner',
      phone: PARTNER_INFO.maintenancePhone,
      whatsappUrl: PARTNER_INFO.maintenanceWhatsAppUrl,
    },
  ],

  branches: [
    {
      id: 'branch-sharm-main',
      name: 'الفرع الرئيسي — شرم الشيخ (الرويسات)',
      address: STORE_INFO.address,
      mapUrl: OFFICIAL_GOOGLE_MAPS_URL,
      workingHours: 'يوميًا من 10:00 صباحًا حتى 11:00 مساءً',
      phone: STORE_INFO.primaryPhone,
    },
  ],

  socialLinks: [],

  categories: PRODUCT_CATEGORIES.map((cat) => ({ ...cat })),
  essentialCategories: DEFAULT_ESSENTIAL_CATEGORIES.map((item) => ({ ...item })),

  showHeroSpotlight: true,
  showValueStrip: true,
  showOffersSection: true,
  showShippingSection: true,
  showPartnerCard: true,
  showAboutBanner: true,
  showRatingsSection: true,

  updatedBy: 'system',
  updatedAt: new Date(0).toISOString(),
};

const PHONE_REGEX = /^[0-9+\-\s()]{7,25}$/;
const SAFE_ID_REGEX = /^[a-zA-Z0-9_\-]+$/;

export function isValidPhoneNumber(value: string): boolean {
  const trimmed = (value || '').trim();
  if (!trimmed) return false;
  const digits = trimmed.replace(/\D/g, '');
  return PHONE_REGEX.test(trimmed) && digits.length >= 7 && digits.length <= 16;
}

export function isValidOptionalHttpUrl(value: string): boolean {
  const trimmed = (value || '').trim();
  if (!trimmed) return true;
  if (trimmed.length > 600) return false;
  return /^https?:\/\/[^\s]+$/i.test(trimmed);
}

export function normalizeDigitsForWhatsApp(phone: string): string {
  const digits = (phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) return digits.slice(2);
  if (digits.startsWith('01') && digits.length === 11) {
    return `2${digits}`;
  }
  return digits;
}

export function buildWhatsAppLinkFromPhone(phone: string): string {
  const intl = normalizeDigitsForWhatsApp(phone);
  return intl ? `https://wa.me/${intl}` : '';
}

export function parsePartnerScopeList(scopeText: string): string[] {
  return (scopeText || '')
    .split(/[،,|\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function validateSiteConfigInput(config: SiteConfig): ValidationResult {
  const errors: string[] = [];

  if ((config.storeName || '').trim().length < 2 || (config.storeName || '').trim().length > 100) {
    errors.push('يرجى إدخال اسم الموقع بالعربية (من 2 إلى 100 حرف).');
  }

  if ((config.storeSubtitle || '').trim().length > 100) {
    errors.push('اسم الموقع بالإنجليزية يجب ألا يتجاوز 100 حرف.');
  }

  if (!isValidPhoneNumber(config.primaryPhone)) {
    errors.push('رقم الهاتف الأساسي غير صالح؛ يرجى إدخال رقم صحيح.');
  }

  if ((config.secondaryPhone || '').trim() && !isValidPhoneNumber(config.secondaryPhone)) {
    errors.push('رقم الهاتف الإضافي غير صالح.');
  }

  const whatsAppDigits = (config.primaryWhatsApp || '').replace(/\D/g, '');
  if (whatsAppDigits.length < 7 || whatsAppDigits.length > 16) {
    errors.push('رقم واتساب الأساسي للطلبات غير صالح (مثال: 201210141187).');
  }

  const textBoundsChecks: Array<[string | undefined, number, string]> = [
    [config.tagline, 300, 'الشعار الترحيبي الرئيسي'],
    [config.heroDescription, 2000, 'الوصف التعريفي بأعلى الصفحة الرئيسية'],
    [config.announcementText, 400, 'شريط الإعلان العلوي'],
    [config.seoTitle, 240, 'عنوان محركات البحث (SEO Title)'],
    [config.seoDescription, 800, 'وصف محركات البحث (Meta Description)'],
    [config.copyrightText, 300, 'نص حقوق الملكية'],
    [config.address, 1000, 'العنوان الرئيسي'],
    [config.workingHours, 300, 'مواعيد العمل'],
    [config.shippingSummary, 1500, 'ملخص الشحن والتوصيل'],
    [config.afterSalesPolicy, 2500, 'سياسة ما بعد البيع'],
    [config.closingPhrase, 300, 'العبارة الختامية'],
    [config.contactSectionTitle, 200, 'عنوان قسم تواصل معنا'],
    [config.contactSectionSubtitle, 400, 'العنوان الفرعي لقسم تواصل معنا'],
    [config.partnerName, 160, 'اسم شريك النجاح'],
    [config.partnerSubtitle, 200, 'الاسم الفرعي لشريك النجاح'],
    [config.partnerRoleTitle, 200, 'المسمى الوظيفي للشريك'],
    [config.partnerServiceScopeText, 800, 'مدن نطاق خدمة الشريك'],
    [config.partnerOrderPhone1, 30, 'رقم طلبات الشريك الأول'],
    [config.partnerOrderPhone2, 30, 'رقم طلبات الشريك الثاني'],
    [config.partnerMaintenancePhone, 30, 'رقم التركيب والصيانة الدورية للشريك'],
    [config.partnerAfterSalesPhone, 30, 'رقم خدمة ما بعد البيع للشريك'],
    [config.aboutHeroTitle, 300, 'عنوان صفحة «من نحن» الرئيسي'],
    [config.aboutHeroSubtitle, 1500, 'مقدمة صفحة «من نحن»'],
    [config.aboutStoreIntro, 5000, 'النبذة التعريفية للمحلاوي ستور'],
    [config.aboutPartnerIntro, 5000, 'النبذة التعريفية لشركة Infinity Corp'],
    [config.visionTitle, 300, 'عنوان قسم الرؤية'],
    [config.visionDescription, 2500, 'نص قسم الرؤية'],
  ];

  for (const [val, maxLen, label] of textBoundsChecks) {
    if ((val || '').trim().length > maxLen) {
      errors.push(`حقل «${label}» يتجاوز الحد الأقصى المسموح به (${maxLen} حرفًا).`);
    }
  }

  const urlChecks: Array<[string, string]> = [
    [config.whatsappUrl, 'رابط واتساب الطلبات'],
    [config.afterSalesWhatsAppUrl, 'رابط واتساب ما بعد البيع'],
    [config.facebookUrl, 'رابط فيسبوك المتجر'],
    [config.instagramUrl, 'رابط إنستغرام'],
    [config.googleMapsUrl, 'رابط خرائط جوجل'],
    [config.partnerFacebookUrl, 'رابط فيسبوك Infinity Corp'],
  ];

  for (const [val, label] of urlChecks) {
    if (!isValidOptionalHttpUrl(val)) {
      errors.push(`${label} غير صالح؛ يجب أن يبدأ بـ https:// أو http://.`);
    }
  }

  if (config.contactChannels.length > MAX_CONTACT_CHANNELS) {
    errors.push(`الحد الأقصى لقنوات التواصل المخصصة هو ${MAX_CONTACT_CHANNELS} رقمًا.`);
  }

  for (const ch of config.contactChannels) {
    if (!(ch.label || '').trim()) {
      errors.push('يرجى إدخال مسمى توضيحي لكل رقم تواصل مضاف.');
      break;
    }
    if (!isValidPhoneNumber(ch.phone)) {
      errors.push(`رقم التواصل في "${ch.label}" غير صالح.`);
      break;
    }
    if (!isValidOptionalHttpUrl(ch.whatsappUrl)) {
      errors.push(`رابط واتساب في "${ch.label}" غير صالح.`);
      break;
    }
  }

  if (config.branches.length > MAX_BRANCHES) {
    errors.push(`الحد الأقصى للفروع والمواقع هو ${MAX_BRANCHES} فروع.`);
  }

  for (const br of config.branches) {
    if (!(br.name || '').trim() || !(br.address || '').trim()) {
      errors.push('يرجى إدخال اسم الفرع وعنوانه لكل فرع مضاف.');
      break;
    }
    if ((br.name || '').trim().length > 120 || (br.address || '').trim().length > 1000) {
      errors.push(`بيانات الفرع "${br.name}" تتجاوز الحد الأقصى المسموح به للنص.`);
      break;
    }
    if ((br.workingHours || '').trim().length > 300 || (br.phone || '').trim().length > 30) {
      errors.push(`مواعيد العمل أو الهاتف في فرع "${br.name}" تتجاوز الحد المسموح به.`);
      break;
    }
    if (!isValidOptionalHttpUrl(br.mapUrl)) {
      errors.push(`رابط الخريطة في فرع "${br.name}" غير صالح.`);
      break;
    }
  }

  if ((config.socialLinks || []).length > MAX_SOCIAL_LINKS) {
    errors.push(`الحد الأقصى لروابط التواصل الإضافية هو ${MAX_SOCIAL_LINKS} رابطًا.`);
  }

  for (const sl of config.socialLinks || []) {
    if (!(sl.label || '').trim()) {
      errors.push('يرجى إدخال اسم أو عنوان لكل رابط تواصل اجتماعي مضاف.');
      break;
    }
    if (!(sl.url || '').trim() || !isValidOptionalHttpUrl(sl.url)) {
      errors.push(`رابط المنصة "${sl.label}" غير صالح؛ يجب أن يبدأ بـ https:// أو http://.`);
      break;
    }
  }

  const rawCategories = config.categories || [];
  if (rawCategories.length < 1 || rawCategories.length > MAX_CATEGORIES) {
    errors.push(`يجب أن يحتوي الموقع على قسم واحد على الأقل وحتى ${MAX_CATEGORIES} قسمًا.`);
  } else {
    const seenIds = new Set<string>();
    for (const cat of rawCategories) {
      const catId = (cat.id || '').trim();
      const catName = (cat.name || '').trim();
      if (!catId || catId.length > 60 || !SAFE_ID_REGEX.test(catId)) {
        errors.push('معرّف أحد الأقسام غير صالح.');
        break;
      }
      if (seenIds.has(catId)) {
        errors.push(`يوجد تكرار في معرّف القسم (${catId}).`);
        break;
      }
      seenIds.add(catId);
      if (catName.length < 2 || catName.length > 80) {
        errors.push('اسم كل قسم يجب أن يكون بين حرفين و80 حرفًا.');
        break;
      }
    }
  }

  const rawEssential = config.essentialCategories || [];
  if (rawEssential.length > 20) {
    errors.push('الحد الأقصى لفئات المنتجات الأساسية هو 20 فئة.');
  } else {
    const seenEssIds = new Set<string>();
    for (const item of rawEssential) {
      const essId = (item.id || '').trim();
      const essName = (item.name || '').trim();
      if (!essId || essId.length > 60 || !SAFE_ID_REGEX.test(essId)) {
        errors.push('معرّف إحدى الفئات الأساسية غير صالح.');
        break;
      }
      if (seenEssIds.has(essId)) {
        errors.push(`يوجد تكرار في معرّف الفئة الأساسية (${essId}).`);
        break;
      }
      seenEssIds.add(essId);
      if (essName.length < 2 || essName.length > 80) {
        errors.push('اسم كل فئة أساسية يجب أن يكون بين حرفين و80 حرفًا.');
        break;
      }
      if (item.imageUrl && !isValidOptionalHttpUrl(item.imageUrl)) {
        errors.push(`رابط صورة الفئة "${essName}" غير صالح.`);
        break;
      }
    }
  }

  if (estimateJsonUtf8Bytes(config) > MAX_FIRESTORE_DOC_SAFE_BYTES) {
    errors.push(
      'حجم بيانات إعدادات الموقع يتجاوز الحد الأقصى المسموح به لمستند Cloud Firestore (1 ميجابايت).'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function sanitizeSiteConfig(input: Partial<SiteConfig>, updatedBy = 'admin'): SiteConfig {
  const merged: SiteConfig = {
    ...DEFAULT_SITE_CONFIG,
    ...input,
  };

  const cleanStr = (val: unknown, fallback: string, maxLen: number, minLen = 0): string => {
    const candidate = typeof val === 'string' ? val.trim() : fallback.trim();
    const effective = candidate.length >= minLen ? candidate : fallback.trim();
    return effective.slice(0, maxLen);
  };

  const rawChannels = Array.isArray(input.contactChannels)
    ? input.contactChannels
    : DEFAULT_SITE_CONFIG.contactChannels;

  const contactChannels: ContactChannelItem[] = rawChannels
    .slice(0, MAX_CONTACT_CHANNELS)
    .map((ch, idx) => {
      const safeId =
        typeof ch?.id === 'string' && SAFE_ID_REGEX.test(ch.id.trim())
          ? ch.id.trim().slice(0, 64)
          : `ch-${idx + 1}`;
      const role: ContactChannelRole =
        ch?.role && ['orders', 'maintenance', 'after_sales', 'support', 'general'].includes(ch.role)
          ? ch.role
          : 'general';
      const owner: ContactChannelOwner = ch?.owner === 'partner' ? 'partner' : 'store';
      const phone = cleanStr(ch?.phone, STORE_INFO.primaryPhone, 30, 7);
      const rawWaUrl = cleanStr(
        ch?.whatsappUrl,
        buildWhatsAppLinkFromPhone(phone),
        600,
        0
      );
      return {
        id: safeId,
        label: cleanStr(ch?.label, CONTACT_ROLE_LABELS[role], 120, 1),
        role,
        owner,
        phone,
        whatsappUrl: isValidOptionalHttpUrl(rawWaUrl) ? rawWaUrl : buildWhatsAppLinkFromPhone(phone),
      };
    });

  const rawBranches = Array.isArray(input.branches)
    ? input.branches
    : DEFAULT_SITE_CONFIG.branches;

  const branches: BranchLocationItem[] = rawBranches.slice(0, MAX_BRANCHES).map((br, idx) => {
    const safeId =
      typeof br?.id === 'string' && SAFE_ID_REGEX.test(br.id.trim())
        ? br.id.trim().slice(0, 64)
        : `branch-${idx + 1}`;
    const rawMapUrl = cleanStr(br?.mapUrl, OFFICIAL_GOOGLE_MAPS_URL, 600, 0);
    const safeBranchMapUrl =
      !rawMapUrl || rawMapUrl.includes('27.9158') || rawMapUrl.includes('maps.google.com/?q=')
        ? OFFICIAL_GOOGLE_MAPS_URL
        : isValidOptionalHttpUrl(rawMapUrl)
        ? rawMapUrl
        : OFFICIAL_GOOGLE_MAPS_URL;
    return {
      id: safeId,
      name: cleanStr(br?.name, 'فرع المحلاوي ستور', 120, 1),
      address: cleanStr(br?.address, STORE_INFO.address, 1000, 1),
      mapUrl: safeBranchMapUrl,
      workingHours: cleanStr(br?.workingHours, '', 300, 0),
      phone: cleanStr(br?.phone, '', 30, 0),
    };
  });

  const allowedPlatforms: SocialPlatform[] = [
    'facebook',
    'instagram',
    'tiktok',
    'youtube',
    'telegram',
    'x',
    'website',
    'other',
  ];
  const rawSocialLinks = Array.isArray(input.socialLinks)
    ? input.socialLinks
    : DEFAULT_SITE_CONFIG.socialLinks;

  const socialLinks: SocialLinkItem[] = rawSocialLinks
    .slice(0, MAX_SOCIAL_LINKS)
    .map((sl, idx) => {
      const safeId =
        typeof sl?.id === 'string' && SAFE_ID_REGEX.test(sl.id.trim())
          ? sl.id.trim().slice(0, 64)
          : `social-${idx + 1}`;
      const platform: SocialPlatform =
        sl?.platform && allowedPlatforms.includes(sl.platform) ? sl.platform : 'other';
      const owner: ContactChannelOwner = sl?.owner === 'partner' ? 'partner' : 'store';
      const url = cleanStr(sl?.url, '', 600, 0);
      return {
        id: safeId,
        platform,
        label: cleanStr(sl?.label, SOCIAL_PLATFORM_LABELS[platform], 120, 1),
        owner,
        url,
      };
    })
    .filter((sl) => sl.url.length > 0 && isValidOptionalHttpUrl(sl.url));

  const rawCategories =
    Array.isArray(input.categories) && input.categories.length > 0
      ? input.categories
      : DEFAULT_SITE_CONFIG.categories;

  const seenCategoryIds = new Set<string>();
  const sanitizedCategories: StoreCategoryItem[] = [];
  for (let idx = 0; idx < rawCategories.length && sanitizedCategories.length < MAX_CATEGORIES; idx += 1) {
    const cat = rawCategories[idx];
    const safeId =
      typeof cat?.id === 'string' && SAFE_ID_REGEX.test(cat.id.trim())
        ? cat.id.trim().slice(0, 60)
        : `cat-${idx + 1}`;
    if (seenCategoryIds.has(safeId)) continue;
    seenCategoryIds.add(safeId);

    const defaultMatch = PRODUCT_CATEGORIES.find((d) => d.id === safeId);
    const fallbackName = defaultMatch?.name || `قسم ${idx + 1}`;
    const safeName = cleanStr(cat?.name, fallbackName, 80, 2);
    const rawOrder =
      typeof cat?.order === 'number' && Number.isFinite(cat.order)
        ? Math.round(cat.order)
        : idx + 1;
    const safeOrder = Math.min(100, Math.max(1, rawOrder));

    sanitizedCategories.push({
      id: safeId,
      name: safeName,
      order: safeOrder,
    });
  }

  sanitizedCategories.sort((a, b) => a.order - b.order);
  const categories: StoreCategoryItem[] =
    sanitizedCategories.length > 0
      ? sanitizedCategories.map((c, idx) => ({ ...c, order: idx + 1 }))
      : DEFAULT_SITE_CONFIG.categories.map((c) => ({ ...c }));

  const rawEssential =
    Array.isArray(input.essentialCategories) && input.essentialCategories.length > 0
      ? input.essentialCategories
      : DEFAULT_SITE_CONFIG.essentialCategories;

  const seenEssentialIds = new Set<string>();
  const sanitizedEssential: EssentialCategoryItem[] = [];
  for (let idx = 0; idx < rawEssential.length && sanitizedEssential.length < 20; idx += 1) {
    const item = rawEssential[idx];
    const safeId =
      typeof item?.id === 'string' && SAFE_ID_REGEX.test(item.id.trim())
        ? item.id.trim().slice(0, 60)
        : `ess-${idx + 1}`;
    if (seenEssentialIds.has(safeId)) continue;
    seenEssentialIds.add(safeId);

    const defaultMatch = DEFAULT_ESSENTIAL_CATEGORIES.find((d) => d.id === safeId);
    const fallbackName = defaultMatch?.name || `فئة ${idx + 1}`;
    const safeName = cleanStr(item?.name, fallbackName, 80, 2);
    const rawImg = cleanStr(item?.imageUrl, '', 600, 0);
    const safeImg = isValidOptionalHttpUrl(rawImg) ? rawImg : '';
    const rawOrder =
      typeof item?.order === 'number' && Number.isFinite(item.order)
        ? Math.round(item.order)
        : idx + 1;
    const safeOrder = Math.min(100, Math.max(1, rawOrder));

    sanitizedEssential.push({
      id: safeId,
      name: safeName,
      imageUrl: safeImg,
      order: safeOrder,
    });
  }

  sanitizedEssential.sort((a, b) => a.order - b.order);
  const essentialCategories: EssentialCategoryItem[] =
    sanitizedEssential.length > 0
      ? sanitizedEssential.map((c, idx) => ({ ...c, order: idx + 1 }))
      : DEFAULT_SITE_CONFIG.essentialCategories.map((c) => ({ ...c }));

  const primaryPhone = cleanStr(merged.primaryPhone, DEFAULT_SITE_CONFIG.primaryPhone, 30, 7);
  const rawPrimaryWhatsAppDigits = normalizeDigitsForWhatsApp(
    merged.primaryWhatsApp || primaryPhone || STORE_INFO.primaryWhatsApp
  );
  const safePrimaryWhatsApp =
    rawPrimaryWhatsAppDigits.length >= 7
      ? rawPrimaryWhatsAppDigits.slice(0, 25)
      : DEFAULT_SITE_CONFIG.primaryWhatsApp;

  const safeUpdatedBy =
    typeof updatedBy === 'string' && SAFE_ID_REGEX.test(updatedBy.trim())
      ? updatedBy.trim().slice(0, 128)
      : 'admin';

  return {
    id: 'main',
    storeName: cleanStr(merged.storeName, DEFAULT_SITE_CONFIG.storeName, 100, 2),
    storeSubtitle: cleanStr(merged.storeSubtitle, DEFAULT_SITE_CONFIG.storeSubtitle, 100, 0),
    tagline: cleanStr(merged.tagline, DEFAULT_SITE_CONFIG.tagline, 300, 0),
    heroDescription: cleanStr(merged.heroDescription, DEFAULT_SITE_CONFIG.heroDescription, 2000, 0),
    announcementText: cleanStr(merged.announcementText, '', 400, 0),
    seoTitle: cleanStr(merged.seoTitle, DEFAULT_SITE_CONFIG.seoTitle, 240, 0),
    seoDescription: cleanStr(merged.seoDescription, DEFAULT_SITE_CONFIG.seoDescription, 800, 0),
    copyrightText: cleanStr(merged.copyrightText, DEFAULT_SITE_CONFIG.copyrightText, 300, 0),

    primaryPhone,
    secondaryPhone: cleanStr(merged.secondaryPhone, '', 30, 0),
    primaryWhatsApp: safePrimaryWhatsApp,
    whatsappUrl: cleanStr(
      merged.whatsappUrl,
      `https://wa.me/${safePrimaryWhatsApp}`,
      600,
      0
    ),
    afterSalesWhatsAppUrl: cleanStr(
      merged.afterSalesWhatsAppUrl,
      DEFAULT_SITE_CONFIG.afterSalesWhatsAppUrl,
      600,
      0
    ),
    facebookUrl: cleanStr(merged.facebookUrl, DEFAULT_SITE_CONFIG.facebookUrl, 600, 0),
    instagramUrl: cleanStr(merged.instagramUrl, '', 600, 0),
    address: cleanStr(merged.address, DEFAULT_SITE_CONFIG.address, 1000, 0),
    googleMapsUrl: (() => {
      const rawUrl = cleanStr(merged.googleMapsUrl, OFFICIAL_GOOGLE_MAPS_URL, 600, 0);
      if (!rawUrl || rawUrl.includes('27.9158') || rawUrl.includes('maps.google.com/?q=')) {
        return OFFICIAL_GOOGLE_MAPS_URL;
      }
      return isValidOptionalHttpUrl(rawUrl) ? rawUrl : OFFICIAL_GOOGLE_MAPS_URL;
    })(),
    workingHours: cleanStr(merged.workingHours, DEFAULT_SITE_CONFIG.workingHours, 300, 0),
    shippingSummary: cleanStr(merged.shippingSummary, DEFAULT_SITE_CONFIG.shippingSummary, 1500, 0),
    afterSalesPolicy: cleanStr(
      merged.afterSalesPolicy,
      DEFAULT_SITE_CONFIG.afterSalesPolicy,
      2500,
      0
    ),
    closingPhrase: cleanStr(merged.closingPhrase, DEFAULT_SITE_CONFIG.closingPhrase, 300, 0),
    contactSectionTitle: cleanStr(
      merged.contactSectionTitle,
      DEFAULT_SITE_CONFIG.contactSectionTitle,
      200,
      0
    ),
    contactSectionSubtitle: cleanStr(
      merged.contactSectionSubtitle,
      DEFAULT_SITE_CONFIG.contactSectionSubtitle,
      400,
      0
    ),

    partnerName: cleanStr(merged.partnerName, DEFAULT_SITE_CONFIG.partnerName, 160, 0),
    partnerSubtitle: cleanStr(merged.partnerSubtitle, DEFAULT_SITE_CONFIG.partnerSubtitle, 200, 0),
    partnerRoleTitle: cleanStr(
      merged.partnerRoleTitle,
      DEFAULT_SITE_CONFIG.partnerRoleTitle,
      200,
      0
    ),
    partnerServiceScopeText: cleanStr(
      merged.partnerServiceScopeText,
      DEFAULT_SITE_CONFIG.partnerServiceScopeText,
      800,
      0
    ),
    partnerOrderPhone1: cleanStr(
      merged.partnerOrderPhone1,
      DEFAULT_SITE_CONFIG.partnerOrderPhone1,
      30,
      0
    ),
    partnerOrderPhone2: cleanStr(
      merged.partnerOrderPhone2,
      DEFAULT_SITE_CONFIG.partnerOrderPhone2,
      30,
      0
    ),
    partnerMaintenancePhone: cleanStr(
      merged.partnerMaintenancePhone,
      DEFAULT_SITE_CONFIG.partnerMaintenancePhone,
      30,
      0
    ),
    partnerAfterSalesPhone: cleanStr(
      merged.partnerAfterSalesPhone,
      DEFAULT_SITE_CONFIG.partnerAfterSalesPhone,
      30,
      0
    ),
    partnerFacebookUrl: cleanStr(
      merged.partnerFacebookUrl,
      DEFAULT_SITE_CONFIG.partnerFacebookUrl,
      600,
      0
    ),

    aboutHeroTitle: cleanStr(merged.aboutHeroTitle, DEFAULT_SITE_CONFIG.aboutHeroTitle, 300, 0),
    aboutHeroSubtitle: cleanStr(
      merged.aboutHeroSubtitle,
      DEFAULT_SITE_CONFIG.aboutHeroSubtitle,
      1500,
      0
    ),
    aboutStoreIntro: cleanStr(merged.aboutStoreIntro, DEFAULT_SITE_CONFIG.aboutStoreIntro, 5000, 0),
    aboutPartnerIntro: cleanStr(
      merged.aboutPartnerIntro,
      DEFAULT_SITE_CONFIG.aboutPartnerIntro,
      5000,
      0
    ),
    visionTitle: cleanStr(merged.visionTitle, DEFAULT_SITE_CONFIG.visionTitle, 300, 0),
    visionDescription: cleanStr(
      merged.visionDescription,
      DEFAULT_SITE_CONFIG.visionDescription,
      2500,
      0
    ),

    contactChannels,
    branches,
    socialLinks,
    categories,
    essentialCategories,

    showHeroSpotlight: merged.showHeroSpotlight !== false,
    showValueStrip: merged.showValueStrip !== false,
    showOffersSection: merged.showOffersSection !== false,
    showShippingSection: merged.showShippingSection !== false,
    showPartnerCard: merged.showPartnerCard !== false,
    showAboutBanner: merged.showAboutBanner !== false,
    showRatingsSection: merged.showRatingsSection !== false,

    updatedBy: safeUpdatedBy,
    updatedAt: typeof merged.updatedAt === 'string' ? merged.updatedAt : new Date().toISOString(),
  };
}

const PROTECTED_NON_EMPTY_STRING_KEYS: ReadonlyArray<keyof SiteConfig> = [
  'storeName',
  'primaryPhone',
  'primaryWhatsApp',
  'address',
  'aboutHeroTitle',
  'aboutHeroSubtitle',
  'aboutStoreIntro',
  'aboutPartnerIntro',
  'partnerName',
  'visionTitle',
  'visionDescription',
];

/**
 * Safely merges an incoming SiteConfig draft over the authoritative server document
 * (if present), preventing accidental wiping of critical store or «من نحن» fields
 * while allowing intentional updates and optional field clearing.
 */
export function mergeSafeSiteConfigForSave(
  existingServerRaw: Record<string, unknown> | null | undefined,
  incomingDraft: Partial<SiteConfig>,
  updatedBy: string
): SiteConfig {
  const baseConfig: SiteConfig =
    existingServerRaw && typeof existingServerRaw === 'object'
      ? sanitizeSiteConfig(
          existingServerRaw as Partial<SiteConfig>,
          typeof existingServerRaw.updatedBy === 'string' ? existingServerRaw.updatedBy : updatedBy
        )
      : DEFAULT_SITE_CONFIG;

  const combined: Record<string, unknown> = {
    ...baseConfig,
    ...incomingDraft,
  };

  for (const key of PROTECTED_NON_EMPTY_STRING_KEYS) {
    const incomingVal = incomingDraft[key];
    const baseVal = baseConfig[key];
    if (typeof incomingVal === 'string') {
      if (incomingVal.trim().length === 0 && typeof baseVal === 'string' && baseVal.trim().length > 0) {
        combined[key] = baseVal;
      }
    } else if (incomingVal === undefined) {
      combined[key] = baseVal;
    }
  }

  if (!Array.isArray(incomingDraft.categories) || incomingDraft.categories.length === 0) {
    combined.categories = baseConfig.categories;
  }
  if (!Array.isArray(incomingDraft.essentialCategories) || incomingDraft.essentialCategories.length === 0) {
    combined.essentialCategories = baseConfig.essentialCategories;
  }
  if (!Array.isArray(incomingDraft.contactChannels)) {
    combined.contactChannels = baseConfig.contactChannels;
  }
  if (!Array.isArray(incomingDraft.branches)) {
    combined.branches = baseConfig.branches;
  }
  if (!Array.isArray(incomingDraft.socialLinks)) {
    combined.socialLinks = baseConfig.socialLinks;
  }

  return sanitizeSiteConfig(combined as Partial<SiteConfig>, updatedBy);
}

/**
 * Builds a minimal, targeted Firestore `{ merge: true }` update payload containing
 * core required identity keys plus ONLY the fields that actually changed relative
 * to the existing server document (or the full sanitized document on initial creation).
 */
export function buildTargetedSiteConfigUpdateFields(
  existingServerRaw: Record<string, unknown> | null | undefined,
  nextSanitized: SiteConfig,
  updatedBy: string
): Omit<Partial<SiteConfig>, 'updatedAt'> & {
  id: 'main';
  storeName: string;
  primaryPhone: string;
  primaryWhatsApp: string;
  updatedBy: string;
} {
  if (!existingServerRaw || typeof existingServerRaw !== 'object') {
    const { updatedAt: _omitUpdatedAt, ...rest } = nextSanitized;
    void _omitUpdatedAt;
    return {
      ...rest,
      id: 'main',
      updatedBy,
    };
  }

  const targeted: Record<string, unknown> = {
    id: 'main',
    storeName: nextSanitized.storeName,
    primaryPhone: nextSanitized.primaryPhone,
    primaryWhatsApp: nextSanitized.primaryWhatsApp,
    updatedBy,
  };

  for (const [key, nextVal] of Object.entries(nextSanitized)) {
    if (key === 'id' || key === 'updatedAt' || key === 'updatedBy') continue;
    const prevVal = existingServerRaw[key];
    if (JSON.stringify(prevVal) !== JSON.stringify(nextVal)) {
      targeted[key] = nextVal;
    }
  }

  return targeted as Omit<Partial<SiteConfig>, 'updatedAt'> & {
    id: 'main';
    storeName: string;
    primaryPhone: string;
    primaryWhatsApp: string;
    updatedBy: string;
  };
}

/**
 * Builds an explicit, schema-locked 51-key Firestore document payload for `siteConfig/main`
 * with zero extra or undefined keys—matching the working `buildFirestoreProductRecord` pattern.
 */
export function buildFirestoreSiteConfigPayload(
  sanitized: SiteConfig,
  updatedBy: string,
  updatedAtValue: unknown
): Record<string, unknown> {
  const clean = sanitizeSiteConfig(sanitized, updatedBy);
  return {
    id: 'main',
    storeName: clean.storeName,
    storeSubtitle: clean.storeSubtitle,
    tagline: clean.tagline,
    heroDescription: clean.heroDescription,
    announcementText: clean.announcementText,
    seoTitle: clean.seoTitle,
    seoDescription: clean.seoDescription,
    copyrightText: clean.copyrightText,
    primaryPhone: clean.primaryPhone,
    secondaryPhone: clean.secondaryPhone,
    primaryWhatsApp: clean.primaryWhatsApp,
    whatsappUrl: clean.whatsappUrl,
    afterSalesWhatsAppUrl: clean.afterSalesWhatsAppUrl,
    facebookUrl: clean.facebookUrl,
    instagramUrl: clean.instagramUrl,
    address: clean.address,
    googleMapsUrl: clean.googleMapsUrl,
    workingHours: clean.workingHours,
    shippingSummary: clean.shippingSummary,
    afterSalesPolicy: clean.afterSalesPolicy,
    closingPhrase: clean.closingPhrase,
    contactSectionTitle: clean.contactSectionTitle,
    contactSectionSubtitle: clean.contactSectionSubtitle,
    partnerName: clean.partnerName,
    partnerSubtitle: clean.partnerSubtitle,
    partnerRoleTitle: clean.partnerRoleTitle,
    partnerServiceScopeText: clean.partnerServiceScopeText,
    partnerOrderPhone1: clean.partnerOrderPhone1,
    partnerOrderPhone2: clean.partnerOrderPhone2,
    partnerMaintenancePhone: clean.partnerMaintenancePhone,
    partnerAfterSalesPhone: clean.partnerAfterSalesPhone,
    partnerFacebookUrl: clean.partnerFacebookUrl,
    aboutHeroTitle: clean.aboutHeroTitle,
    aboutHeroSubtitle: clean.aboutHeroSubtitle,
    aboutStoreIntro: clean.aboutStoreIntro,
    aboutPartnerIntro: clean.aboutPartnerIntro,
    visionTitle: clean.visionTitle,
    visionDescription: clean.visionDescription,
    contactChannels: clean.contactChannels.map((ch) => ({
      id: ch.id,
      label: ch.label,
      role: ch.role,
      owner: ch.owner,
      phone: ch.phone,
      whatsappUrl: ch.whatsappUrl,
    })),
    branches: clean.branches.map((br) => ({
      id: br.id,
      name: br.name,
      address: br.address,
      mapUrl: br.mapUrl,
      workingHours: br.workingHours,
      phone: br.phone,
    })),
    socialLinks: clean.socialLinks.map((sl) => ({
      id: sl.id,
      platform: sl.platform,
      label: sl.label,
      owner: sl.owner,
      url: sl.url,
    })),
    categories: clean.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      order: cat.order,
    })),
    essentialCategories: clean.essentialCategories.map((item) => ({
      id: item.id,
      name: item.name,
      imageUrl: item.imageUrl,
      order: item.order,
    })),
    showHeroSpotlight: Boolean(clean.showHeroSpotlight),
    showValueStrip: Boolean(clean.showValueStrip),
    showOffersSection: Boolean(clean.showOffersSection),
    showShippingSection: Boolean(clean.showShippingSection),
    showPartnerCard: Boolean(clean.showPartnerCard),
    showAboutBanner: Boolean(clean.showAboutBanner),
    updatedBy: clean.updatedBy,
    updatedAt: updatedAtValue,
  };
}


