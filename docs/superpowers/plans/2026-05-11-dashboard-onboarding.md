# Dashboard Onboarding + Optional Budgets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a guided onboarding flow to the dashboard for new users, make budgets optional for transactions, and nudge users toward budgeting after they start tracking.

**Architecture:** Conditional render in the dashboard page — show checklist-card onboarding when no transactions exist, normal dashboard otherwise. Fix the add-transaction drawer to allow uncategorized transactions when no budgets are defined. Add a dismissable nudge chip when transactions exist but budgets don't.

**Tech Stack:** React 19, Next.js 16 (App Router), TanStack Query, Tailwind CSS 4, vaul (drawers), lucide-react (icons)

**Design Spec:** `docs/superpowers/specs/2026-05-11-dashboard-onboarding-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/transactions/add-transaction-drawer.tsx` | Modify | Fix category filter to show "Uncategorized" tile when no budgets |
| `src/components/home/dashboard-onboarding.tsx` | Create | Checklist-card onboarding UI component |
| `src/components/home/budget-nudge.tsx` | Create | Dismissable chip encouraging budget setup |
| `src/app/(main)/page.tsx` | Modify | Conditional render: onboarding vs dashboard, add budget hooks + CreateBudgetDrawer |

---

## Task 1: Fix Add Transaction Drawer — Uncategorized Fallback

**Files:**
- Modify: `src/components/transactions/add-transaction-drawer.tsx:369-376` (displayCategories memo)
- Modify: `src/components/transactions/add-transaction-drawer.tsx:460-473` (handleSave)

- [ ] **Step 1: Update displayCategories memo**

In `src/components/transactions/add-transaction-drawer.tsx`, replace the `displayCategories` useMemo (lines 369-376):

```tsx
// Only show categories that have budgets defined for current month
const displayCategories = React.useMemo(() => {
  if (budgets.length === 0) return [];
  const budgetCategoryIds = new Set(budgets.map((b) => b.category_id).filter(Boolean));
  const budgetCategoryNames = new Set(budgets.map((b) => b.category));
  return categories.filter(
    (c) => budgetCategoryIds.has(c.id) || budgetCategoryNames.has(c.name)
  );
}, [categories, budgets]);
```

With:

```tsx
// Show budgeted categories, or a single "Uncategorized" fallback when no budgets exist
const UNCATEGORIZED_TILE = { id: "__uncategorized__", name: "Uncategorized", icon: "📝" };

const displayCategories = React.useMemo(() => {
  if (budgets.length === 0) return [UNCATEGORIZED_TILE];
  const budgetCategoryIds = new Set(budgets.map((b) => b.category_id).filter(Boolean));
  const budgetCategoryNames = new Set(budgets.map((b) => b.category));
  return categories.filter(
    (c) => budgetCategoryIds.has(c.id) || budgetCategoryNames.has(c.name)
  );
}, [categories, budgets]);
```

- [ ] **Step 2: Update handleSave to handle uncategorized**

Replace the `handleSave` function (lines 460-473):

```tsx
const handleSave = () => {
  const selectedCategory = categories.find((c) => c.id === cat);
  createTransaction.mutate({
    account_id: acctKey,
    category_id: cat,
    type: type === "expense" ? "Expense" : type === "income" ? "Income" : "Transfer",
    category: selectedCategory?.name ?? "",
    amount: amount,
    currency: profile?.currency_preference ?? "IDR",
    date: format(date, "yyyy-MM-dd"),
    merchant: note || undefined,
    note: note || undefined,
  });
};
```

With:

```tsx
const handleSave = () => {
  const isUncategorized = cat === "__uncategorized__";
  const selectedCategory = isUncategorized ? null : categories.find((c) => c.id === cat);
  createTransaction.mutate({
    account_id: acctKey,
    category_id: isUncategorized ? undefined : cat,
    type: type === "expense" ? "Expense" : type === "income" ? "Income" : "Transfer",
    category: isUncategorized ? "Uncategorized" : (selectedCategory?.name ?? ""),
    amount: amount,
    currency: profile?.currency_preference ?? "IDR",
    date: format(date, "yyyy-MM-dd"),
    merchant: note || undefined,
    note: note || undefined,
  });
};
```

- [ ] **Step 3: Verify the drawer works without budgets**

Run: `npm run build`
Expected: Build succeeds with no type errors.

