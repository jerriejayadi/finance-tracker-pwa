"use client";

import { ChevronRight, X } from "lucide-react";

interface BudgetNudgeProps {
  month: string;
  onSetup: () => void;
  onDismiss: () => void;
}

export function BudgetNudge({ month, onSetup, onDismiss }: BudgetNudgeProps) {
  return (
    <div className="bg-brand-soft mx-4 flex items-center gap-2 rounded-lg px-3.5 py-2.5">
      <span className="text-[14px]">📊</span>
      <button
        onClick={onSetup}
        className="flex flex-1 cursor-pointer items-center gap-1 text-[12px] font-medium text-brand"
      >
        Set up a budget for {month}
        <ChevronRight size={12} strokeWidth={1.75} />
      </button>
      <button
        onClick={onDismiss}
        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-brand/60 hover:text-brand transition-colors"
      >
        <X size={12} strokeWidth={2} />
      </button>
    </div>
  );
}
