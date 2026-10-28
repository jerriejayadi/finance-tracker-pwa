"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { fmtIDRShort } from "@/lib/format";
import { budgetPct as pctOf } from "./budget-constants";
import type { BudgetCategory } from "./budget-types";

interface BudgetIncomeListProps {
  /** Income rows: `spent` is the amount received, `budget` the amount expected */
  categories: BudgetCategory[];
  /** "YYYY-MM" of the month being shown, passed through to the detail page */
  monthKey: string;
}

/** Income categories: received vs expected. Receiving more than expected is fine, so no over state. */
export function BudgetIncomeList({ categories, monthKey }: BudgetIncomeListProps) {
  const t = useTranslations("budget");
  return (
    <div className="px-4 flex flex-col gap-1">
      {categories.map((c) => {
        const received = c.spent >= c.budget;

        return (
          <Link
            key={c.id}
            href={`/budget/category?id=${c.id}&month=${monthKey}`}
            className="block p-3.5 rounded-lg bg-bg-1 border border-line transition-colors hover:bg-bg-2 active:bg-bg-2"
          >
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-bg-2 border border-line flex items-center justify-center text-[18px]">
                  {c.icon}
                </div>
                <div>
                  <div className="text-[13px] font-medium text-fg-0">{c.name}</div>
                  <div className="text-[11px] text-fg-2">
                    {t("transactionCount", { count: c.count })}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[12px] font-mono tabular-nums">
                  <span className="text-fg-0 font-medium">{fmtIDRShort(c.spent)}</span>
                  <span className="text-fg-2"> / {fmtIDRShort(c.budget)}</span>
                </div>
                <div
                  className={cn(
                    "text-[11px] font-mono tabular-nums mt-0.5",
                    received ? "text-pos" : "text-fg-2"
                  )}
                >
                  {received ? "Received" : `${fmtIDRShort(c.budget - c.spent)} to go`}
                </div>
              </div>
              <ChevronRight size={14} strokeWidth={1.75} className="text-fg-3 ml-1 flex-shrink-0" />
            </div>

            {/* Progress bar */}
            <div className="mt-2.5 h-[5px] bg-bg-3 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-pos transition-all duration-500"
                style={{ width: Math.min(100, pctOf(c.spent, c.budget)) + "%" }}
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
