"use client";

import { TransactionItem } from "@/components/home/transaction-item";
import { Chip } from "@/components/ui/chip";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { fmtIDR, fmtIDRShort } from "@/lib/format";
import { useGetAccountBalances } from "@/services/accounts/accounts.hooks";
import { useGetCategories } from "@/services/categories/categories.hooks";
import {
  useGetTransactions,
  useGetTransactionSummary,
  useGetTransactionCount,
} from "@/services/transactions/transactions.hooks";
import {
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { Locale } from "date-fns";
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
import { EditTransactionDrawer } from "@/components/transactions/edit-transaction-drawer";
import type { Transaction } from "@/services/transactions/transactions.service";
import { DashboardOnboarding } from "@/components/home/dashboard-onboarding";
import { BudgetNudge } from "@/components/home/budget-nudge";
import { CurrencyPickerDrawer } from "@/components/profile/currency-picker-drawer";
import { monthKey } from "@/components/budget/budget-constants";
import { useGetBudgets } from "@/services/budgets/budgets.hooks";
import { useGetProfile } from "@/services/profile/profile.hooks";
import { useRouter } from "next/navigation";
import { MonthPickerDrawer } from "@/components/budget/month-picker-drawer";
import { useTranslations, useLocale } from "next-intl";
import { getDateLocale } from "@/lib/date-locale";

function formatDayLabel(
  dateStr: string,
  tCommon: ReturnType<typeof useTranslations>,
  dateLocale: Locale
): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const todayStr = format(today, "yyyy-MM-dd");
  const yesterdayStr = format(yesterday, "yyyy-MM-dd");

  if (dateStr === todayStr) return `${tCommon("today")} \u00B7 ${format(date, "MMM d", { locale: dateLocale })}`;
  if (dateStr === yesterdayStr)
    return `${tCommon("yesterday")} \u00B7 ${format(date, "MMM d", { locale: dateLocale })}`;
  return format(date, "MMM d", { locale: dateLocale });
}

