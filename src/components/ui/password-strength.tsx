"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  value: string;
  className?: string;
}

function getStrength(v: string) {
  let score = 0;
  if (v.length >= 6) score++;
  if (v.length >= 10) score++;
  if (/[A-Z]/.test(v) && /[0-9]/.test(v)) score++;
  if (/[^A-Za-z0-9]/.test(v)) score++;
  return score;
}

function PasswordStrength({ value, className }: PasswordStrengthProps) {
  const score = getStrength(value || "");
  const colorClass =
    score === 0 ? "" : score <= 1 ? "bg-neg" : score === 2 ? "bg-warn" : "bg-pos";
  const label =
    score === 0 ? "—" : score <= 1 ? "Weak" : score === 2 ? "Okay" : "Strong";

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={cn(
            "flex-1 h-[3px] rounded-full bg-bg-3 transition-colors duration-200",
            score >= i && colorClass
          )}
        />
      ))}
      <span className="font-mono text-[11px] text-fg-2 ml-1">{label}</span>
    </div>
  );
}

export { PasswordStrength };
