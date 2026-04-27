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
      viewBox="0 0 32 32"
      fill="none"
      className={className}
    >
      <rect width="32" height="32" rx="8" className="fill-brand" />
      <text
        x="16"
        y="22"
        textAnchor="middle"
        className="fill-brand-ink"
        fontSize="18"
        fontWeight="700"
        fontFamily="var(--font-mono)"
      >
        F
      </text>
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
