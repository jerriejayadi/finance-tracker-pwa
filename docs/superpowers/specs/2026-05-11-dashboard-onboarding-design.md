# Dashboard Onboarding + Optional Budgets

**Date:** 2026-05-11
**Status:** Approved

## Problem

1. Creating a transaction with no budgets defined is broken — the add-transaction drawer filters categories by budgets, resulting in an empty category grid. User cannot complete a transaction.
2. New users land on an empty dashboard with no guidance on what to do first.
3. Budgets are currently an implicit prerequisite for transactions, but should be optional — the core action is "track spending," and budgets are an enhancement.

## Design Decisions

- **Budgets are optional.** Transactions can exist without budgets. Budget page only tracks explicitly budgeted categories.
- **Onboarding is data-driven.** No profile flags or schema changes. Appears when `transactions.length === 0`, disappears when user adds first transaction.
- **No skip button.** Onboarding disappears naturally once a transaction exists.
- **Post-onboarding nudge.** Users with transactions but no budgets see a subtle chip encouraging budget setup. Dismissable per session.

## 1. Add Transaction Drawer — Category Fix

**File:** `src/components/transactions/add-transaction-drawer.tsx`

### Current behavior

`displayCategories` (lines 369-376) returns `[]` when no budgets exist. Category grid renders empty. User cannot save a transaction.

### New behavior

When `budgets.length === 0`, show a single "Uncategorized" fallback tile instead of an empty grid:

```ts
const displayCategories = React.useMemo(() => {
  if (budgets.length === 0) {
    return [{ id: "__uncategorized__", name: "Uncategorized", icon: "📝" }];
  }
  const budgetCategoryIds = new Set(budgets.map((b) => b.category_id).filter(Boolean));
  const budgetCategoryNames = new Set(budgets.map((b) => b.category));
  return categories.filter(
    (c) => budgetCategoryIds.has(c.id) || budgetCategoryNames.has(c.name)
  );
}, [categories, budgets]);
```

`handleSave` change: when `cat === "__uncategorized__"`, send `category: "Uncategorized"` and `category_id: undefined`.

### Why this works

- DB `category` column is `NOT NULL` text — `"Uncategorized"` satisfies constraint.
- DB `category_id` is nullable (`ON DELETE SET NULL`) — `undefined`/`null` is valid.
- Budget page iterates over budget rows only — unbudgeted transactions are invisible to it. No breakage.
- Homepage income/expense summary already aggregates all transactions regardless of category.

## 2. Dashboard Onboarding Component

**New file:** `src/components/home/dashboard-onboarding.tsx`

### Render condition

```ts
const showOnboarding = recentTx.length === 0;
```

Placed in `src/app/(main)/page.tsx` — conditionally renders `<DashboardOnboarding />` instead of the normal dashboard content.

### Layout — Checklist Cards (Option A)

Visual structure:
- App header (greeting + avatar) remains from layout — always visible.
- Centered wave emoji + "Let's set you up" + "3 quick steps to get started."
- Progress dots: 3 segments, filled with `--color-brand` as steps complete.
- 3 stacked step cards.

### Step definitions

| # | Title | Subtitle | Completion check | Action on tap |
|---|-------|----------|-----------------|---------------|
| 1 | Choose currency | "Already set to {currency}" | `!!profile?.currency_preference` (always true post-registration) | Open `CurrencyPickerDrawer` (from `src/components/profile/currency-picker-drawer.tsx`) |
| 2 | Define budgets | "Set monthly limits" | `budgets.length > 0` for current month | Open `CreateBudgetDrawer` |
| 3 | Add first transaction | "Log your first expense" | `recentTx.length > 0` | Trigger `useAddTransaction()` from layout context |

### Step states

| State | Border | Background | Icon area | Right indicator |
|-------|--------|------------|-----------|----------------|
| Completed | `--color-brand` at 25% opacity | `--color-bg-1` | Brand-soft bg + emoji | Checkmark circle (brand bg) |
| Active | `--color-brand` solid | `--color-bg-1` | Brand-soft bg + emoji | Arrow `→` (brand color) |
| Upcoming | `--color-line` | `--color-bg-1` at 50% opacity | Muted bg + emoji | None |

