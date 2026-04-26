import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-bold transition-all duration-300 hover:scale-[1.02] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-white shadow-colored dark:bg-primary dark:text-white dark:hover:bg-primary/90 hover:opacity-90",
        destructive:
          "bg-accent-coral text-white shadow-[0_10px_30px_rgba(255,107,107,0.35)] hover:opacity-90",
        outline:
          "bg-transparent text-primary ring-1 ring-primary/30 shadow-none hover:bg-primary/10 dark:ring-primary/40",
        secondary:
          "bg-accent-yellow text-text-navy shadow-[0_10px_30px_rgba(255,209,102,0.35)] hover:opacity-90",
        ghost:
          "bg-transparent text-text-navy dark:text-white shadow-none hover:bg-black/5 dark:hover:bg-white/10",
        link: "bg-transparent text-primary shadow-none hover:underline underline-offset-4",
      },
      size: {
        default: "h-12 px-6 py-3 text-base",
        sm: "h-10 px-4 text-sm",
        lg: "h-14 px-8 text-lg",
        icon: "size-12 p-0",
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
