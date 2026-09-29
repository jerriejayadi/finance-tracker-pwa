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
