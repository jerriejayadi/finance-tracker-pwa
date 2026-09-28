import type { Account } from "@/services/accounts/accounts.service";
import type { Category } from "@/services/categories/categories.service";
import type { ImportRow } from "./parse-import-file";

export const UNCATEGORIZED = "Uncategorized";

export const IMPORT_ACCOUNT_TYPES: { value: Account["type"]; icon: string }[] = [
  { value: "e-wallet", icon: "📱" },
  { value: "bank", icon: "🏦" },
  { value: "cash", icon: "💵" },
  { value: "credit-card", icon: "💳" },
  { value: "investment", icon: "📈" },
];

export const IMPORT_ICON_PALETTE = ["☕", "💼", "💻", "✨", "🎁", "🐾", "📚", "💊", "🏠", "✈️", "🎮", "💸"];

const E_WALLETS = ["ovo", "gopay", "dana", "shopeepay", "linkaja", "jenius pay", "sakuku"];

export const nameKey = (s: string) => s.trim().toLowerCase();

export function accountTypeIcon(type: string) {
  return IMPORT_ACCOUNT_TYPES.find((t) => t.value === type)?.icon ?? "💰";
}

/** Best-guess type for an account name that only exists in the file. */
export function guessAccountType(name: string): Account["type"] {
  const k = nameKey(name);
  if (E_WALLETS.some((w) => k.includes(w))) return "e-wallet";
  if (k === "cash" || k === "tunai" || k.includes("dompet")) return "cash";
  if (k.includes("credit") || k.includes("kartu kredit") || k.includes(" cc")) return "credit-card";
  return "bank";
}

export type MatchedAccount = { account: Account; rows: number };
export type NewAccount = { name: string; rows: number };
export type MatchedCategory = { category: Category; rows: number };
export type NewCategory = { name: string; rows: number; kind: Category["type"] };

export type ImportMatches = {
  matchedAccounts: MatchedAccount[];
  newAccounts: NewAccount[];
  /** Rows with a blank Account cell — they go to the default account */
  noAccountRows: number;
  matchedCategories: MatchedCategory[];
  newCategories: NewCategory[];
  /** Rows with a blank Category cell */
  blankCategoryRows: number;
};

/** Groups file rows by account/category name and links them to what the user already has. */
export function matchImportRows(
  rows: ImportRow[],
  accounts: Account[],
  categories: Category[],
): ImportMatches {
  const accountByKey = new Map(accounts.map((a) => [nameKey(a.name), a]));
  const categoryByKey = new Map(categories.map((c) => [nameKey(c.name), c]));

  const matchedAccounts = new Map<string, MatchedAccount>();
  const newAccounts = new Map<string, NewAccount>();
  const matchedCategories = new Map<string, MatchedCategory>();
  const newCategories = new Map<string, NewCategory & { income: number; expense: number }>();
  let noAccountRows = 0;
  let blankCategoryRows = 0;

  for (const r of rows) {
    const ak = nameKey(r.account);
    if (!ak) noAccountRows++;
    else if (accountByKey.has(ak)) {
      const m = matchedAccounts.get(ak) ?? { account: accountByKey.get(ak)!, rows: 0 };
      m.rows++;
      matchedAccounts.set(ak, m);
    } else {
      const n = newAccounts.get(ak) ?? { name: r.account, rows: 0 };
      n.rows++;
      newAccounts.set(ak, n);
    }

    const ck = nameKey(r.category);
    if (!ck || ck === nameKey(UNCATEGORIZED)) blankCategoryRows++;
    else if (categoryByKey.has(ck)) {
      const m = matchedCategories.get(ck) ?? { category: categoryByKey.get(ck)!, rows: 0 };
      m.rows++;
      matchedCategories.set(ck, m);
    } else {
      const n = newCategories.get(ck) ?? { name: r.category, rows: 0, kind: "expense", income: 0, expense: 0 };
      n.rows++;
      if (r.type === "Income") n.income++;
      else n.expense++;
      newCategories.set(ck, n);
    }
  }

  const byRows = <T extends { rows: number }>(a: T, b: T) => b.rows - a.rows;

  return {
    matchedAccounts: [...matchedAccounts.values()].sort(byRows),
    newAccounts: [...newAccounts.values()].sort(byRows),
    noAccountRows,
    matchedCategories: [...matchedCategories.values()].sort(byRows),
    newCategories: [...newCategories.values()]
      .map(({ income, expense, ...c }) => ({
        ...c,
        kind: (income && expense ? "both" : income ? "income" : "expense") as Category["type"],
      }))
      .sort(byRows),
    blankCategoryRows,
  };
}

export type ImportBudgetMonth = { month: string; categories: number };

/**
 * Months × expense categories that would get a spend-based budget.
 * Categories that won't exist after import (switched off / blank) are excluded.
 * Budgets that already exist are skipped at import time, so this is an upper bound.
 */
export function previewImportBudgets(
  rows: ImportRow[],
  willHaveCategory: (name: string) => boolean,
): ImportBudgetMonth[] {
  const byMonth = new Map<string, Set<string>>();
  for (const r of rows) {
    if (r.type !== "Expense" || !r.category || !willHaveCategory(r.category)) continue;
    const month = r.date.slice(0, 7);
    const set = byMonth.get(month) ?? new Set<string>();
    set.add(nameKey(r.category));
    byMonth.set(month, set);
  }
  return [...byMonth.entries()]
    .map(([month, cats]) => ({ month, categories: cats.size }))
    .sort((a, b) => b.month.localeCompare(a.month));
}
