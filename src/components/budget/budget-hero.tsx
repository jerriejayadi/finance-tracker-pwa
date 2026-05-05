"use client";

import { fmtIDR } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Calendar } from "lucide-react";
import { MONTH_NAMES } from "./budget-constants";
import type { BudgetCategory } from "./budget-types";

function pctOf(spent: number, budget: number): number {
  if (budget <= 0) return 0;
  return Math.min(999, (spent / budget) * 100);
}

interface BudgetHeroProps {
  categories: BudgetCategory[];
  year: number;
  month: number;
}

export function BudgetHero({ categories, year, month }: BudgetHeroProps) {
  const totalBudget = categories.reduce((a, c) => a + c.budget, 0);
  const totalSpent = categories.reduce((a, c) => a + c.spent, 0);
  const remaining = totalBudget - totalSpent;
  const overall = pctOf(totalSpent, totalBudget);

  const R = 64;
  const C = 2 * Math.PI * R;
  const dash = (overall / 100) * C;

  const monthDays = new Date(year, month + 1, 0).getDate();
  const today = new Date().getDate();
  const daysLeft = Math.max(0, monthDays - today);

  return (
    <div className="bg-bg-1 border-line mx-4 flex items-center gap-4 rounded-lg border p-5">
      {/* Donut */}
      <svg
        width="140"
        height="140"
        viewBox="0 0 160 160"
        className="flex-shrink-0"
      >
        <circle
          cx="80"
          cy="80"
          r={R}
          stroke="var(--bg-3)"
          strokeWidth="10"
          fill="none"
        />
        <circle
          cx="80"
          cy="80"
          r={R}
          stroke={
            overall >= 100
              ? "var(--neg)"
              : overall >= 85
                ? "var(--warn)"
                : "var(--brand)"
          }
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${C}`}
          transform="rotate(-90 80 80)"
          className="transition-all duration-500"
        />
        <text
          x="80"
          y="74"
          textAnchor="middle"
          className="fill-fg-0 font-mono text-[22px] font-semibold"
        >
          {Math.round(overall)}%
        </text>
        <text
          x="80"
          y="94"
          textAnchor="middle"
          className="fill-fg-2 text-[11px]"
        >
          used
        </text>
      </svg>

      {/* Stats */}
      <div className="flex min-w-0 flex-col gap-1.5">
        <div className="flex flex-col items-baseline justify-between gap-2">
          <span className="text-fg-2 text-[11px]">Spent</span>
          <span className="font-mono text-[13px] font-medium tabular-nums">
            {fmtIDR(totalSpent)}
          </span>
        </div>
        <div className="flex flex-col items-baseline justify-between gap-2">
          <span className="text-fg-2 text-[11px]">Budget</span>
          <span className="text-fg-1 font-mono text-[13px] tabular-nums">
            {fmtIDR(totalBudget)}
          </span>
        </div>
        <div className="bg-line my-1 h-px" />
        <div className="flex flex-col items-baseline justify-between gap-2">
          <span className="text-fg-0 text-[11px] font-medium">Remaining</span>
          <span
            className={cn(
              "font-mono text-[13px] font-medium tabular-nums",
              remaining < 0 ? "text-neg" : "text-pos",
            )}
          >
            {fmtIDR(remaining)}
          </span>
        </div>
        <div className="text-fg-2 mt-1 flex items-center gap-1.5 text-[11px]">
          <Calendar size={11} strokeWidth={1.75} />
          <span>
            {daysLeft} days left in {MONTH_NAMES[month]}
          </span>
        </div>
      </div>
    </div>
  );
}
