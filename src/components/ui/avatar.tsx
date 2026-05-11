import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "brand";
  src?: string | null;
}

const sizeClasses = {
  sm: "w-9 h-9 text-[13px] rounded-full",
  md: "w-9 h-9 text-[13px] rounded-full",
  lg: "w-14 h-14 text-[19px] rounded-2xl",
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size = "md", variant = "default", src, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center font-semibold flex-shrink-0 overflow-hidden",
          sizeClasses[size],
          variant === "brand"
            ? "bg-brand text-brand-ink"
            : "bg-bg-2 border border-line text-fg-1",
          className
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          children
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

export { Avatar };
