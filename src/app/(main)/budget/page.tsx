"use client";

import { BudgetCategoryList } from "@/components/budget/budget-category-list";
import {
  monthKey,
  monthLabel,
  parseMonthKey,
} from "@/components/budget/budget-constants";
import { BudgetEmptyState } from "@/components/budget/budget-empty-state";
import { BudgetHero } from "@/components/budget/budget-hero";
import { BudgetIncomeList } from "@/components/budget/budget-income-list";
import { BudgetInsight } from "@/components/budget/budget-insight";
import { BudgetPace } from "@/components/budget/budget-pace";
import type { BudgetCategory } from "@/components/budget/budget-types";
import { CopyFromMonthDrawer } from "@/components/budget/copy-from-month-drawer";
import { CreateBudgetDrawer, type BudgetRowsByKind } from "@/components/budget/create-budget-drawer";
import { EditBudgetDrawer } from "@/components/budget/edit-budget-drawer";
import { MonthPickerDrawer } from "@/components/budget/month-picker-drawer";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
} from "lucide-react";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useGetBudgets, useCreateBudgets, useSaveBudgetChanges, useGetBudgetMonths } from "@/services/budgets/budgets.hooks";
import { toast } from "sonner";
import { useGetCategories } from "@/services/categories/categories.hooks";
import { useGetProfile } from "@/services/profile/profile.hooks";
import type { BudgetKind, BudgetWithSpent } from "@/services/budgets/budgets.service";

/** Budget rows in the shape the budget components use */
function toBudgetCategories(rows: BudgetWithSpent[], kind: BudgetKind): BudgetCategory[] {
  return rows
    .filter((b) => b.kind === kind)
    .map((b) => ({
      id: b.id,
      name: b.category_name || b.category,
      icon: b.category_icon || "",
      budget: Number(b.planned_amount),
      spent: b.spent,
      count: b.count,
      kind,
    }));
}

export default function BudgetPage() {
  return (
    <React.Suspense>
      <BudgetPageContent />
    </React.Suspense>
  );
}

