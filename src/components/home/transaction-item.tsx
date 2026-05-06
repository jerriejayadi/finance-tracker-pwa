import * as React from "react";
import { cn } from "@/lib/utils";
import { Repeat } from "lucide-react";

interface TransactionItemProps {
  title: string;
  category: string;
  amount: number;
  time: string;
  type: "income" | "expense";
  icon?: string;
  recurring?: boolean;
  className?: string;
}

export function TransactionItem({
  title,
  category,
  amount,
  time,
  type,
  icon,
  recurring,
  className,
}: TransactionItemProps) {
  const isIncome = type === "income";
  const sign = isIncome ? "+" : "\u2212";

  return (
    <div
      className={cn(
        "grid grid-cols-[40px_1fr_auto] gap-3 items-center px-3 py-2.5 rounded-sm cursor-pointer hover:bg-bg-1 transition-colors",
        className
      )}
    >
      {/* Avatar */}
      <div className="w-10 h-10 rounded-xl bg-bg-2 border border-line flex items-center justify-center text-[17px] text-fg-1">
        {icon || "\u2022"}
      </div>

      {/* Info */}
      <div className="min-w-0">
        <div className="text-[14px] font-medium text-fg-0 truncate flex items-center gap-1.5">
          {title}
          {recurring && (
            <span className="text-fg-2 flex items-center">
              <Repeat size={11} strokeWidth={1.75} />
            </span>
          )}
        </div>
        <div className="text-[12px] text-fg-2 mt-0.5 truncate">
          {category} · {time}
        </div>
      </div>

      {/* Amount */}
      <div
        className={cn(
          "font-mono tabular-nums text-[14px] font-medium whitespace-nowrap text-right",
          isIncome ? "text-pos" : "text-fg-0"
        )}
      >
        {sign} Rp {Math.abs(amount).toLocaleString("id-ID")}
      </div>
    </div>
  );
}
