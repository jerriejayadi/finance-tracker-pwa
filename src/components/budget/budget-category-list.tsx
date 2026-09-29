"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { fmtIDRShort } from "@/lib/format";
import { budgetFillColor as fillColor, budgetPct as pctOf } from "./budget-constants";
import type { BudgetCategory } from "./budget-types";

interface BudgetCategoryListProps {
  categories: BudgetCategory[];
  /** "YYYY-MM" of the month being shown, passed through to the detail page */
  monthKey: string;
}

export function BudgetCategoryList({ categories, monthKey }: BudgetCategoryListProps) {
  const t = useTranslations("budget");
  return (
    <div className="px-4 flex flex-col gap-1">
      {categories.map((c) => {
        const pct = pctOf(c.spent, c.budget);
        const over = c.spent > c.budget;
        const left = c.budget - c.spent;

        return (
          <Link
            key={c.id}
            href={`/budget/category?id=${c.id}&month=${monthKey}`}
            className={cn(
              "block p-3.5 rounded-lg bg-bg-1 border border-line transition-colors hover:bg-bg-2 active:bg-bg-2",
              over && "border-neg/30"
            )}
          >
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-bg-2 border border-line flex items-center justify-center text-[18px]">
                  {c.icon}
                </div>
                <div>
                  <div className="text-[13px] font-medium text-fg-0">
                    {c.name}
                  </div>
                  <div className="text-[11px] text-fg-2">
                    {t("transactionCount", { count: c.count })}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[12px] font-mono tabular-nums">
                  <span className="text-fg-0 font-medium">
                    {fmtIDRShort(c.spent)}
                  </span>
                  <span className="text-fg-2"> / {fmtIDRShort(c.budget)}</span>
                </div>
                <div
                  className={cn(
                    "text-[11px] font-mono tabular-nums mt-0.5",
                    over
                      ? "text-neg"
                      : left < c.budget * 0.15
                        ? "text-warn"
                        : "text-fg-2"
                  )}
                >
                  {over
                    ? t("overBy", { amount: fmtIDRShort(Math.abs(left)) })
                    : t("left", { amount: fmtIDRShort(left) })}
                </div>
              </div>
              <ChevronRight size={14} strokeWidth={1.75} className="text-fg-3 ml-1 flex-shrink-0" />
            </div>

            {/* Progress bar */}
            <div className="mt-2.5 h-[5px] bg-bg-3 rounded-full overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: Math.min(100, pct) + "%",
                  background: fillColor(c.spent, c.budget),
                }}
              />
              {over && (
                <div
                  className="absolute top-0 right-0 h-full rounded-full bg-neg/40"
                  style={{ width: Math.min(100, pct - 100) + "%" }}
                />
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
