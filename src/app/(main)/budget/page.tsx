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
import { CreateBudgetDrawer } from "@/components/budget/create-budget-drawer";
import { MonthPickerDrawer } from "@/components/budget/month-picker-drawer";
import { Chip } from "@/components/ui/chip";
import {
  BarChart3,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Tag,
} from "lucide-react";
import * as React from "react";
import { useGetBudgets, useCreateBudgets } from "@/services/budgets/budgets.hooks";
import { useGetCategories } from "@/services/categories/categories.hooks";

function pctOf(spent: number, budget: number): number {
  if (budget <= 0) return 0;
  return Math.min(999, (spent / budget) * 100);
}

type FilterType = "all" | "active" | "over";

export default function BudgetPage() {
  const now = new Date();
  const [year, setYear] = React.useState(now.getFullYear());
  const [month, setMonth] = React.useState(now.getMonth());
  const [filter, setFilter] = React.useState<FilterType>("all");
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);

  const key = monthKey(year, month);

  // Previous month
  let pm = month - 1,
    py = year;
  if (pm < 0) {
    pm = 11;
    py -= 1;
  }
  const prevKey = monthKey(py, pm);

  const { data: budgetData, isLoading } = useGetBudgets({ monthYear: key });
  const { data: prevBudgetData } = useGetBudgets({ monthYear: prevKey });
  const { data: categories = [] } = useGetCategories();

  const createBudgets = useCreateBudgets({
    mutationConfig: {
      onSuccess: () => setCreateOpen(false),
    },
  });

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

  const previousCats: BudgetCategory[] | null = React.useMemo(() => {
    if (!prevBudgetData || prevBudgetData.length === 0) return null;
    return prevBudgetData.map((b) => ({
      id: b.id,
      name: b.category_name || b.category,
      icon: b.category_icon || "",
      budget: Number(b.planned_amount),
      spent: b.spent,
      recent: b.recent,
    }));
  }, [prevBudgetData]);

  const isEmpty = !isLoading && (!cats || cats.length === 0);

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
      };
    });
    createBudgets.mutate(payloads);
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
          Loading...
        </div>
      )}

      {!isLoading && isEmpty ? (
        <BudgetEmptyState
          year={year}
          month={month}
          previousCategories={previousCats}
          onCreate={() => setCreateOpen(true)}
        />
      ) : !isLoading && cats ? (
        <>
          <BudgetHero categories={cats} year={year} month={month} />
          <BudgetPace categories={cats} year={year} month={month} />

          {/* Section title + view toggle */}
          <div className="mt-2 flex items-center justify-between px-5">
            <h2 className="text-fg-2 text-[11px] font-semibold tracking-[0.06em] uppercase">
              Categories
            </h2>
            <div className="bg-bg-1 border-line flex items-center gap-0.5 rounded-sm border p-[3px]">
              <button className="bg-bg-3 text-fg-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-xs">
                <Tag size={12} strokeWidth={1.75} />
              </button>
              <button className="text-fg-2 hover:text-fg-0 flex h-7 w-7 cursor-pointer items-center justify-center rounded-xs">
                <BarChart3 size={12} strokeWidth={1.75} />
              </button>
            </div>
          </div>

          {/* Filter chips */}
          <div className="hide-scrollbar flex gap-1.5 overflow-x-auto px-5 pb-1">
            <Chip
              active={filter === "all"}
              count={cats.length}
              onClick={() => setFilter("all")}
            >
              All
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
          <BudgetInsight month={month} />

          {/* Add category CTA */}
          <button className="border-line text-fg-1 hover:bg-bg-1 hover:border-brand mx-4 flex h-14 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed text-[13px] transition-colors">
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
        onOpenChange={setCreateOpen}
        year={year}
        month={month}
        onSave={handleSave}
      />
    </main>
  );
}
