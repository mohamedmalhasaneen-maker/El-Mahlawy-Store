import {
  Building2,
  Home,
  LayoutDashboard,
  Package,
  Percent,
  Phone,
  Star,
  Truck,
  X,
} from 'lucide-react';
import { useSiteConfig } from '../../contexts/SiteConfigContext';
import { useMobileOverlay } from '../../utils/useMobileOverlay';

interface MobileMenuDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateSection: (sectionId: string) => void;
  onNavigateAbout?: () => void;
  onAdminClick: () => void;
  hasDiscountOffers: boolean;
  onOpenRatingModal?: () => void;
}

export function MobileMenuDrawer({
  isOpen,
  onClose,
  onNavigateSection,
  onNavigateAbout,
  onAdminClick,
  hasDiscountOffers,
  onOpenRatingModal,
}: MobileMenuDrawerProps) {
  const siteConfig = useSiteConfig();
  useMobileOverlay(isOpen, onClose, 'mobile-menu-drawer');

  if (!isOpen) return null;

  const navItems = [
    { id: 'mobile-top', label: 'الرئيسية', Icon: Home },
    ...(hasDiscountOffers && siteConfig.showOffersSection
      ? [{ id: 'mobile-offers-section', label: 'عروض وخصومات المنتجات', Icon: Percent }]
      : []),
    { id: 'mobile-products-section', label: 'تصفح جميع المنتجات', Icon: Package },
    ...(siteConfig.showShippingSection
      ? [{ id: 'mobile-shipping-section', label: 'الشحن والتوصيل', Icon: Truck }]
      : []),
    { id: 'footer-contact', label: 'تواصل معنا', Icon: Phone },
    ...(siteConfig.showRatingsSection !== false && onOpenRatingModal
      ? [{ id: 'rating-modal', label: 'تقييم المتجر', Icon: Star }]
      : []),
    { id: 'about-us', label: 'من نحن | About Us', Icon: Building2 },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="القائمة الرئيسية للمتجر"
      className="fixed inset-0 z-50 md:hidden flex justify-start bg-[#081A33]/55 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="animate-drawer-rtl w-[84vw] max-w-[330px] h-full bg-white border-l border-[#D8EEFB] flex flex-col justify-between shadow-2xl pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] overflow-y-auto">
        <div>
          {/* Drawer Header */}
          <div className="flex items-center justify-between gap-2 px-4 py-3.5 border-b border-[#E8F4FD]">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1D4ED8] to-[#0284C7] text-white"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4.5 w-4.5"
                >
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 0 1-8 0" />
                </svg>
              </span>
              <div className="min-w-0">
                <p className="text-sm font-extrabold text-[#0B1F3A] truncate">
                  {siteConfig.storeName}
                </p>
                {siteConfig.storeSubtitle && (
                  <p className="text-[11px] font-semibold text-[#0284C7] truncate">
                    <bdi>{siteConfig.storeSubtitle}</bdi>
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق القائمة"
              className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-[#F2FAFF] border border-[#CBE7FA] text-[#0B1F3A] active:scale-95 transition-transform cursor-pointer"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>

          {/* Section Links */}
          <nav aria-label="روابط أقسام المتجر" className="p-3 space-y-1">
            {navItems.map(({ id, label, Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  onClose();
                  if (id === 'rating-modal' && onOpenRatingModal) {
                    onOpenRatingModal();
                  } else if (id === 'about-us' && onNavigateAbout) {
                    onNavigateAbout();
                  } else {
                    setTimeout(() => onNavigateSection(id), 40);
                  }
                }}
                className="flex min-h-[46px] w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-right text-sm font-bold text-[#0F294A] hover:bg-[#F2FAFF] active:bg-[#E2F3FE] transition-colors cursor-pointer"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F2FAFF] border border-[#D8EEFB] text-[#1D4ED8]">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="truncate">{label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom Developer Settings Gate Button */}
        <div className="p-3.5 border-t border-[#E8F4FD]">
          <button
            type="button"
            onClick={() => {
              onClose();
              onAdminClick();
            }}
            className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#F2FAFF] hover:bg-[#E2F3FE] border border-[#CBE7FA] px-4 py-2.5 text-xs font-extrabold text-[#0F294A] cursor-pointer"
          >
            <LayoutDashboard className="h-4 w-4 text-[#1D4ED8] shrink-0" aria-hidden="true" />
            <span>إعدادات المطور</span>
          </button>
        </div>
      </div>
    </div>
  );
}

