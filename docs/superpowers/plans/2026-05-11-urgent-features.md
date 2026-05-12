# Urgent Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 5 urgent features: dashboard month picker, profile stats (real data + streak), history sort, budget insight with reallocate, and fix the empty-state bug on dashboard period filter.

**Architecture:** All features are client-side UI wiring to existing Supabase data. Two new service methods needed (transaction count, streak). Month picker reuses existing `MonthPickerDrawer`. Budget insight computes from already-fetched budget category data. Sort is client-side on already-fetched transactions.

**Tech Stack:** Next.js App Router, React 19, Supabase, TanStack Query, vaul (drawers), date-fns, lucide-react

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/services/transactions/transactions.service.ts` | Modify | Add `getTransactionCount`, `getTransactionStreak`, `getYearlySummary` methods |
| `src/services/transactions/transactions.hooks.ts` | Modify | Add `useGetTransactionCount`, `useGetTransactionStreak`, `useGetYearlySummary` hooks |
| `src/app/(main)/page.tsx` | Modify | Add month picker, fix empty-state bug |
| `src/app/(main)/profile/page.tsx` | Modify | Uncomment streak, wire stats to real data |
| `src/app/(main)/history/page.tsx` | Modify | Add sort dropdown with 4 options |
| `src/components/budget/budget-insight.tsx` | Modify | Compute insight from real data, wire reallocate |
| `src/app/(main)/budget/page.tsx` | Modify | Pass `onReallocate` callback + categories to BudgetInsight |
| `src/components/budget/edit-budget-drawer.tsx` | Modify | Accept optional `highlightedIds` prop |

---

### Task 1: Transaction Service — New Query Methods

**Files:**
- Modify: `src/services/transactions/transactions.service.ts`
- Modify: `src/services/transactions/transactions.hooks.ts`

- [ ] **Step 1: Add `getTransactionCount` to service**

Add to `transactionsService` object in `src/services/transactions/transactions.service.ts`:

```ts
getTransactionCount: async (): Promise<number> => {
  const { count, error } = await supabase
    .from("transactions")
    .select("*", { count: "exact", head: true });

  if (error) throw new Error(error.message);
  return count ?? 0;
},
```

- [ ] **Step 2: Add `getTransactionStreak` to service**

Add to `transactionsService` object:

```ts
getTransactionStreak: async (): Promise<number> => {
  const { data, error } = await supabase
    .from("transactions")
    .select("date")
    .order("date", { ascending: false });

  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return 0;

  // Get unique dates
  const uniqueDates = [...new Set(data.map((r) => r.date))];

  // Count consecutive days from today backwards
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  const checkDate = new Date(today);

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().split("T")[0];
    if (uniqueDates.includes(dateStr)) {
      streak++;
    } else if (i > 0) {
      // Allow today to be missing (day not over yet), but break on any other gap
      break;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }
  return streak;
},
```

- [ ] **Step 3: Add `getYearlySummary` to service**

Add to `transactionsService` object:

```ts
getYearlySummary: async (year: number): Promise<TransactionSummary> => {
  const dateFrom = `${year}-01-01`;
  const dateTo = `${year}-12-31`;
  const { data, error } = await supabase
    .from("transactions")
    .select("type, amount")
    .gte("date", dateFrom)
    .lte("date", dateTo);

  if (error) throw new Error(error.message);

  let totalIncome = 0;
  let totalExpense = 0;
  for (const row of data ?? []) {
    if (row.type === "Income") totalIncome += Number(row.amount);
    else if (row.type === "Expense") totalExpense += Number(row.amount);
  }
  return { totalIncome, totalExpense };
},
```

- [ ] **Step 4: Add hooks in `transactions.hooks.ts`**

Add query keys:

```ts
// Add to transactionKeys object:
count: () => ["transactions", "count"] as const,
streak: () => ["transactions", "streak"] as const,
yearlySummary: (year: number) => ["transactions", "yearly-summary", year] as const,
```

Add query options and hooks:

```ts
export const getTransactionCountQueryOptions = () => ({
  queryKey: transactionKeys.count(),
  queryFn: () => transactionsService.getTransactionCount(),
});

export const useGetTransactionCount = () => {
  return useQuery(getTransactionCountQueryOptions());
};

