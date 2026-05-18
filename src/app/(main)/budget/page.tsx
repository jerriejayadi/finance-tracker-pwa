"use client";

import { BudgetCategoryList } from "@/components/budget/budget-category-list";
import {
  monthKey,
  monthLabel,
} from "@/components/budget/budget-constants";
import { BudgetEmptyState } from "@/components/budget/budget-empty-state";
import { BudgetHero } from "@/components/budget/budget-hero";
import { BudgetInsight } from "@/components/budget/budget-insight";
import { BudgetPace } from "@/components/budget/budget-pace";
import type { BudgetCategory } from "@/components/budget/budget-types";
import { CopyFromMonthDrawer } from "@/components/budget/copy-from-month-drawer";
import { CreateBudgetDrawer } from "@/components/budget/create-budget-drawer";
import { EditBudgetDrawer } from "@/components/budget/edit-budget-drawer";
import { MonthPickerDrawer } from "@/components/budget/month-picker-drawer";
import { Chip } from "@/components/ui/chip";
import {
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Tag,
} from "lucide-react";
import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useGetBudgets, useCreateBudgets, useUpdateBudget, useDeleteBudget, useGetBudgetMonths } from "@/services/budgets/budgets.hooks";
import { useGetCategories } from "@/services/categories/categories.hooks";
import { useGetProfile } from "@/services/profile/profile.hooks";

function pctOf(spent: number, budget: number): number {
  if (budget <= 0) return 0;
  return Math.min(999, (spent / budget) * 100);
}

