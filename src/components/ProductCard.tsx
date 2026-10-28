import { Eye, MessageCircle } from 'lucide-react';
import { useSiteConfig } from '../contexts/SiteConfigContext';
import { Product } from '../types/store';
import {
  buildWhatsAppOrderUrl,
  calculateDiscountPercent,
  formatPriceEgp,
  getEffectiveProductPrice,
  isDiscountActive,
} from '../utils/catalogLogic';
import { ProductImage } from './ProductImage';

interface ProductCardProps {
  product: Product;
  onViewDetails: (product: Product) => void;
  publicOrigin?: string;
}

export function ProductCard({ product, onViewDetails, publicOrigin }: ProductCardProps) {
  const siteConfig = useSiteConfig();
  const hasDiscount = isDiscountActive(product);
  const effectivePrice = getEffectiveProductPrice(product);
  const discountPct = hasDiscount
    ? calculateDiscountPercent(product.originalPrice, effectivePrice)
    : 0;

  const whatsappUrl = buildWhatsAppOrderUrl({
    product,
    selectedOption: product.options[0],
    quantity: 1,
    baseOrigin: publicOrigin,
    whatsappNumber: siteConfig.primaryWhatsApp,
    storeName: siteConfig.storeName,
    storeSubtitle: siteConfig.storeSubtitle,
  });

  const showCategory = Boolean(product.category && product.category.trim() !== 'عام');

  return (
    <article className="group flex flex-col justify-between rounded-2xl bg-white dark:bg-[#0E264A] border border-[#D8EEFB] dark:border-[#1E3F73] transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[#7DD3FC] dark:hover:border-[#38BDF8]">
      <div>
        {/* Dedicated Light/Dark Harmonious Product Image Area */}
        <div className="relative p-3 pb-0">
          <div
            onClick={() => onViewDetails(product)}
            role="presentation"
            className="relative cursor-pointer overflow-hidden rounded-xl bg-[#F2FAFF] dark:bg-[#081830]"
          >
            {hasDiscount && (
              <span className="absolute top-3 right-3 z-20 rounded-lg bg-[#1D4ED8] px-2.5 py-1 text-xs font-bold text-white">
                خصم <bdi className="font-num">{discountPct}%</bdi>
              </span>
            )}

            {!product.inStock && (
              <span className="absolute top-3 left-3 z-20 rounded-lg bg-slate-800/90 px-2.5 py-1 text-xs font-semibold text-white">
                غير متوفر حاليًا
              </span>
            )}

            <ProductImage
              src={product.images[0]}
              alt={product.name}
              showPedestalHalo={true}
              containerClassName="aspect-square w-full p-2.5"
              className="group-hover:scale-[1.02]"
            />
          </div>
        </div>

        {/* Product Info */}
        <div className="px-5 pt-4 pb-3">
          {/* Unboxed Metadata */}
          {(product.brand || showCategory) && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0284C7] dark:text-[#38BDF8] mb-1.5">
              {product.brand && <span>{product.brand}</span>}
              {product.brand && showCategory && <span aria-hidden="true">·</span>}
              {showCategory && (
                <span className="text-slate-500 dark:text-slate-400 font-normal">
                  {product.category}
                </span>
              )}
            </div>
          )}

          <h3 className="text-base sm:text-lg font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF] leading-snug mb-2">
            <button
              type="button"
              onClick={() => onViewDetails(product)}
              className="text-right hover:text-[#1D4ED8] dark:hover:text-[#38BDF8] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1D4ED8] rounded"
            >
              {product.name}
            </button>
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2 min-h-[2.6rem]">
            {product.shortDescription || product.description}
          </p>
        </div>
      </div>

      {/* Pricing & Actions Footer */}
      <div className="px-5 pb-5 pt-2">
        <div className="flex items-baseline justify-between gap-2 border-t border-[#E8F4FD] dark:border-[#1E3F73] pt-3.5 mb-4">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-num text-xl sm:text-2xl font-extrabold text-[#1D4ED8] dark:text-[#38BDF8]">
              {formatPriceEgp(effectivePrice)}
            </span>
            <span className="text-xs font-bold text-[#0F294A] dark:text-[#E0F2FE]">ج.م</span>

            {hasDiscount && (
              <span className="font-num text-xs sm:text-sm text-slate-400 dark:text-slate-400 line-through mr-1">
                {formatPriceEgp(product.originalPrice)} ج.م
              </span>
            )}
          </div>

          <span
            className={`text-xs font-semibold ${
              product.inStock
                ? 'text-[#0284C7] dark:text-[#38BDF8]'
                : 'text-amber-700 dark:text-amber-400'
            }`}
          >
            {product.inStock ? 'متوفر' : 'نفذت الكمية'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`طلب المنتج عبر واتساب: ${product.name}`}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] px-4 py-2.5 text-xs sm:text-sm font-bold text-white transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
          >
            <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>طلب المنتج عبر واتساب</span>
          </a>

          <button
            type="button"
            onClick={() => onViewDetails(product)}
            aria-label={`عرض التفاصيل: ${product.name}`}
            className="inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl bg-[#F2FAFF] dark:bg-[#0B1F3A] hover:bg-[#E2F3FE] dark:hover:bg-[#153460] border border-[#CBE7FA] dark:border-[#1E3F73] px-4 py-2 text-xs sm:text-sm font-bold text-[#0F294A] dark:text-[#E0F2FE] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
          >
            <Eye
              className="h-4 w-4 text-[#0284C7] dark:text-[#38BDF8] shrink-0"
              aria-hidden="true"
            />
            <span>عرض التفاصيل</span>
          </button>
        </div>
      </div>
    </article>
  );
}


