"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ToggleProps {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
}

const Toggle = React.forwardRef<HTMLButtonElement, ToggleProps>(
  ({ checked = false, onCheckedChange, className }, ref) => {
    return (
      <button
        ref={ref}
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange?.(!checked)}
        className={cn(
          "relative w-11 h-[26px] rounded-full flex-shrink-0 cursor-pointer transition-colors duration-200",
          checked ? "bg-brand" : "bg-bg-3",
          className
        )}
      >
        <span
          className={cn(
            "absolute top-[2px] left-[2px] w-[22px] h-[22px] rounded-full transition-transform duration-200",
            checked
              ? "translate-x-[18px] bg-brand-ink"
              : "translate-x-0 bg-fg-0"
          )}
        />
      </button>
    );
  }
);
Toggle.displayName = "Toggle";

export { Toggle };
