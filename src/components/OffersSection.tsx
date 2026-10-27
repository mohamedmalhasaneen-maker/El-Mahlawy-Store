import { Eye, MessageCircle } from 'lucide-react';
import { Product } from '../types/store';
import {
  buildWhatsAppOrderUrl,
  calculateDiscountPercent,
  calculateSavingsAmount,
  formatPriceEgp,
  getDiscountedProducts,
} from '../utils/catalogLogic';
import { ProductImage } from './ProductImage';

interface OffersSectionProps {
  products: Product[];
  onViewDetails: (product: Product) => void;
  publicOrigin?: string;
}

export function OffersSection({ products, onViewDetails, publicOrigin }: OffersSectionProps) {
  const discountedProducts = getDiscountedProducts(products);

  if (discountedProducts.length === 0) {
    return null;
  }

  return (
    <section
      id="offers-section"
      aria-labelledby="offers-heading"
      className="bg-[#F2FAFF] border-b border-[#D8EEFB] py-12 sm:py-16"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs sm:text-sm font-bold text-[#0284C7] mb-1.5">
              تخفيضات حصرية ومحدثة تلقائيًا
            </p>
            <h2
              id="offers-heading"
              className="text-2xl sm:text-3xl font-extrabold text-[#0B1F3A]"
              style={{ textWrap: 'balance' }}
            >
              عروض وخصومات المحلاوي ستور
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 max-w-md">
            جميع المنتجات المعروضة هنا مفعّل عليها خصم مباشر الآن — اطلب عبر واتساب بالسعر المخفّض
            فورًا.
          </p>
        </div>

        {/* Discounted Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:gap-6">
          {discountedProducts.map((product) => {
            const discountPct = calculateDiscountPercent(product.originalPrice, product.price);
            const savings = calculateSavingsAmount(product.originalPrice, product.price);
            const whatsappUrl = buildWhatsAppOrderUrl({
              product,
              selectedOption: product.options[0],
              quantity: 1,
              baseOrigin: publicOrigin,
            });

            return (
              <article
                key={product.id}
                className="flex flex-col sm:flex-row items-stretch rounded-2xl bg-white border border-[#CBE7FA] overflow-hidden transition-transform duration-200 hover:-translate-y-0.5 hover:border-[#38BDF8]"
              >
                {/* Offer Image */}
                <div
                  onClick={() => onViewDetails(product)}
                  role="presentation"
                  className="relative sm:w-52 shrink-0 cursor-pointer bg-[#F7FCFF] border-b sm:border-b-0 sm:border-l border-[#E4F3FC]"
                >
                  <span className="absolute top-3 right-3 z-20 inline-flex items-center gap-1 rounded-lg bg-[#0284C7] px-2.5 py-1 text-xs font-extrabold text-white">
                    <span>
                      خصم <bdi className="font-num">{discountPct}%</bdi>
                    </span>
                  </span>

                  <ProductImage
                    src={product.images[0]}
                    alt={product.name}
                    showPedestalHalo={true}
                    containerClassName="h-56 sm:h-full w-full p-2.5 bg-[#F7FCFF]"
                    className=""
                  />
                </div>

                {/* Offer Content */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <p className="text-xs font-semibold text-[#0284C7] mb-1">
                      {product.brand} · وفّر <span className="font-num">{formatPriceEgp(savings)}</span> ج.م
                    </p>
                    <h3 className="text-base sm:text-lg font-extrabold text-[#0B1F3A] leading-snug mb-2">
                      <button
                        type="button"
                        onClick={() => onViewDetails(product)}
                        className="text-right hover:text-[#1D4ED8] transition-colors cursor-pointer"
                      >
                        {product.name}
                      </button>
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 mb-4">
                      {product.shortDescription}
                    </p>
                  </div>

                  <div>
                    {/* Before & After Price Comparison */}
                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-[#EBF6FE] pt-3 mb-3.5">
                      <div>
                        <span className="block text-[11px] text-slate-500">السعر بعد الخصم</span>
                        <span className="font-num text-xl sm:text-2xl font-extrabold text-[#1D4ED8]">
                          {formatPriceEgp(product.price)}{' '}
                          <span className="text-xs font-bold text-[#0F294A]">ج.م</span>
                        </span>
                      </div>

                      <div className="text-left">
                        <span className="block text-[11px] text-slate-400">السعر قبل الخصم</span>
                        <span className="font-num text-sm font-semibold text-slate-400 line-through">
                          {formatPriceEgp(product.originalPrice)} ج.م
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`طلب العرض عبر واتساب: ${product.name}`}
                        className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] px-4 py-2 text-xs sm:text-sm font-bold text-white transition-colors whitespace-nowrap shrink-0"
                      >
                        <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>طلب العرض</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => onViewDetails(product)}
                        aria-label={`تفاصيل العرض: ${product.name}`}
                        className="inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-[#F2FAFF] hover:bg-[#E2F3FE] border border-[#CBE7FA] px-3.5 py-2 text-xs sm:text-sm font-bold text-[#0F294A] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Eye className="h-4 w-4 text-[#0284C7]" aria-hidden="true" />
                        <span>التفاصيل</span>
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
