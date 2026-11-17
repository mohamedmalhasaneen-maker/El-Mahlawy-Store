import { useEffect, useState } from 'react';
import {
  ShoppingBag,
  ShoppingCart,
  Heart,
  X,
  Trash2,
  Plus,
  Minus,
  MessageCircle,
  WifiOff,
  Check,
  AlertTriangle,
} from 'lucide-react';
import { Product } from '../types/store';
import { useSiteConfig } from '../contexts/SiteConfigContext';
import { useCart } from '../contexts/CartContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { buildCartWhatsAppOrderUrl } from '../utils/cartLogic';
import {
  formatPriceEgp,
  getEffectiveProductPrice,
  isDiscountActive,
  roundCurrency,
} from '../utils/catalogLogic';
import { ProductImage } from './ProductImage';

interface CartAndFavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'cart' | 'favorites';
  products: Product[];
  onViewDetails: (product: Product) => void;
  publicOrigin?: string;
}

export function CartAndFavoritesDrawer({
  isOpen,
  onClose,
  initialTab = 'cart',
  products,
  onViewDetails,
}: CartAndFavoritesDrawerProps) {
  const siteConfig = useSiteConfig();
  const {
    cartItems,
    favoriteIds,
    totals,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    toggleFavorite,
  } = useCart();
  const { isOnline } = useNetworkStatus();

  const [activeTab, setActiveTab] = useState<'cart' | 'favorites'>(initialTab);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [addedFavId, setAddedFavId] = useState<string | null>(null);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!isOpen) {
      setConfirmClearOpen(false);
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const favoriteProducts = products.filter((p) => favoriteIds.includes(p.id));

  const whatsappUrl = buildCartWhatsAppOrderUrl({
    items: cartItems,
    storeName: siteConfig.storeName,
    primaryWhatsApp: siteConfig.primaryWhatsApp,
  });

  const handleConfirmClearCart = () => {
    clearCart();
    setConfirmClearOpen(false);
  };

  const handleAddFavoriteToCart = (product: Product) => {
    if (addedFavId === product.id) return;
    addToCart(product, { quantity: 1 });
    setAddedFavId(product.id);
    setTimeout(() => {
      setAddedFavId((prev) => (prev === product.id ? null : prev));
    }, 1000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="سلة المشتريات والمفضلة"
      className="fixed inset-0 z-50 flex justify-end bg-[#081A33]/60 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-drawer-rtl w-[92vw] max-w-[420px] h-full bg-white dark:bg-[#081A33] border-r border-[#D8EEFB] dark:border-[#1E3F73] flex flex-col justify-between shadow-2xl pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
        {/* Drawer Header */}
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-[#E8F4FD] dark:border-[#1E3F73] bg-[#F8FCFF] dark:bg-[#0E264A]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('cart')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'cart'
                  ? 'bg-[#1D4ED8] text-white shadow-sm'
                  : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#153460]'
              }`}
            >
              <ShoppingCart className="h-4 w-4" aria-hidden="true" />
              <span>السلة ({totals.totalQuantity})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('favorites')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'favorites'
                  ? 'bg-[#1D4ED8] text-white shadow-sm'
                  : 'bg-transparent text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#153460]'
              }`}
            >
              <Heart className="h-4 w-4 text-rose-500 fill-rose-500" aria-hidden="true" />
              <span>المفضلة ({favoriteProducts.length})</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق القائمة"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-[#081830] border border-[#CBE7FA] dark:border-[#1E3F73] text-slate-600 dark:text-slate-300 hover:bg-[#F2FAFF] dark:hover:bg-[#153460] cursor-pointer"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5">
          {activeTab === 'cart' ? (
            <div className="space-y-4">
              {cartItems.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-[#F2FAFF] dark:bg-[#0E264A] border border-[#D8EEFB] dark:border-[#1E3F73] text-[#1D4ED8] dark:text-[#38BDF8]">
                    <ShoppingCart className="h-8 w-8" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF]">
                    سلة المشتريات فارغة
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    اضغط على «أضف إلى السلة» على أي منتج لحفظه هنا ومتابعة الكميات والإجمالي في أي وقت.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between pb-2.5 border-b border-[#E8F4FD] dark:border-[#1E3F73]">
                    <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                      {totals.uniqueCount} منتج · إجمالي {totals.totalQuantity} قطعة
                    </span>

                    {!confirmClearOpen && (
                      <button
                        type="button"
                        onClick={() => setConfirmClearOpen(true)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>إفراغ السلة</span>
                      </button>
                    )}
                  </div>

                  {/* Inline Clear Confirmation Box */}
                  {confirmClearOpen && (
                    <div
                      role="alertdialog"
                      aria-label="تأكيد إفراغ السلة"
                      className="rounded-2xl bg-rose-50 dark:bg-rose-950/35 border border-rose-200 dark:border-rose-800/60 p-3.5 space-y-2.5"
                    >
                      <div className="flex items-start gap-2 text-xs font-bold text-rose-900 dark:text-rose-200">
                        <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>هل أنت متأكد من حذف جميع المنتجات من سلة المشتريات؟</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleConfirmClearCart}
                          className="flex-1 min-h-[36px] rounded-xl bg-rose-600 hover:bg-rose-700 px-3 py-1.5 text-xs font-extrabold text-white transition-colors cursor-pointer"
                        >
                          نعم، إفراغ السلة
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmClearOpen(false)}
                          className="flex-1 min-h-[36px] rounded-xl bg-white dark:bg-[#081830] border border-slate-200 dark:border-[#1E3F73] px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#153460] transition-colors cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {cartItems.map((item) => {
                      const product = item.productSnapshot;
                      const unitPrice = getEffectiveProductPrice(product);
                      const hasDiscount = isDiscountActive(product);
                      const subtotal = roundCurrency(unitPrice * item.quantity);

                      return (
                        <div
                          key={item.cartKey}
                          className="flex items-start gap-3 rounded-2xl bg-[#F2FAFF] dark:bg-[#0E264A] border border-[#D8EEFB] dark:border-[#1E3F73] p-3"
                        >
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onViewDetails(product);
                            }}
                            aria-label={`عرض تفاصيل ${product.name}`}
                            className="shrink-0 cursor-pointer"
                          >
                            <ProductImage
                              src={product.images[0]}
                              alt={product.name}
                              containerClassName="h-18 w-18 shrink-0 rounded-xl bg-white dark:bg-[#081830] border border-[#CBE7FA] dark:border-[#1E3F73] p-1"
                              className="h-full w-full"
                            />
                          </button>

                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onViewDetails(product);
                              }}
                              className="block w-full text-right cursor-pointer"
                            >
                              <h4 className="text-xs sm:text-sm font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF] line-clamp-2 hover:text-[#1D4ED8] dark:hover:text-[#38BDF8] transition-colors">
                                {product.name}
                              </h4>
                            </button>

                            {item.selectedOption && (
                              <p className="mt-0.5 text-[11px] font-semibold text-[#0284C7] dark:text-[#38BDF8] truncate">
                                الخيار: {item.selectedOption}
                              </p>
                            )}

                            <div className="mt-1 flex flex-wrap items-baseline gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="font-num font-bold text-[#0F294A] dark:text-[#E0F2FE]">
                                {formatPriceEgp(unitPrice)} ج.م
                              </span>
                              <span>× {item.quantity}</span>
                              {hasDiscount && (
                                <span className="font-num line-through text-slate-400">
                                  {formatPriceEgp(product.originalPrice)}
                                </span>
                              )}
                            </div>

                            <div className="mt-2 flex items-center justify-between gap-2">
                              <p className="font-num text-sm font-extrabold text-[#1D4ED8] dark:text-[#38BDF8]">
                                {formatPriceEgp(subtotal)} ج.م
                              </p>

                              <div className="flex items-center gap-1.5">
                                <div className="inline-flex items-center rounded-xl bg-white dark:bg-[#081830] border border-[#CBE7FA] dark:border-[#1E3F73] p-0.5">
                                  <button
                                    type="button"
                                    disabled={item.quantity <= 1}
                                    onClick={() => updateCartQuantity(item.cartKey, item.quantity - 1)}
                                    aria-label="تقليل الكمية"
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 dark:text-slate-200 hover:bg-[#F2FAFF] dark:hover:bg-[#163663] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                  >
                                    <Minus className="h-3.5 w-3.5" aria-hidden="true" />
                                  </button>
                                  <span className="font-num min-w-[26px] text-center text-xs font-extrabold text-[#0B1F3A] dark:text-white">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateCartQuantity(item.cartKey, item.quantity + 1)}
                                    aria-label="زيادة الكمية"
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-700 dark:text-slate-200 hover:bg-[#F2FAFF] dark:hover:bg-[#163663] cursor-pointer"
                                  >
                                    <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item.cartKey)}
                                  aria-label={`حذف ${product.name} من السلة`}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:text-rose-700 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {favoriteProducts.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-rose-50 dark:bg-rose-950/30 text-rose-500">
                    <Heart className="h-8 w-8 fill-rose-500" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF]">
                    لا توجد منتجات في المفضلة
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    اضغط على أيقونة القلب لحفظ منتجاتك المفضلة محليًا.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {favoriteProducts.map((p) => {
                    const eff = getEffectiveProductPrice(p);
                    const isAdded = addedFavId === p.id;
                    return (
                      <div
                        key={p.id}
                        className="flex items-center gap-3 rounded-2xl bg-[#F2FAFF] dark:bg-[#0E264A] border border-[#D8EEFB] dark:border-[#1E3F73] p-3"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onViewDetails(p);
                          }}
                          className="shrink-0 cursor-pointer"
                        >
                          <ProductImage
                            src={p.images[0]}
                            alt={p.name}
                            containerClassName="h-16 w-16 shrink-0 rounded-xl bg-white dark:bg-[#081830] border border-[#CBE7FA] dark:border-[#1E3F73] p-1"
                            className="h-full w-full"
                          />
                        </button>
                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onViewDetails(p);
                            }}
                            className="block w-full text-right cursor-pointer"
                          >
                            <h4 className="text-xs font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF] truncate hover:text-[#1D4ED8] dark:hover:text-[#38BDF8]">
                              {p.name}
                            </h4>
                          </button>
                          <p className="font-num text-xs font-extrabold text-[#1D4ED8] dark:text-[#38BDF8] mt-1">
                            {formatPriceEgp(eff)} ج.م
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAddFavoriteToCart(p)}
                            disabled={isAdded}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition-colors cursor-pointer ${
                              isAdded
                                ? 'bg-emerald-500 text-white'
                                : 'bg-[#1D4ED8] hover:bg-[#1E40AF] text-white'
                            }`}
                          >
                            {isAdded ? (
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <ShoppingCart className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                            <span>{isAdded ? 'أُضيف' : 'أضف إلى السلة'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleFavorite(p.id)}
                            className="text-rose-500 p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl cursor-pointer"
                            title="إزالة من المفضلة"
                            aria-label={`إزالة ${p.name} من المفضلة`}
                          >
                            <Heart className="h-4 w-4 fill-rose-500" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Drawer Footer CTA */}
        {activeTab === 'cart' && cartItems.length > 0 && (
          <div className="shrink-0 p-4 sm:p-5 border-t border-[#E8F4FD] dark:border-[#1E3F73] bg-[#F8FCFF] dark:bg-[#0E264A] space-y-3">
            <div className="space-y-1">
              {totals.totalSavings > 0 && (
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                    إجمالي التوفير من الخصومات:
                  </span>
                  <span className="font-num font-extrabold text-emerald-700 dark:text-emerald-400">
                    {formatPriceEgp(totals.totalSavings)} ج.م
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-slate-600 dark:text-slate-300">
                  الإجمالي الكلي ({totals.totalQuantity} قطعة):
                </span>
                <span className="font-num text-lg font-extrabold text-[#1D4ED8] dark:text-[#38BDF8]">
                  {formatPriceEgp(totals.totalPrice)} ج.م
                </span>
              </div>
            </div>

            {isOnline ? (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#22bf5b] px-4 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md transition-all whitespace-nowrap"
              >
                <MessageCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>إرسال السلة عبر واتساب</span>
              </a>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/35 border border-amber-200 dark:border-amber-800/50 px-3 py-2.5 text-[11px] font-bold text-amber-900 dark:text-amber-200 leading-relaxed">
                  <WifiOff className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" aria-hidden="true" />
                  <span>
                    أنت غير متصل بالإنترنت حاليًا. تم حفظ السلة والكميات على جهازك بأمان، ويمكنك إرسال الطلب عبر واتساب فور عودة الاتصال.
                  </span>
                </div>
                <button
                  type="button"
                  disabled
                  className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-slate-200 dark:bg-slate-800 px-4 py-2.5 text-xs sm:text-sm font-extrabold text-slate-500 dark:text-slate-400 cursor-not-allowed whitespace-nowrap"
                >
                  <ShoppingBag className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>إرسال الطلب عبر واتساب يتطلب اتصالًا بالإنترنت</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
