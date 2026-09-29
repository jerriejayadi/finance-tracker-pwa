"use client";

import * as React from "react";
import { Repeat, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, isToday, isYesterday, type Locale } from "date-fns";
import { useTranslations, useLocale } from "next-intl";
import { getDateLocale } from "@/lib/date-locale";
import { useLongPress } from "@/hooks/use-long-press";
import type { Transaction } from "./history-constants";

function fmtDateRow(
  iso: string,
  locale: Locale,
  tCommon: (key: string) => string,
): string {
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
  /** Hold-press on a row; the page uses it to enter select mode. */
  onLongPressRow: (tx: Transaction) => void;
  rangeLabel: string;
}

export function HistoryList({
  transactions,
  selectMode,
  selected,
  onToggleSelect,
  onTapRow,
  onLongPressRow,
  rangeLabel,
}: HistoryListProps) {
  return (
    <div className="flex flex-col gap-px px-3">
      {transactions.map((tx) => (
        <HistoryRow
          key={tx.id}
          tx={tx}
          selectMode={selectMode}
          selected={selected.has(tx.id)}
          onTap={() => {
            if (selectMode) onToggleSelect(tx.id);
            else onTapRow(tx);
          }}
          onLongPress={() => onLongPressRow(tx)}
        />
      ))}

      {/* End cap */}
      <div className="text-fg-2 flex justify-center py-4 font-mono text-[11px] tracking-[0.04em]">
        That&apos;s all for {rangeLabel.toLowerCase()}
      </div>
    </div>
  );
}

function HistoryRow({
  tx,
  selectMode,
  selected: sel,
  onTap,
  onLongPress,
}: {
  tx: Transaction;
  selectMode: boolean;
  selected: boolean;
  onTap: () => void;
  onLongPress: () => void;
}) {
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const dateLocale = getDateLocale(locale);
  const longPress = useLongPress(onLongPress);
  const isIncome = tx.type === "Income";

  return (
    <div
      {...longPress}
      onClick={onTap}
      className={cn(
        "grid cursor-pointer items-center gap-3 rounded-sm px-3 py-3 transition-colors select-none [-webkit-touch-callout:none]",
        selectMode
          ? "grid-cols-[22px_40px_1fr_auto]"
          : "grid-cols-[40px_1fr_auto]",
        sel ? "bg-brand-soft" : "hover:bg-bg-1",
      )}
    >
      {/* Checkbox in select mode */}
      {selectMode && (
        <div
          className={cn(
            "flex h-[22px] w-[22px] items-center justify-center rounded-md border-[1.5px] transition-colors",
            sel
              ? "bg-brand border-brand text-brand-ink"
              : "bg-bg-1 border-line",
          )}
        >
          {sel && <Check size={12} strokeWidth={2.5} />}
        </div>
      )}

      {/* Icon avatar */}
      <div className="bg-bg-2 border-line flex h-10 w-10 items-center justify-center rounded-xl border text-[17px]">
        {tx.category_icon || "💰"}
      </div>

      {/* Body */}
      <div className="min-w-0">
        <div className="text-fg-0 flex items-center gap-1.5 truncate text-[14px] font-medium">
          {tx.merchant || tx.category_name || tx.category}
          {tx.recurring_transaction_id && (
            <Repeat
              size={10}
              strokeWidth={2}
              className="text-fg-2 flex-shrink-0"
            />
          )}
        </div>
        <div className="text-fg-2 mt-0.5 flex items-center gap-1.5 truncate font-mono text-[11px]">
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
            "font-mono text-[14px] font-medium whitespace-nowrap tabular-nums",
            isIncome ? "text-pos" : "text-fg-0",
          )}
        >
          {isIncome ? "+" : "\u2212"} Rp{" "}
          {Number(tx.amount).toLocaleString("id-ID")}
        </div>
      </div>
    </div>
  );
}
