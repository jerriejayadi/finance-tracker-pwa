import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  suffix?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, suffix, ...props }, ref) => {
    return (
      <div className="relative flex items-center">
        {icon && (
          <span className="absolute left-3.5 text-fg-2 pointer-events-none flex items-center justify-center">
            {icon}
          </span>
        )}
        <input
          type={type}
          className={cn(
            "flex h-[52px] w-full rounded-sm border border-line bg-bg-1 px-3.5 py-2.5 text-[15px] text-fg-0 font-sans transition-colors placeholder:text-fg-2 focus-visible:outline-none focus-visible:border-brand disabled:cursor-not-allowed disabled:opacity-50",
            icon && "pl-11",
            suffix && "pr-16",
            className
          )}
          ref={ref}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 flex items-center">
            {suffix}
          </span>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
