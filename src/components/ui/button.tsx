import * as React from "react"
import { cn } from "@/lib/utils"

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-full text-base font-bold transition-all duration-300 hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
          "bg-primary text-white shadow-colored h-12 px-6 py-3 dark:bg-primary dark:text-white dark:hover:bg-primary/90 hover:opacity-90",
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
