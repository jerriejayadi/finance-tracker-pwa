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
