import { useEffect, useState, useTransition } from 'react';
import { ShoppingBag, Heart, X, Trash2, Plus, Minus, MessageCircle, ArrowRight } from 'lucide-react';
import { Product } from '../types/store';
import { useSiteConfig } from '../contexts/SiteConfigContext';
import {
  CartItem,
  idbClearCart,
  idbGetCartItems,
  idbGetFavorites,
  idbRemoveCartItem,
  idbSaveCartItem,
  idbToggleFavorite,
} from '../utils/offlineDb';
import { formatPriceEgp, getEffectiveProductPrice, roundCurrency } from '../utils/catalogLogic';
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
  publicOrigin,
}: CartAndFavoritesDrawerProps) {
  const siteConfig = useSiteConfig();
  const [activeTab, setActiveTab] = useState<'cart' | 'favorites'>(initialTab);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!isOpen) return;
    idbGetCartItems().then((items) => setCartItems(items));
    idbGetFavorites().then((favs) => setFavoriteIds(favs));
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUpdateQuantity = async (cartKey: string, nextQty: number) => {
    if (nextQty <= 0) {
      await idbRemoveCartItem(cartKey);
    } else {
      const existing = cartItems.find((i) => i.cartKey === cartKey);
      if (existing) {
        await idbSaveCartItem({ ...existing, quantity: nextQty, updatedAt: Date.now() });
      }
    }
    const updated = await idbGetCartItems();
    startTransition(() => setCartItems(updated));
  };

  const handleRemoveItem = async (cartKey: string) => {
    await idbRemoveCartItem(cartKey);
    const updated = await idbGetCartItems();
    startTransition(() => setCartItems(updated));
  };

  const handleClearCart = async () => {
    await idbClearCart();
    startTransition(() => setCartItems([]));
  };

  const handleToggleFav = async (productId: string) => {
    await idbToggleFavorite(productId);
    const updated = await idbGetFavorites();
    startTransition(() => setFavoriteIds(updated));
  };

  const totalPrice = cartItems.reduce((sum, item) => {
    const unitPrice = getEffectiveProductPrice(item.productSnapshot);
    return sum + unitPrice * item.quantity;
  }, 0);

  const favoriteProducts = products.filter((p) => favoriteIds.includes(p.id));

  const buildMultiItemWhatsAppUrl = () => {
    const phone = siteConfig.primaryWhatsApp || '201210141187';
    const lines: string[] = [
      `مرحبًا ${siteConfig.storeName} 👋`,
      'أرغب في طلب المنتجات التالية من السلة:',
      '',
    ];

    cartItems.forEach((item, idx) => {
      const p = item.productSnapshot;
      const unit = getEffectiveProductPrice(p);
      const subtotal = roundCurrency(unit * item.quantity);
      lines.push(`${idx + 1}. ${p.name}`);
      if (item.selectedOption) lines.push(`   - الخيار: ${item.selectedOption}`);
      lines.push(`   - الكمية: ${item.quantity} × ${formatPriceEgp(unit)} ج.م = ${formatPriceEgp(subtotal)} ج.م`);
    });

    lines.push('');
    lines.push(`الإجمالي الكلي: ${formatPriceEgp(totalPrice)} ج.م`);
    lines.push('يرجى تأكيد التوفر وتفاصيل التوصيل.');

    const message = lines.join('\n');
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
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
      <div className="animate-drawer-rtl w-[90vw] max-w-[400px] h-full bg-white dark:bg-[#081A33] border-r border-[#D8EEFB] dark:border-[#1E3F73] flex flex-col justify-between shadow-2xl pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] overflow-y-auto">
        <div>
          {/* Drawer Header */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#E8F4FD] dark:border-[#1E3F73] bg-[#F8FCFF] dark:bg-[#0E264A]">
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
                <ShoppingBag className="h-4 w-4" />
                <span>السلة ({cartItems.length})</span>
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
                <Heart className="h-4 w-4 text-rose-500 fill-rose-500" />
                <span>المفضلة ({favoriteIds.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق القائمة"
              className="p-2 rounded-xl bg-white dark:bg-[#081830] border border-[#CBE7FA] dark:border-[#1E3F73] text-slate-600 dark:text-slate-300 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-5">
            {activeTab === 'cart' ? (
              <div className="space-y-4">
                {cartItems.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-[#F2FAFF] dark:bg-[#0E264A] text-[#1D4ED8]">
                      <ShoppingBag className="h-7 w-7" />
                    </div>
                    <p className="text-sm font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF]">
                      سلة المشتريات فارغة
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      أضف منتجات إلى سلتك لاستعراضها وطلبها معًا بكل سهولة.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between pb-2 border-b border-[#E8F4FD] dark:border-[#1E3F73]">
                      <span className="text-xs font-bold text-slate-500">المنتجات المحفوظة محليًا</span>
                      <button
                        type="button"
                        onClick={handleClearCard}
                        className="text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
                      >
                        إفراغ السلة
                      </button>
                    </div>

                    <div className="space-y-3">
                      {cartItems.map((item) => {
                        const unitPrice = getEffectiveProductPrice(item.productSnapshot);
                        const subtotal = roundCurrency(unitPrice * item.quantity);
                        return (
                          <div
                            key={item.cartKey}
                            className="flex items-center gap-3 rounded-2xl bg-[#F2FAFF] dark:bg-[#0E264A] border border-[#D8EEFB] dark:border-[#1E3F73] p-3"
                          >
                            <ProductImage
                              src={item.productSnapshot.images[0]}
                              alt={item.productSnapshot.name}
                              containerClassName="h-16 w-16 shrink-0 rounded-xl bg-white border border-[#CBE7FA] p-1"
                              className="h-full w-full"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-xs font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF] truncate">
                                {item.productSnapshot.name}
                              </h4>
                              {item.selectedOption && (
                                <p className="text-[11px] text-[#0284C7] dark:text-[#38BDF8] truncate">
                                  {item.selectedOption}
                                </p>
                              )}
                              <p className="font-num text-xs font-extrabold text-[#1D4ED8] dark:text-[#38BDF8] mt-1">
                                {formatPriceEgp(subtotal)} ج.م
                              </p>
                            </div>

                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(item.cartKey)}
                                aria-label="حذف المنتج"
                                className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>

                              <div className="inline-flex items-center rounded-lg bg-white dark:bg-[#081830] border border-[#CBE7FA] dark:border-[#1E3F73] p-0.5">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(item.cartKey, item.quantity - 1)}
                                  className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#163663] rounded"
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="font-num px-2 text-xs font-bold text-[#0B1F3A] dark:text-white">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleUpdateQuantity(item.cartKey, item.quantity + 1)}
                                  className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#163663] rounded"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
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
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-rose-50 dark:bg-rose-950/30 text-rose-500">
                      <Heart className="h-7 w-7 fill-rose-500" />
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
                      return (
                        <div
                          key={p.id}
                          className="flex items-center gap-3 rounded-2xl bg-[#F2FAFF] dark:bg-[#0E264A] border border-[#D8EEFB] dark:border-[#1E3F73] p-3"
                        >
                          <ProductImage
                            src={p.images[0]}
                            alt={p.name}
                            containerClassName="h-16 w-16 shrink-0 rounded-xl bg-white border border-[#CBE7FA] p-1"
                            className="h-full w-full"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-extrabold text-[#0B1F3A] dark:text-[#F0F9FF] truncate">
                              {p.name}
                            </h4>
                            <p className="font-num text-xs font-extrabold text-[#1D4ED8] dark:text-[#38BDF8] mt-1">
                              {formatPriceEgp(eff)} ج.م
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onViewDetails(p);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#1D4ED8] text-white text-xs font-bold cursor-pointer"
                            >
                              عرض
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleFav(p.id)}
                              className="text-rose-500 p-1.5 cursor-pointer"
                              title="إزالة من المفضلة"
                            >
                              <Heart className="h-4 w-4 fill-rose-500" />
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
        </div>

        {/* Drawer Footer CTA */}
        {activeTab === 'cart' && cartItems.length > 0 && (
          <div className="p-5 border-t border-[#E8F4FD] dark:border-[#1E3F73] bg-[#F8FCFF] dark:bg-[#0E264A] space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-slate-600 dark:text-slate-300">الإجمالي الكلي:</span>
              <span className="font-num text-lg font-extrabold text-[#1D4ED8] dark:text-[#38BDF8]">
                {formatPriceEgp(totalPrice)} ج.م
              </span>
            </div>

            <a
              href={buildMultiItemWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] hover:bg-[#22bf5b] px-4 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md transition-all whitespace-nowrap"
            >
              <MessageCircle className="h-5 w-5 shrink-0" />
              <span>إرسال السلة عبر واتساب</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function handleClearCard() {
  void idbClearCart();
}