Manual test: Open the app with no budgets defined. Open add transaction drawer. Verify a single "Uncategorized" tile appears. Save a transaction. Verify it saves successfully.

- [ ] **Step 4: Commit**

```bash
git add src/components/transactions/add-transaction-drawer.tsx
git commit -m "fix: show Uncategorized fallback in add-transaction drawer when no budgets exist"
```

---

## Task 2: Create Dashboard Onboarding Component

**Files:**
- Create: `src/components/home/dashboard-onboarding.tsx`

- [ ] **Step 1: Create the onboarding component**

Create `src/components/home/dashboard-onboarding.tsx`:

```tsx
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronRight } from "lucide-react";

interface StepConfig {
  title: string;
  subtitle: string;
  icon: string;
  completed: boolean;
}

interface DashboardOnboardingProps {
  currencyLabel: string;
  hasBudgets: boolean;
  onChangeCurrency: () => void;
  onCreateBudget: () => void;
  onAddTransaction: () => void;
}

function StepCard({
  step,
  active,
  onClick,
}: {
  step: StepConfig;
  active: boolean;
  onClick: () => void;
}) {
  const isUpcoming = !step.completed && !active;

  return (
    <button
      onClick={onClick}
      disabled={isUpcoming}
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3.5 text-left transition-colors",
        step.completed && "border-brand/25 bg-bg-1",
        active && "border-brand bg-bg-1 cursor-pointer",
        isUpcoming && "border-line bg-bg-1 opacity-50",
        !isUpcoming && "cursor-pointer",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[18px]",
          step.completed && "bg-brand-soft",
          active && "bg-brand-soft",
          isUpcoming && "bg-bg-2",
        )}
      >
        {step.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-[13px] font-medium",
            step.completed && "text-fg-1",
            active && "text-fg-0",
            isUpcoming && "text-fg-2",
          )}
        >
          {step.title}
        </div>
        <div
          className={cn(
            "text-[11px] mt-0.5",
            isUpcoming ? "text-fg-3" : "text-fg-2",
          )}
        >
          {step.subtitle}
        </div>
      </div>
      {step.completed && (
        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand">
          <Check size={12} strokeWidth={2.5} className="text-brand-ink" />
        </div>
      )}
      {active && (
        <ChevronRight
          size={16}
          strokeWidth={1.75}
          className="flex-shrink-0 text-brand"
        />
      )}
    </button>
  );
}

export function DashboardOnboarding({
  currencyLabel,
  hasBudgets,
  onChangeCurrency,
  onCreateBudget,
  onAddTransaction,
}: DashboardOnboardingProps) {
  const steps: StepConfig[] = [
    {
      title: "Choose currency",
      subtitle: `Already set to ${currencyLabel}`,
      icon: "💱",
      completed: true, // always completed post-registration
    },
    {
      title: "Define budgets",
      subtitle: hasBudgets ? "Budget created" : "Set monthly limits",
      icon: "📊",
      completed: hasBudgets,
    },
    {
      title: "Add first transaction",
      subtitle: "Log your first expense",
      icon: "💸",
      completed: false, // if this were true, onboarding wouldn't render
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;

  const handlers = [onChangeCurrency, onCreateBudget, onAddTransaction];

  return (
    <div className="flex flex-col items-center px-5 pt-4">
      {/* Hero */}
      <div className="text-[28px] mb-2">👋</div>
      <h2 className="text-[20px] font-semibold text-fg-0 text-center">
        Let&apos;s set you up
      </h2>
      <p className="text-[13px] text-fg-2 mt-1 mb-5">
        3 quick steps to get started
      </p>

      {/* Progress dots */}
      <div className="flex gap-1.5 mb-6">
        {steps.map((s, i) => (
          <div
            key={i}
            className={cn(
              "h-[5px] rounded-full transition-all",
              s.completed ? "w-[22px] bg-brand" : "w-[5px] bg-bg-3",
            )}
          />
        ))}
      </div>

      {/* Step cards */}
      <div className="flex w-full flex-col gap-2">
        {steps.map((step, i) => {
          // A step is "active" if it's not completed and all previous are completed,
          // OR if it's the transaction step (always tappable when currency is done)
          const active =
            !step.completed &&
            (i === 0 || steps.slice(0, i).every((s) => s.completed) || i === 2);

          return (
            <StepCard
              key={i}
              step={step}
              active={active}
              onClick={handlers[i]}
            />
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds. Component is created but not yet wired to any page.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/dashboard-onboarding.tsx
git commit -m "feat: add dashboard onboarding checklist component"
```

