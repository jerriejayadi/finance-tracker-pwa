"use client";

import * as React from "react";
import { Plus, Tag, Bell, Repeat } from "lucide-react";
import { MONTH_NAMES } from "./budget-constants";

interface BudgetEmptyStateProps {
  year: number;
  month: number;
  hasPreviousBudgets: boolean;
  onCreate: () => void;
  onCopyFromTemplate: () => void;
}

export function BudgetEmptyState({
  year,
  month,
  hasPreviousBudgets,
  onCreate,
  onCopyFromTemplate,
}: BudgetEmptyStateProps) {

  return (
    <div className="flex flex-col items-center px-6 pt-8">
      {/* Illustration */}
      <svg
        width="200"
        height="140"
        viewBox="0 0 200 140"
        fill="none"
        className="mb-5"
      >
        <rect
          x="20"
          y="40"
          width="160"
          height="84"
          rx="14"
          fill="var(--bg-1)"
          stroke="var(--line)"
        />
        <rect x="36" y="58" width="60" height="6" rx="3" fill="var(--bg-3)" />
        <rect x="36" y="72" width="128" height="4" rx="2" fill="var(--bg-2)" />
        <rect
          x="36"
          y="72"
          width="40"
          height="4"
          rx="2"
          fill="var(--brand)"
          opacity="0.6"
        />
        <rect x="36" y="86" width="128" height="4" rx="2" fill="var(--bg-2)" />
        <rect
          x="36"
          y="86"
          width="76"
          height="4"
          rx="2"
          fill="var(--brand)"
          opacity="0.4"
        />
        <rect
          x="36"
          y="100"
          width="128"
          height="4"
          rx="2"
          fill="var(--bg-2)"
        />
        <rect
          x="36"
          y="100"
          width="22"
          height="4"
          rx="2"
          fill="var(--brand)"
          opacity="0.3"
        />
        <circle
          cx="156"
          cy="38"
          r="18"
          fill="var(--brand-soft)"
          stroke="var(--brand)"
          strokeDasharray="2 3"
        />
        <path
          d="M156 32 v12 M150 38 h12"
          stroke="var(--brand)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>

      <h2 className="text-[20px] font-semibold text-fg-0 text-center">
        No budget for {MONTH_NAMES[month]}
      </h2>
      <p className="text-[14px] text-fg-1 text-center mt-2 max-w-[30ch]">
        Set monthly limits per category to keep your spending on track for{" "}
        {MONTH_NAMES[month]} {year}.
      </p>

      <button
        onClick={onCreate}
        className="mt-5 h-11 px-5 rounded-sm bg-brand text-brand-ink text-[14px] font-medium flex items-center gap-2 cursor-pointer hover:bg-brand-hi transition-colors"
      >
        <Plus size={16} strokeWidth={1.75} />
        Create budget for {MONTH_NAMES[month]}
      </button>

      {hasPreviousBudgets && (
        <button
          onClick={onCopyFromTemplate}
          className="mt-3 h-9 px-4 rounded-sm bg-bg-2 border border-line text-[13px] text-fg-0 font-medium flex items-center gap-2 cursor-pointer hover:bg-bg-3 hover:border-brand transition-colors"
        >
          <Repeat size={14} strokeWidth={1.75} />
          Copy from template
        </button>
      )}

      {/* Tips */}
      <div className="mt-6 w-full flex flex-col gap-3">
        <Tip icon={<Tag size={14} strokeWidth={1.75} />} title="Per-category limits">
          Track Groceries, Food, Transport separately.
        </Tip>
        <Tip icon={<Bell size={14} strokeWidth={1.75} />} title="Smart alerts">
          Get notified at 85% and when you go over.
        </Tip>
        <Tip icon={<Repeat size={14} strokeWidth={1.75} />} title="Auto-recurring">
          Roll the same setup forward every month.
        </Tip>
      </div>
    </div>
  );
}

function Tip({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-brand-soft text-brand flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div>
        <div className="text-[13px] font-medium text-fg-0">{title}</div>
        <div className="text-[12px] text-fg-2">{children}</div>
      </div>
    </div>
  );
}
