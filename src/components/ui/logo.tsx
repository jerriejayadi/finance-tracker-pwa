import * as React from "react";
import { cn } from "@/lib/utils";

interface LogoMarkProps {
  size?: number;
  className?: string;
}

function LogoMark({ size = 24, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      className={className}
    >
      <rect width="44" height="44" rx="10" className="fill-brand" />
      {/* In / out: income pill over a shorter expense pill */}
      <rect x="10" y="12" width="24" height="8" rx="4" className="fill-brand-ink" />
      <rect
        x="10"
        y="24"
        width="15"
        height="8"
        rx="4"
        className="fill-brand-ink"
        fillOpacity={0.45}
      />
    </svg>
  );
}

interface LogoProps {
  size?: number;
  className?: string;
}

function Logo({ size = 24, className }: LogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark size={size} />
      <span className="text-[14px] font-semibold tracking-[-0.01em]">
        FinTrack
      </span>
    </div>
  );
}

export { LogoMark, Logo };
