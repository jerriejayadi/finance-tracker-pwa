"use client";

import * as React from "react";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
} from "lucide-react";
import { TransactionItem } from "@/components/home/transaction-item";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Chip } from "@/components/ui/chip";
import { useAddTransaction } from "./layout";
import { fmtIDR } from "@/lib/format";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";
import { useGetTransactions, useGetTransactionSummary } from "@/services/transactions/transactions.hooks";
import { useGetAccountBalances } from "@/services/accounts/accounts.hooks";
import { useGetCategories } from "@/services/categories/categories.hooks";
import Link from "next/link";

const PERIOD_OPTIONS = [
  { value: "Day", label: "Day" },
  { value: "Week", label: "Week" },
  { value: "Month", label: "Month" },
  { value: "Year", label: "Year" },
];

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const todayStr = format(today, "yyyy-MM-dd");
  const yesterdayStr = format(yesterday, "yyyy-MM-dd");

  if (dateStr === todayStr) return `Today \u00B7 ${format(date, "MMM d")}`;
  if (dateStr === yesterdayStr) return `Yesterday \u00B7 ${format(date, "MMM d")}`;
  return format(date, "MMM d");
}

export default function DashboardPage() {
  const openAddTx = useAddTransaction();
  const [period, setPeriod] = React.useState("Month");
  const [chip, setChip] = React.useState("All");

  // Compute date range
  const { dateFrom, dateTo } = React.useMemo(() => {
    const today = new Date();
    switch (period) {
      case "Day":
        return {
          dateFrom: format(today, "yyyy-MM-dd"),
          dateTo: format(today, "yyyy-MM-dd"),
        };
      case "Week":
        return {
          dateFrom: format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"),
          dateTo: format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        };
      case "Year":
        return {
          dateFrom: `${today.getFullYear()}-01-01`,
          dateTo: `${today.getFullYear()}-12-31`,
        };
      case "Month":
      default:
        return {
          dateFrom: format(startOfMonth(today), "yyyy-MM-dd"),
          dateTo: format(endOfMonth(today), "yyyy-MM-dd"),
        };
    }
  }, [period]);

  const { data: accountBalances = [] } = useGetAccountBalances();
  const { data: recentTx = [] } = useGetTransactions({
    filters: { dateFrom, dateTo, limit: 20 },
  });
  const { data: summary } = useGetTransactionSummary({ dateFrom, dateTo });
  const { data: categories = [] } = useGetCategories();

  const totalBalance = React.useMemo(
    () => accountBalances.reduce((sum, a) => sum + Number(a.balance), 0),
    [accountBalances],
  );

  // Group transactions by date
  const groups = React.useMemo(() => {
    const map = new Map<string, typeof recentTx>();
    for (const tx of recentTx) {
      const existing = map.get(tx.date) || [];
      existing.push(tx);
      map.set(tx.date, existing);
    }
    return Array.from(map.entries()).map(([date, items]) => ({
      day: date,
      dayLabel: formatDayLabel(date),
      total: items.reduce((s, t) =>
        s + (t.type === "Income" ? Number(t.amount) : -Number(t.amount)), 0),
      items,
    }));
  }, [recentTx]);

  // Category chips with counts
  const chips = React.useMemo(() => {
    const all = [{ id: "All", count: recentTx.length }];
    const catCounts = new Map<string, number>();
    for (const tx of recentTx) {
      const name = tx.category_name || tx.category;
      catCounts.set(name, (catCounts.get(name) || 0) + 1);
    }
    for (const [name, count] of catCounts) {
      all.push({ id: name, count });
    }
    return all.slice(0, 6);
  }, [recentTx]);

  // Month label
  const monthLabel = format(new Date(), "MMMM \u00B7 yyyy");

  return (
    <main className="flex flex-col gap-4">
      {/* Balance hero */}
      <section className="mx-4 p-[22px_22px_20px] bg-bg-1 border border-line rounded-lg relative overflow-hidden">
        {/* Brand glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-soft blur-[40px] pointer-events-none" />

        <div className="flex items-center justify-between relative z-[1]">
          <div className="text-[11px] uppercase tracking-[0.06em] text-fg-2 font-medium">
            Total balance
          </div>
          <button className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-bg-2 border border-line text-[11px] text-fg-1 font-mono cursor-pointer">
            {monthLabel} <ChevronDown size={12} strokeWidth={1.75} />
          </button>
        </div>

        <div className="font-mono tabular-nums text-[42px] leading-[1.05] tracking-[-0.025em] font-medium mt-3 relative z-[1]">
          {fmtIDR(totalBalance)}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2 mt-[18px] relative z-[1]">
          <button onClick={() => openAddTx("expense")} className="h-11 rounded-sm bg-brand text-brand-ink text-[13px] font-medium border border-transparent flex items-center justify-center gap-1.5 cursor-pointer hover:bg-brand-hi transition-colors">
            <Plus size={16} strokeWidth={1.75} /> Expense
          </button>
          <button onClick={() => openAddTx("income")} className="h-11 rounded-sm bg-bg-2 text-fg-0 text-[13px] font-medium border border-line flex items-center justify-center gap-1.5 cursor-pointer hover:bg-bg-3 transition-colors">
            <ArrowDownLeft size={16} strokeWidth={1.75} /> Income
          </button>
          <button onClick={() => openAddTx("transfer")} className="h-11 rounded-sm bg-bg-2 text-fg-0 text-[13px] font-medium border border-line flex items-center justify-center gap-1.5 cursor-pointer hover:bg-bg-3 transition-colors">
            <ArrowLeftRight size={16} strokeWidth={1.75} /> Transfer
          </button>
        </div>
      </section>

      {/* In/Out strip */}
      <section className="mx-4 grid grid-cols-[1fr_1px_1fr] bg-bg-1 border border-line rounded-md py-3.5 items-center">
        <div className="flex items-center gap-3 px-3.5">
          <div className="w-8 h-8 rounded-lg bg-pos-soft text-pos flex items-center justify-center flex-shrink-0">
            <ArrowDownLeft size={16} strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-[11px] text-fg-2 uppercase tracking-[0.04em]">
              Income
            </div>
            <div className="font-mono tabular-nums text-[15px] font-medium mt-0.5">
              + {fmtIDR(summary?.totalIncome ?? 0)}
            </div>
          </div>
        </div>
        <div className="w-px h-7 bg-line" />
        <div className="flex items-center gap-3 px-3.5">
          <div className="w-8 h-8 rounded-lg bg-neg-soft text-neg flex items-center justify-center flex-shrink-0">
            <ArrowUpRight size={16} strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-[11px] text-fg-2 uppercase tracking-[0.04em]">
              Expenses
            </div>
            <div className="font-mono tabular-nums text-[15px] font-medium mt-0.5">
              &minus; {fmtIDR(summary?.totalExpense ?? 0)}
            </div>
          </div>
        </div>
      </section>

      {/* Section title */}
      <div className="flex items-center justify-between px-5 mt-[18px]">
        <h2 className="text-[11px] font-semibold text-fg-2 uppercase tracking-[0.06em]">
          Recent activity
        </h2>
        <Link href="/history" className="text-[12px] text-fg-1 flex items-center gap-0.5 cursor-pointer hover:text-fg-0">
          See all <ChevronRight size={12} strokeWidth={1.75} />
        </Link>
      </div>

      {/* Period picker */}
      <div className="px-5">
        <SegmentedControl
          value={period}
          onValueChange={setPeriod}
          options={PERIOD_OPTIONS}
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-1.5 overflow-x-auto px-5 hide-scrollbar pb-1">
        {chips.map((c) => (
          <Chip
            key={c.id}
            active={chip === c.id}
            count={c.count}
            onClick={() => setChip(c.id)}
          >
            {c.id}
          </Chip>
        ))}
      </div>

      {/* Transaction list */}
      <div className="px-4 flex flex-col gap-0.5">
        {groups.length === 0 && (
          <div className="flex justify-center py-8 text-[13px] text-fg-2">
            No transactions yet
          </div>
        )}
        {groups.map((g) => (
          <React.Fragment key={g.day}>
            <div className="text-[11px] text-fg-2 uppercase tracking-[0.04em] px-1 pt-3.5 pb-1.5 flex justify-between items-baseline">
              <span>{g.dayLabel}</span>
              <span className="font-mono text-fg-1 normal-case tracking-normal">
                {g.total >= 0 ? "+ " : "\u2212 "}{fmtIDR(Math.abs(g.total))}
              </span>
            </div>
            {g.items.map((tx) => (
              <TransactionItem
                key={tx.id}
                title={tx.merchant || tx.category_name || tx.category}
                category={tx.category_name || tx.category}
                amount={Number(tx.amount)}
                time={tx.date}
                type={tx.type === "Income" ? "income" : "expense"}
                icon={tx.category_icon || ""}
                recurring={!!tx.recurring_transaction_id}
              />
            ))}
          </React.Fragment>
        ))}
      </div>

      <div className="h-5" />
    </main>
  );
}
