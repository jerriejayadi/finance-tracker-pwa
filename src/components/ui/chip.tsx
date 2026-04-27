import * as React from "react";
import { cn } from "@/lib/utils";

interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  count?: number;
}

const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, active, count, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[12px] border whitespace-nowrap cursor-pointer transition-all duration-120",
          active
            ? "bg-fg-0 text-bg-0 border-fg-0"
            : "bg-bg-1 text-fg-1 border-line hover:bg-bg-2",
          className
        )}
        {...props}
      >
        {children}
        {count !== undefined && (
          <span
            className={cn(
              "font-mono text-[10px]",
              active ? "text-bg-0 opacity-70" : "text-fg-2"
            )}
          >
            {count}
          </span>
        )}
      </button>
    );
  }
);
Chip.displayName = "Chip";

export { Chip };