export const getTransactionStreakQueryOptions = () => ({
  queryKey: transactionKeys.streak(),
  queryFn: () => transactionsService.getTransactionStreak(),
});

export const useGetTransactionStreak = () => {
  return useQuery(getTransactionStreakQueryOptions());
};

export const getYearlySummaryQueryOptions = (year: number) => ({
  queryKey: transactionKeys.yearlySummary(year),
  queryFn: () => transactionsService.getYearlySummary(year),
});

type UseGetYearlySummaryParams = {
  year: number;
  queryConfig?: QueryConfig<typeof getYearlySummaryQueryOptions>;
};

export const useGetYearlySummary = ({ year, queryConfig }: UseGetYearlySummaryParams) => {
  return useQuery({
    ...getYearlySummaryQueryOptions(year),
    ...queryConfig,
  });
};
```

- [ ] **Step 5: Commit**

```bash
git add src/services/transactions/transactions.service.ts src/services/transactions/transactions.hooks.ts
git commit -m "feat: add transaction count, streak, and yearly summary service methods"
```

---

### Task 2: Dashboard Month Picker + Empty State Bug Fix

**Files:**
- Modify: `src/app/(main)/page.tsx`

- [ ] **Step 1: Add month/year state and month picker import**

Add imports at top of `src/app/(main)/page.tsx`:

```ts
import { MonthPickerDrawer } from "@/components/budget/month-picker-drawer";
```

Inside `DashboardPage`, add state (near other state declarations):

```ts
const [selectedYear, setSelectedYear] = React.useState(now.getFullYear());
const [selectedMonth, setSelectedMonth] = React.useState(now.getMonth());
const [monthPickerOpen, setMonthPickerOpen] = React.useState(false);
```

- [ ] **Step 2: Update dateFrom/dateTo to use selected month**

Replace the `dateFrom`/`dateTo` `useMemo` to respect selected month for "Month" period, and also for other periods when a non-current month is selected:

```ts
const { dateFrom, dateTo } = React.useMemo(() => {
  const today = new Date();
  const isCurrentMonth =
    selectedYear === today.getFullYear() && selectedMonth === today.getMonth();

  // If user selected a different month, always show that full month
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
```

- [ ] **Step 3: Update month label and wire button**

Replace the static `monthLabel`:

```ts
const monthLabel = format(new Date(selectedYear, selectedMonth), "MMMM \u00B7 yyyy");
```

Wire the month selector button (around line 198):

```tsx
<button
  onClick={() => setMonthPickerOpen(true)}
  className="bg-bg-2 border-line text-fg-1 inline-flex h-6 cursor-pointer items-center gap-1 rounded-full border px-2.5 font-mono text-[11px]"
>
  {monthLabel} <ChevronDown size={12} strokeWidth={1.75} />
</button>
```

- [ ] **Step 4: Fix empty-state bug**

The bug: `showOnboarding` uses `!hasTransactions` which is based on filtered `recentTx`. When period filter returns 0 results, it shows onboarding instead of empty state.

Add a separate query for total count (import the hook):

```ts
import { useGetTransactionCount } from "@/services/transactions/transactions.hooks";
```

Inside component:

```ts
const { data: totalTxCount = 0 } = useGetTransactionCount();
```

Change `showOnboarding`:

```ts
const showOnboarding = totalTxCount === 0;
```

And add an empty state for filtered results (inside the `<>` branch, after the transaction list):

```tsx
{!showOnboarding && groups.length === 0 && (
  <div className="text-fg-2 flex justify-center py-8 text-[13px]">
    No transactions this period
  </div>
)}
```

Remove the existing "No transactions yet" empty state inside the groups map (lines 299-302), since it's now handled above.

- [ ] **Step 5: Add MonthPickerDrawer at bottom of component**

Add near the other drawers (before `<div className="h-5" />`):

```tsx
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
```

- [ ] **Step 6: Commit**

```bash
git add src/app/(main)/page.tsx
git commit -m "feat: add month picker to dashboard, fix empty-state bug on period filter"
```

---

### Task 3: Profile Stats — Real Data + Streak

**Files:**
- Modify: `src/app/(main)/profile/page.tsx`

- [ ] **Step 1: Add imports for new hooks**

```ts
import {
  useGetTransactionCount,
  useGetTransactionStreak,
  useGetYearlySummary,
} from "@/services/transactions/transactions.hooks";
```

- [ ] **Step 2: Add hook calls inside `ProfilePage`**

```ts
const { data: txCount = 0 } = useGetTransactionCount();
const { data: streak = 0 } = useGetTransactionStreak();
const currentYear = new Date().getFullYear();
const { data: thisYearSummary } = useGetYearlySummary({ year: currentYear });
const { data: lastYearSummary } = useGetYearlySummary({ year: currentYear - 1 });
```

Compute savings percentage:

```ts
const savingsPercent = React.useMemo(() => {
  if (!thisYearSummary) return null;
  const thisYearSavings = thisYearSummary.totalIncome - thisYearSummary.totalExpense;
  if (!lastYearSummary) {
    // No last year data — show savings rate
    if (thisYearSummary.totalIncome === 0) return null;
    return Math.round((thisYearSavings / thisYearSummary.totalIncome) * 100);
  }
  const lastYearSavings = lastYearSummary.totalIncome - lastYearSummary.totalExpense;
  if (lastYearSavings === 0) return null;
  return Math.round(((thisYearSavings - lastYearSavings) / Math.abs(lastYearSavings)) * 100);
}, [thisYearSummary, lastYearSummary]);
```

- [ ] **Step 3: Uncomment streak and wire all three stats**

Replace the entire stats strip section (lines 114-147) with:

```tsx
{/* Stats strip */}
<div className="border-line bg-bg-1 mx-4 grid grid-cols-3 overflow-hidden rounded-md border">
  <div className="border-line border-r p-3.5">
    <div className="text-fg-2 text-[10px] tracking-[0.06em] uppercase">
      Tracked
    </div>
    <div className="mt-1 font-mono text-[18px] font-medium tracking-[-0.01em] tabular-nums">
      {txCount.toLocaleString()}
    </div>
    <div className="text-fg-2 mt-0.5 font-mono text-[11px]">
      transactions
    </div>
  </div>
  <div className="border-line border-r p-3.5">
    <div className="text-fg-2 text-[10px] tracking-[0.06em] uppercase">
      Saved
    </div>
    <div className={`mt-1 font-mono text-[18px] font-medium tracking-[-0.01em] tabular-nums ${savingsPercent !== null && savingsPercent >= 0 ? "text-pos" : "text-neg"}`}>
      {savingsPercent !== null ? `${savingsPercent >= 0 ? "+" : ""}${savingsPercent}%` : "\u2014"}
    </div>
    <div className="text-fg-2 mt-0.5 font-mono text-[11px]">
      {lastYearSummary ? "vs last yr" : "savings rate"}
    </div>
  </div>
  <div className="p-3.5">
    <div className="text-fg-2 text-[10px] tracking-[0.06em] uppercase">
      Streak
    </div>
    <div className="mt-1 font-mono text-[18px] font-medium tracking-[-0.01em] tabular-nums">
      {streak}
    </div>
    <div className="text-fg-2 mt-0.5 font-mono text-[11px]">days</div>
  </div>
</div>
```

- [ ] **Step 4: Clean up unused imports**

Remove `Calendar`, `Shield`, `Database`, `Download`, `Tag` from the lucide imports if they're only used in commented-out code. Keep `User` if still used elsewhere.

- [ ] **Step 5: Commit**

```bash
git add src/app/(main)/profile/page.tsx
git commit -m "feat: wire profile stats to real data, add streak counter"
```

---

### Task 4: Sort Transactions in History

**Files:**
- Modify: `src/app/(main)/history/page.tsx`

- [ ] **Step 1: Add sort state and type**

Near the top of `HistoryPage` component, add:

```ts
type SortOption = "newest" | "oldest" | "highest" | "lowest";
const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "highest", label: "Highest amount" },
  { value: "lowest", label: "Lowest amount" },
];
```

Inside component:

```ts
const [sort, setSort] = React.useState<SortOption>("newest");
const [sortOpen, setSortOpen] = React.useState(false);
```

- [ ] **Step 2: Add sorted transactions memo**

After `transactions` is fetched, add:

```ts
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
      return txs; // Already sorted newest first from API
  }
}, [transactions, sort]);
```

Replace all references to `transactions` in the JSX with `sortedTransactions` (in `HistoryList`, `selected.size`, `setSelected`, and the count display).

**Important:** Keep using `transactions` for `isEmpty` / `isNoResults` checks and `selected` "select all" — those should use the unfiltered list. Only `HistoryList`, the count label, and `HistorySummary` should use `sortedTransactions`.

- [ ] **Step 3: Replace sort button with dropdown**

Replace the sort button (lines 288-291) with:

```tsx
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
```

Add `cn` import if not already present:

```ts
import { cn } from "@/lib/utils";
```

- [ ] **Step 4: Update HistoryList and HistorySummary to use sortedTransactions**

In the JSX, change:
- `<HistorySummary transactions={transactions} />` → `<HistorySummary transactions={sortedTransactions} />`
- `<HistoryList transactions={transactions}` → `<HistoryList transactions={sortedTransactions}`
- `{transactions.length} transactions` → `{sortedTransactions.length} transactions`
- Keep `transactions` for: `isEmpty`, `isNoResults`, `setSelected(new Set(transactions.map(...)))` (select all)

- [ ] **Step 5: Commit**

```bash
git add src/app/(main)/history/page.tsx
git commit -m "feat: add sort dropdown to transaction history (date, amount)"
```

---

### Task 5: Budget Insight — Computed Data + Reallocate

**Files:**
- Modify: `src/components/budget/budget-insight.tsx`
- Modify: `src/app/(main)/budget/page.tsx`
- Modify: `src/components/budget/edit-budget-drawer.tsx`

- [ ] **Step 1: Add `highlightedIds` prop to EditBudgetDrawer**

In `src/components/budget/edit-budget-drawer.tsx`, update the interface:

```ts
interface EditBudgetDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  month: number;
  categories: BudgetCategory[];
  onSave: (rows: BudgetCategory[]) => void;
  onDelete: (ids: string[]) => void;
  highlightedIds?: string[];
}
```

Add to destructured props:

```ts
export function EditBudgetDrawer({
  open,
  onOpenChange,
  year,
  month,
  categories,
  onSave,
  onDelete,
  highlightedIds = [],
}: EditBudgetDrawerProps) {
```

In the row rendering (the `<div key={r.id}` around line 155), add a highlight ring when the row id is in `highlightedIds`:

Replace the className on the row container:

```ts
className={cn(
  "p-3 rounded-lg border transition-colors",
  r.enabled
    ? highlightedIds.includes(r.id)
      ? "bg-brand-soft/30 border-brand ring-1 ring-brand/20"
      : "bg-bg-1 border-line"
    : "bg-bg-0 border-line/50 opacity-60"
)}
```

- [ ] **Step 2: Rewrite BudgetInsight to compute from real data**

Replace the entire `src/components/budget/budget-insight.tsx`:

```tsx
"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { fmtIDRShort } from "@/lib/format";
import { MONTH_NAMES } from "./budget-constants";
import type { BudgetCategory } from "./budget-types";

interface BudgetInsightProps {
  month: number;
  categories: BudgetCategory[];
  onReallocate: (fromId: string, toId: string, amount: number) => void;
}

function computeInsight(categories: BudgetCategory[]) {
  if (categories.length === 0) return null;

  // Find most over-budget category (highest spent/budget ratio > 100%)
  let overCat: BudgetCategory | null = null;
  let overRatio = 1;
  for (const c of categories) {
    if (c.budget <= 0) continue;
    const ratio = c.spent / c.budget;
    if (ratio > overRatio && ratio > 1) {
      overCat = c;
      overRatio = ratio;
    }
  }

  // Find category with most surplus (lowest spent/budget ratio)
  let surplusCat: BudgetCategory | null = null;
  let surplusAmount = 0;
  for (const c of categories) {
    if (c.budget <= 0) continue;
    const surplus = c.budget - c.spent;
    if (surplus > surplusAmount && c.id !== overCat?.id) {
      surplusCat = c;
      surplusAmount = surplus;
    }
  }

  if (!overCat) {
    // Nothing over budget — positive message
    const totalBudget = categories.reduce((s, c) => s + c.budget, 0);
    const totalSpent = categories.reduce((s, c) => s + c.spent, 0);
    const ahead = totalBudget - totalSpent;
    return {
      type: "positive" as const,
      message: ahead > 0
        ? `You're ${fmtIDRShort(ahead)} under budget. On track!`
        : "You're right on budget this month.",
      overCat: null,
      surplusCat: null,
      suggestedAmount: 0,
    };
  }

  const overAmount = overCat.spent - overCat.budget;
  const suggestedAmount = surplusCat ? Math.min(overAmount, surplusAmount) : 0;

  return {
    type: "warning" as const,
    overCat,
    surplusCat,
    suggestedAmount,
    message: surplusCat
      ? `${overCat.name} is over budget \u2014 consider rolling ${fmtIDRShort(suggestedAmount)} from ${surplusCat.name}.`
      : `${overCat.name} is ${fmtIDRShort(overAmount)} over budget.`,
  };
}

export function BudgetInsight({ month, categories, onReallocate }: BudgetInsightProps) {
  const [dismissed, setDismissed] = React.useState(false);
  const insight = React.useMemo(() => computeInsight(categories), [categories]);

  if (dismissed || !insight) return null;

  return (
    <div className="mx-4 p-4 rounded-lg bg-bg-1 border border-line">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-md bg-brand-soft text-brand flex items-center justify-center">
          <Sparkles size={13} strokeWidth={1.75} />
        </div>
        <span className="text-[12px] font-semibold text-fg-0">
          {MONTH_NAMES[month]} Insight
        </span>
      </div>
      <p className="text-[12px] text-fg-1 leading-relaxed">
        {insight.type === "positive" ? (
          <span className="text-pos font-medium">{insight.message}</span>
        ) : (
          insight.message
        )}
      </p>
      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={() => setDismissed(true)}
          className="h-8 px-3 rounded-sm text-[12px] text-fg-1 border border-line bg-bg-2 cursor-pointer hover:bg-bg-3 transition-colors"
        >
          Dismiss
        </button>
        {insight.type === "warning" && insight.overCat && insight.surplusCat && insight.suggestedAmount > 0 && (
          <button
            onClick={() => onReallocate(insight.surplusCat!.id, insight.overCat!.id, insight.suggestedAmount)}
            className="h-8 px-3 rounded-sm text-[12px] font-medium text-brand-ink bg-brand cursor-pointer hover:bg-brand-hi transition-colors"
          >
            Reallocate
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire BudgetInsight in budget page**

In `src/app/(main)/budget/page.tsx`, add state for reallocate:

```ts
const [reallocateHighlights, setReallocateHighlights] = React.useState<string[]>([]);
```

Add the reallocate handler:

```ts
const handleReallocate = (fromId: string, toId: string, amount: number) => {
  // Pre-fill edit drawer: reduce fromId budget by amount, increase toId budget by amount
  const adjusted = (cats ?? []).map((c) => {
    if (c.id === fromId) return { ...c, budget: Math.max(0, c.budget - amount) };
    if (c.id === toId) return { ...c, budget: c.budget + amount };
    return c;
  });
  // Store adjusted categories temporarily and open edit drawer
  setReallocateCategories(adjusted);
  setReallocateHighlights([fromId, toId]);
  setEditOpen(true);
};
```

Add state for reallocate categories:

```ts
const [reallocateCategories, setReallocateCategories] = React.useState<BudgetCategory[] | null>(null);
```

Update the `BudgetInsight` usage (around line 281):

```tsx
<BudgetInsight
  month={month}
  categories={cats}
  onReallocate={handleReallocate}
/>
```

Update `EditBudgetDrawer` to use reallocate categories when available:

```tsx
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
```

- [ ] **Step 4: Commit**

```bash
git add src/components/budget/budget-insight.tsx src/app/(main)/budget/page.tsx src/components/budget/edit-budget-drawer.tsx
git commit -m "feat: compute budget insight from real data, wire reallocate to edit drawer with highlights"
```

---

### Task 6: Final Verification

- [ ] **Step 1: Run build**

```bash
npm run build
```

Expected: Build succeeds with no type errors.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Expected: No lint errors.

- [ ] **Step 3: Manual smoke test checklist**

1. Dashboard: tap month selector → picker opens → select past month → only "Recent activity" changes, balance hero stays
2. Dashboard: set period to "Day" on a day with no transactions → shows "No transactions this period" (NOT onboarding)
3. Profile: stats show real transaction count, computed savings %, streak days
4. History: tap "Newest first" → dropdown appears → select "Highest amount" → transactions reorder
5. Budget: insight section shows computed text → tap "Reallocate" → edit drawer opens with highlighted rows and pre-adjusted amounts
