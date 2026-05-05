"use client";

import * as React from "react";
import { fmtIDR } from "@/lib/format";
import type { BudgetCategory } from "./budget-types";
import { MONTH_NAMES } from "./budget-constants";

interface BudgetPaceProps {
  categories: BudgetCategory[];
  year: number;
  month: number;
}

export function BudgetPace({ categories, year, month }: BudgetPaceProps) {
  const totalBudget = categories.reduce((a, c) => a + c.budget, 0);
  const totalSpent = categories.reduce((a, c) => a + c.spent, 0);
  const remaining = totalBudget - totalSpent;

  const monthDays = new Date(year, month + 1, 0).getDate();
  const today = new Date().getDate();
  const daysLeft = Math.max(0, monthDays - today);
  const dailyAvg = today > 0 ? totalSpent / today : 0;
  const safe = daysLeft > 0 ? Math.max(0, remaining / daysLeft) : 0;

  return (
    <div className="mx-4 grid grid-cols-[1fr_1px_1fr] bg-bg-1 border border-line rounded-md py-3.5 items-center">
      <div className="px-4">
        <div className="text-[11px] text-fg-2 uppercase tracking-[0.04em]">
          Daily avg
        </div>
        <div className="font-mono tabular-nums text-[15px] font-medium mt-0.5">
          {fmtIDR(dailyAvg)}
        </div>
        <div className="text-[10px] text-pos mt-0.5">&#9660; 8% vs last mo</div>
      </div>
      <div className="w-px h-7 bg-line" />
      <div className="px-4">
        <div className="text-[11px] text-fg-2 uppercase tracking-[0.04em]">
          Safe to spend
        </div>
        <div className="font-mono tabular-nums text-[15px] font-medium mt-0.5">
          {fmtIDR(safe)}
          <span className="text-[11px] text-fg-2 font-normal">/day</span>
        </div>
        <div className="text-[10px] text-fg-2 mt-0.5">
          until {MONTH_NAMES[month].slice(0, 3)} {monthDays}
        </div>
      </div>
    </div>
  );
}
