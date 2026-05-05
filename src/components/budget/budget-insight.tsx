"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { fmtIDRShort } from "@/lib/format";
import { MONTH_NAMES } from "./budget-constants";

interface BudgetInsightProps {
  month: number;
}

export function BudgetInsight({ month }: BudgetInsightProps) {
  return (
    <div className="mx-4 p-4 rounded-lg bg-bg-1 border border-line">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-md bg-brand-soft text-brand flex items-center justify-center">
          <Sparkles size={13} strokeWidth={1.75} />
        </div>
        <span className="text-[12px] font-semibold text-fg-0">Insight</span>
      </div>
      <p className="text-[12px] text-fg-1 leading-relaxed">
        You&apos;re{" "}
        <span className="text-pos font-medium">{fmtIDRShort(420_000)} ahead</span>{" "}
        of your typical {MONTH_NAMES[month]} pace. Entertainment is over budget
        &mdash; consider rolling {fmtIDRShort(200_000)} from Shopping.
      </p>
      <div className="flex items-center gap-2 mt-3">
        <button className="h-8 px-3 rounded-sm text-[12px] text-fg-1 border border-line bg-bg-2 cursor-pointer hover:bg-bg-3 transition-colors">
          Dismiss
        </button>
        <button className="h-8 px-3 rounded-sm text-[12px] font-medium text-brand-ink bg-brand cursor-pointer hover:bg-brand-hi transition-colors">
          Reallocate
        </button>
      </div>
    </div>
  );
}
