"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SegmentedControlProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}

function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex p-[3px] bg-bg-1 border border-line rounded-sm",
        className
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onValueChange(option.value)}
          className={cn(
            "px-3.5 py-1.5 text-[12px] rounded-xs cursor-pointer transition-all duration-120",
            value === option.value
              ? "bg-bg-3 text-fg-0"
              : "text-fg-1 hover:text-fg-0"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export { SegmentedControl };
