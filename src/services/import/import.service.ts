import { supabase } from "@/lib/supabase/client";
import type { Account } from "@/services/accounts/accounts.service";
import type { Category } from "@/services/categories/categories.service";
import type { ImportRow } from "@/lib/import/parse-import-file";
import { accountTypeIcon, nameKey, UNCATEGORIZED } from "@/lib/import/match-import-rows";

const CHUNK_SIZE = 100;

export type ImportNewAccount = {
  name: string;
  type: Account["type"];
  /** false → rows fall back to the default account */
  create: boolean;
};

export type ImportNewCategory = {
  name: string;
  icon: string;
  kind: Category["type"];
  /** false → rows are imported as Uncategorized */
  create: boolean;
};

export type ImportTransactionsPayload = {
  rows: ImportRow[];
  currency: string;
  defaultAccountId: string | null;
  accounts: Account[];
  categories: Category[];
  newAccounts: ImportNewAccount[];
  newCategories: ImportNewCategory[];
  /** Create a budget (planned = actual spend) per month × expense category that has none yet */
  createBudgets: boolean;
  onProgress?: (done: number, total: number) => void;
};

export type ImportTransactionsResult = {
  inserted: number;
  totalIncome: number;
  totalExpense: number;
  accountsCreated: number;
  categoriesCreated: number;
  budgetsCreated: number;
  uncategorized: number;
  /** Rows dropped because no account could be resolved */
  skippedNoAccount: number;
};

export const importService = {
  importTransactions: async ({
    rows,
    currency,
    defaultAccountId,
    accounts,
    categories,
    newAccounts,
    newCategories,
    createBudgets,
    onProgress,
  }: ImportTransactionsPayload): Promise<ImportTransactionsResult> => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      throw new Error(authError?.message ?? "Not authenticated");
    }
    const userId = authData.user.id;

    // 1. Create accounts & categories that are switched on
    const accountsToCreate = newAccounts.filter((a) => a.create);
    const categoriesToCreate = newCategories.filter((c) => c.create);

    const accountIdByKey = new Map(accounts.map((a) => [nameKey(a.name), a.id]));
    if (accountsToCreate.length) {
      const { data, error } = await supabase
        .from("accounts")
        .insert(
          accountsToCreate.map((a) => ({
            user_id: userId,
            name: a.name,
            type: a.type,
            icon: accountTypeIcon(a.type),
          })),
        )
        .select("id, name");
      if (error) throw new Error(error.message);
      for (const a of data) accountIdByKey.set(nameKey(a.name), a.id);
    }

    const categoryByKey = new Map(
      categories.map((c) => [nameKey(c.name), { id: c.id, name: c.name }]),
    );
    if (categoriesToCreate.length) {
      const { data, error } = await supabase
        .from("categories")
        .insert(
          categoriesToCreate.map((c) => ({
            user_id: userId,
            name: c.name,
            icon: c.icon,
            type: c.kind,
          })),
        )
        .select("id, name");
      if (error) throw new Error(error.message);
      for (const c of data) categoryByKey.set(nameKey(c.name), { id: c.id, name: c.name });
    }

    // 2. Resolve each row to an account + category
    let uncategorized = 0;
    let skippedNoAccount = 0;
    let totalIncome = 0;
    let totalExpense = 0;
    const payloads = [];
    // `${month}|${categoryId}` → expense total, for spend-based budgets
    const spend = new Map<string, { month: string; categoryId: string; category: string; amount: number }>();

    for (const r of rows) {
      const accountId =
        (r.account && accountIdByKey.get(nameKey(r.account))) || defaultAccountId;
      if (!accountId) {
        skippedNoAccount++;
        continue;
      }
      const category = r.category ? categoryByKey.get(nameKey(r.category)) : undefined;
      if (!category) uncategorized++;
      if (r.type === "Income") totalIncome += r.amount;
      else totalExpense += r.amount;

      if (createBudgets && r.type === "Expense" && category) {
        const month = r.date.slice(0, 7);
        const key = `${month}|${category.id}`;
        const entry = spend.get(key) ?? { month, categoryId: category.id, category: category.name, amount: 0 };
        entry.amount += r.amount;
        spend.set(key, entry);
      }

      payloads.push({
        user_id: userId,
        account_id: accountId,
        category_id: category?.id ?? null,
        category: category?.name ?? UNCATEGORIZED,
        type: r.type,
        amount: r.amount,
        currency,
        date: r.date,
        merchant: r.description || null,
      });
    }

    // 3. Insert transactions in chunks so progress can be reported
    onProgress?.(0, payloads.length);
    for (let i = 0; i < payloads.length; i += CHUNK_SIZE) {
      const chunk = payloads.slice(i, i + CHUNK_SIZE);
      const { error } = await supabase.from("transactions").insert(chunk);
      if (error) throw new Error(error.message);
      onProgress?.(i + chunk.length, payloads.length);
    }

    // 4. Spend-based budgets — never overwrite a budget the user already has
    let budgetsCreated = 0;
    if (spend.size) {
      const months = [...new Set([...spend.values()].map((s) => s.month))];
      const { data: existing, error } = await supabase
        .from("budgets")
        .select("month_year, category_id")
        .in("month_year", months);
      if (error) throw new Error(error.message);

      const taken = new Set(existing.map((b) => `${b.month_year}|${b.category_id}`));
      const budgets = [...spend.entries()]
        .filter(([key]) => !taken.has(key))
        .map(([, s]) => ({
          user_id: userId,
          month_year: s.month,
          category: s.category,
          category_id: s.categoryId,
          planned_amount: Math.round(s.amount),
          currency,
        }));
      if (budgets.length) {
        const { error: insertError } = await supabase.from("budgets").insert(budgets);
        if (insertError) throw new Error(insertError.message);
      }
      budgetsCreated = budgets.length;
    }

    return {
      inserted: payloads.length,
      totalIncome,
      totalExpense,
      accountsCreated: accountsToCreate.length,
      categoriesCreated: categoriesToCreate.length,
      budgetsCreated,
      uncategorized,
      skippedNoAccount,
    };
  },
};
