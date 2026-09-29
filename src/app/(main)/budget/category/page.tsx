"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtIDR, fmtIDRShort } from "@/lib/format";
import {
  budgetFillColor,
  budgetPct,
  monthKey,
  monthLabel,
  monthRange,
  parseMonthKey,
} from "@/components/budget/budget-constants";
import { CategoryTransactionList } from "@/components/budget/category-transaction-list";
import { TxDetailDrawer } from "@/components/history/tx-detail-drawer";
import { DeleteTransactionsDrawer } from "@/components/history/delete-transactions-drawer";
import { EditTransactionDrawer } from "@/components/transactions/edit-transaction-drawer";
import type { Transaction } from "@/components/history/history-constants";
import { useGetBudgets } from "@/services/budgets/budgets.hooks";
import { useGetTransactions } from "@/services/transactions/transactions.hooks";
import CategoryDetailLoading from "./loading";

// Static page reading ?id=<budget id>&month=YYYY-MM on the client, so it can be
// prerendered and fully prefetched like the other (main) pages
export default function BudgetCategoryPage() {
  return (
    <React.Suspense fallback={<CategoryDetailLoading />}>
      <BudgetCategoryContent />
    </React.Suspense>
  );
}

function BudgetCategoryContent() {
  const t = useTranslations("budget");
  const router = useRouter();
  const searchParams = useSearchParams();
  const budgetId = searchParams.get("id");
  const [{ y, m }] = React.useState(() => {
    const now = new Date();
    return parseMonthKey(searchParams.get("month")) ?? { y: now.getFullYear(), m: now.getMonth() };
  });
  const key = monthKey(y, m);
  const backHref = `/budget?month=${key}`;

  const [detailTx, setDetailTx] = React.useState<Transaction | null>(null);
  const [editTx, setEditTx] = React.useState<Transaction | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<Transaction[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);

  const { data: budgets, isLoading: budgetsLoading } = useGetBudgets({ monthYear: key });
  const budget = budgets?.find((b) => b.id === budgetId);

  // Same rules as the budget's "spent": expenses in the month, matched by
  // category_id (or by name for legacy rows without one)
  const { data: transactions = [], isLoading: txLoading } = useGetTransactions({
    filters: {
      type: "expense",
      categoryIds: budget?.category_id ? [budget.category_id] : undefined,
      legacyCategory: budget && !budget.category_id ? budget.category : undefined,
      ...monthRange(y, m),
    },
    queryConfig: { enabled: !!budget },
  });

  const goBack = () => {
    // Opened from inside the app → pop so the budget page keeps its scroll; deep link → replace
    if (window.history.length > 1) router.back();
    else router.replace(backHref);
  };

  if (budgetsLoading || (budget && txLoading)) return <CategoryDetailLoading />;

  if (!budget) {
    return (
      <main className="flex flex-col items-center gap-4 px-5 pt-16 text-center">
        <p className="text-fg-2 text-[14px]">{t("notFound")}</p>
        <Link href={backHref} className="text-brand text-[13px] font-medium">
          {t("backToBudget")}
        </Link>
      </main>
    );
  }

  // Derived from the list itself so the header always agrees with what's shown
  const spent = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const planned = Number(budget.planned_amount);
  const left = planned - spent;
  const over = left < 0;
  const pct = budgetPct(spent, planned);

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === y && now.getMonth() === m;
  const daysRemaining = new Date(y, m + 1, 0).getDate() - now.getDate() + 1;

  return (
    <main className="flex flex-col gap-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-1">
        <button
          type="button"
          onClick={goBack}
          aria-label={t("backToBudget")}
          className="bg-bg-1 border-line text-fg-1 hover:bg-bg-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition-colors"
        >
          <ChevronLeft size={14} strokeWidth={1.75} />
        </button>
        <span className="bg-bg-1 border-line text-fg-1 flex h-7 items-center rounded-full border px-3 font-mono text-[12px]">
          {monthLabel(y, m)}
        </span>
      </div>

      {/* Hero */}
      <section
        className={cn(
          "bg-bg-1 border-line mx-4 rounded-lg border p-5",
          over && "border-neg/30",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="bg-bg-2 border-line flex h-11 w-11 items-center justify-center rounded-xl border text-[22px]">
            {budget.category_icon || "💰"}
          </div>
          <div className="min-w-0">
            <h1 className="text-fg-0 truncate text-[17px] font-semibold">
              {budget.category_name || budget.category}
            </h1>
            <div className="text-fg-2 text-[12px]">
              {t("transactionCount", { count: transactions.length })}
            </div>
          </div>
        </div>

        <div className="mt-5 flex items-baseline gap-2 font-mono tabular-nums">
          <span className="text-fg-0 text-[28px] font-medium tracking-tight">
            {fmtIDR(spent)}
          </span>
          <span className="text-fg-2 text-[13px]">
            {t("ofBudget", { amount: fmtIDRShort(planned) })}
          </span>
        </div>

        <div className="bg-bg-3 relative mt-3 h-[6px] overflow-hidden rounded-full">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: Math.min(100, pct) + "%", background: budgetFillColor(spent, planned) }}
          />
        </div>

        <div className="mt-2 flex items-center justify-between gap-2 font-mono text-[12px] tabular-nums">
          <span className={cn(over ? "text-neg" : "text-fg-1")}>
            {over
              ? t("overBy", { amount: fmtIDRShort(Math.abs(left)) })
              : t("left", { amount: fmtIDRShort(left) })}
          </span>
          <span className="text-fg-2">{Math.round(pct)}%</span>
        </div>

        {isCurrentMonth && !over && left > 0 && (
          <p className="text-fg-2 mt-3 text-[12px]">
            {t("dailyLeft", { amount: fmtIDRShort(left / daysRemaining) })}
          </p>
        )}
      </section>

      {/* Transactions */}
      {transactions.length > 0 ? (
        <CategoryTransactionList transactions={transactions} onTapRow={setDetailTx} />
      ) : (
        <p className="text-fg-2 px-5 py-10 text-center text-[13px]">{t("noSpending")}</p>
      )}

      {/* Drawers */}
      <TxDetailDrawer
        open={!!detailTx}
        onOpenChange={(open) => {
          if (!open) setDetailTx(null);
        }}
        tx={detailTx}
        onDelete={() => {
          if (!detailTx) return;
          setPendingDelete([detailTx]);
          setConfirmDeleteOpen(true);
        }}
        onEdit={(tx) => setEditTx(tx)}
      />
      <DeleteTransactionsDrawer
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        transactions={pendingDelete}
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
