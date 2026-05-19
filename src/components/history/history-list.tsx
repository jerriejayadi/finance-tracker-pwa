"use client";

import * as React from "react";
import { Repeat, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday, type Locale } from "date-fns";
import { useTranslations, useLocale } from "next-intl";
import { getDateLocale } from "@/lib/date-locale";
import type { Transaction } from "./history-constants";

function fmtDateRow(iso: string, locale: Locale, tCommon: (key: string) => string): string {
  const d = new Date(iso + "T00:00:00");
  if (isToday(d)) return tCommon("today");
  if (isYesterday(d)) return tCommon("yesterday");
  return format(d, "d MMM", { locale });
}

interface HistoryListProps {
  transactions: Transaction[];
  selectMode: boolean;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onTapRow: (tx: Transaction) => void;
  rangeLabel: string;
}

export function HistoryList({
  transactions,
  selectMode,
  selected,
  onToggleSelect,
  onTapRow,
  rangeLabel,
}: HistoryListProps) {
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const dateLocale = getDateLocale(locale);

  return (
    <div className="px-3 flex flex-col gap-px">
      {transactions.map((tx) => {
        const isIncome = tx.type === "Income";
        const sel = selected.has(tx.id);

        return (
          <div
            key={tx.id}
            onClick={() => {
              if (selectMode) onToggleSelect(tx.id);
              else onTapRow(tx);
            }}
            className={cn(
              "grid items-center gap-3 px-3 py-3 rounded-sm cursor-pointer transition-colors",
              selectMode
                ? "grid-cols-[22px_40px_1fr_auto]"
                : "grid-cols-[40px_1fr_auto]",
              sel ? "bg-brand-soft" : "hover:bg-bg-1"
            )}
          >
            {/* Checkbox in select mode */}
            {selectMode && (
              <div
                className={cn(
                  "w-[22px] h-[22px] rounded-md border-[1.5px] flex items-center justify-center transition-colors",
                  sel
                    ? "bg-brand border-brand text-brand-ink"
                    : "bg-bg-1 border-line"
                )}
              >
                {sel && <Check size={12} strokeWidth={2.5} />}
              </div>
            )}

            {/* Icon avatar */}
            <div className="w-10 h-10 rounded-xl bg-bg-2 border border-line flex items-center justify-center text-[17px]">
              {tx.category_icon || "💰"}
            </div>

            {/* Body */}
            <div className="min-w-0">
              <div className="text-[14px] font-medium text-fg-0 flex items-center gap-1.5 truncate">
                {tx.merchant || tx.category_name || tx.category}
                {tx.recurring_transaction_id && (
                  <Repeat size={10} strokeWidth={2} className="text-fg-2 flex-shrink-0" />
                )}
              </div>
              <div className="text-[11px] text-fg-2 font-mono mt-0.5 truncate flex items-center gap-1.5">
                <span>{fmtDateRow(tx.date, dateLocale, tCommon)}</span>
                <span className="opacity-50">&middot;</span>
                <span>{tx.category_name || tx.category}</span>
                <span className="opacity-50">&middot;</span>
                <span className="text-fg-1">{tx.account_name || ""}</span>
              </div>
            </div>

            {/* Amount */}
            <div className="text-right">
              <div
                className={cn(
                  "font-mono tabular-nums text-[14px] font-medium whitespace-nowrap",
                  isIncome ? "text-pos" : "text-fg-0"
                )}
              >
                {isIncome ? "+" : "\u2212"} Rp {Number(tx.amount).toLocaleString("id-ID")}
              </div>
            </div>
          </div>
        );
      })}

      {/* End cap */}
      <div className="flex justify-center py-4 text-[11px] text-fg-2 font-mono tracking-[0.04em]">
        That&apos;s all for {rangeLabel.toLowerCase()}
      </div>
    </div>
  );
}
