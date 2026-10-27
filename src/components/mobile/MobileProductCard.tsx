import { ShoppingBag } from 'lucide-react';
import { Product } from '../../types/store';
import {
  calculateDiscountPercent,
  formatPriceEgp,
  isDiscountActive,
} from '../../utils/catalogLogic';
import { ProductImage } from '../ProductImage';

interface MobileProductCardProps {
  product: Product;
  onOpenDetails: (product: Product) => void;
  onOrderProduct: (product: Product) => void;
}

export function MobileProductCard({
  product,
  onOpenDetails,
  onOrderProduct,
}: MobileProductCardProps) {
  const hasDiscount = isDiscountActive(product);
  const discountPct = hasDiscount
    ? calculateDiscountPercent(product.originalPrice, product.price)
    : 0;

  return (
    <article className="flex h-full flex-col justify-between rounded-2xl bg-white border border-[#D8EEFB] p-2.5 shadow-[0_2px_10px_rgba(11,31,58,0.03)]">
      <div>
        {/* Fixed Aspect-Ratio Uncropped Product Image */}
        <button
          type="button"
          onClick={() => onOpenDetails(product)}
          aria-label={`عرض تفاصيل ${product.name}`}
          className="relative block aspect-square w-full overflow-hidden rounded-xl bg-[#F2FAFF] p-2 text-right focus-visible:outline-2 focus-visible:outline-[#1D4ED8] cursor-pointer"
        >
          {hasDiscount && (
            <span className="font-num absolute top-2 right-2 z-20 rounded-md bg-[#0B2354] px-1.5 py-0.5 text-[10px] font-extrabold text-white">
              -{discountPct}%
            </span>
          )}

          <ProductImage
            src={product.images[0]}
            alt={product.name}
            containerClassName="h-full w-full rounded-lg bg-[#F2FAFF]"
            className="max-h-full max-w-full"
          />
        </button>

        {/* Unboxed Brand & Availability */}
        <p className="mt-2 truncate text-[11px] font-semibold text-[#0284C7]">
          {product.brand}
          {!product.inStock ? ' · غير متوفر حاليًا' : ''}
        </p>

        {/* Product Name (Clamped to 2 Lines) */}
        <button
          type="button"
          onClick={() => onOpenDetails(product)}
          className="mt-0.5 block w-full text-right focus-visible:outline-2 focus-visible:outline-[#1D4ED8] rounded cursor-pointer"
        >
          <h3 className="text-[13px] min-[390px]:text-sm font-extrabold text-[#0B1F3A] leading-snug line-clamp-2">
            {product.name}
          </h3>
        </button>

        {/* Short Clamped Description so Long Text Never Stretches Cards */}
        <p className="mt-1 text-[11px] text-slate-500 leading-relaxed line-clamp-2">
          {product.shortDescription || product.description}
        </p>
      </div>

      {/* Price & Primary Order Button */}
      <div className="mt-2.5 pt-2 border-t border-[#EBF6FE]">
        <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
          <span className="font-num text-[15px] min-[390px]:text-base font-extrabold text-[#1D4ED8]">
            {formatPriceEgp(product.price)}
          </span>
          <span className="text-[11px] font-bold text-[#0F294A]">ج.م</span>

          {hasDiscount && (
            <span className="font-num text-[11px] font-semibold text-slate-400 line-through">
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