### Step ordering and gating

- Step 1 (currency) is always completed post-registration.
- Step 2 (budgets) is always active/tappable — not gated.
- Step 3 (transaction) is always active/tappable — **not gated behind step 2.**
- Steps 2 and 3 are independent. User can do either first.

### Props interface

```ts
interface DashboardOnboardingProps {
  profile: Profile | undefined;
  hasBudgets: boolean;
  onCreateBudget: () => void;
  onAddTransaction: () => void;
  onChangeCurrency: () => void;
}
```

## 3. Post-Onboarding Budget Nudge

**New file:** `src/components/home/budget-nudge.tsx`

### Render condition

```ts
const showNudge = recentTx.length > 0 && budgets.length === 0 && !nudgeDismissed;
```

`nudgeDismissed` is session-only state (`useState(false)` in `page.tsx`).

### Layout

Small chip/banner rendered above the Total Balance hero card:

- Background: `--color-brand-soft`
- Left icon: 📊 or Wallet icon
- Text: "Set up a budget for {currentMonth} →"
- Tap action: opens `CreateBudgetDrawer`
- Dismiss: small `×` button on right, sets `nudgeDismissed = true`

### Dimensions

- Height: ~36px
- Margin: `mx-4`, same horizontal alignment as hero card
- Border-radius: `rounded-lg`

## 4. Dashboard Page Changes

**File:** `src/app/(main)/page.tsx`

### New state and hooks needed

```ts
const [createBudgetOpen, setCreateBudgetOpen] = useState(false);
const [nudgeDismissed, setNudgeDismissed] = useState(false);

// Existing hooks already available:
// - recentTx (useGetTransactions)
// - profile (via layout or add here)
// - budgets (new — useGetBudgets for current month)
```

### Conditional rendering

```tsx
{recentTx.length === 0 ? (
  <DashboardOnboarding
    profile={profile}
    hasBudgets={budgets.length > 0}
    onCreateBudget={() => setCreateBudgetOpen(true)}
    onAddTransaction={() => openAddTx("expense")}
    onChangeCurrency={() => { /* open currency drawer */ }}
  />
) : (
  <>
    {budgets.length === 0 && !nudgeDismissed && (
      <BudgetNudge
        onSetup={() => setCreateBudgetOpen(true)}
        onDismiss={() => setNudgeDismissed(true)}
      />
    )}
    {/* ...existing dashboard content... */}
  </>
)}
```

### CreateBudgetDrawer integration

Add `CreateBudgetDrawer` to `page.tsx` (imported from budget components), controlled by `createBudgetOpen` state. Needs current month/year and the `useCreateBudgets` hook for save handling.

## 5. Data Flow Summary

| Scenario | Homepage Income/Expense | Budget Page | Dashboard View |
|----------|------------------------|-------------|----------------|
| No tx, no budgets | Rp 0 / Rp 0 | Empty state | Onboarding (1✓ 2○ 3○) |
| No tx, has budgets | Rp 0 / Rp 0 | Shows budgets, 0 spent | Onboarding (1✓ 2✓ 3○) |
| Has tx, no budgets | Tracks all tx | Empty state | Normal dashboard + nudge chip |
| Has tx, has budgets | Tracks all tx | Only budgeted categories tracked | Normal dashboard |
| Tx with unbudgeted category | Included in totals | Not tracked | Shows in activity list |

## 6. Files Changed

| File | Type | Description |
|------|------|-------------|
| `src/components/home/dashboard-onboarding.tsx` | New | Checklist card onboarding UI |
| `src/components/home/budget-nudge.tsx` | New | Subtle budget encouragement chip |
| `src/app/(main)/page.tsx` | Modified | Conditional render: onboarding vs dashboard, budget nudge, CreateBudgetDrawer integration |
| `src/components/transactions/add-transaction-drawer.tsx` | Modified | "Uncategorized" fallback tile when no budgets |

## 7. Not Changed

- **Budget page** — keeps existing behavior, only tracks budgeted categories.
- **Homepage income/expense summary** — already aggregates all transactions.
- **DB schema** — no migrations needed. `category_id` already nullable, `category` text accepts "Uncategorized."
- **Auth/middleware** — no routing changes.