function BudgetPageContent() {
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  // ?month=YYYY-MM restores the month when coming back from a category page
  const [initialMonth] = React.useState(() => {
    const now = new Date();
    return parseMonthKey(searchParams.get("month")) ?? { y: now.getFullYear(), m: now.getMonth() };
  });
  const [year, setYear] = React.useState(initialMonth.y);
  const [month, setMonth] = React.useState(initialMonth.m);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);

  // Auto-open create drawer when navigated with ?create=true
  React.useEffect(() => {
    if (searchParams.get("create") === "true") {
      setCreateOpen(true);
    }
  }, [searchParams]);
  const [copyFromPrev, setCopyFromPrev] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  // Which list the edit drawer edits; kept after closing so it doesn't flip mid-animation
  const [editKind, setEditKind] = React.useState<BudgetKind>("expense");
  const openEdit = (kind: BudgetKind) => {
    setEditKind(kind);
    setEditOpen(true);
  };
  const [copyDrawerOpen, setCopyDrawerOpen] = React.useState(false);
  const [copyFromMonth, setCopyFromMonth] = React.useState<string | null>(null);
  const [reallocateCategories, setReallocateCategories] = React.useState<BudgetCategory[] | null>(null);
  const [reallocateHighlights, setReallocateHighlights] = React.useState<string[]>([]);

  const key = monthKey(year, month);

  // Mirror the month into the URL (no navigation) so back from a category page lands on it.
  // Drops ?create too, so changing month doesn't re-trigger the create drawer.
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("month") === key && !params.has("create")) return;
    params.set("month", key);
    params.delete("create");
    window.history.replaceState(null, "", `?${params}`);
  }, [key]);

  const { data: profile } = useGetProfile();
  const currency = profile?.currency_preference ?? "IDR";
  const { data: budgetData, isLoading } = useGetBudgets({ monthYear: key });
  const { data: categories = [] } = useGetCategories();
  // Budgets link only to the user's own categories of the budget's kind, never a system
  // default of the same name; unmatched names are resolved (or created) by the budgets service
  const findOwnCategory = (name: string, kind: BudgetKind) =>
    categories.find((c) => c.name === name && c.user_id !== null && c.type === kind);
  const { data: budgetMonths = [] } = useGetBudgetMonths();

  // Fetch budget for the month user wants to copy from
  const { data: copySourceData } = useGetBudgets({
    monthYear: copyFromMonth ?? "",
    queryConfig: { enabled: !!copyFromMonth },
  });

  const createBudgets = useCreateBudgets({
    mutationConfig: {
      onSuccess: () => setCreateOpen(false),
    },
  });

  const closeEdit = () => {
    setEditOpen(false);
    setReallocateCategories(null);
    setReallocateHighlights([]);
  };

  const saveBudgetChanges = useSaveBudgetChanges({
    mutationConfig: {
      onSuccess: closeEdit,
      onError: (err) => toast.error(err.message),
    },
  });

  // Map to BudgetCategory shape for existing components, split by kind
  const incomeCats = React.useMemo(() => toBudgetCategories(budgetData ?? [], "income"), [budgetData]);
  const expenseCats = React.useMemo(() => toBudgetCategories(budgetData ?? [], "expense"), [budgetData]);
  const hasBudget = !!budgetData && budgetData.length > 0;

  // Rows to start from when copying a month (stable, so the create drawer doesn't reset)
  const copyInitial: BudgetRowsByKind | null = React.useMemo(
    () =>
      copyFromPrev && copySourceData
        ? {
            income: toBudgetCategories(copySourceData, "income"),
            expense: toBudgetCategories(copySourceData, "expense"),
          }
        : null,
    [copyFromPrev, copySourceData],
  );

  const isEmpty = !isLoading && !hasBudget;

  React.useEffect(() => {
    if (copyFromMonth && copySourceData && copySourceData.length > 0) {
      setCopyFromPrev(true);
      setCreateOpen(true);
    }
  }, [copyFromMonth, copySourceData]);

  const stepMonth = (delta: number) => {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    }
    if (m > 11) {
      m = 0;
      y += 1;
    }
    setMonth(m);
    setYear(y);
  };

  const handleSave = (rows: BudgetRowsByKind) => {
    const payloads = (["income", "expense"] as const).flatMap((kind) =>
      rows[kind].map((r) => ({
        month_year: key,
        category: r.name,
        category_id: findOwnCategory(r.name, kind)?.id,
        icon: r.icon,
        kind,
        planned_amount: r.budget,
        currency,
      })),
    );
    createBudgets.mutate(payloads, { onError: (err) => toast.error(err.message) });
  };

  const handleEditSave = (kind: BudgetKind) => (rows: BudgetCategory[], removedIds: string[]) => {
    const existingRows = rows.filter((r) => !r.id.startsWith("new-"));
    const newRows = rows.filter((r) => r.id.startsWith("new-"));

    // Name/icon edits go to the budget's category, so the picker and history follow
    const original = new Map((kind === "income" ? incomeCats : expenseCats).map((c) => [c.id, c]));
    saveBudgetChanges.mutate({
      updates: existingRows.map((r) => ({ id: r.id, planned_amount: r.budget })),
      categoryEdits: existingRows
        .filter((r) => r.name.trim() && (r.name !== original.get(r.id)?.name || r.icon !== original.get(r.id)?.icon))
        .map((r) => ({ id: r.id, name: r.name.trim(), icon: r.icon, kind })),
      creates: newRows.map((r) => ({
        month_year: key,
        category: r.name,
        category_id: findOwnCategory(r.name, kind)?.id,
        icon: r.icon,
        kind,
        planned_amount: r.budget,
        currency,
      })),
      deleteIds: removedIds,
    });
  };

  const handleReallocate = (fromId: string, toId: string, amount: number) => {
    const adjusted = expenseCats.map((c) => {
      if (c.id === fromId) return { ...c, budget: Math.max(0, c.budget - amount) };
      if (c.id === toId) return { ...c, budget: c.budget + amount };
      return c;
    });
    setReallocateCategories(adjusted);
    setReallocateHighlights([fromId, toId]);
    openEdit("expense");
  };

  return (
    <main className="flex flex-col gap-4 pb-4">
      {/* Month stepper header */}
      <div className="flex items-center justify-between px-5 pt-1">
        <button
          onClick={() => setPickerOpen(true)}
          className="bg-bg-1 border-line text-fg-1 hover:bg-bg-2 flex h-7 cursor-pointer items-center gap-1.5 rounded-full border px-3 font-mono text-[12px] transition-colors"
        >
          {monthLabel(year, month)}
          <ChevronDown size={12} strokeWidth={1.75} />
        </button>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => stepMonth(-1)}
            className="bg-bg-1 border-line text-fg-1 hover:bg-bg-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition-colors"
          >
            <ChevronLeft size={14} strokeWidth={1.75} />
          </button>
          <button
            onClick={() => stepMonth(1)}
            className="bg-bg-1 border-line text-fg-1 hover:bg-bg-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border transition-colors"
          >
            <ChevronRight size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center py-12 text-[13px] text-fg-2">
          {tCommon("loading")}
        </div>
      )}

      {!isLoading && isEmpty ? (
        <BudgetEmptyState
          year={year}
          month={month}
          hasPreviousBudgets={budgetMonths.filter((m) => m.month_year !== key).length > 0}
          onCreate={() => {
            setCopyFromPrev(false);
            setCreateOpen(true);
          }}
          onCopyFromTemplate={() => setCopyDrawerOpen(true)}
        />
      ) : !isLoading && hasBudget ? (
        <>
          <BudgetHero categories={expenseCats} year={year} month={month} />
          <BudgetPace categories={expenseCats} year={year} month={month} />

          {/* Income categories */}
          <SectionHeader title="Income categories" onEdit={() => openEdit("income")} />
          {incomeCats.length > 0 ? (
            <BudgetIncomeList categories={incomeCats} monthKey={key} />
          ) : (
            <AddCategoryButton onClick={() => openEdit("income")}>
              Add income category
            </AddCategoryButton>
          )}

          {/* Expense categories */}
          <SectionHeader title="Expense categories" onEdit={() => openEdit("expense")} />
          <BudgetCategoryList categories={expenseCats} monthKey={key} />
          <BudgetInsight
            month={month}
            categories={expenseCats}
            onReallocate={handleReallocate}
          />

          <AddCategoryButton onClick={() => openEdit("expense")}>
            Add another category
          </AddCategoryButton>
        </>
      ) : null}

      {/* Drawers */}
      <MonthPickerDrawer
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        year={year}
        month={month}
        onPick={(y, m) => {
          setYear(y);
          setMonth(m);
        }}
        createdBudgets={{}}
      />
      <CreateBudgetDrawer
        open={createOpen}
        onOpenChange={(open) => {
          setCreateOpen(open);
          if (!open) {
            setCopyFromPrev(false);
            setCopyFromMonth(null);
          }
        }}
        year={year}
        month={month}
        onSave={handleSave}
        initialCategories={copyInitial}
      />
      <CopyFromMonthDrawer
        open={copyDrawerOpen}
        onOpenChange={setCopyDrawerOpen}
        currentMonthYear={key}
        onSelect={(monthYear) => setCopyFromMonth(monthYear)}
      />
      <EditBudgetDrawer
        open={editOpen}
        onOpenChange={(open) => {
          if (!open) closeEdit();
        }}
        kind={editKind}
        year={year}
        month={month}
        categories={
          editKind === "income" ? incomeCats : (reallocateCategories ?? expenseCats)
        }
        onSave={handleEditSave(editKind)}
        saving={saveBudgetChanges.isPending}
        highlightedIds={reallocateHighlights}
      />
    </main>
  );
}

function SectionHeader({ title, onEdit }: { title: string; onEdit: () => void }) {
  const tCommon = useTranslations("common");
  return (
    <div className="mt-2 flex items-center justify-between px-5">
      <h2 className="text-fg-2 text-[11px] font-semibold tracking-[0.06em] uppercase">
        {title}
      </h2>
      <button
        onClick={onEdit}
        className="text-[12px] text-brand flex items-center gap-1 cursor-pointer hover:text-brand-hi"
      >
        <Pencil size={12} strokeWidth={1.75} /> {tCommon("edit")}
      </button>
    </div>
  );
}

function AddCategoryButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="border-line text-fg-1 hover:bg-bg-1 hover:border-brand mx-4 flex h-14 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed text-[13px] transition-colors"
    >
      <Plus size={16} strokeWidth={1.75} />
      {children}
    </button>
  );
}
