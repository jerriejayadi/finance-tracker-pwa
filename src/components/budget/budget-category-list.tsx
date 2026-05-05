"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { fmtIDRShort } from "@/lib/format";
import type { BudgetCategory } from "./budget-types";

function pctOf(spent: number, budget: number): number {
  if (budget <= 0) return 0;
  return Math.min(999, (spent / budget) * 100);
}

function fillColor(spent: number, budget: number): string {
  const pct = pctOf(spent, budget);
  if (pct >= 100) return "var(--neg)";
  if (pct >= 85) return "var(--warn)";
  return "var(--brand)";
}

interface BudgetCategoryListProps {
  categories: BudgetCategory[];
}

export function BudgetCategoryList({ categories }: BudgetCategoryListProps) {
  return (
    <div className="px-4 flex flex-col gap-1">
      {categories.map((c) => {
        const pct = pctOf(c.spent, c.budget);
        const over = c.spent > c.budget;
        const left = c.budget - c.spent;

        return (
          <div
            key={c.id}
            className={cn(
              "p-3.5 rounded-lg bg-bg-1 border border-line",
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
                    {c.recent} transactions
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
                    ? `Over by ${fmtIDRShort(Math.abs(left))}`
                    : `${fmtIDRShort(left)} left`}
                </div>
              </div>
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
          </div>
        );
      })}
    </div>
  );
}
