import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-brand text-brand-ink border border-transparent rounded-sm hover:bg-brand-hi active:opacity-85",
        secondary:
          "bg-bg-2 text-fg-0 border border-line rounded-sm hover:bg-bg-3",
        ghost:
          "bg-transparent text-fg-0 rounded-sm hover:bg-bg-1",
        danger:
          "bg-neg text-white border border-neg rounded-sm hover:opacity-85",
        outline:
          "bg-transparent text-fg-0 border border-line rounded-sm hover:bg-bg-1",
        link: "bg-transparent text-fg-1 hover:text-fg-0 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-[52px] px-4 text-[15px] font-semibold rounded-sm",
        sm: "h-7 px-2.5 text-[13px] rounded-[5px]",
        md: "h-10 px-4 text-[15px] rounded-sm",
        lg: "h-11 px-[18px] text-[15px] rounded-sm",
        icon: "size-10 p-0 rounded-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