type FilterType = "all" | "active" | "over";

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
  const now = new Date();
  const [year, setYear] = React.useState(now.getFullYear());
  const [month, setMonth] = React.useState(now.getMonth());
  const [filter, setFilter] = React.useState<FilterType>("all");
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
  const [copyDrawerOpen, setCopyDrawerOpen] = React.useState(false);
  const [copyFromMonth, setCopyFromMonth] = React.useState<string | null>(null);
  const [reallocateCategories, setReallocateCategories] = React.useState<BudgetCategory[] | null>(null);
  const [reallocateHighlights, setReallocateHighlights] = React.useState<string[]>([]);

  const key = monthKey(year, month);

  const { data: profile } = useGetProfile();
  const currency = profile?.currency_preference ?? "IDR";
  const { data: budgetData, isLoading } = useGetBudgets({ monthYear: key });
  const { data: categories = [] } = useGetCategories();
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

  const updateBudget = useUpdateBudget();
  const deleteBudget = useDeleteBudget();

  // Map to BudgetCategory shape for existing components
  const cats: BudgetCategory[] | null = React.useMemo(() => {
    if (!budgetData || budgetData.length === 0) return null;
    return budgetData.map((b) => ({
      id: b.id,
      name: b.category_name || b.category,
      icon: b.category_icon || "",
      budget: Number(b.planned_amount),
      spent: b.spent,
      recent: b.recent,
    }));
  }, [budgetData]);

  const isEmpty = !isLoading && (!cats || cats.length === 0);

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

  const filtered = React.useMemo(() => {
    if (!cats) return [];
    if (filter === "over")
      return cats.filter((c) => pctOf(c.spent, c.budget) >= 85);
    if (filter === "active") return cats.filter((c) => c.spent > 0);
    return cats;
  }, [cats, filter]);

  const handleSave = (rows: BudgetCategory[]) => {
    const payloads = rows.map((r) => {
      const cat = categories.find((c) => c.name === r.name);
      return {
        month_year: key,
        category: r.name,
        category_id: cat?.id,
        planned_amount: r.budget,
        currency,
      };
    });
    createBudgets.mutate(payloads);
  };

  const handleEditSave = (rows: BudgetCategory[]) => {
    const existingRows = rows.filter((r) => !r.id.startsWith("new-"));
    const newRows = rows.filter((r) => r.id.startsWith("new-"));

    // Update existing budgets
    for (const r of existingRows) {
      updateBudget.mutate({ id: r.id, planned_amount: r.budget, category: r.name });
    }

    // Create new budget entries
    if (newRows.length > 0) {
      const payloads = newRows.map((r) => {
        const cat = categories.find((c) => c.name === r.name);
        return {
          month_year: key,
          category: r.name,
          category_id: cat?.id,
          planned_amount: r.budget,
          currency,
        };
      });
      createBudgets.mutate(payloads);
    }

    setEditOpen(false);
  };

  const handleEditDelete = (ids: string[]) => {
    for (const id of ids) {
      deleteBudget.mutate(id);
    }
  };

  const handleReallocate = (fromId: string, toId: string, amount: number) => {
    const adjusted = (cats ?? []).map((c) => {
      if (c.id === fromId) return { ...c, budget: Math.max(0, c.budget - amount) };
      if (c.id === toId) return { ...c, budget: c.budget + amount };
      return c;
    });
    setReallocateCategories(adjusted);
    setReallocateHighlights([fromId, toId]);
    setEditOpen(true);
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
      ) : !isLoading && cats ? (
        <>
          <BudgetHero categories={cats} year={year} month={month} />
          <BudgetPace categories={cats} year={year} month={month} />

          {/* Section title + edit button */}
          <div className="mt-2 flex items-center justify-between px-5">
            <h2 className="text-fg-2 text-[11px] font-semibold tracking-[0.06em] uppercase">
              Categories
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setEditOpen(true)}
                className="text-[12px] text-brand flex items-center gap-1 cursor-pointer hover:text-brand-hi"
              >
                <Pencil size={12} strokeWidth={1.75} /> {tCommon("edit")}
              </button>
              <div className="bg-bg-1 border-line flex items-center gap-0.5 rounded-sm border p-[3px]">
                <button className="bg-bg-3 text-fg-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-xs">
                  <Tag size={12} strokeWidth={1.75} />
                </button>
                <button className="text-fg-2 hover:text-fg-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-xs">
                  <BarChart3 size={12} strokeWidth={1.75} />
                </button>
              </div>
            </div>
          </div>

          {/* Filter chips */}
          <div className="hide-scrollbar flex gap-1.5 overflow-x-auto px-5 pb-1">
            <Chip
              active={filter === "all"}
              count={cats.length}
              onClick={() => setFilter("all")}
            >
              {tCommon("all")}
            </Chip>
            <Chip
              active={filter === "active"}
              count={cats.filter((c) => c.spent > 0).length}
              onClick={() => setFilter("active")}
            >
              Active
            </Chip>
            <Chip
              active={filter === "over"}
              count={cats.filter((c) => pctOf(c.spent, c.budget) >= 85).length}
              onClick={() => setFilter("over")}
            >
              Watch
            </Chip>
          </div>

          <BudgetCategoryList categories={filtered} />
          <BudgetInsight
            month={month}
            categories={cats}
            onReallocate={handleReallocate}
          />

          {/* Add category CTA */}
          <button
            onClick={() => setEditOpen(true)}
            className="border-line text-fg-1 hover:bg-bg-1 hover:border-brand mx-4 flex h-14 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed text-[13px] transition-colors"
          >
            <Plus size={16} strokeWidth={1.75} />
            Add another category
          </button>
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
        initialCategories={
          copyFromPrev && copySourceData
            ? copySourceData.map((b) => ({
                id: b.id,
                name: b.category_name || b.category,
                icon: b.category_icon || "",
                budget: Number(b.planned_amount),
                spent: 0,
                recent: 0,
              }))
            : null
        }
      />
      <CopyFromMonthDrawer
        open={copyDrawerOpen}
        onOpenChange={setCopyDrawerOpen}
        currentMonthYear={key}
        onSelect={(monthYear) => setCopyFromMonth(monthYear)}
      />
      {cats && (
        <EditBudgetDrawer
          open={editOpen}
          onOpenChange={(open) => {
            setEditOpen(open);
            if (!open) {
              setReallocateCategories(null);
              setReallocateHighlights([]);
            }
          }}
          year={year}
          month={month}
          categories={reallocateCategories ?? cats}
          onSave={handleEditSave}
          onDelete={handleEditDelete}
          highlightedIds={reallocateHighlights}
        />
      )}
    </main>
  );
}
