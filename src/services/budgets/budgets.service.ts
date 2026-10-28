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

/** A budget's kind is its category's type: "income" → income, anything else → expense */
export type BudgetKind = "income" | "expense";

export type BudgetWithSpent = Budget & {
  kind: BudgetKind;
  /** Expense rows: spent this month. Income rows: received this month */
  spent: number;
  /** Number of transactions of the budget's kind in this category for the month */
  count: number;
};

/** Category ids budgeted per kind (see getBudgetCategoryIds) */
export type BudgetCategoryIds = Record<BudgetKind, string[]>;

export type CreateBudgetPayload = {
  month_year: string;
  category: string;
  category_id?: string;
  /** Icon for the category row created when `category` doesn't exist yet; not stored on the budget */
  icon?: string;
  /** Type of the category resolved or created for `category`; not stored on the budget */
  kind: BudgetKind;
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
  categoryEdits: { id: string; name: string; icon: string; kind: BudgetKind }[];
  creates: CreateBudgetPayload[];
  deleteIds: string[];
};

export type BudgetMonthSummary = {
  month_year: string;
  category_count: number;
  total_planned: number;
};

/** Error for a name the user already owns as a category of another type. */
function typeConflictError(name: string, type: string): Error {
  return new Error(
    type === "both"
      ? `"${name}" is already used for both income and expenses`
      : `"${name}" is already one of your ${type} categories`,
  );
}

/**
 * Resolves budget category names without a `category_id` to the user's own category
 * rows of the payload's kind, creating missing ones. System defaults are never linked:
 * a budget always gets the user's own category, even when a default of the same name
 * exists (e.g. the income-only "Investment"). Budgets never use "both" categories, so
 * an own category of another type is an error. Returns name → id.
 */
async function ensureCategories(
  userId: string,
  payloads: Pick<CreateBudgetPayload, "category" | "category_id" | "icon" | "kind">[],
): Promise<Map<string, string>> {
  const missing = payloads.filter((p) => !p.category_id);
  const ids = new Map<string, string>();
  if (!missing.length) return ids;

  // Own category names are unique, so one name can't be both an income and an expense row
  const kinds = new Map<string, BudgetKind>();
  for (const p of missing) {
    const seen = kinds.get(p.category);
    if (seen && seen !== p.kind) throw typeConflictError(p.category, seen);
    kinds.set(p.category, p.kind);
  }

  const { data: existing, error } = await supabase
    .from("categories")
    .select("id, name, type")
    .eq("user_id", userId)
    .in("name", [...kinds.keys()]);
  if (error) throw new Error(error.message);
  for (const c of existing) {
    if (c.type !== kinds.get(c.name)) throw typeConflictError(c.name, c.type);
    ids.set(c.name, c.id);
  }

  const toCreate = [...kinds.keys()].filter((n) => !ids.has(n));
  if (toCreate.length) {
    const { data: created, error: createError } = await supabase
      .from("categories")
      .insert(
        toCreate.map((name) => ({
          user_id: userId,
          name,
          icon: missing.find((p) => p.category === name)?.icon || "📝",
          type: kinds.get(name),
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
  { name, icon, kind }: { name: string; icon: string; kind: BudgetKind },
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
      .select("id, type")
      .eq("user_id", userId)
      .eq("name", name)
      .maybeSingle();
    if (lookupError) throw new Error(lookupError.message);

    if (sameName) {
      if (sameName.type !== kind) throw typeConflictError(name, sameName.type);
      categoryId = sameName.id;
    } else if (current?.user_id === userId) {
      categoryId = current.id;
    } else {
      const ids = await ensureCategories(userId, [{ category: name, icon, kind }]);
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
      .select("*, categories(name, icon, type)")
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
      .select("type, category, category_id, amount")
      .in("type", ["Expense", "Income"])
      .gte("date", dateFrom)
      .lte("date", dateTo);

    if (txError) throw new Error(txError.message);

    // Build spent/received map, keyed per kind so an income and an expense row never mix
    const spentMap = new Map<string, { total: number; count: number }>();
    for (const tx of txData ?? []) {
      const kind: BudgetKind = tx.type === "Income" ? "income" : "expense";
      const key = `${kind}:${tx.category_id || tx.category}`;
      const entry = spentMap.get(key) || { total: 0, count: 0 };
      entry.total += Number(tx.amount);
      entry.count += 1;
      spentMap.set(key, entry);
    }

    return (budgets ?? []).map((b) => {
      const row = b as Record<string, unknown>;
      const categories = row.categories as { name: string; icon: string; type: string } | null;
      // Legacy rows without a category, and "both" categories, count as expense
      const kind: BudgetKind = categories?.type === "income" ? "income" : "expense";
      const spentKey = `${kind}:${(b.category_id as string) || (b.category as string)}`;
      const spentEntry = spentMap.get(spentKey) || { total: 0, count: 0 };

      const { categories: _cat, ...rest } = row;
      return {
        ...rest,
        category_name: categories?.name ?? b.category,
        category_icon: categories?.icon ?? "",
        kind,
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

    const categoryIds = await ensureCategories(authData.user.id, payloads);
    const rows = payloads.map(({ icon: _icon, kind: _kind, ...p }) => ({
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
   * Category ids budgeted for `monthYear`, per kind. Each kind falls back on its own to
   * the latest earlier month that has rows of that kind (e.g. a new month whose budget
   * isn't set up yet). A kind with no budget rows at all gets [].
   */
  getBudgetCategoryIds: async (monthYear: string): Promise<BudgetCategoryIds> => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      throw new Error(authError?.message ?? "Not authenticated");
    }

    const { data, error } = await supabase
      .from("budgets")
      .select("month_year, category_id, categories(type)")
      .eq("user_id", authData.user.id)
      .lte("month_year", monthYear)
      .not("category_id", "is", null)
      .order("month_year", { ascending: false });

    if (error) throw new Error(error.message);

    const ids: BudgetCategoryIds = { income: [], expense: [] };
    const latest: Partial<Record<BudgetKind, string>> = {};
    for (const b of data) {
      const category = b.categories as unknown as { type: string } | null;
      const kind: BudgetKind = category?.type === "income" ? "income" : "expense";
      // Rows are newest first, so the first month seen per kind is its latest
      latest[kind] ??= b.month_year;
      if (b.month_year === latest[kind]) ids[kind].push(b.category_id as string);
    }
    return ids;
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
