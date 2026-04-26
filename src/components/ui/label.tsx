import * as React from "react"
import { cn } from "@/lib/utils"

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-sm font-bold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-text-navy dark:text-white",
        className
      )}
      {...props}
    />
  )
)
Label.displayName = "Label"

export { Label }
