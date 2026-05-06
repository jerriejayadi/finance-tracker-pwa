import { supabase } from "@/lib/supabase/client";

export type Transaction = {
  id: string;
  user_id: string;
  account_id: string;
  category_id: string | null;
  recurring_transaction_id: string | null;
  type: "Income" | "Expense" | "Transfer";
  category: string;
  amount: number;
  date: string;
  merchant: string | null;
  note: string | null;
  created_at: string;
  // Joined fields
  account_name?: string;
  category_name?: string;
  category_icon?: string;
};

export type CreateTransactionPayload = {
  account_id: string;
  category_id?: string;
  type: "Income" | "Expense" | "Transfer";
  category: string;
  amount: number;
  date: string;
  merchant?: string;
  note?: string;
};

export type TransactionFilters = {
  type?: "income" | "expense";
  categoryIds?: string[];
  accountIds?: string[];
  amtMin?: number;
  amtMax?: number;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  limit?: number;
};

export type TransactionSummary = {
  totalIncome: number;
  totalExpense: number;
};

export const transactionsService = {
  getTransactions: async (filters: TransactionFilters = {}): Promise<Transaction[]> => {
    let query = supabase
      .from("transactions")
      .select(`
        *,
        accounts!inner(name),
        categories(name, icon)
      `)
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (filters.type) {
      query = query.eq("type", filters.type === "income" ? "Income" : "Expense");
    }
    if (filters.categoryIds && filters.categoryIds.length > 0) {
      query = query.in("category_id", filters.categoryIds);
    }
    if (filters.accountIds && filters.accountIds.length > 0) {
      query = query.in("account_id", filters.accountIds);
    }
    if (filters.amtMin) {
      query = query.gte("amount", filters.amtMin);
    }
    if (filters.amtMax) {
      query = query.lte("amount", filters.amtMax);
    }
    if (filters.dateFrom) {
      query = query.gte("date", filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte("date", filters.dateTo);
    }
    if (filters.search) {
      query = query.or(
        `merchant.ilike.%${filters.search}%,note.ilike.%${filters.search}%,category.ilike.%${filters.search}%`
      );
    }
    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    // Flatten joined data
    return (data ?? []).map((row) => {
      const r = row as Record<string, unknown>;
      const accounts = r.accounts as { name: string } | null;
      const categories = r.categories as { name: string; icon: string } | null;
      const { accounts: _a, categories: _c, ...rest } = r;
      return {
        ...rest,
        account_name: accounts?.name ?? "",
        category_name: categories?.name ?? r.category,
        category_icon: categories?.icon ?? "",
      } as Transaction;
    });
  },

  getTransactionSummary: async (dateFrom: string, dateTo: string): Promise<TransactionSummary> => {
    const { data, error } = await supabase
      .from("transactions")
      .select("type, amount")
      .gte("date", dateFrom)
      .lte("date", dateTo);

    if (error) throw new Error(error.message);

    let totalIncome = 0;
    let totalExpense = 0;
    for (const row of data ?? []) {
      if (row.type === "Income") totalIncome += Number(row.amount);
      else if (row.type === "Expense") totalExpense += Number(row.amount);
    }

    return { totalIncome, totalExpense };
  },

  createTransaction: async (payload: CreateTransactionPayload): Promise<Transaction> => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      throw new Error(authError?.message ?? "Not authenticated");
    }

    const { data, error } = await supabase
      .from("transactions")
      .insert({ ...payload, user_id: authData.user.id })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  deleteTransactions: async (ids: string[]): Promise<void> => {
    const { error } = await supabase
      .from("transactions")
      .delete()
      .in("id", ids);

    if (error) throw new Error(error.message);
  },
};
