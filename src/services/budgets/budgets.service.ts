import { supabase } from "@/lib/supabase/client";

export type Budget = {
  id: string;
  user_id: string;
  month_year: string;
  category: string;
  category_id: string | null;
  planned_amount: number;
  created_at: string;
  updated_at: string;
  // Joined
  category_name?: string;
  category_icon?: string;
};

export type BudgetWithSpent = Budget & {
  spent: number;
  recent: number;
};

export type CreateBudgetPayload = {
  month_year: string;
  category: string;
  category_id?: string;
  planned_amount: number;
};

export type UpdateBudgetPayload = {
  planned_amount?: number;
  category?: string;
  category_id?: string;
};

export const budgetsService = {
  getBudgets: async (monthYear: string): Promise<BudgetWithSpent[]> => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      throw new Error(authError?.message ?? "Not authenticated");
    }

    const { data: budgets, error: budgetsError } = await supabase
      .from("budgets")
      .select("*, categories(name, icon)")
      .eq("month_year", monthYear)
      .order("created_at", { ascending: true });

    if (budgetsError) throw new Error(budgetsError.message);

    // Calculate date range for the month
    const [year, monthStr] = monthYear.split("-");
    const monthNum = parseInt(monthStr, 10);
    const daysInMonth = new Date(parseInt(year), monthNum, 0).getDate();
    const dateFrom = `${monthYear}-01`;
    const dateTo = `${monthYear}-${String(daysInMonth).padStart(2, "0")}`;

    // 7-day window for "recent" spending
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const recentFrom = sevenDaysAgo.toISOString().split("T")[0];
    const recentTo = today.toISOString().split("T")[0];

    const { data: txData, error: txError } = await supabase
      .from("transactions")
      .select("category, category_id, amount, date")
      .eq("type", "Expense")
      .gte("date", dateFrom)
      .lte("date", dateTo);

    if (txError) throw new Error(txError.message);

    // Build spent map
    const spentMap = new Map<string, { total: number; recent: number }>();
    for (const tx of txData ?? []) {
      const key = tx.category_id || tx.category;
      const entry = spentMap.get(key) || { total: 0, recent: 0 };
      entry.total += Number(tx.amount);
      if (tx.date >= recentFrom && tx.date <= recentTo) {
        entry.recent += Number(tx.amount);
      }
      spentMap.set(key, entry);
    }

    return (budgets ?? []).map((b) => {
      const row = b as Record<string, unknown>;
      const categories = row.categories as { name: string; icon: string } | null;
      const spentKey = (b.category_id as string) || (b.category as string);
      const spentEntry = spentMap.get(spentKey) || { total: 0, recent: 0 };

      const { categories: _cat, ...rest } = row;
      return {
        ...rest,
        category_name: categories?.name ?? b.category,
        category_icon: categories?.icon ?? "",
        spent: spentEntry.total,
        recent: spentEntry.recent,
      } as BudgetWithSpent;
    });
  },

  createBudgets: async (payloads: CreateBudgetPayload[]): Promise<Budget[]> => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      throw new Error(authError?.message ?? "Not authenticated");
    }

    const rows = payloads.map((p) => ({ ...p, user_id: authData.user.id }));
    const { data, error } = await supabase
      .from("budgets")
      .insert(rows)
      .select();

    if (error) throw new Error(error.message);
    return data;
  },

  updateBudget: async (id: string, payload: UpdateBudgetPayload): Promise<Budget> => {
    const { data, error } = await supabase
      .from("budgets")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  deleteBudget: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("budgets")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  },
};
