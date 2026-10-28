import { PARTNER_INFO, STORE_INFO, ValidationResult } from '../types/store';

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

  // 6. Section Visibility Toggles
  showHeroSpotlight: boolean;
  showValueStrip: boolean;
  showOffersSection: boolean;
  showShippingSection: boolean;
  showPartnerCard: boolean;
  showAboutBanner: boolean;

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
  googleMapsUrl: 'https://maps.google.com/?q=27.9158,34.3300',
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
      mapUrl: 'https://maps.google.com/?q=27.9158,34.3300',
      workingHours: 'يوميًا من 10:00 صباحًا حتى 11:00 مساءً',
      phone: STORE_INFO.primaryPhone,
    },
  ],

  socialLinks: [],

  showHeroSpotlight: true,
  showValueStrip: true,
  showOffersSection: true,
  showShippingSection: true,
  showPartnerCard: true,
  showAboutBanner: true,

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
  if (whatsAppDigits.length < 8 || whatsAppDigits.length > 16) {
    errors.push('رقم واتساب الأساسي للطلبات غير صالح (مثال: 201210141187).');
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

  const cleanStr = (val: unknown, fallback: string, maxLen: number): string => {
    const str = typeof val === 'string' ? val.trim() : fallback;
    return str.slice(0, maxLen);
  };

  const rawChannels = Array.isArray(input.contactChannels)
    ? input.contactChannels
    : DEFAULT_SITE_CONFIG.contactChannels;

  const contactChannels: ContactChannelItem[] = rawChannels
    .slice(0, MAX_CONTACT_CHANNELS)
    .map((ch, idx) => {
      const safeId =
        typeof ch?.id === 'string' && SAFE_ID_REGEX.test(ch.id)
          ? ch.id.slice(0, 64)
          : `ch-${idx + 1}`;
      const role: ContactChannelRole =
        ch?.role && ['orders', 'maintenance', 'after_sales', 'support', 'general'].includes(ch.role)
          ? ch.role
          : 'general';
      const owner: ContactChannelOwner = ch?.owner === 'partner' ? 'partner' : 'store';
      const phone = cleanStr(ch?.phone, STORE_INFO.primaryPhone, 30);
      const whatsappUrl = cleanStr(
        ch?.whatsappUrl,
        buildWhatsAppLinkFromPhone(phone),
        600
      );
      return {
        id: safeId,
        label: cleanStr(ch?.label, CONTACT_ROLE_LABELS[role], 120),
        role,
        owner,
        phone,
        whatsappUrl,
      };
    });

  const rawBranches = Array.isArray(input.branches)
    ? input.branches
    : DEFAULT_SITE_CONFIG.branches;

  const branches: BranchLocationItem[] = rawBranches.slice(0, MAX_BRANCHES).map((br, idx) => {
    const safeId =
      typeof br?.id === 'string' && SAFE_ID_REGEX.test(br.id)
        ? br.id.slice(0, 64)
        : `branch-${idx + 1}`;
    return {
      id: safeId,
      name: cleanStr(br?.name, 'فرع المحلاوي ستور', 120),
      address: cleanStr(br?.address, STORE_INFO.address, 400),
      mapUrl: cleanStr(br?.mapUrl, '', 600),
      workingHours: cleanStr(br?.workingHours, '', 160),
      phone: cleanStr(br?.phone, '', 30),
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
        typeof sl?.id === 'string' && SAFE_ID_REGEX.test(sl.id)
          ? sl.id.slice(0, 64)
          : `social-${idx + 1}`;
      const platform: SocialPlatform =
        sl?.platform && allowedPlatforms.includes(sl.platform) ? sl.platform : 'other';
      const owner: ContactChannelOwner = sl?.owner === 'partner' ? 'partner' : 'store';
      const url = cleanStr(sl?.url, '', 600);
      return {
        id: safeId,
        platform,
        label: cleanStr(sl?.label, SOCIAL_PLATFORM_LABELS[platform], 120) || SOCIAL_PLATFORM_LABELS[platform],
        owner,
        url,
      };
    })
    .filter((sl) => sl.url.length > 0 && isValidOptionalHttpUrl(sl.url));

  const primaryWhatsAppDigits = normalizeDigitsForWhatsApp(
    merged.primaryWhatsApp || merged.primaryPhone || STORE_INFO.primaryWhatsApp
  );

  return {
    id: 'main',
    storeName: cleanStr(merged.storeName, DEFAULT_SITE_CONFIG.storeName, 100) || DEFAULT_SITE_CONFIG.storeName,
    storeSubtitle: cleanStr(merged.storeSubtitle, DEFAULT_SITE_CONFIG.storeSubtitle, 100),
    tagline: cleanStr(merged.tagline, DEFAULT_SITE_CONFIG.tagline, 200),
    heroDescription: cleanStr(merged.heroDescription, DEFAULT_SITE_CONFIG.heroDescription, 600),
    announcementText: cleanStr(merged.announcementText, '', 240),
    seoTitle: cleanStr(merged.seoTitle, DEFAULT_SITE_CONFIG.seoTitle, 140),
    seoDescription: cleanStr(merged.seoDescription, DEFAULT_SITE_CONFIG.seoDescription, 400),
    copyrightText: cleanStr(merged.copyrightText, DEFAULT_SITE_CONFIG.copyrightText, 200),

    primaryPhone: cleanStr(merged.primaryPhone, DEFAULT_SITE_CONFIG.primaryPhone, 30),
    secondaryPhone: cleanStr(merged.secondaryPhone, DEFAULT_SITE_CONFIG.secondaryPhone, 30),
    primaryWhatsApp: (primaryWhatsAppDigits || DEFAULT_SITE_CONFIG.primaryWhatsApp).slice(0, 25),
    whatsappUrl: cleanStr(
      merged.whatsappUrl,
      primaryWhatsAppDigits ? `https://wa.me/${primaryWhatsAppDigits}` : DEFAULT_SITE_CONFIG.whatsappUrl,
      600
    ),
    afterSalesWhatsAppUrl: cleanStr(
      merged.afterSalesWhatsAppUrl,
      DEFAULT_SITE_CONFIG.afterSalesWhatsAppUrl,
      600
    ),
    facebookUrl: cleanStr(merged.facebookUrl, DEFAULT_SITE_CONFIG.facebookUrl, 600),
    instagramUrl: cleanStr(merged.instagramUrl, '', 600),
    address: cleanStr(merged.address, DEFAULT_SITE_CONFIG.address, 500),
    googleMapsUrl: cleanStr(merged.googleMapsUrl, DEFAULT_SITE_CONFIG.googleMapsUrl, 600),
    workingHours: cleanStr(merged.workingHours, DEFAULT_SITE_CONFIG.workingHours, 160),
    shippingSummary: cleanStr(merged.shippingSummary, DEFAULT_SITE_CONFIG.shippingSummary, 400),
    afterSalesPolicy: cleanStr(merged.afterSalesPolicy, DEFAULT_SITE_CONFIG.afterSalesPolicy, 800),
    closingPhrase: cleanStr(merged.closingPhrase, DEFAULT_SITE_CONFIG.closingPhrase, 160),
    contactSectionTitle: cleanStr(
      merged.contactSectionTitle,
      DEFAULT_SITE_CONFIG.contactSectionTitle,
      120
    ),
    contactSectionSubtitle: cleanStr(
      merged.contactSectionSubtitle,
      DEFAULT_SITE_CONFIG.contactSectionSubtitle,
      200
    ),

    partnerName: cleanStr(merged.partnerName, DEFAULT_SITE_CONFIG.partnerName, 100),
    partnerSubtitle: cleanStr(merged.partnerSubtitle, DEFAULT_SITE_CONFIG.partnerSubtitle, 120),
    partnerRoleTitle: cleanStr(merged.partnerRoleTitle, DEFAULT_SITE_CONFIG.partnerRoleTitle, 120),
    partnerServiceScopeText: cleanStr(
      merged.partnerServiceScopeText,
      DEFAULT_SITE_CONFIG.partnerServiceScopeText,
      300
    ),
    partnerOrderPhone1: cleanStr(
      merged.partnerOrderPhone1,
      DEFAULT_SITE_CONFIG.partnerOrderPhone1,
      30
    ),
    partnerOrderPhone2: cleanStr(
      merged.partnerOrderPhone2,
      DEFAULT_SITE_CONFIG.partnerOrderPhone2,
      30
    ),
    partnerMaintenancePhone: cleanStr(
      merged.partnerMaintenancePhone,
      DEFAULT_SITE_CONFIG.partnerMaintenancePhone,
      30
    ),
    partnerAfterSalesPhone: cleanStr(
      merged.partnerAfterSalesPhone,
      DEFAULT_SITE_CONFIG.partnerAfterSalesPhone,
      30
    ),
    partnerFacebookUrl: cleanStr(
      merged.partnerFacebookUrl,
      DEFAULT_SITE_CONFIG.partnerFacebookUrl,
      600
    ),

    aboutHeroTitle: cleanStr(merged.aboutHeroTitle, DEFAULT_SITE_CONFIG.aboutHeroTitle, 160),
    aboutHeroSubtitle: cleanStr(
      merged.aboutHeroSubtitle,
      DEFAULT_SITE_CONFIG.aboutHeroSubtitle,
      500
    ),
    aboutStoreIntro: cleanStr(merged.aboutStoreIntro, DEFAULT_SITE_CONFIG.aboutStoreIntro, 1200),
    aboutPartnerIntro: cleanStr(
      merged.aboutPartnerIntro,
      DEFAULT_SITE_CONFIG.aboutPartnerIntro,
      1200
    ),
    visionTitle: cleanStr(merged.visionTitle, DEFAULT_SITE_CONFIG.visionTitle, 160),
    visionDescription: cleanStr(
      merged.visionDescription,
      DEFAULT_SITE_CONFIG.visionDescription,
      800
    ),

    contactChannels,
    branches,
    socialLinks,

    showHeroSpotlight: merged.showHeroSpotlight !== false,
    showValueStrip: merged.showValueStrip !== false,
    showOffersSection: merged.showOffersSection !== false,
    showShippingSection: merged.showShippingSection !== false,
    showPartnerCard: merged.showPartnerCard !== false,
    showAboutBanner: merged.showAboutBanner !== false,

    updatedBy: (updatedBy || 'admin').slice(0, 128),
    updatedAt: typeof merged.updatedAt === 'string' ? merged.updatedAt : new Date().toISOString(),
  };
}
