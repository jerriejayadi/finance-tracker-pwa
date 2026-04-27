import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

interface SettingsGroupProps {
  label?: string;
  children: React.ReactNode;
  className?: string;
}

function SettingsGroup({ label, children, className }: SettingsGroupProps) {
  return (
    <div className={cn("", className)}>
      {label && (
        <div className="text-[10px] uppercase tracking-[0.08em] text-fg-2 font-medium px-1 pb-2 mt-1">
          {label}
        </div>
      )}
      <div className="bg-bg-1 border border-line rounded-md overflow-hidden">
        {children}
      </div>
    </div>
  );
}

interface SettingsRowProps {
  icon?: React.ReactNode;
  iconClassName?: string;
  label: string;
  description?: string;
  value?: string;
  trailing?: React.ReactNode;
  danger?: boolean;
  onClick?: () => void;
  className?: string;
}

function SettingsRow({
  icon,
  iconClassName,
  label,
  description,
  value,
  trailing,
  danger,
  onClick,
  className,
}: SettingsRowProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3.5 border-b border-line-soft last:border-b-0 cursor-pointer transition-colors hover:bg-bg-2",
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border border-line bg-bg-2 text-fg-1",
            iconClassName
          )}
        >
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className={cn("text-[14px] text-fg-0", danger && "text-neg")}>
          {label}
        </div>
        {description && (
          <div className="text-[12px] text-fg-2 mt-0.5">{description}</div>
        )}
      </div>
      {value && (
        <span className="font-mono text-[13px] text-fg-2">{value}</span>
      )}
      {trailing}
      {!trailing && (
        <ChevronRight size={14} className="text-fg-2 flex-shrink-0" />
      )}
    </div>
  );
}

export { SettingsGroup, SettingsRow };
