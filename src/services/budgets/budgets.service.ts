import { supabase } from "@/lib/supabase/client";

export type Budget = {
  id: string;
  user_id: string;
  month_year: string;
  category: string;
  category_id: string | null;
  planned_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  // Joined
  category_name?: string;
  category_icon?: string;
};

export type BudgetWithSpent = Budget & {
  spent: number;
  /** Number of expense transactions in this category for the month */
  count: number;
};

export type CreateBudgetPayload = {
  month_year: string;
  category: string;
  category_id?: string;
  /** Icon for the category row created when `category` doesn't exist yet; not stored on the budget */
  icon?: string;
  planned_amount: number;
  currency: string;
};

export type UpdateBudgetPayload = {
  planned_amount?: number;
  category?: string;
  category_id?: string;
  currency?: string;
};

export type SaveBudgetChangesPayload = {
  updates: ({ id: string } & UpdateBudgetPayload)[];
  /** Name/icon edits, applied to the budget's category (see updateBudgetCategory) */
  categoryEdits: { id: string; name: string; icon: string }[];
  creates: CreateBudgetPayload[];
  deleteIds: string[];
};

export type BudgetMonthSummary = {
  month_year: string;
  category_count: number;
  total_planned: number;
};

/**
 * Resolves budget category names without a `category_id` to the user's own category
 * rows, creating missing ones as expense categories. System defaults are never
 * linked: a budget always gets the user's own category, even when a default of the
 * same name exists (e.g. the income-only "Investment"). Returns name → id.
 */
async function ensureExpenseCategories(
  userId: string,
  payloads: Pick<CreateBudgetPayload, "category" | "category_id" | "icon">[],
): Promise<Map<string, string>> {
  const missing = payloads.filter((p) => !p.category_id);
  const ids = new Map<string, string>();
  if (!missing.length) return ids;

  const names = [...new Set(missing.map((p) => p.category))];
  const { data: existing, error } = await supabase
    .from("categories")
    .select("id, name, type")
    .eq("user_id", userId)
    .in("name", names);
  if (error) throw new Error(error.message);
  for (const c of existing) ids.set(c.name, c.id);

  // Budgets track expenses; an own income-only category can't be duplicated (unique
  // per user + name), so widen it to "both" to make it pickable for expenses
  const ownIncome = existing.filter((c) => c.type === "income");
  if (ownIncome.length) {
    const { error: widenError } = await supabase
      .from("categories")
      .update({ type: "both" })
      .in("id", ownIncome.map((c) => c.id));
    if (widenError) throw new Error(widenError.message);
  }

  const toCreate = names.filter((n) => !ids.has(n));
  if (toCreate.length) {
    const { data: created, error: createError } = await supabase
      .from("categories")
      .insert(
        toCreate.map((name) => ({
          user_id: userId,
          name,
          icon: missing.find((p) => p.category === name)?.icon || "📝",
          type: "expense",
        })),
      )
      .select("id, name");
    if (createError) throw new Error(createError.message);
    for (const c of created) ids.set(c.name, c.id);
  }
  return ids;
}

/**
 * Applies a name/icon edit from the budget edit drawer to the budget's category.
 * The user's own category is renamed in place (so its transactions follow); a system
 * default is swapped for the user's own category. Renaming to the name of another own
 * category links the budget to that one instead.
 */
