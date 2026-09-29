"use client";

import * as React from "react";
import { format, isToday, isYesterday } from "date-fns";
import { useLocale, useTranslations } from "next-intl";
import { Repeat } from "lucide-react";
import { getDateLocale } from "@/lib/date-locale";
import { fmtIDR } from "@/lib/format";
import type { Transaction } from "@/components/history/history-constants";

interface CategoryTransactionListProps {
  transactions: Transaction[];
  onTapRow: (tx: Transaction) => void;
}

/** A month's transactions for one category, grouped by day (newest first) with day totals. */
export function CategoryTransactionList({ transactions, onTapRow }: CategoryTransactionListProps) {
  const tCommon = useTranslations("common");
  const dateLocale = getDateLocale(useLocale());

  // Query already returns newest first, so groups come out in order
  const days = React.useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    for (const tx of transactions) {
      const list = groups.get(tx.date) ?? [];
      list.push(tx);
      groups.set(tx.date, list);
    }
    return [...groups].map(([date, txs]) => ({
      date,
      txs,
      total: txs.reduce((sum, tx) => sum + Number(tx.amount), 0),
    }));
  }, [transactions]);

  const dayLabel = (iso: string) => {
    const d = new Date(iso + "T00:00:00");
    if (isToday(d)) return tCommon("today");
    if (isYesterday(d)) return tCommon("yesterday");
    return format(d, "EEE, d MMM", { locale: dateLocale });
  };

  return (
    <div className="flex flex-col gap-4 px-4">
      {days.map((day) => (
        <section key={day.date}>
          <div className="flex items-center justify-between px-1 pb-1.5">
            <h3 className="text-fg-2 text-[11px] font-semibold tracking-[0.06em] uppercase">
              {dayLabel(day.date)}
            </h3>
            <span className="text-fg-2 font-mono text-[11px] tabular-nums">
              {"−"}
              {fmtIDR(day.total)}
            </span>
          </div>
          <div className="bg-bg-1 border-line overflow-hidden rounded-lg border">
            {day.txs.map((tx, i) => (
              <button
                key={tx.id}
                type="button"
                onClick={() => onTapRow(tx)}
                className={`hover:bg-bg-2 flex w-full cursor-pointer items-center gap-3 px-3.5 py-3 text-left transition-colors ${
                  i > 0 ? "border-line-soft border-t" : ""
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="text-fg-0 flex items-center gap-1.5 truncate text-[14px] font-medium">
                    <span className="truncate">
                      {tx.merchant || tx.note || tx.category_name || tx.category}
                    </span>
                    {tx.recurring_transaction_id && (
                      <Repeat size={10} strokeWidth={2} className="text-fg-2 flex-shrink-0" />
                    )}
                  </div>
                  <div className="text-fg-2 mt-0.5 truncate font-mono text-[11px]">
                    {tx.account_name}
                  </div>
                </div>
                <div className="text-fg-0 font-mono text-[14px] font-medium whitespace-nowrap tabular-nums">
                  {"−"} {fmtIDR(Number(tx.amount))}
                </div>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
