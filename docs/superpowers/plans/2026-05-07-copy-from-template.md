# Copy From Template — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hardcoded "Copy from last month" button in BudgetEmptyState with a "Copy from template" drawer that lists all months the user has budget data for, letting them pick any month to copy from.

**Architecture:** Add a `getBudgetMonths()` service method that returns distinct `month_year` values with summary data. A new `CopyFromMonthDrawer` presents these months in a list. When user picks a month, its budget data is fetched (reusing existing `getBudgets`) and passed as `initialCategories` to `CreateBudgetDrawer`. The previous-month-specific logic in `page.tsx` is removed — the drawer handles its own data.

**Tech Stack:** Supabase (distinct query), TanStack Query hook, vaul drawer, existing UI primitives

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Modify | `src/services/budgets/budgets.service.ts` | Add `getBudgetMonths()` |
| Modify | `src/services/budgets/budgets.hooks.ts` | Add `useGetBudgetMonths()` hook |
| Create | `src/components/budget/copy-from-month-drawer.tsx` | Month picker drawer for copying |
| Modify | `src/components/budget/budget-empty-state.tsx` | Replace prev-month card with "Copy from template" button |
| Modify | `src/app/(main)/budget/page.tsx` | Remove prev-month fetch, wire new drawer |

---

### Task 1: Add `getBudgetMonths` to budget service

**Files:**
- Modify: `src/services/budgets/budgets.service.ts`

- [ ] **Step 1: Add `BudgetMonthSummary` type and `getBudgetMonths` method**

Add this type near the top of the file after existing types:

```ts
export type BudgetMonthSummary = {
  month_year: string;
  category_count: number;
  total_planned: number;
};
```

Add this method to the `budgetsService` object, after `deleteBudget`:

```ts
getBudgetMonths: async (): Promise<BudgetMonthSummary[]> => {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    throw new Error(authError?.message ?? "Not authenticated");
  }

  const { data, error } = await supabase
    .from("budgets")
    .select("month_year, planned_amount")
    .eq("user_id", authData.user.id)
    .order("month_year", { ascending: false });

  if (error) throw new Error(error.message);

  // Aggregate client-side: group by month_year
  const map = new Map<string, { count: number; total: number }>();
  for (const row of data ?? []) {
    const entry = map.get(row.month_year) ?? { count: 0, total: 0 };
    entry.count += 1;
    entry.total += Number(row.planned_amount);
    map.set(row.month_year, entry);
  }

  return Array.from(map.entries()).map(([month_year, { count, total }]) => ({
    month_year,
    category_count: count,
    total_planned: total,
  }));
},
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors in `budgets.service.ts`

- [ ] **Step 3: Commit**

```bash
git add src/services/budgets/budgets.service.ts
git commit -m "feat(budget): add getBudgetMonths service method"
```

---

### Task 2: Add `useGetBudgetMonths` hook

**Files:**
- Modify: `src/services/budgets/budgets.hooks.ts`

- [ ] **Step 1: Add query key and hook**

Add to imports at top:

```ts
import {
  budgetsService,
  CreateBudgetPayload,
  UpdateBudgetPayload,
  BudgetMonthSummary,
} from "./budgets.service";
```

Add to `budgetKeys`:

```ts
export const budgetKeys = {
  all: ["budgets"] as const,
  month: (monthYear: string) => ["budgets", monthYear] as const,
  months: () => ["budgets", "months"] as const,
};
```

Add after `useGetBudgets`:

```ts
export const getBudgetMonthsQueryOptions = () => ({
  queryKey: budgetKeys.months(),
  queryFn: () => budgetsService.getBudgetMonths(),
});

type UseGetBudgetMonthsParams = {
  queryConfig?: QueryConfig<typeof getBudgetMonthsQueryOptions>;
};

export const useGetBudgetMonths = ({ queryConfig }: UseGetBudgetMonthsParams = {}) => {
  return useQuery({
    ...getBudgetMonthsQueryOptions(),
    ...queryConfig,
  });
};
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors in `budgets.hooks.ts`

- [ ] **Step 3: Commit**

