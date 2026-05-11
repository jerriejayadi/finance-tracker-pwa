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
import { fmtIDRShort } from "@/lib/format";
import { HistorySummary } from "@/components/history/history-summary";
import { HistoryList } from "@/components/history/history-list";
import {
  HistoryEmptyState,
  HistoryNoResults,
} from "@/components/history/history-empty-states";
import { HistoryFilterDrawer } from "@/components/history/history-filter-drawer";
import { TxDetailDrawer } from "@/components/history/tx-detail-drawer";
import {
  DATE_RANGES,
  DEFAULT_FILTERS,
  type Filters,
  type Transaction,
} from "@/components/history/history-constants";
import { useAddTransaction } from "../layout";
import { useGetTransactions, useDeleteTransactions } from "@/services/transactions/transactions.hooks";
import { useGetCategories } from "@/services/categories/categories.hooks";
import { useGetAccounts } from "@/services/accounts/accounts.hooks";
import { EditTransactionDrawer } from "@/components/transactions/edit-transaction-drawer";
import { cn } from "@/lib/utils";

type SortOption = "newest" | "oldest" | "highest" | "lowest";
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "highest", label: "Highest amount" },
  { value: "lowest", label: "Lowest amount" },
];

export default function HistoryPage() {
  const openAddTx = useAddTransaction();
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQ, setSearchQ] = React.useState("");
  const [filterOpen, setFilterOpen] = React.useState(false);
  const [detailTx, setDetailTx] = React.useState<Transaction | null>(null);
  const [editTx, setEditTx] = React.useState<Transaction | null>(null);
  const [selectMode, setSelectMode] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [filters, setFilters] = React.useState<Filters>(DEFAULT_FILTERS);
  const [sort, setSort] = React.useState<SortOption>("newest");
  const [sortOpen, setSortOpen] = React.useState(false);

  const { data: categories = [] } = useGetCategories();
  const { data: accounts = [] } = useGetAccounts();

  // Compute date range from filters
  const dateRange = React.useMemo(() => {
    const today = new Date();
    let dateFrom: string;
    let dateTo: string = today.toISOString().split("T")[0];
    switch (filters.range) {
      case "7d":
        dateFrom = new Date(today.getTime() - 7 * 86400000).toISOString().split("T")[0];
        break;
      case "30d":
        dateFrom = new Date(today.getTime() - 30 * 86400000).toISOString().split("T")[0];
        break;
      case "this": {
        dateFrom = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
        break;
      }
      case "last": {
        const last = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        dateFrom = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-01`;
        const lastEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        dateTo = lastEnd.toISOString().split("T")[0];
        break;
      }
      default:
        dateFrom = new Date(today.getTime() - 30 * 86400000).toISOString().split("T")[0];
    }
    return { dateFrom, dateTo };
  }, [filters.range]);

  const { data: transactions = [], isLoading } = useGetTransactions({
    filters: {
      type: filters.type !== "all" ? filters.type : undefined,
      categoryIds: filters.cats.length > 0
        ? categories.filter((c) => filters.cats.includes(c.name)).map((c) => c.id)
        : undefined,
      accountIds: filters.accts.length > 0
        ? accounts.filter((a) => filters.accts.includes(a.name)).map((a) => a.id)
        : undefined,
      amtMin: filters.amtMin || undefined,
      amtMax: filters.amtMax || undefined,
      dateFrom: dateRange.dateFrom,
      dateTo: dateRange.dateTo,
      search: searchQ || undefined,
    },
  });

  const deleteTransactions = useDeleteTransactions({
    mutationConfig: { onSuccess: () => exitSelectMode() },
  });

  const sortedTransactions = React.useMemo(() => {
    const txs = [...transactions];
    switch (sort) {
      case "oldest":
        return txs.sort((a, b) => a.date.localeCompare(b.date) || a.created_at.localeCompare(b.created_at));
      case "highest":
        return txs.sort((a, b) => Number(b.amount) - Number(a.amount));
      case "lowest":
        return txs.sort((a, b) => Number(a.amount) - Number(b.amount));
      case "newest":
      default:
        return txs;
    }
  }, [transactions, sort]);

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
  const isEmpty = !isLoading && transactions.length === 0 && !searchQ && filters.type === "all" && filters.cats.length === 0;
  const isNoResults = !isLoading && transactions.length === 0 && !isEmpty;

  const toggleSelect = (id: string) => {
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
                setSelected(new Set(transactions.map((t) => t.id)))
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
      {!isEmpty && <HistorySummary transactions={sortedTransactions} />}

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
          <span>{sortedTransactions.length} transactions</span>
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-1 text-fg-1 normal-case tracking-normal cursor-pointer hover:text-fg-0"
            >
              {SORT_OPTIONS.find((o) => o.value === sort)?.label}
              <ChevronDown size={11} strokeWidth={1.75} />
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 top-full mt-1 z-40 w-40 rounded-lg bg-bg-1 border border-line shadow-lg py-1">
                  {SORT_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => {
                        setSort(o.value);
                        setSortOpen(false);
                      }}
                      className={cn(
                        "w-full px-3 py-2 text-left text-[12px] cursor-pointer transition-colors",
                        sort === o.value
                          ? "text-brand bg-brand-soft font-medium"
                          : "text-fg-1 hover:bg-bg-2"
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-12 text-[13px] text-fg-2">
          Loading...
        </div>
      )}

      {/* Content */}
      {!isLoading && isEmpty ? (
        <HistoryEmptyState onAdd={() => openAddTx("expense")} />
      ) : !isLoading && isNoResults ? (
        <HistoryNoResults
          query={searchQ}
          onClear={() => {
            setSearchQ("");
            setFilters(DEFAULT_FILTERS);
          }}
        />
      ) : !isLoading ? (
        <HistoryList
          transactions={sortedTransactions}
          selectMode={selectMode}
          selected={selected}
          onToggleSelect={toggleSelect}
          onTapRow={(tx) => setDetailTx(tx)}
          rangeLabel={rangeLabel}
        />
      ) : null}

      {/* Bulk action bar */}
      {selectMode && selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 flex gap-2.5 px-4 py-3.5 pb-[calc(14px+env(safe-area-inset-bottom))] bg-bg-0/90 backdrop-blur-[18px] border-t border-line z-40">
          <button className="flex-1 h-11 rounded-sm bg-bg-2 border border-line text-fg-0 text-[13px] font-medium flex items-center justify-center gap-2 cursor-pointer hover:bg-bg-3 transition-colors">
            <Tag size={14} strokeWidth={1.75} />
            Recategorize
          </button>
          <button
            onClick={() => deleteTransactions.mutate(Array.from(selected))}
            className="flex-1 h-11 rounded-sm bg-neg text-white text-[13px] font-medium flex items-center justify-center gap-2 cursor-pointer hover:brightness-105 transition-all"
          >
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
        categories={categories.map((c) => ({ id: c.id, name: c.name, icon: c.icon }))}
        accounts={accounts.map((a) => ({ id: a.id, name: a.name }))}
      />
      <TxDetailDrawer
        open={!!detailTx}
        onOpenChange={(open) => {
          if (!open) setDetailTx(null);
        }}
        tx={detailTx}
        onDelete={(id) => deleteTransactions.mutate([id])}
        onEdit={(tx) => setEditTx(tx)}
      />
      <EditTransactionDrawer
        open={!!editTx}
        onOpenChange={(open) => {
          if (!open) setEditTx(null);
        }}
        transaction={editTx}
      />
    </main>
  );
}
