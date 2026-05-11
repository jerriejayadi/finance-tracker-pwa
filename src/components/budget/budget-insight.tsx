"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { fmtIDRShort } from "@/lib/format";
import { MONTH_NAMES } from "./budget-constants";
import type { BudgetCategory } from "./budget-types";

interface BudgetInsightProps {
  month: number;
  categories: BudgetCategory[];
  onReallocate: (fromId: string, toId: string, amount: number) => void;
}

function computeInsight(categories: BudgetCategory[]) {
  if (categories.length === 0) return null;

  // Find most over-budget category (highest spent/budget ratio > 100%)
  let overCat: BudgetCategory | null = null;
  let overRatio = 1;
  for (const c of categories) {
    if (c.budget <= 0) continue;
    const ratio = c.spent / c.budget;
    if (ratio > overRatio && ratio > 1) {
      overCat = c;
      overRatio = ratio;
    }
  }

  // Find category with most surplus (lowest spent/budget ratio)
  let surplusCat: BudgetCategory | null = null;
  let surplusAmount = 0;
  for (const c of categories) {
    if (c.budget <= 0) continue;
    const surplus = c.budget - c.spent;
    if (surplus > surplusAmount && c.id !== overCat?.id) {
      surplusCat = c;
      surplusAmount = surplus;
    }
  }

  if (!overCat) {
    // Nothing over budget — positive message
    const totalBudget = categories.reduce((s, c) => s + c.budget, 0);
    const totalSpent = categories.reduce((s, c) => s + c.spent, 0);
    const ahead = totalBudget - totalSpent;
    return {
      type: "positive" as const,
      message: ahead > 0
        ? `You're ${fmtIDRShort(ahead)} under budget. On track!`
        : "You're right on budget this month.",
      overCat: null,
      surplusCat: null,
      suggestedAmount: 0,
    };
  }

  const overAmount = overCat.spent - overCat.budget;
  const suggestedAmount = surplusCat ? Math.min(overAmount, surplusAmount) : 0;

  return {
    type: "warning" as const,
    overCat,
    surplusCat,
    suggestedAmount,
    message: surplusCat
      ? `${overCat.name} is over budget \u2014 consider rolling ${fmtIDRShort(suggestedAmount)} from ${surplusCat.name}.`
      : `${overCat.name} is ${fmtIDRShort(overAmount)} over budget.`,
  };
}

export function BudgetInsight({ month, categories, onReallocate }: BudgetInsightProps) {
  const [dismissed, setDismissed] = React.useState(false);
  const insight = React.useMemo(() => computeInsight(categories), [categories]);

  if (dismissed || !insight) return null;

  return (
    <div className="mx-4 p-4 rounded-lg bg-bg-1 border border-line">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-md bg-brand-soft text-brand flex items-center justify-center">
          <Sparkles size={13} strokeWidth={1.75} />
        </div>
        <span className="text-[12px] font-semibold text-fg-0">
          {MONTH_NAMES[month]} Insight
        </span>
      </div>
      <p className="text-[12px] text-fg-1 leading-relaxed">
        {insight.type === "positive" ? (
          <span className="text-pos font-medium">{insight.message}</span>
        ) : (
          insight.message
        )}
      </p>
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => setDismissed(true)}
          className="h-8 px-3 rounded-sm text-[12px] text-fg-1 border border-line bg-bg-2 cursor-pointer hover:bg-bg-3 transition-colors"
        >
          Dismiss
        </button>
        {insight.type === "warning" && insight.overCat && insight.surplusCat && insight.suggestedAmount > 0 && (
          <button
            onClick={() => onReallocate(insight.surplusCat!.id, insight.overCat!.id, insight.suggestedAmount)}
            className="h-8 px-3 rounded-sm text-[12px] font-medium text-brand-ink bg-brand cursor-pointer hover:bg-brand-hi transition-colors"
          >
            Reallocate
          </button>
        )}
      </div>
    </div>
  );
}
