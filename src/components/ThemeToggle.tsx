import { Moon, Sun } from 'lucide-react';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
  className?: string;
}

export function ThemeToggle({ isDark, onToggle, className = '' }: ThemeToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={isDark ? 'التبديل إلى الوضع النهاري ☀️' : 'التبديل إلى الوضع الليلي 🌙'}
      title={isDark ? 'الوضع النهاري' : 'الوضع الليلي'}
      className={`relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl bg-[#F2FAFF] dark:bg-[#0E264A] border border-[#CBE7FA] dark:border-[#1E3F73] text-[#0F294A] dark:text-[#E0F2FE] hover:bg-[#E2F3FE] dark:hover:bg-[#153666] active:scale-95 transition-all cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-[#1D4ED8] ${className}`}
    >
      {isDark ? (
        <span className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
          <Sun className="h-4.5 w-4.5 text-amber-400 animate-pulse-slow" aria-hidden="true" />
          <span className="hidden sm:inline">نهاري</span>
        </span>
      ) : (
        <span className="flex items-center gap-1.5 text-xs font-bold text-[#0F294A]">
          <Moon className="h-4.5 w-4.5 text-[#1D4ED8]" aria-hidden="true" />
          <span className="hidden sm:inline">ليلي</span>
        </span>
      )}
    </button>
  );
}
