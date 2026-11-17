import { Check, Heart, Share2, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Product } from '../../types/store';
import { useAddToCartButton, useCart } from '../../contexts/CartContext';
import {
  buildProductShareUrl,
  formatPriceEgp,
  getEffectiveProductPrice,
  isDiscountActive,
} from '../../utils/catalogLogic';
import { buildProductImageAlt } from '../../utils/seo';
import { ProductImage } from '../ProductImage';
import { DiscountCountdownBadge } from '../DiscountCountdownBadge';

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
  const { isFavorite: checkIsFavorite, toggleFavorite } = useCart();
  const { justAdded, triggerAdd } = useAddToCartButton();
  const [copied, setCopied] = useState(false);

  const isFavorite = checkIsFavorite(product.id);
  const hasDiscount = isDiscountActive(product);
  const effectivePrice = getEffectiveProductPrice(product);

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
    } catch {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {}
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerAdd(product, {
      selectedOption: product.options[0] || '',
      quantity: 1,
    });
  };

  const handleToggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  return (
    <article className="flex h-full flex-col justify-between rounded-2xl bg-white dark:bg-[#0E264A] border border-[#D8EEFB] dark:border-[#1E3F73] p-2.5 shadow-[0_2px_10px_rgba(11,31,58,0.03)]">
      <div>
        <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#F2FAFF] dark:bg-[#081830]">
          <button
            type="button"
            onClick={() => onOpenDetails(product)}
            aria-label={`عرض تفاصيل ${product.name}`}
            className="block h-full w-full p-2 text-right focus-visible:outline-2 focus-visible:outline-[#1D4ED8] cursor-pointer"
          >
            {hasDiscount && (
              <DiscountCountdownBadge
                product={product}
                variant="compact"
                className="absolute top-2 right-2 z-20 max-w-[85%]"
              />
            )}

            <ProductImage
              src={product.images[0]}
              alt={buildProductImageAlt(product)}
              containerClassName="h-full w-full rounded-lg bg-[#F2FAFF] dark:bg-[#081830]"
              className="max-h-full max-w-full"
            />
          </button>

          {/* Favorite Button */}
          <button
            type="button"
            onClick={handleToggleFav}
            title="إضافة للمفضلة"
            className={`absolute top-2 left-2 z-25 flex h-8 w-8 items-center justify-center rounded-lg border shadow-xs transition-all active:scale-90 cursor-pointer ${
              isFavorite
                ? 'bg-rose-500 border-rose-500 text-white'
                : 'bg-white/90 dark:bg-[#0E264A]/90 border-white dark:border-[#1E3F73] text-rose-500'
            }`}
          >
            <Heart className={`h-3.5 w-3.5 ${isFavorite ? 'fill-white' : ''}`} />
          </button>

          {/* Quick Share Button */}
          <button
            type="button"
            onClick={handleShare}
            title="مشاركة الرابط"
            className={`absolute bottom-2 left-2 z-20 flex h-8 w-8 items-center justify-center rounded-lg border shadow-xs transition-all active:scale-90 cursor-pointer ${
              copied
                ? 'bg-emerald-500 border-emerald-500 text-white'
                : 'bg-white/90 dark:bg-[#0E264A]/90 border-white dark:border-[#1E3F73] text-[#0284C7] dark:text-[#38BDF8]'
            }`}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
          </button>
        </div>

        {(product.brand || !product.inStock) && (
          <p className="mt-2 truncate text-[11px] font-semibold text-[#0284C7] dark:text-[#38BDF8]">
            {product.brand}
            {product.brand && !product.inStock ? ' · ' : ''}
            {!product.inStock ? 'غير متوفر حاليًا' : ''}
          </p>
        )}

        <h3 className="mt-0.5 text-[13px] min-[390px]:text-sm font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF] leading-snug line-clamp-2">
          <a
            href={`/product/${encodeURIComponent(product.id)}`}
            onClick={(e) => {
              if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
              e.preventDefault();
              onOpenDetails(product);
            }}
            className="block w-full text-right cursor-pointer"
          >
            {product.name}
          </a>
        </h3>

        <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-300 leading-relaxed line-clamp-2">
          {product.shortDescription || product.description}
        </p>
      </div>

      <div className="mt-2.5 pt-2 border-t border-[#EBF6FE] dark:border-[#1E3F73]">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="font-num text-[15px] min-[390px]:text-base font-extrabold text-[#1D4ED8] dark:text-[#38BDF8]">
            {formatPriceEgp(effectivePrice)}
          </span>
          <span className="text-[11px] font-bold text-[#0F294A] dark:text-[#E0F2FE]">ج.م</span>

          {hasDiscount && (
            <span className="font-num text-[11px] font-semibold text-slate-400 line-through">
              {formatPriceEgp(product.originalPrice)} ج.م
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-1.5 mt-2">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={justAdded}
            aria-label={`أضف ${product.name} إلى السلة`}
            className={`inline-flex min-h-[40px] items-center justify-center gap-1 rounded-xl px-1.5 py-2 text-[10.5px] min-[390px]:text-[11px] font-extrabold transition-all duration-150 active:scale-[0.97] whitespace-nowrap cursor-pointer ${
              justAdded
                ? 'bg-emerald-600 text-white border border-emerald-600 shadow-xs'
                : 'bg-[#F2FAFF] dark:bg-[#081830] border border-[#CBE7FA] dark:border-[#1E3F73] text-[#0F294A] dark:text-[#E0F2FE]'
            }`}
          >
            {justAdded ? (
              <Check className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <ShoppingCart className="h-3.5 w-3.5 shrink-0 text-[#0284C7] dark:text-[#38BDF8]" aria-hidden="true" />
            )}
            <span>{justAdded ? 'تمت الإضافة' : 'أضف إلى السلة'}</span>
          </button>

          <button
            type="button"
            onClick={() => onOrderProduct(product)}
            aria-label={`طلب المنتج ${product.name}`}
            className="inline-flex min-h-[40px] items-center justify-center gap-1 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] active:scale-[0.98] px-2 py-2 text-[11px] font-extrabold text-white transition-all cursor-pointer"
          >
            <span>طلب واتساب</span>
          </button>
        </div>
      </div>
    </article>
  );
}
