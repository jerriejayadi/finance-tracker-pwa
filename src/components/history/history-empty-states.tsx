"use client";

import { Plus } from "lucide-react";

interface HistoryEmptyStateProps {
  onAdd: () => void;
}

export function HistoryEmptyState({ onAdd }: HistoryEmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center px-6 pt-10">
      <svg
        width="180"
        height="140"
        viewBox="0 0 180 140"
        fill="none"
        className="mb-5"
      >
        <rect
          x="20"
          y="28"
          width="140"
          height="92"
          rx="14"
          fill="var(--bg-1)"
          stroke="var(--line)"
        />
        <rect x="36" y="46" width="44" height="6" rx="3" fill="var(--bg-3)" />
        <rect x="36" y="60" width="108" height="3" rx="1.5" fill="var(--bg-2)" />
        <rect x="36" y="72" width="84" height="3" rx="1.5" fill="var(--bg-2)" />
        <rect x="36" y="84" width="100" height="3" rx="1.5" fill="var(--bg-2)" />
        <rect x="36" y="96" width="60" height="3" rx="1.5" fill="var(--bg-2)" />
        <circle
          cx="142"
          cy="32"
          r="14"
          fill="var(--brand-soft)"
          stroke="var(--brand)"
          strokeDasharray="2 3"
        />
        <path
          d="M142 27v10M137 32h10"
          stroke="var(--brand)"
          strokeWidth="1.75"
          strokeLinecap="round"
        />
      </svg>
      <h2 className="text-[20px] font-semibold text-fg-0">
        No transactions yet
      </h2>
      <p className="text-[13px] text-fg-1 mt-2 max-w-[30ch] leading-relaxed">
        Tap the + button to log your first expense or income. Your history will
        live here.
      </p>
      <button
        onClick={onAdd}
        className="mt-5 w-full h-12 rounded-sm bg-brand text-brand-ink text-[14px] font-semibold flex items-center justify-center gap-2 cursor-pointer hover:bg-brand-hi transition-colors"
      >
        <Plus size={16} strokeWidth={1.75} />
        Add transaction
      </button>
    </div>
  );
}

interface HistoryNoResultsProps {
  query: string;
  onClear: () => void;
}

export function HistoryNoResults({ query, onClear }: HistoryNoResultsProps) {
  return (
    <div className="flex flex-col items-center text-center px-6 pt-10">
      <svg
        width="80"
        height="80"
        viewBox="0 0 80 80"
        fill="none"
        className="mb-5 opacity-70"
      >
        <circle cx="34" cy="34" r="22" stroke="var(--line)" strokeWidth="2" />
        <path
          d="m51 51 14 14"
          stroke="var(--line)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M28 34h12M34 28v12"
          stroke="var(--fg-2)"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.5"
          transform="rotate(45 34 34)"
        />
      </svg>
      <h2 className="text-[20px] font-semibold text-fg-0">No matches</h2>
      <p className="text-[13px] text-fg-1 mt-2 max-w-[30ch] leading-relaxed">
        {query ? (
          <>
            Nothing matches &ldquo;<b className="text-fg-0">{query}</b>&rdquo;
            with the current filters.
          </>
        ) : (
          <>
            No transactions match the current filters. Try widening the date
            range or clearing some filters.
          </>
        )}
      </p>
      <button
        onClick={onClear}
        className="mt-5 w-full h-12 rounded-sm bg-bg-2 border border-line text-fg-0 text-[14px] font-semibold flex items-center justify-center cursor-pointer hover:bg-bg-3 transition-colors"
      >
        Clear all filters
      </button>
    </div>
  );
}
