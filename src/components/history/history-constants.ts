export interface Transaction {
  id: number;
  date: string;
  time: string;
  merchant: string;
  category: string;
  icon: string;
  amount: number;
  type: "expense" | "income";
  account: string;
  recurring?: boolean;
}

export const CATEGORIES = [
  "Food",
  "Coffee",
  "Groceries",
  "Transport",
  "Utilities",
  "Bills",
  "Shopping",
  "Entertainment",
  "Health",
  "Subscriptions",
  "Income",
];

export const ACCOUNTS = ["BCA Debit", "Jago", "Cash", "GoPay", "OVO"];

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

// Mock 30-day data — Apr 27 = "today"
export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 1, date: "2026-04-27", time: "12:48", merchant: "Ramen Tatsu", category: "Food", icon: "🍜", amount: 185_000, type: "expense", account: "BCA Debit" },
  { id: 2, date: "2026-04-27", time: "09:12", merchant: "Spotify", category: "Subscriptions", icon: "♪", amount: 99_000, type: "expense", account: "Jago", recurring: true },
  { id: 3, date: "2026-04-27", time: "08:19", merchant: "Kopi Tuku", category: "Coffee", icon: "☕", amount: 61_000, type: "expense", account: "Cash" },
  { id: 4, date: "2026-04-26", time: "08:00", merchant: "Payroll \u00B7 Acme Co.", category: "Income", icon: "$", amount: 15_000_000, type: "income", account: "BCA Debit" },
  { id: 5, date: "2026-04-26", time: "18:31", merchant: "Ranch Market", category: "Groceries", icon: "🛒", amount: 762_500, type: "expense", account: "BCA Debit" },
  { id: 6, date: "2026-04-25", time: "22:04", merchant: "Gojek", category: "Transport", icon: "🚗", amount: 143_500, type: "expense", account: "GoPay" },
  { id: 7, date: "2026-04-25", time: "07:02", merchant: "PLN Listrik", category: "Utilities", icon: "⌁", amount: 821_500, type: "expense", account: "BCA Debit", recurring: true },
  { id: 8, date: "2026-04-24", time: "19:42", merchant: "Tokopedia", category: "Shopping", icon: "🛍", amount: 329_000, type: "expense", account: "BCA Debit" },
  { id: 9, date: "2026-04-24", time: "13:15", merchant: "Padang Sederhana", category: "Food", icon: "🍜", amount: 78_000, type: "expense", account: "Cash" },
  { id: 10, date: "2026-04-23", time: "20:38", merchant: "CGV Cinemas", category: "Entertainment", icon: "🎬", amount: 120_000, type: "expense", account: "BCA Debit" },
  { id: 11, date: "2026-04-23", time: "09:08", merchant: "Indomaret", category: "Groceries", icon: "🛒", amount: 42_500, type: "expense", account: "Cash" },
  { id: 12, date: "2026-04-22", time: "16:22", merchant: "Refund \u00B7 Tokopedia", category: "Shopping", icon: "↺", amount: 185_000, type: "income", account: "Jago" },
  { id: 13, date: "2026-04-22", time: "08:47", merchant: "Grab", category: "Transport", icon: "🚗", amount: 38_000, type: "expense", account: "GoPay" },
  { id: 14, date: "2026-04-21", time: "19:00", merchant: "Starbucks", category: "Coffee", icon: "☕", amount: 62_000, type: "expense", account: "Jago" },
  { id: 15, date: "2026-04-20", time: "21:14", merchant: "Netflix", category: "Subscriptions", icon: "♪", amount: 186_000, type: "expense", account: "Jago", recurring: true },
  { id: 16, date: "2026-04-20", time: "12:30", merchant: "Sushi Tei", category: "Food", icon: "🍜", amount: 412_000, type: "expense", account: "BCA Debit" },
  { id: 17, date: "2026-04-19", time: "15:50", merchant: "Apotek K-24", category: "Health", icon: "✚", amount: 87_000, type: "expense", account: "Cash" },
  { id: 18, date: "2026-04-18", time: "09:20", merchant: "Side gig \u00B7 Design", category: "Income", icon: "$", amount: 2_500_000, type: "income", account: "Jago" },
  { id: 19, date: "2026-04-18", time: "19:15", merchant: "Ramen Tatsu", category: "Food", icon: "🍜", amount: 165_000, type: "expense", account: "BCA Debit" },
  { id: 20, date: "2026-04-17", time: "11:08", merchant: "Bensin \u00B7 Pertamina", category: "Transport", icon: "🚗", amount: 200_000, type: "expense", account: "BCA Debit" },
  { id: 21, date: "2026-04-16", time: "20:02", merchant: "Bakerzin", category: "Food", icon: "🍞", amount: 148_500, type: "expense", account: "Jago" },
  { id: 22, date: "2026-04-15", time: "08:00", merchant: "Internet \u00B7 Indihome", category: "Utilities", icon: "⌁", amount: 480_000, type: "expense", account: "BCA Debit", recurring: true },
  { id: 23, date: "2026-04-14", time: "13:42", merchant: "Yoshinoya", category: "Food", icon: "🍜", amount: 72_000, type: "expense", account: "Cash" },
  { id: 24, date: "2026-04-12", time: "18:00", merchant: "Uniqlo", category: "Shopping", icon: "🛍", amount: 599_000, type: "expense", account: "BCA Debit" },
  { id: 25, date: "2026-04-10", time: "08:30", merchant: "iCloud+", category: "Subscriptions", icon: "♪", amount: 49_000, type: "expense", account: "Jago", recurring: true },
  { id: 26, date: "2026-04-08", time: "21:00", merchant: "Gym \u00B7 Celebrity Fit", category: "Health", icon: "💪", amount: 550_000, type: "expense", account: "BCA Debit", recurring: true },
  { id: 27, date: "2026-04-05", time: "14:20", merchant: "Bakso Akiat", category: "Food", icon: "🍜", amount: 55_000, type: "expense", account: "Cash" },
  { id: 28, date: "2026-04-03", time: "11:00", merchant: "Air \u00B7 PAM", category: "Utilities", icon: "💧", amount: 185_000, type: "expense", account: "BCA Debit", recurring: true },
  { id: 29, date: "2026-04-01", time: "09:00", merchant: "Rent \u00B7 Apartemen", category: "Bills", icon: "🏠", amount: 4_500_000, type: "expense", account: "BCA Debit", recurring: true },
  { id: 30, date: "2026-03-31", time: "16:55", merchant: "Gojek", category: "Transport", icon: "🚗", amount: 42_000, type: "expense", account: "GoPay" },
];
