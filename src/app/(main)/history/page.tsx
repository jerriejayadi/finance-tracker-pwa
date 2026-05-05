"use client";

import * as React from "react";
import {
  Search,
  X,
  SlidersHorizontal,
  ChevronDown,
  Check,
  Tag,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtIDRShort } from "@/lib/format";
import { Chip } from "@/components/ui/chip";
import { HistorySummary } from "@/components/history/history-summary";
import { HistoryList } from "@/components/history/history-list";
import {
  HistoryEmptyState,
  HistoryNoResults,
} from "@/components/history/history-empty-states";
import { HistoryFilterDrawer } from "@/components/history/history-filter-drawer";
import { TxDetailDrawer } from "@/components/history/tx-detail-drawer";
import {
  MOCK_TRANSACTIONS,
  DATE_RANGES,
  DEFAULT_FILTERS,
  type Filters,
  type Transaction,
} from "@/components/history/history-constants";
import { useAddTransaction } from "../layout";

export default function HistoryPage() {
  const openAddTx = useAddTransaction();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQ, setSearchQ] = React.useState("");
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [detailTx, setDetailTx] = React.useState<Transaction | null>(null);
  const [selectMode, setSelectMode] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<number>>(new Set());
  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS);

  // Filtered transactions
  const filteredTx = React.useMemo(() => {
    return MOCK_TRANSACTIONS.filter((t) => {
      if (filters.type !== "all" && t.type !== filters.type) return false;
      if (filters.cats.length && !filters.cats.includes(t.category))
        return false;
      if (filters.accts.length && !filters.accts.includes(t.account))
        return false;
      if (filters.amtMin && t.amount < filters.amtMin) return false;
      if (filters.amtMax && t.amount > filters.amtMax) return false;
      if (searchQ) {
        const q = searchQ.toLowerCase();
        if (
          !t.merchant.toLowerCase().includes(q) &&
          !t.category.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [filters, searchQ]);

  // Active filter chips for display
  const activeChips = React.useMemo(() => {
    const chips: { key: string; label: string; onClear: () => void }[] = [];
    if (filters.range !== "30d") {
      const r = DATE_RANGES.find((x) => x.id === filters.range);
      chips.push({
        key: "range",
        label: r?.label || filters.range,
        onClear: () => setFilters((f) => ({ ...f, range: "30d" })),
      });
    }
    if (filters.type !== "all") {
      chips.push({
        key: "type",
        label: filters.type === "income" ? "Income" : "Expense",
        onClear: () => setFilters((f) => ({ ...f, type: "all" })),
      });
    }
    filters.cats.forEach((c) =>
      chips.push({
        key: "cat-" + c,
        label: c,
        onClear: () =>
          setFilters((f) => ({ ...f, cats: f.cats.filter((x) => x !== c) })),
      })
    );
    filters.accts.forEach((a) =>
      chips.push({
        key: "acct-" + a,
        label: a,
        onClear: () =>
          setFilters((f) => ({ ...f, accts: f.accts.filter((x) => x !== a) })),
      })
    );
    if (filters.amtMin || filters.amtMax) {
      chips.push({
        key: "amt",
        label:
          (filters.amtMin ? fmtIDRShort(filters.amtMin) : "0") +
          "\u2013" +
          (filters.amtMax ? fmtIDRShort(filters.amtMax) : "\u221E"),
        onClear: () => setFilters((f) => ({ ...f, amtMin: 0, amtMax: 0 })),
      });
    }
    return chips;
  }, [filters]);

  const rangeLabel =
    DATE_RANGES.find((r) => r.id === filters.range)?.label || "Last 30 days";
  const isEmpty = MOCK_TRANSACTIONS.length === 0;
  const isNoResults = !isEmpty && filteredTx.length === 0;

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setSelected(new Set());
  };

  return (
    <main className="flex flex-col gap-3 pb-4">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-1">
        {selectMode ? (
          <>
            <button
              onClick={exitSelectMode}
              className="w-8 h-8 rounded-full bg-bg-1 border border-line flex items-center justify-center text-fg-1 cursor-pointer hover:bg-bg-2 transition-colors"
            >
              <X size={14} strokeWidth={1.75} />
            </button>
            <div className="flex-1">
              <div className="text-[17px] font-semibold text-fg-0">
                {selected.size} selected
              </div>
            </div>
            <button
              onClick={() =>
                setSelected(new Set(filteredTx.map((t) => t.id)))
              }
              className="w-8 h-8 rounded-full bg-bg-1 border border-line flex items-center justify-center text-fg-1 cursor-pointer hover:bg-bg-2 transition-colors"
              title="Select all"
            >
              <Check size={14} strokeWidth={1.75} />
            </button>
          </>
        ) : (
          <>
            <div className="flex-1">
              <div className="text-[17px] font-semibold text-fg-0">
                Transactions
              </div>
              <div className="text-[11px] text-fg-2 font-mono mt-0.5">
                {rangeLabel}
              </div>
            </div>
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="w-8 h-8 rounded-full bg-bg-1 border border-line flex items-center justify-center text-fg-1 cursor-pointer hover:bg-bg-2 transition-colors"
              title="Search"
            >
              <Search size={14} strokeWidth={1.75} />
            </button>
            <button
              onClick={() => setSelectMode(true)}
              className="w-8 h-8 rounded-full bg-bg-1 border border-line flex items-center justify-center text-fg-1 cursor-pointer hover:bg-bg-2 transition-colors"
              title="Select multiple"
            >
              <Check size={14} strokeWidth={1.75} />
            </button>
          </>
        )}
      </div>

      {/* Search bar */}
      {searchOpen && !selectMode && (
        <div className="mx-4 flex items-center gap-2.5 h-10 px-3.5 bg-bg-1 border border-line rounded-sm">
          <Search size={14} strokeWidth={1.75} className="text-fg-2" />
          <input
            autoFocus
            placeholder="Search merchant or note\u2026"
            className="flex-1 bg-transparent text-[14px] text-fg-0 outline-none placeholder:text-fg-2"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
          {searchQ && (
            <button
              onClick={() => setSearchQ("")}
              className="w-5 h-5 rounded-full bg-bg-2 border border-line flex items-center justify-center text-fg-1 cursor-pointer"
            >
              <X size={10} strokeWidth={2} />
            </button>
          )}
        </div>
      )}

      {/* Summary */}
      {!isEmpty && <HistorySummary transactions={filteredTx} />}

      {/* Filter strip */}
      {!isEmpty && !selectMode && (
        <div className="flex items-center gap-2 overflow-x-auto px-4 hide-scrollbar">
          <button
            onClick={() => setFilterOpen(true)}
            className="flex-shrink-0 inline-flex items-center gap-1.5 h-[30px] px-3 rounded-full bg-bg-1 border border-line text-[12px] font-medium text-fg-0 cursor-pointer hover:bg-bg-2 transition-colors"
          >
            <SlidersHorizontal size={13} strokeWidth={1.75} />
            Filters
            {activeChips.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-brand text-brand-ink text-[10px] font-mono font-semibold flex items-center justify-center">
                {activeChips.length}
              </span>
            )}
          </button>

          {activeChips.length === 0 ? (
            <>
              <span className="flex-shrink-0 h-[30px] px-3 rounded-full border border-dashed border-line text-[12px] text-fg-2 inline-flex items-center">
                All categories
              </span>
              <span className="flex-shrink-0 h-[30px] px-3 rounded-full border border-dashed border-line text-[12px] text-fg-2 inline-flex items-center">
                All accounts
              </span>
            </>
          ) : (
            activeChips.map((c) => (
              <button
                key={c.key}
                onClick={c.onClear}
                className="flex-shrink-0 inline-flex items-center gap-1.5 h-[30px] px-3 rounded-full bg-brand-soft border border-brand text-[12px] font-medium text-brand cursor-pointer hover:brightness-110 transition-all"
              >
                {c.label}
                <X size={11} strokeWidth={2.25} />
              </button>
            ))
          )}
        </div>
      )}

      {/* Result count + sort */}
      {!isEmpty && !isNoResults && !selectMode && (
        <div className="flex justify-between items-center px-5 text-[11px] text-fg-2 font-mono uppercase tracking-[0.05em]">
          <span>{filteredTx.length} transactions</span>
          <button className="flex items-center gap-1 text-fg-1 normal-case tracking-normal cursor-pointer hover:text-fg-0">
            Newest first
            <ChevronDown size={11} strokeWidth={1.75} />
          </button>
        </div>
      )}

      {/* Content */}
      {isEmpty ? (
        <HistoryEmptyState onAdd={() => openAddTx("expense")} />
      ) : isNoResults ? (
        <HistoryNoResults
          query={searchQ}
          onClear={() => {
            setSearchQ("");
            setFilters(DEFAULT_FILTERS);
          }}
        />
      ) : (
        <HistoryList
          transactions={filteredTx}
          selectMode={selectMode}
          selected={selected}
          onToggleSelect={toggleSelect}
          onTapRow={(tx) => setDetailTx(tx)}
          rangeLabel={rangeLabel}
        />
      )}

      {/* Bulk action bar */}
      {selectMode && selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 flex gap-2.5 px-4 py-3.5 pb-[calc(14px+env(safe-area-inset-bottom))] bg-bg-0/90 backdrop-blur-[18px] border-t border-line z-40">
          <button className="flex-1 h-11 rounded-sm bg-bg-2 border border-line text-fg-0 text-[13px] font-medium flex items-center justify-center gap-2 cursor-pointer hover:bg-bg-3 transition-colors">
            <Tag size={14} strokeWidth={1.75} />
            Recategorize
          </button>
          <button className="flex-1 h-11 rounded-sm bg-neg text-white text-[13px] font-medium flex items-center justify-center gap-2 cursor-pointer hover:brightness-105 transition-all">
            <Trash2 size={14} strokeWidth={1.75} />
            Delete ({selected.size})
          </button>
        </div>
      )}

      {/* Drawers */}
      <HistoryFilterDrawer
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onApply={setFilters}
      />
      <TxDetailDrawer
        open={!!detailTx}
        onOpenChange={(open) => {
          if (!open) setDetailTx(null);
        }}
        tx={detailTx}
      />
    </main>
  );
}
