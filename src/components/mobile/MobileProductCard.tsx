import { Check, Share2, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import { Product } from '../../types/store';
import {
  buildProductShareUrl,
  calculateDiscountPercent,
  formatPriceEgp,
  getEffectiveProductPrice,
  isDiscountActive,
} from '../../utils/catalogLogic';
import { ProductImage } from '../ProductImage';

interface MobileProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
  onOrderProduct: (product: Product) => void;
  publicOrigin?: string;
}

export function MobileProductCard({
  product,
  onOpenDetails,
  onOrderProduct,
  publicOrigin,
}: MobileProductCardProps) {
  const [copied, setCopied] = useState(false);
  const hasDiscount = isDiscountActive(product);
  const effectivePrice = getEffectiveProductPrice(product);
  const discountPct = hasDiscount
    ? calculateDiscountPercent(product.originalPrice, effectivePrice)
    : 0;

  const shareUrl = buildProductShareUrl(product.id, publicOrigin);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.share) {
        await navigator.share({
          title: product.name,
          text: product.shortDescription || product.description,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Ignore
        }
      }
    }
  };

  return (
    <article className="flex h-full flex-col justify-between rounded-2xl bg-white dark:bg-[#0E264A] border border-[#D8EEFB] dark:border-[#1E3F73] p-2.5 shadow-[0_2px_10px_rgba(11,31,58,0.03)]">
      <div>
        {/* Fixed Aspect-Ratio Uncropped Product Image */}
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#F2FAFF] dark:bg-[#081830]">
          <button
            type="button"
            onClick={() => onOpenDetails(product)}
            aria-label={`عرض تفاصيل ${product.name}`}
            className="block h-full w-full p-2 text-right focus-visible:outline-2 focus-visible:outline-[#1D4ED8] cursor-pointer"
          >
            {hasDiscount && (
              <span className="font-num absolute top-2 right-2 z-20 rounded-md bg-[#0B2354] dark:bg-[#1D4ED8] px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                -{discountPct}%
              </span>
            )}

            <ProductImage
              src={product.images[0]}
              alt={product.name}
              containerClassName="h-full w-full rounded-lg bg-[#F2FAFF] dark:bg-[#081830]"
              className="max-h-full max-w-full"
            />
          </button>

          {/* Quick Share Button in Image Area */}
          <button
            type="button"
            onClick={handleShare}
            title="مشاركة الرابط"
            className={`absolute bottom-2 left-2 z-20 flex h-8 w-8 items-center justify-center rounded-lg border shadow-xs transition-all duration-200 active:scale-90 cursor-pointer ${
              copied
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'bg-white/90 dark:bg-[#0E264A]/90 border-white dark:border-[#1E3F73] text-[#0284C7] dark:text-[#38BDF8]'
            }`}
          >
            {copied ? (
              <Check className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Unboxed Brand & Availability */}
        {(product.brand || !product.inStock) && (
          <p className="mt-2 truncate text-[11px] font-semibold text-[#0284C7] dark:text-[#38BDF8]">
            {product.brand}
            {product.brand && !product.inStock ? ' · ' : ''}
            {!product.inStock ? 'غير متوفر حاليًا' : ''}
          </p>
        )}

        {/* Product Name (Clamped to 2 Lines) */}
        <button
          type="button"
          onClick={() => onOpenDetails(product)}
          className="mt-0.5 block w-full text-right focus-visible:outline-2 focus-visible:outline-[#1D4ED8] rounded cursor-pointer"
        >
          <h3 className="text-[13px] min-[390px]:text-sm font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF] leading-snug line-clamp-2">
            {product.name}
          </h3>
        </button>

        {/* Short Clamped Description so Long Text Never Stretches Cards */}
        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-300 leading-relaxed line-clamp-2">
          {product.shortDescription || product.description}
        </p>
      </div>

      {/* Price & Primary Order Button */}
      <div className="mt-2.5 pt-2 border-t border-[#EBF6FE] dark:border-[#1E3F73]">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="font-num text-[15px] min-[390px]:text-base font-extrabold text-[#1D4ED8] dark:text-[#38BDF8]">
            {formatPriceEgp(effectivePrice)}
          </span>
          <span className="text-[11px] font-bold text-[#0F294A] dark:text-[#E0F2FE]">ج.م</span>

          {hasDiscount && (
            <span className="font-num text-[11px] font-semibold text-slate-400 dark:text-slate-400 line-through">
              {formatPriceEgp(product.originalPrice)} ج.م
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onOrderProduct(product)}
          aria-label={`طلب المنتج ${product.name}`}
          className="mt-2 inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-[0.98] px-3 py-2 text-xs font-extrabold text-white transition-all whitespace-nowrap cursor-pointer"
        >
          <ShoppingBag className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>طلب المنتج</span>
        </button>
      </div>
    </article>
  );
}

