import type { BudgetCategory, BudgetCategoryTemplate } from "./budget-types";

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

// Mock data — will be replaced with real Supabase queries
export const MOCK_BUDGETS: Record<string, BudgetCategory[]> = {
  "2026-04": [
    { id: "groceries", name: "Groceries", icon: "🛒", spent: 2_142_000, budget: 2_500_000, recent: 14 },
    { id: "food", name: "Food & Dining", icon: "🍜", spent: 1_624_500, budget: 1_800_000, recent: 22 },
    { id: "transport", name: "Transport", icon: "🚗", spent: 412_000, budget: 800_000, recent: 8 },
    { id: "bills", name: "Bills & Utilities", icon: "⌁", spent: 1_092_000, budget: 1_200_000, recent: 4 },
    { id: "fun", name: "Entertainment", icon: "🎬", spent: 715_000, budget: 500_000, recent: 11 },
    { id: "shopping", name: "Shopping", icon: "🛍", spent: 280_000, budget: 600_000, recent: 3 },
    { id: "health", name: "Health", icon: "✚", spent: 0, budget: 400_000, recent: 0 },
    { id: "subs", name: "Subscriptions", icon: "♪", spent: 239_800, budget: 250_000, recent: 5 },
  ],
  "2026-03": [
    { id: "groceries", name: "Groceries", icon: "🛒", spent: 2_456_000, budget: 2_400_000, recent: 16 },
    { id: "food", name: "Food & Dining", icon: "🍜", spent: 1_705_000, budget: 1_800_000, recent: 26 },
    { id: "transport", name: "Transport", icon: "🚗", spent: 624_000, budget: 700_000, recent: 11 },
    { id: "bills", name: "Bills & Utilities", icon: "⌁", spent: 1_188_000, budget: 1_200_000, recent: 4 },
  ],
};

export function monthKey(y: number, m: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}`;
}

export function monthLabel(y: number, m: number): string {
  return `${MONTH_NAMES[m]} \u00B7 ${y}`;
}
