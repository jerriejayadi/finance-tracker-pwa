"use client";

import * as React from "react";
import { ArrowUpDown, ChevronRight, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/* From / To account rows with a swap button between them. Lives inside the drawer's field group. */

function TransferAccountsRoot({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("relative flex flex-col", className)}>{children}</div>;
}

function TransferAccountsRow({
  label,
  value,
  loading,
  disabled,
  onClick,
}: {
  label: string;
  value: string;
  loading?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const inactive = loading || disabled;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={inactive}
      className={cn(
        "flex items-center gap-3 px-4 py-3.5 border-b border-line-soft text-left transition-colors",
        inactive ? "cursor-default" : "cursor-pointer hover:bg-bg-1",
      )}
    >
      <div className="w-8 h-8 rounded-lg bg-bg-2 border border-line flex items-center justify-center text-fg-1 flex-shrink-0">
        <Wallet size={16} strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] text-fg-2 uppercase tracking-[0.04em]">{label}</div>
        {loading ? (
          <Skeleton className="h-4 w-28 mt-1" />
        ) : (
          <div className="text-[14px] text-fg-0 font-medium mt-0.5 truncate">{value}</div>
        )}
      </div>
      <ChevronRight size={14} strokeWidth={1.75} className="text-fg-2 flex-shrink-0" />
    </button>
  );
}

/** Sits on the divider between the two rows; rotates half a turn on each swap. */
function TransferAccountsSwap({
  label,
  onSwap,
  disabled,
}: {
  label: string;
  onSwap: () => void;
  disabled?: boolean;
}) {
  const [turns, setTurns] = React.useState(0);
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={() => {
        setTurns((n) => n + 1);
        navigator.vibrate?.(10);
        onSwap();
      }}
      className={cn(
        "absolute right-12 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full border border-line bg-bg-0 flex items-center justify-center text-fg-1 transition-colors",
        disabled ? "opacity-50 cursor-default" : "cursor-pointer hover:bg-bg-2 hover:text-fg-0",
      )}
    >
      <ArrowUpDown
        size={14}
        strokeWidth={1.75}
        className="transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ transform: `rotate(${turns * 180}deg)` }}
      />
    </button>
  );
}

/** Inline message in place of the rows (not enough accounts, failed to load). */
function TransferAccountsNotice({
  children,
  action,
}: {
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-line-soft">
      <p className="text-[13px] text-fg-1">{children}</p>
      {action}
    </div>
  );
}

export const TransferAccounts = Object.assign(TransferAccountsRoot, {
  Row: TransferAccountsRow,
  Swap: TransferAccountsSwap,
  Notice: TransferAccountsNotice,
});
