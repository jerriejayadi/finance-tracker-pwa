import type { Category } from "./categories.service";

export type CategoryTxType = "expense" | "income" | "transfer";

/**
 * Categories selectable for a transaction type: expense/income show their own
 * type plus "both"; transfer shows only "both". Budgeted categories come first.
 */
export function categoriesForTxType(
  categories: Category[],
  txType: CategoryTxType,
  budgetedIds: ReadonlySet<string> = new Set(),
): Category[] {
  const matches = categories.filter((c) =>
    txType === "transfer" ? c.type === "both" : c.type === txType || c.type === "both",
  );
  // Array.sort is stable, so sort_order from the query is preserved within each group
  return matches.sort((a, b) => Number(budgetedIds.has(b.id)) - Number(budgetedIds.has(a.id)));
}