---

## Task 3: Create Budget Nudge Component

**Files:**
- Create: `src/components/home/budget-nudge.tsx`

- [ ] **Step 1: Create the nudge component**

Create `src/components/home/budget-nudge.tsx`:

```tsx
"use client";

import { ChevronRight, X } from "lucide-react";

interface BudgetNudgeProps {
  month: string;
  onSetup: () => void;
  onDismiss: () => void;
}

export function BudgetNudge({ month, onSetup, onDismiss }: BudgetNudgeProps) {
  return (
    <div className="bg-brand-soft mx-4 flex items-center gap-2 rounded-lg px-3.5 py-2.5">
      <span className="text-[14px]">📊</span>
      <button
        onClick={onSetup}
        className="flex flex-1 cursor-pointer items-center gap-1 text-[12px] font-medium text-brand"
      >
        Set up a budget for {month}
        <ChevronRight size={12} strokeWidth={1.75} />
      </button>
      <button
        onClick={onDismiss}
        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full text-brand/60 hover:text-brand transition-colors"
      >
        <X size={12} strokeWidth={2} />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/home/budget-nudge.tsx
git commit -m "feat: add budget nudge chip component"
```

---

## Task 4: Wire Onboarding and Nudge into Dashboard Page

**Files:**
- Modify: `src/app/(main)/page.tsx`

This is the main integration task. The dashboard page needs:
1. Budget data hooks (to check if budgets exist)
2. Profile hook (for currency label)
3. Conditional render: onboarding vs normal dashboard
4. Budget nudge when transactions exist but no budgets
5. CreateBudgetDrawer + CurrencyPickerDrawer integration

- [ ] **Step 1: Add new imports to page.tsx**

Add these imports at the top of `src/app/(main)/page.tsx`, after the existing imports:

```tsx
import { DashboardOnboarding } from "@/components/home/dashboard-onboarding";
import { BudgetNudge } from "@/components/home/budget-nudge";
import { CreateBudgetDrawer } from "@/components/budget/create-budget-drawer";
import { CurrencyPickerDrawer } from "@/components/profile/currency-picker-drawer";
import type { BudgetCategory } from "@/components/budget/budget-types";
import { monthKey } from "@/components/budget/budget-constants";
import { useGetBudgets, useCreateBudgets } from "@/services/budgets/budgets.hooks";
import { useGetProfile } from "@/services/profile/profile.hooks";
import { useGetCategories } from "@/services/categories/categories.hooks";
```

Note: `useGetCategories` is already imported — skip that one if duplicate. The `format` import from `date-fns` already exists.

- [ ] **Step 2: Add state and hooks inside DashboardPage**

Inside `DashboardPage`, after the existing `const [editTx, setEditTx]` line (line 61), add:

```tsx
const [createBudgetOpen, setCreateBudgetOpen] = React.useState(false);
const [currencyPickerOpen, setCurrencyPickerOpen] = React.useState(false);
const [nudgeDismissed, setNudgeDismissed] = React.useState(false);

// Budget & profile data for onboarding
const { data: profile } = useGetProfile();
const now = new Date();
const currentMonthKey = monthKey(now.getFullYear(), now.getMonth());
const { data: budgets = [] } = useGetBudgets({ monthYear: currentMonthKey });

const createBudgets = useCreateBudgets({
  mutationConfig: {
    onSuccess: () => setCreateBudgetOpen(false),
  },
});

const currency = profile?.currency_preference ?? "IDR";
const hasBudgets = budgets.length > 0;
const hasTransactions = recentTx.length > 0;
const showOnboarding = !hasTransactions;

const handleBudgetSave = (rows: BudgetCategory[]) => {
  const payloads = rows.map((r) => {
    const cat = categories.find((c) => c.name === r.name);
    return {
      month_year: currentMonthKey,
      category: r.name,
      category_id: cat?.id,
      planned_amount: r.budget,
      currency,
    };
  });
  createBudgets.mutate(payloads);
};
```

- [ ] **Step 3: Update the return JSX with conditional rendering**

Replace the entire `return (...)` block in `DashboardPage` with:

