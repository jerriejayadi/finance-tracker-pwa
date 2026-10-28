import type { Category } from "./categories.service";

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

/**
 * Categories for the transaction picker. Expenses only offer the categories budgeted
 * for the transaction's month (see getBudgetCategoryIds), so every expense lands in a
 * budget; with no budget at all it falls back to every expense category. `keepId`
 * stays listed so editing an old transaction never hides its current category.
 */
export function pickerCategories(
  categories: Category[],
  txType: CategoryTxType,
  budgetCategoryIds: readonly string[],
  usage: Readonly<Record<string, number>> = {},
  keepId?: string,
): Category[] {
  const budgetedIds = new Set(budgetCategoryIds);
  if (txType !== "expense" || budgetedIds.size === 0) {
    return categoriesForTxType(categories, txType, budgetedIds, usage);
  }
  // Budgeted categories regardless of their own type: the budget is what makes them expenses
  return categories
    .filter((c) => budgetedIds.has(c.id) || c.id === keepId)
    .sort((a, b) => (usage[b.id] ?? 0) - (usage[a.id] ?? 0));
}
