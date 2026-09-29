import type { BudgetCategoryTemplate } from "./budget-types";

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const DEFAULT_CATEGORY_TEMPLATE: BudgetCategoryTemplate[] = [
  { id: "groceries", name: "Groceries", icon: "🛒", suggested: 2_500_000 },
  { id: "food", name: "Food & Dining", icon: "🍜", suggested: 1_800_000 },
  { id: "transport", name: "Transport", icon: "🚗", suggested: 800_000 },
  { id: "bills", name: "Bills & Utilities", icon: "⌁", suggested: 1_200_000 },
  { id: "fun", name: "Entertainment", icon: "🎬", suggested: 500_000 },
  { id: "shopping", name: "Shopping", icon: "🛍", suggested: 600_000 },
  { id: "health", name: "Health", icon: "✚", suggested: 400_000 },
  { id: "subs", name: "Subscriptions", icon: "♪", suggested: 250_000 },
];

export const ICON_PALETTE = [
  "✨", "🙏", "💝", "📚", "🎁", "💊", "🐾", "✈️",
  "💪", "🎮", "☕", "💸", "🏠", "🚗", "👶", "🎓",
  "🛒", "🍜", "⌁", "🎬", "🛍", "✚", "♪", "🍔",
];


export function monthKey(y: number, m: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}

export function monthLabel(y: number, m: number): string {
  return `${MONTH_NAMES[m]} \u00B7 ${y}`;
}

/** Parses a "YYYY-MM" key into { y, m } (m is 0-based), or null when malformed. */
export function parseMonthKey(key: string | null): { y: number; m: number } | null {
  const match = key?.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  const m = Number(match[2]) - 1;
  if (m < 0 || m > 11) return null;
  return { y: Number(match[1]), m };
}

/** First and last day ("YYYY-MM-DD") of a 0-based month. */
export function monthRange(y: number, m: number): { dateFrom: string; dateTo: string } {
  const key = monthKey(y, m);
  const lastDay = new Date(y, m + 1, 0).getDate();
  return { dateFrom: `${key}-01`, dateTo: `${key}-${String(lastDay).padStart(2, "0")}` };
}

/** Spent as a % of budget, capped at 999. */
export function budgetPct(spent: number, budget: number): number {
  if (budget <= 0) return 0;
  return Math.min(999, (spent / budget) * 100);
}

/** Progress bar color: brand, warn from 85%, neg from 100%. */
export function budgetFillColor(spent: number, budget: number): string {
  const pct = budgetPct(spent, budget);
  if (pct >= 100) return "var(--neg)";
  if (pct >= 85) return "var(--warn)";
  return "var(--brand)";
}
