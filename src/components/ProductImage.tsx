import { useEffect, useState } from 'react';
import { Package } from 'lucide-react';
import { normalizeImageSrc } from '../utils/catalogLogic';

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  showPedestalHalo?: boolean;
}

export function ProductImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  showPedestalHalo = false,
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const resolvedSrc = normalizeImageSrc(src);

  useEffect(() => {
    setHasError(false);
  }, [resolvedSrc]);

  const validSrc = resolvedSrc.length > 0 && !hasError;

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden bg-[#F2FAFF] ${containerClassName}`}
    >
      {showPedestalHalo && !validSrc && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute aspect-square h-[86%] max-w-[86%] rounded-full bg-white shadow-[0_8px_28px_rgba(14,116,190,0.08)] border border-[#E1F2FE]"
        />
      )}

      {validSrc ? (
        <img
          src={resolvedSrc}
          alt={alt}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setHasError(true)}
          className={`relative z-10 h-full w-full object-contain rounded-xl transition-transform duration-200 ease-out ${className}`}
        />
      ) : (
        <div className="relative z-10 flex flex-col items-center justify-center gap-2 p-6 text-center text-[#1D4ED8]/70">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white border border-[#CBE7FA]">
            <Package className="h-8 w-8 text-[#0284C7]" aria-hidden="true" />
          </div>
          <span className="max-w-[180px] truncate text-xs font-semibold text-[#0F294A]">
            {alt}
          </span>
        </div>
      )}
    </div>
  );
}