```bash
git add src/services/budgets/budgets.hooks.ts
git commit -m "feat(budget): add useGetBudgetMonths hook"
```

---

### Task 3: Create `CopyFromMonthDrawer`

**Files:**
- Create: `src/components/budget/copy-from-month-drawer.tsx`

- [ ] **Step 1: Write the drawer component**

This drawer lists months with existing budget data (excluding current month). When user taps a month, it calls `onSelect(monthYear)`. Uses `useGetBudgetMonths` hook internally.

```tsx
"use client";

import * as React from "react";
import { Copy, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtIDR } from "@/lib/format";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { MONTH_NAMES, monthKey } from "./budget-constants";
import { useGetBudgetMonths } from "@/services/budgets/budgets.hooks";

interface CopyFromMonthDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current month_year key to exclude from list */
  currentMonthYear: string;
  onSelect: (monthYear: string) => void;
}

function parseMonthYear(my: string): { year: number; month: number } {
  const [y, m] = my.split("-");
  return { year: parseInt(y, 10), month: parseInt(m, 10) - 1 };
}

function formatMonthYear(my: string): string {
  const { year, month } = parseMonthYear(my);
  return `${MONTH_NAMES[month]} ${year}`;
}

export function CopyFromMonthDrawer({
  open,
  onOpenChange,
  currentMonthYear,
  onSelect,
}: CopyFromMonthDrawerProps) {
  const { data: months = [], isLoading } = useGetBudgetMonths();

  const available = months.filter((m) => m.month_year !== currentMonthYear);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[70dvh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle>Copy from template</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {isLoading && (
            <div className="flex justify-center py-8 text-[13px] text-fg-2">
              Loading...
            </div>
          )}

          {!isLoading && available.length === 0 && (
            <div className="flex flex-col items-center py-8 text-center">
              <Calendar size={28} strokeWidth={1.5} className="text-fg-2 mb-2" />
              <p className="text-[13px] text-fg-2">
                No other months with budgets yet.
              </p>
            </div>
          )}

          {!isLoading && available.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[12px] text-fg-2 mb-1">
                Pick a month to copy its budget categories and amounts.
              </p>
              {available.map((m) => (
                <button
                  key={m.month_year}
                  onClick={() => {
                    onSelect(m.month_year);
                    onOpenChange(false);
                  }}
                  className="flex items-center justify-between p-3.5 rounded-lg bg-bg-1 border border-line cursor-pointer hover:bg-bg-2 hover:border-brand transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-soft text-brand flex items-center justify-center">
                      <Copy size={15} strokeWidth={1.75} />
                    </div>
                    <div className="text-left">
                      <div className="text-[13px] font-medium text-fg-0">
                        {formatMonthYear(m.month_year)}
                      </div>
                      <div className="text-[11px] text-fg-2">
                        {m.category_count} {m.category_count === 1 ? "category" : "categories"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-mono tabular-nums text-fg-1 group-hover:text-fg-0">
                      {fmtIDR(m.total_planned)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/components/budget/copy-from-month-drawer.tsx
git commit -m "feat(budget): add CopyFromMonthDrawer component"
```

---

### Task 4: Update `BudgetEmptyState`

**Files:**
- Modify: `src/components/budget/budget-empty-state.tsx`

- [ ] **Step 1: Replace previous-month card with "Copy from template" button**

Remove `previousCategories` and `onCopyFromLastMonth` props. Add `onCopyFromTemplate` prop. Remove `prevTotal` calculation. Replace the previous-month card with a simpler button. Also remove unused `fmtIDR` import.

New interface:

```ts
interface BudgetEmptyStateProps {
  year: number;
  month: number;
  hasPreviousBudgets: boolean;
  onCreate: () => void;
  onCopyFromTemplate: () => void;
}
```

New component signature:

```tsx
export function BudgetEmptyState({
  year,
  month,
  hasPreviousBudgets,
  onCreate,
  onCopyFromTemplate,
}: BudgetEmptyStateProps) {
```

Replace the `{prevTotal != null && (...)}` block (lines 117-135) with:

