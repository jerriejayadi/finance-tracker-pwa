export interface Transaction {
  id: string;
  date: string;
  merchant: string | null;
  category: string;
  category_name?: string;
  category_icon?: string;
  amount: number;
  type: "Income" | "Expense" | "Transfer";
  account_name?: string;
  account_id: string;
  category_id: string | null;
  note: string | null;
  created_at: string;
  recurring_transaction_id: string | null;
  user_id: string;
}

export const DATE_RANGES = [
  { id: "7d", label: "Last 7 days" },
  { id: "30d", label: "Last 30 days" },
  { id: "this", label: "This month" },
  { id: "last", label: "Last month" },
  { id: "custom", label: "Custom\u2026" },
] as const;

export type DateRangeId = (typeof DATE_RANGES)[number]["id"];

export interface Filters {
  range: DateRangeId;
  type: "all" | "income" | "expense";
  cats: string[];
  accts: string[];
  amtMin: number;
  amtMax: number;
}

export const DEFAULT_FILTERS: Filters = {
  range: "30d",
  type: "all",
  cats: [],
  accts: [],
  amtMin: 0,
  amtMax: 0,
};