```tsx
return (
  <main className="flex flex-col gap-4">
    {showOnboarding ? (
      <DashboardOnboarding
        currencyLabel={currency}
        hasBudgets={hasBudgets}
        onChangeCurrency={() => setCurrencyPickerOpen(true)}
        onCreateBudget={() => setCreateBudgetOpen(true)}
        onAddTransaction={() => openAddTx("expense")}
      />
    ) : (
      <>
        {/* Budget nudge */}
        {!hasBudgets && !nudgeDismissed && (
          <BudgetNudge
            month={format(now, "MMMM")}
            onSetup={() => setCreateBudgetOpen(true)}
            onDismiss={() => setNudgeDismissed(true)}
          />
        )}

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
                  onClick={() => setEditTx(tx)}
                />
              ))}
            </React.Fragment>
          ))}
        </div>

        <EditTransactionDrawer
          open={!!editTx}
          onOpenChange={(open) => {
            if (!open) setEditTx(null);
          }}
          transaction={editTx}
        />
      </>
    )}

    {/* Drawers — always mounted regardless of onboarding state */}
    <CreateBudgetDrawer
      open={createBudgetOpen}
      onOpenChange={setCreateBudgetOpen}
      year={now.getFullYear()}
      month={now.getMonth()}
      onSave={handleBudgetSave}
    />
    <CurrencyPickerDrawer
      open={currencyPickerOpen}
      onOpenChange={setCurrencyPickerOpen}
      currentCurrency={currency}
    />

    <div className="h-5" />
  </main>
);
```

- [ ] **Step 4: Clean up duplicate imports**

After applying the changes, ensure there are no duplicate imports. Specifically:
- `useGetCategories` — already imported on line 9, remove from new imports if duplicated
- `ChevronRight` — already imported from lucide-react on line 27
- `format` — already imported from date-fns on line 18

Remove these from the new import block added in Step 1:
- `useGetCategories` (already exists)
- `ChevronRight` (already in lucide destructure)

Also add `format` of `MMMM` — this is already available from the existing `date-fns` import.

- [ ] **Step 5: Build and verify**

Run: `npm run build`
Expected: Build succeeds with no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/(main)/page.tsx
git commit -m "feat: wire onboarding and budget nudge into dashboard page"
```

---

## Task 5: Manual Integration Testing

No test runner is configured in this project, so verification is manual.

- [ ] **Step 1: Test onboarding — fresh user (no transactions, no budgets)**

1. Run `npm run dev`
2. Log in as a user with no transactions and no budgets
3. Verify: Dashboard shows onboarding with 3 step cards
4. Verify: Step 1 (currency) shows checkmark, subtitle shows currency code
5. Verify: Step 2 (budgets) is active with arrow indicator
6. Verify: Step 3 (transaction) is active with arrow indicator (not locked)

- [ ] **Step 2: Test onboarding — tap "Define budgets"**

1. Tap step 2 card
2. Verify: `CreateBudgetDrawer` opens with income step
3. Complete the budget creation flow
4. Verify: Drawer closes, step 2 now shows checkmark
5. Verify: Onboarding still showing (no transactions yet)

- [ ] **Step 3: Test onboarding — tap "Add first transaction"**

1. Tap step 3 card
2. Verify: Add transaction drawer opens
3. If budgets exist: category grid shows budgeted categories
4. If no budgets: category grid shows single "Uncategorized" tile
5. Save a transaction
6. Verify: Onboarding disappears, normal dashboard renders

- [ ] **Step 4: Test nudge — has transactions, no budgets**

1. As a user with transactions but no budgets for current month
2. Verify: Normal dashboard renders with budget nudge chip above hero
3. Verify: Tapping nudge opens `CreateBudgetDrawer`
4. Verify: Tapping × dismisses nudge for the session
5. Refresh page — verify nudge reappears (session-only state)

- [ ] **Step 5: Test normal state — has both transactions and budgets**

1. As a user with both transactions and budgets
2. Verify: Normal dashboard renders with no onboarding and no nudge

- [ ] **Step 6: Test currency picker from onboarding**

1. From onboarding view, tap step 1 (currency)
2. Verify: `CurrencyPickerDrawer` opens
3. Change currency
4. Verify: Step 1 subtitle updates to new currency code

- [ ] **Step 7: Final build check**

Run: `npm run build`
Run: `npm run lint`
Expected: Both pass cleanly.

- [ ] **Step 8: Commit any fixes**

If any fixes were needed during testing:

```bash
git add -A
git commit -m "fix: address issues found during onboarding integration testing"
```