```tsx
{hasPreviousBudgets && (
  <button
    onClick={onCopyFromTemplate}
    className="mt-3 h-9 px-4 rounded-sm bg-bg-2 border border-line text-[13px] text-fg-0 font-medium flex items-center gap-2 cursor-pointer hover:bg-bg-3 hover:border-brand transition-colors"
  >
    <Repeat size={14} strokeWidth={1.75} />
    Copy from template
  </button>
)}
```

Remove unused `fmtIDR` import from the top of the file (it was only used for `prevTotal`).

- [ ] **Step 2: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: Errors in `page.tsx` (expected — we update that next)

- [ ] **Step 3: Commit**

```bash
git add src/components/budget/budget-empty-state.tsx
git commit -m "feat(budget): update empty state with copy-from-template button"
```

---

### Task 5: Wire everything in `page.tsx`

**Files:**
- Modify: `src/app/(main)/budget/page.tsx`

- [ ] **Step 1: Add imports**

Add to imports:

```ts
import { CopyFromMonthDrawer } from "@/components/budget/copy-from-month-drawer";
import { useGetBudgetMonths } from "@/services/budgets/budgets.hooks";
```

- [ ] **Step 2: Add state and hook, remove prev-month logic**

Remove these lines (previous month calculation + data, ~lines 51-57 and 62):

```ts
// Previous month
let pm = month - 1,
  py = year;
if (pm < 0) {
  pm = 11;
  py -= 1;
}
const prevKey = monthKey(py, pm);
```

Remove:

```ts
const { data: prevBudgetData } = useGetBudgets({ monthYear: prevKey });
```

Remove the entire `previousCats` useMemo block (~lines 87-97):

```ts
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
```

Add new state and hook:

```ts
const [copyDrawerOpen, setCopyDrawerOpen] = React.useState(false);
const [copyFromMonth, setCopyFromMonth] = React.useState<string | null>(null);
const { data: budgetMonths = [] } = useGetBudgetMonths();

// Fetch budget for the month user wants to copy from
const { data: copySourceData } = useGetBudgets({
  monthYear: copyFromMonth ?? "",
  queryConfig: { enabled: !!copyFromMonth },
});
```

Add effect to open CreateBudgetDrawer when copy source data loads:

```ts
React.useEffect(() => {
  if (copyFromMonth && copySourceData && copySourceData.length > 0) {
    setCopyFromPrev(true);
    setCreateOpen(true);
    setCopyFromMonth(null);
  }
}, [copyFromMonth, copySourceData]);
```

- [ ] **Step 3: Update BudgetEmptyState usage**

Replace the `<BudgetEmptyState>` JSX:

```tsx
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
```

- [ ] **Step 4: Update CreateBudgetDrawer initialCategories**

Change the `initialCategories` prop on `<CreateBudgetDrawer>` from `previousCats` to use `copySourceData`:

```tsx
<CreateBudgetDrawer
  open={createOpen}
  onOpenChange={setCreateOpen}
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
```

- [ ] **Step 5: Add CopyFromMonthDrawer to JSX**

Add after `<CreateBudgetDrawer>`:

```tsx
<CopyFromMonthDrawer
  open={copyDrawerOpen}
  onOpenChange={setCopyDrawerOpen}
  currentMonthYear={key}
  onSelect={(monthYear) => setCopyFromMonth(monthYear)}
/>
```

- [ ] **Step 6: Clean up unused imports**

Remove `monthKey` import if no longer used (it is still used for `key`). Remove `BudgetCategory` type import only if no longer referenced (it's still used in `cats` typing and `handleSave`/`handleEditSave`). Remove the `Repeat` import from lucide if it was only in empty state (check — it's not imported in page.tsx, so nothing to remove).

- [ ] **Step 7: Verify no type errors**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: No errors

- [ ] **Step 8: Test manually**

1. Navigate to a month with no budget → see "Copy from template" button
2. Tap it → drawer opens showing months with existing budgets
3. Pick a month → CreateBudgetDrawer opens pre-filled with that month's categories/amounts
4. Save → budget created successfully

- [ ] **Step 9: Commit**

```bash
git add src/app/(main)/budget/page.tsx
git commit -m "feat(budget): wire copy-from-template drawer in budget page"
```
