export enum SortOption {
  NEWEST = 'newest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  DISCOUNT_DESC = 'discount_desc',
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export type DiscountType = 'percentage' | 'fixed';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  shortDescription: string;
  description: string;
  price: number;
  originalPrice: number;
  discountEnabled: boolean;
  discountType?: DiscountType;
  discountValue?: number;
  discountStartDate?: string;
  discountEndDate?: string;
  inStock: boolean;
  isFeatured: boolean;
  isPublished: boolean;
  images: string[];
  specs: string[];
  options: string[];
  authorUid: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormInput {
  id?: string;
  name: string;
  brand: string;
  category: string;
  shortDescription: string;
  description: string;
  price: number;
  originalPrice: number;
  discountEnabled: boolean;
  discountType?: DiscountType;
  discountValue?: number;
  discountStartDate?: string;
  discountEndDate?: string;
  inStock: boolean;
  isFeatured: boolean;
  isPublished: boolean;
  images: string[];
  specs: string[];
  options: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface StoreContactInfo {
  storeName: string;
  storeSubtitle: string;
  tagline: string;
  address: string;
  shippingSummary: string;
  afterSalesPolicy: string;
  primaryPhone: string;
  secondaryPhone: string;
  primaryWhatsApp: string;
  secondaryWhatsApp: string;
  whatsappUrl: string;
  afterSalesWhatsAppUrl: string;
  facebookUrl: string;
  closingPhrase: string;
}

export interface PartnerContactInfo {
  partnerName: string;
  partnerSubtitle: string;
  roleTitle: string;
  serviceScope: string[];
  deliveryScope: string;
  afterSalesPolicy: string;
  orderPhones: string[];
  maintenancePhone: string;
  afterSalesPhone: string;
  orderWhatsAppUrl: string;
  maintenanceWhatsAppUrl: string;
  afterSalesWhatsAppUrl: string;
  facebookUrl: string;
  closingPhrase: string;
}

export const STORE_INFO: StoreContactInfo = {
  storeName: 'المحلاوي ستور',
  storeSubtitle: 'El Mahlawy Store',
  tagline: 'منتجات متنوعة وحلول ذكية لحياة أسهل',
  address: 'جنوب سيناء – شرم الشيخ – الرويسات – مدخل 1 – شارع دستي، بجوار قسم الشرطة، الشارع الجانبي لمول الشيخ عيد، محل المحلاوي ستور.',
  shippingSummary: 'شحن متاح لجميع محافظات مصر. وتوصيل داخل شرم الشيخ من خلال خدمة الدليفري.',
  afterSalesPolicy: 'نضمن لك الدعم والمساعدة خلال فترة الضمان. إذا واجهتك أي مشكلة، يمكننا مساعدتك ومعاينة المنتج عن بُعد لتحديد المشكلة. كما تتوفر إمكانية الاستبدال أو الاسترجاع خلال 14 يومًا، بشرط أن يكون المنتج بنفس حالة الشراء، مع مراعاة شروط الاستبدال والاسترجاع المعلنة والقوانين المعمول بها.',
  primaryPhone: '01210141187',
  secondaryPhone: '01507558522',
  primaryWhatsApp: '201210141187',
  secondaryWhatsApp: '201507558522',
  whatsappUrl: 'https://wa.me/201210141187',
  afterSalesWhatsAppUrl: 'https://wa.me/201507558522',
  facebookUrl: 'https://www.facebook.com/profile.php?id=61574358801771',
  closingPhrase: 'وما تنساش تصلي على النبي ﷺ',
};

export const PARTNER_INFO: PartnerContactInfo = {
  partnerName: 'Infinity Corp',
  partnerSubtitle: 'Smart Home & Technical Solutions',
  roleTitle: 'Infinity Corp – شريك النجاح',
  serviceScope: ['شرم الشيخ', 'دهب', 'نويبع', 'طابا', 'الطور'],
  deliveryScope: 'التوصيل متاح لجميع محافظات مصر.',
  afterSalesPolicy: 'نقدم دعمًا متكاملًا خلال فترة الضمان. إذا واجهتك أي مشكلة، يمكننا تقديم المساعدة ومعاينة المنتج عن بُعد، أو إرسال فني متخصص إذا كانت المشكلة تتطلب ذلك.',
  orderPhones: ['01210141187', '01143677682'],
  maintenancePhone: '01005089640',
  afterSalesPhone: '01507558522',
  orderWhatsAppUrl: 'https://wa.me/201210141187',
  maintenanceWhatsAppUrl: 'https://wa.me/201005089640',
  afterSalesWhatsAppUrl: 'https://wa.me/201507558522',
  facebookUrl: 'https://www.facebook.com/InfinityCorp2?rdid=8XksJEQmMP0ddcZj&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F1GZfQzyJrn%2F#',
  closingPhrase: 'وما تنساش تصلي على النبي ﷺ',
};

