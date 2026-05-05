"use client";

import { fmtIDRShort } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Transaction } from "./history-constants";

interface HistorySummaryProps {
  transactions: Transaction[];
}

export function HistorySummary({ transactions }: HistorySummaryProps) {
  const totalIn = transactions
    .filter((t) => t.type === "income")
    .reduce((a, t) => a + t.amount, 0);
  const totalOut = transactions
    .filter((t) => t.type === "expense")
    .reduce((a, t) => a + t.amount, 0);
  const net = totalIn - totalOut;

  return (
    <div className="mx-4 grid grid-cols-[1fr_1px_1fr_1px_1fr] bg-bg-1 border border-line rounded-md py-3.5 items-center">
      <div className="flex flex-col items-center gap-1 px-2">
        <span className="text-[10px] text-fg-2 uppercase tracking-[0.06em] font-medium">
          Income
        </span>
        <span className="font-mono tabular-nums text-[14px] font-medium text-pos">
          + {fmtIDRShort(totalIn)}
        </span>
      </div>
      <div className="w-px h-7 bg-line justify-self-center" />
      <div className="flex flex-col items-center gap-1 px-2">
        <span className="text-[10px] text-fg-2 uppercase tracking-[0.06em] font-medium">
          Expense
        </span>
        <span className="font-mono tabular-nums text-[14px] font-medium text-neg">
          &minus; {fmtIDRShort(totalOut)}
        </span>
      </div>
      <div className="w-px h-7 bg-line justify-self-center" />
      <div className="flex flex-col items-center gap-1 px-2">
        <span className="text-[10px] text-fg-2 uppercase tracking-[0.06em] font-medium">
          Net
        </span>
        <span
          className={cn(
            "font-mono tabular-nums text-[14px] font-medium",
            net >= 0 ? "text-pos" : "text-neg"
          )}
        >
          {net >= 0 ? "+ " : "\u2212 "}
          {fmtIDRShort(Math.abs(net))}
        </span>
      </div>
    </div>
  );
}