async function updateBudgetCategory(
  userId: string,
  budgetId: string,
  { name, icon }: { name: string; icon: string },
): Promise<void> {
  const { data: budget, error } = await supabase
    .from("budgets")
    .select("category_id, categories(id, user_id, name)")
    .eq("id", budgetId)
    .single();
  if (error) throw new Error(error.message);

  const current = budget.categories as unknown as { id: string; user_id: string | null; name: string } | null;
  let categoryId: string;
  if (current?.user_id === userId && current.name === name) {
    categoryId = current.id;
  } else {
    const { data: sameName, error: lookupError } = await supabase
      .from("categories")
      .select("id")
      .eq("user_id", userId)
      .eq("name", name)
      .maybeSingle();
    if (lookupError) throw new Error(lookupError.message);

    if (sameName) {
      categoryId = sameName.id;
    } else if (current?.user_id === userId) {
      categoryId = current.id;
    } else {
      const ids = await ensureExpenseCategories(userId, [{ category: name, icon }]);
      categoryId = ids.get(name)!;
    }
  }

  const { error: catError } = await supabase
    .from("categories")
    .update({ name, icon })
    .eq("id", categoryId);
  if (catError) throw new Error(catError.message);

  const { error: budgetError } = await supabase
    .from("budgets")
    .update({ category: name, category_id: categoryId })
    .eq("id", budgetId);
  if (budgetError) throw new Error(budgetError.message);
}

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

    const { data: txData, error: txError } = await supabase
      .from("transactions")
      .select("category, category_id, amount")
      .eq("type", "Expense")
      .gte("date", dateFrom)
      .lte("date", dateTo);

    if (txError) throw new Error(txError.message);

    // Build spent map
    const spentMap = new Map<string, { total: number; count: number }>();
    for (const tx of txData ?? []) {
      const key = tx.category_id || tx.category;
      const entry = spentMap.get(key) || { total: 0, count: 0 };
      entry.total += Number(tx.amount);
      entry.count += 1;
      spentMap.set(key, entry);
    }

    return (budgets ?? []).map((b) => {
      const row = b as Record<string, unknown>;
      const categories = row.categories as { name: string; icon: string } | null;
      const spentKey = (b.category_id as string) || (b.category as string);
      const spentEntry = spentMap.get(spentKey) || { total: 0, count: 0 };

      const { categories: _cat, ...rest } = row;
      return {
        ...rest,
        category_name: categories?.name ?? b.category,
        category_icon: categories?.icon ?? "",
        spent: spentEntry.total,
        count: spentEntry.count,
      } as BudgetWithSpent;
    });
  },

  createBudgets: async (payloads: CreateBudgetPayload[]): Promise<Budget[]> => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      throw new Error(authError?.message ?? "Not authenticated");
    }

    const categoryIds = await ensureExpenseCategories(authData.user.id, payloads);
    const rows = payloads.map(({ icon: _icon, ...p }) => ({
      ...p,
      category_id: p.category_id ?? categoryIds.get(p.category),
      user_id: authData.user.id,
    }));
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

  /** Applies an edit-drawer session (updates + creates + deletes) as one operation. */
  saveBudgetChanges: async ({
    updates,
    categoryEdits,
    creates,
    deleteIds,
  }: SaveBudgetChangesPayload): Promise<void> => {
    const ops: Promise<unknown>[] = updates.map(({ id, ...payload }) =>
      budgetsService.updateBudget(id, payload),
    );
    if (categoryEdits.length) {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        throw new Error(authError?.message ?? "Not authenticated");
      }
      ops.push(...categoryEdits.map(({ id, ...edit }) => updateBudgetCategory(authData.user.id, id, edit)));
    }
    if (creates.length) ops.push(budgetsService.createBudgets(creates));
    if (deleteIds.length) {
      ops.push(
        (async () => {
          const { error } = await supabase.from("budgets").delete().in("id", deleteIds);
          if (error) throw new Error(error.message);
        })(),
      );
    }
    await Promise.all(ops);
  },

  deleteBudget: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("budgets")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  },

  /**
   * Category ids budgeted for `monthYear`, or for the latest earlier month with a budget
   * (e.g. a new month whose budget isn't set up yet). Empty when there's none.
   */
  getBudgetCategoryIds: async (monthYear: string): Promise<string[]> => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      throw new Error(authError?.message ?? "Not authenticated");
    }

    const { data, error } = await supabase
      .from("budgets")
      .select("month_year, category_id")
      .eq("user_id", authData.user.id)
      .lte("month_year", monthYear)
      .order("month_year", { ascending: false });

    if (error) throw new Error(error.message);

    const latest = data[0]?.month_year;
    return data
      .filter((b) => b.month_year === latest && b.category_id)
      .map((b) => b.category_id as string);
  },

  getBudgetMonths: async (): Promise<BudgetMonthSummary[]> => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      throw new Error(authError?.message ?? "Not authenticated");
    }

    const { data, error } = await supabase
      .from("budgets")
      .select("month_year, planned_amount")
      .eq("user_id", authData.user.id)
      .order("month_year", { ascending: false });

    if (error) throw new Error(error.message);

    // Aggregate client-side: group by month_year
    const map = new Map<string, { count: number; total: number }>();
    for (const row of data ?? []) {
      const entry = map.get(row.month_year) ?? { count: 0, total: 0 };
      entry.count += 1;
      entry.total += Number(row.planned_amount);
      map.set(row.month_year, entry);
    }

    return Array.from(map.entries()).map(([month_year, { count, total }]) => ({
      month_year,
      category_count: count,
      total_planned: total,
    }));
  },
};
