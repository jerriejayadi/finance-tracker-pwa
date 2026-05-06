"use client";

import { TransactionItem } from "@/components/home/transaction-item";
import { Chip } from "@/components/ui/chip";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { fmtIDR, fmtIDRShort } from "@/lib/format";
import { useGetAccountBalances } from "@/services/accounts/accounts.hooks";
import { useGetCategories } from "@/services/categories/categories.hooks";
import {
  useGetTransactions,
  useGetTransactionSummary,
} from "@/services/transactions/transactions.hooks";
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Plus,
} from "lucide-react";
import Link from "next/link";
import * as React from "react";
import { useAddTransaction } from "./layout";

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
  if (dateStr === yesterdayStr)
    return `Yesterday \u00B7 ${format(date, "MMM d")}`;
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
          dateFrom: format(
            startOfWeek(today, { weekStartsOn: 1 }),
            "yyyy-MM-dd",
          ),
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
      total: items.reduce(
        (s, t) =>
          s + (t.type === "Income" ? Number(t.amount) : -Number(t.amount)),
        0,
      ),
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
      <section className="bg-bg-1 border-line relative mx-4 overflow-hidden rounded-lg border p-[22px_22px_20px]">
        {/* Brand glow */}
        <div className="bg-brand-soft pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full blur-[40px]" />

        <div className="relative z-[1] flex items-center justify-between">
          <div className="text-fg-2 text-[11px] font-medium tracking-[0.06em] uppercase">
            Total balance
          </div>
          <button className="bg-bg-2 border-line text-fg-1 inline-flex h-6 cursor-pointer items-center gap-1 rounded-full border px-2.5 font-mono text-[11px]">
            {monthLabel} <ChevronDown size={12} strokeWidth={1.75} />
          </button>
        </div>

        <div className="relative z-[1] mt-3 font-mono text-[42px] leading-[1.05] font-medium tracking-[-0.025em] tabular-nums">
          {fmtIDRShort(totalBalance)}
        </div>

        {/* Action buttons */}
        <div className="relative z-[1] mt-[18px] grid grid-cols-3 gap-2">
          <button
            onClick={() => openAddTx("expense")}
            className="bg-brand text-brand-ink hover:bg-brand-hi flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-transparent text-[13px] font-medium transition-colors"
          >
            <Plus size={16} strokeWidth={1.75} /> Expense
          </button>
          <button
            onClick={() => openAddTx("income")}
            className="bg-bg-2 text-fg-0 border-line hover:bg-bg-3 flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-sm border text-[13px] font-medium transition-colors"
          >
            <ArrowDownLeft size={16} strokeWidth={1.75} /> Income
          </button>
          <button
            onClick={() => openAddTx("transfer")}
            className="bg-bg-2 text-fg-0 border-line hover:bg-bg-3 flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-sm border text-[13px] font-medium transition-colors"
          >
            <ArrowLeftRight size={16} strokeWidth={1.75} /> Transfer
          </button>
        </div>
      </section>

      {/* In/Out strip */}
      <section className="bg-bg-1 border-line mx-4 grid grid-cols-[1fr_1px_1fr] items-center rounded-md border py-3.5">
        <div className="flex items-center gap-3 px-3.5">
          <div className="bg-pos-soft text-pos flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
            <ArrowDownLeft size={16} strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-fg-2 text-[11px] tracking-[0.04em] uppercase">
              Income
            </div>
            <div className="mt-0.5 font-mono text-[15px] font-medium tabular-nums">
              {fmtIDRShort(summary?.totalIncome ?? 0)}
            </div>
          </div>
        </div>
        <div className="bg-line h-7 w-px" />
        <div className="flex items-center gap-3 px-3.5">
          <div className="bg-neg-soft text-neg flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
            <ArrowUpRight size={16} strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-fg-2 text-[11px] tracking-[0.04em] uppercase">
              Expenses
            </div>
            <div className="mt-0.5 font-mono text-[15px] font-medium tabular-nums">
              {fmtIDRShort(summary?.totalExpense ?? 0)}
            </div>
          </div>
        </div>
      </section>

      {/* Section title */}
      <div className="mt-[18px] flex items-center justify-between px-5">
        <h2 className="text-fg-2 text-[11px] font-semibold tracking-[0.06em] uppercase">
          Recent activity
        </h2>
        <Link
          href="/history"
          className="text-fg-1 hover:text-fg-0 flex cursor-pointer items-center gap-0.5 text-[12px]"
        >
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
      <div className="hide-scrollbar flex gap-1.5 overflow-x-auto px-5 pb-1">
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
      <div className="flex flex-col gap-0.5 px-4">
        {groups.length === 0 && (
          <div className="text-fg-2 flex justify-center py-8 text-[13px]">
            No transactions yet
          </div>
        )}
        {groups.map((g) => (
          <React.Fragment key={g.day}>
            <div className="text-fg-2 flex items-baseline justify-between px-1 pt-3.5 pb-1.5 text-[11px] tracking-[0.04em] uppercase">
              <span>{g.dayLabel}</span>
              <span className="text-fg-1 font-mono tracking-normal normal-case">
                {g.total >= 0 ? "+ " : "\u2212 "}
                {fmtIDR(Math.abs(g.total))}
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
