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

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex justify-between items-end">
        <div>
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
            {label}
          </p>
          <p className="text-lg font-black text-text-navy dark:text-white">
            {current.toLocaleString()} <span className="text-sm font-bold text-text-muted">{unit}</span>
          </p>
        </div>
        <p className="text-sm font-black text-primary">{percentage}%</p>
      </div>
      
      <div className="w-full h-3 bg-text-muted/10 rounded-full overflow-hidden relative">
        {/* Animated progress fill */}
        <div 
          className="h-full bg-primary rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(5,189,137,0.4)]"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <p className="text-[10px] font-bold text-text-muted text-right italic">
        Target: {target.toLocaleString()} {unit}
      </p>
    </div>
  );
}
