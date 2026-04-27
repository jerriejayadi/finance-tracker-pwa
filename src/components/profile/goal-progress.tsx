"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface GoalProgressProps {
  label: string;
  current: number;
  target: number;
  unit?: string;
  className?: string;
}

export function GoalProgress({
  label,
  current,
  target,
  unit = "IDR",
  className,
}: GoalProgressProps) {
  const percentage = Math.min(Math.round((current / target) * 100), 100);
  const warn = percentage > 85;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex justify-between items-baseline">
        <div>
          <p className="text-[11px] font-medium text-fg-2 uppercase tracking-[0.04em]">
            {label}
          </p>
          <p className="ft-num text-[17px] font-medium text-fg-0 mt-0.5">
            {current.toLocaleString()}{" "}
            <span className="text-[13px] text-fg-2">{unit}</span>
          </p>
        </div>
        <p className="ft-num text-[13px] text-fg-1">{percentage}%</p>
      </div>

      <div className="w-full h-1.5 bg-bg-3 rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500",
            warn ? "bg-neg" : "bg-fg-0"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="ft-num text-[11px] text-fg-2 text-right">
        Target: {target.toLocaleString()} {unit}
      </p>
    </div>
  );
}
