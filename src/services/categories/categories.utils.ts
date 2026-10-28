import type { Category } from "./categories.service";
import type { BudgetCategoryIds } from "@/services/budgets/budgets.service";

export type CategoryTxType = "expense" | "income" | "transfer";

/**
 * Categories selectable for a transaction type: expense/income show their own
 * type plus "both"; transfer shows only "both". Most-used, then budgeted, come first.
 */
export function categoriesForTxType(
  categories: Category[],
  txType: CategoryTxType,
  budgetedIds: ReadonlySet<string> = new Set(),
  usage: Readonly<Record<string, number>> = {},
): Category[] {
  const matches = categories.filter((c) =>
    txType === "transfer" ? c.type === "both" : c.type === txType || c.type === "both",
  );
  // Most-used first, then budgeted. Array.sort is stable, so sort_order from the
  // query is preserved for ties
  return matches.sort(
    (a, b) =>
      (usage[b.id] ?? 0) - (usage[a.id] ?? 0) ||
      Number(budgetedIds.has(b.id)) - Number(budgetedIds.has(a.id)),
  );
}

/** Stable empty value for callers whose budget-category query hasn't loaded yet. */
export const EMPTY_BUDGET_CATEGORY_IDS: BudgetCategoryIds = { income: [], expense: [] };

/**
 * Categories for the transaction picker. Expenses and income only offer the categories
 * budgeted for the transaction's month (see getBudgetCategoryIds), so every transaction
 * lands in a budget; a kind with no budget at all falls back to every category of that
 * type. `keepId` stays listed so editing an old transaction never hides its category.
 */
export function pickerCategories(
  categories: Category[],
  txType: CategoryTxType,
  budgetCategoryIds: BudgetCategoryIds,
  usage: Readonly<Record<string, number>> = {},
  keepId?: string,
): Category[] {
  const budgetedIds = new Set(txType === "transfer" ? [] : budgetCategoryIds[txType]);
  if (budgetedIds.size === 0) {
    return categoriesForTxType(categories, txType, budgetedIds, usage);
  }
  // Budgeted categories regardless of their own type: the budget decides the kind
  return categories
    .filter((c) => budgetedIds.has(c.id) || c.id === keepId)
    .sort((a, b) => (usage[b.id] ?? 0) - (usage[a.id] ?? 0));
}