export default function DashboardPage() {
  const openAddTx = useAddTransaction();
  const router = useRouter();
  const now = new Date();
  const [period, setPeriod] = React.useState("Month");
  const [chip, setChip] = React.useState("All");
  const [editTx, setEditTx] = React.useState<Transaction | null>(null);
  const [currencyPickerOpen, setCurrencyPickerOpen] = React.useState(false);
  const [nudgeDismissed, setNudgeDismissed] = React.useState(false);
  const [selectedYear, setSelectedYear] = React.useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = React.useState(now.getMonth());
  const [monthPickerOpen, setMonthPickerOpen] = React.useState(false);

  const tDash = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const dateLocale = getDateLocale(locale);

  const PERIOD_OPTIONS = [
    { value: "Day", label: tDash("day") },
    { value: "Week", label: tDash("week") },
    { value: "Month", label: tDash("month") },
    { value: "Year", label: tDash("year") },
  ];

  // Budget & profile data for onboarding
  const { data: profile } = useGetProfile();
  const currentMonthKey = monthKey(now.getFullYear(), now.getMonth());
  const { data: budgets = [] } = useGetBudgets({ monthYear: currentMonthKey });

  // Compute date range
  const { dateFrom, dateTo } = React.useMemo(() => {
    const today = new Date();
    const isCurrentMonth =
      selectedYear === today.getFullYear() && selectedMonth === today.getMonth();

    if (!isCurrentMonth) {
      const start = new Date(selectedYear, selectedMonth, 1);
      const end = endOfMonth(start);
      return {
        dateFrom: format(start, "yyyy-MM-dd"),
        dateTo: format(end, "yyyy-MM-dd"),
      };
    }

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
  }, [period, selectedYear, selectedMonth]);

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
      dayLabel: formatDayLabel(date, tCommon, dateLocale),
      total: items.reduce(
        (s, t) =>
          s + (t.type === "Income" ? Number(t.amount) : -Number(t.amount)),
        0,
      ),
      items,
    }));
  }, [recentTx, tCommon, dateLocale]);

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
  const monthLabel = format(new Date(selectedYear, selectedMonth), "MMMM \u00B7 yyyy", { locale: dateLocale });

  const { data: totalTxCount = 0 } = useGetTransactionCount();

  const currency = profile?.currency_preference ?? "IDR";
  const hasBudgets = budgets.length > 0;
  const showOnboarding = totalTxCount === 0;

  const navigateToBudgetCreate = () => router.push("/budget?create=true");

  return (
    <main className="flex flex-col gap-4">
      {showOnboarding ? (
        <DashboardOnboarding
          currencyLabel={currency}
          hasBudgets={hasBudgets}
          onChangeCurrency={() => setCurrencyPickerOpen(true)}
          onCreateBudget={navigateToBudgetCreate}
          onAddTransaction={() => openAddTx("expense")}
        />
      ) : (
        <>
          {/* Budget nudge */}
          {!hasBudgets && !nudgeDismissed && (
            <BudgetNudge
              month={format(now, "MMMM")}
              onSetup={navigateToBudgetCreate}
              onDismiss={() => setNudgeDismissed(true)}
            />
          )}

          {/* Balance hero */}

          <section className="bg-bg-1 border-line relative mx-4 overflow-hidden rounded-lg border p-[22px_22px_20px]">

        {/* Brand glow */}
        <div className="bg-brand-soft pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full blur-[40px]" />

        <div className="relative z-[1] flex items-center justify-between">
          <div className="text-fg-2 text-[11px] font-medium tracking-[0.06em] uppercase">
            {tDash("totalBalance")}
          </div>
          <button onClick={() => setMonthPickerOpen(true)} className="bg-bg-2 border-line text-fg-1 inline-flex h-6 cursor-pointer items-center gap-1 rounded-full border px-2.5 font-mono text-[11px]">
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
            <Plus size={16} strokeWidth={1.75} /> {tCommon("expense")}
          </button>
          <button
            onClick={() => openAddTx("income")}
            className="bg-bg-2 text-fg-0 border-line hover:bg-bg-3 flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-sm border text-[13px] font-medium transition-colors"
          >
            <ArrowDownLeft size={16} strokeWidth={1.75} /> {tCommon("income")}
          </button>
          <button
            onClick={() => openAddTx("transfer")}
            className="bg-bg-2 text-fg-0 border-line hover:bg-bg-3 flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-sm border text-[13px] font-medium transition-colors"
          >
            <ArrowLeftRight size={16} strokeWidth={1.75} /> {tCommon("transfer")}
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
              {tCommon("income")}
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
              {tCommon("expenses")}
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
          {tDash("recentActivity")}
        </h2>
        <Link
          href="/history"
          className="text-fg-1 hover:text-fg-0 flex cursor-pointer items-center gap-0.5 text-[12px]"
        >
          {tCommon("seeAll")} <ChevronRight size={12} strokeWidth={1.75} />
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
                onClick={() => setEditTx(tx)}
              />
            ))}
          </React.Fragment>
        ))}
      </div>
      {groups.length === 0 && (
        <div className="text-fg-2 flex justify-center py-8 text-[13px]">
          {tDash("noTransactions")}
        </div>
      )}
        {/* <Input type="text" className="sticky bottom-20" /> */}
      <MonthPickerDrawer
        open={monthPickerOpen}
        onOpenChange={setMonthPickerOpen}
        year={selectedYear}
        month={selectedMonth}
        onPick={(y, m) => {
          setSelectedYear(y);
          setSelectedMonth(m);
        }}
        createdBudgets={{}}
      />
      <EditTransactionDrawer
        open={!!editTx}
        onOpenChange={(open) => {
          if (!open) setEditTx(null);
        }}
        transaction={editTx}
      />
        </>
      )}

      {/* Currency picker — always mounted */}
      <CurrencyPickerDrawer
        open={currencyPickerOpen}
        onOpenChange={setCurrencyPickerOpen}
        currentCurrency={currency}
      />

      <div className="h-5" />
    </main>
  );
}
