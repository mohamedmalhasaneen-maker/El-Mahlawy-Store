interface TechBackgroundProps {
  isDark?: boolean;
}

export function TechBackground({ isDark }: TechBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
    >
      {/* 1. Hardware Accelerated Circuit Grid Overlay */}
      <div className="absolute inset-0 tech-grid-pattern opacity-60 dark:opacity-40" />

      {/* 2. Soft Ambient Electronic Glowing Orbs */}
      <div className="animate-glow absolute -top-32 -right-32 h-[480px] w-[480px] rounded-full bg-gradient-to-br from-[#0284C7]/20 via-[#38BDF8]/15 to-transparent blur-3xl dark:from-[#38BDF8]/25 dark:via-[#0284C7]/15" />

      <div className="animate-glow absolute top-1/3 -left-40 h-[520px] w-[520px] rounded-full bg-gradient-to-tr from-[#1D4ED8]/15 via-[#0284C7]/10 to-transparent blur-3xl dark:from-[#1D4ED8]/25 dark:via-[#38BDF8]/15" />

      <div className="animate-glow absolute bottom-10 right-10 h-[400px] w-[400px] rounded-full bg-gradient-to-tl from-[#0284C7]/15 via-[#38BDF8]/10 to-transparent blur-3xl dark:from-[#38BDF8]/20 dark:via-[#1D4ED8]/15" />

      {/* 3. Subtle Electronic Nodes / Dots */}
      <div className="animate-pulse-slow absolute top-24 right-1/4 h-2 w-2 rounded-full bg-[#0284C7] shadow-[0_0_12px_#0284C7] dark:bg-[#38BDF8] dark:shadow-[0_0_14px_#38BDF8]" />

      <div className="animate-pulse-slow absolute top-1/2 left-1/5 h-2.5 w-2.5 rounded-full bg-[#1D4ED8] shadow-[0_0_14px_#1D4ED8] dark:bg-[#38BDF8] dark:shadow-[0_0_16px_#38BDF8]" />

      <div className="animate-pulse-slow absolute bottom-1/4 right-1/3 h-2 w-2 rounded-full bg-[#0284C7] shadow-[0_0_12px_#0284C7] dark:bg-[#7DD3FC] dark:shadow-[0_0_14px_#7DD3FC]" />
    </div>
  );
}
