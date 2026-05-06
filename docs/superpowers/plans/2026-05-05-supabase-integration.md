# Supabase Full Integration Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all mock/hardcoded data with live Supabase queries, making the app a fully functional finance tracker.

**Architecture:** Service classes with static methods → TanStack Query hooks → Page components. Each domain (categories, accounts, transactions, budgets) gets a `{domain}.service.ts` + `{domain}.hooks.ts` pair following the existing profile pattern. Pages swap mock constants for hook calls.

**Tech Stack:** Supabase (PostgreSQL + RLS), TanStack Query, React 19, Next.js 16 App Router

---

## File Map

### New Files
- `src/services/categories/categories.service.ts` — CRUD for categories table
- `src/services/categories/categories.hooks.ts` — useGetCategories, useCreateCategory
- `src/services/accounts/accounts.service.ts` — CRUD for accounts table + balances view
- `src/services/accounts/accounts.hooks.ts` — useGetAccounts, useGetAccountBalances, useCreateAccount, useUpdateAccount, useDeleteAccount
- `src/services/transactions/transactions.service.ts` — CRUD + aggregation queries
- `src/services/transactions/transactions.hooks.ts` — useGetTransactions, useCreateTransaction, useDeleteTransactions, useGetTransactionSummary
- `src/services/budgets/budgets.service.ts` — CRUD + spent calculation
- `src/services/budgets/budgets.hooks.ts` — useGetBudgets, useCreateBudgets, useUpdateBudget, useDeleteBudget
- `src/components/profile/accounts-section.tsx` — Account management UI in profile page

### Modified Files
- `src/services/auth/auth.service.ts` — Add default "Cash" account creation in setupProfile
- `src/components/transactions/add-transaction-drawer.tsx` — Replace hardcoded CATEGORIES/ACCOUNTS with hooks
- `src/app/(main)/page.tsx` — Replace SEED_GROUPS/CHIPS with live data
- `src/app/(main)/history/page.tsx` — Replace MOCK_TRANSACTIONS with hook
- `src/app/(main)/budget/page.tsx` — Replace MOCK_BUDGETS/createdBudgets with hooks
- `src/app/(main)/profile/page.tsx` — Add accounts section, live stats
- `src/components/history/history-constants.ts` — Remove mock data, keep types/constants
- `src/components/budget/budget-constants.ts` — Remove MOCK_BUDGETS, keep utilities
- `src/components/history/history-filter-drawer.tsx` — Use live categories/accounts for filter options

---

### Task 1: Categories Service + Hooks

**Files:**
- Create: `src/services/categories/categories.service.ts`
- Create: `src/services/categories/categories.hooks.ts`

- [ ] **Step 1: Create categories service**

```typescript
// src/services/categories/categories.service.ts
import { supabase } from "@/lib/supabase/client";

export type Category = {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  type: "expense" | "income" | "both";
  color: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export type CreateCategoryPayload = {
  name: string;
  icon: string;
  type: "expense" | "income" | "both";
  color?: string;
  sort_order?: number;
};

export const categoriesService = {
  getCategories: async (): Promise<Category[]> => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      throw new Error(authError?.message ?? "Not authenticated");
    }

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .or(`user_id.is.null,user_id.eq.${authData.user.id}`)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  },

  createCategory: async (payload: CreateCategoryPayload): Promise<Category> => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      throw new Error(authError?.message ?? "Not authenticated");
    }

    const { data, error } = await supabase
      .from("categories")
      .insert({ ...payload, user_id: authData.user.id })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },
};
```

- [ ] **Step 2: Create categories hooks**

```typescript
// src/services/categories/categories.hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesService, CreateCategoryPayload } from "./categories.service";
import { QueryConfig, MutationConfig } from "@/lib/query-client";

export const categoryKeys = {
  all: ["categories"] as const,
};

export const getCategoriesQueryOptions = () => ({
  queryKey: categoryKeys.all,
  queryFn: categoriesService.getCategories,
});

type UseGetCategoriesParams = {
  queryConfig?: QueryConfig<typeof getCategoriesQueryOptions>;
};

export const useGetCategories = ({ queryConfig }: UseGetCategoriesParams = {}) => {
  return useQuery({
    ...getCategoriesQueryOptions(),
    ...queryConfig,
  });
};

type UseCreateCategoryParams = {
  mutationConfig?: MutationConfig<typeof categoriesService.createCategory>;
};

export const useCreateCategory = ({ mutationConfig }: UseCreateCategoryParams = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) =>
      categoriesService.createCategory(payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      mutationConfig?.onSuccess?.(...args);
    },
    ...mutationConfig,
  });
};
```

- [ ] **Step 3: Verify by importing in a page and checking console**

Run: `npm run build` (or check dev server for type errors)

- [ ] **Step 4: Commit**

```bash
git add src/services/categories/
git commit -m "feat: add categories service and TanStack Query hooks"
```

---

### Task 2: Accounts Service + Hooks

**Files:**
- Create: `src/services/accounts/accounts.service.ts`
- Create: `src/services/accounts/accounts.hooks.ts`

- [ ] **Step 1: Create accounts service**

```typescript
// src/services/accounts/accounts.service.ts
import { supabase } from "@/lib/supabase/client";

export type Account = {
  id: string;
  user_id: string;
  name: string;
  type: "bank" | "cash" | "e-wallet" | "credit-card" | "investment";
  icon: string | null;
  color: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type AccountBalance = {
  account_id: string;
  user_id: string;
  name: string;
  type: string;
  icon: string | null;
  color: string | null;
  is_active: boolean;
  balance: number;
};

export type CreateAccountPayload = {
  name: string;
  type: Account["type"];
  icon?: string;
  color?: string;
};

export type UpdateAccountPayload = {
  name?: string;
  type?: Account["type"];
  icon?: string;
  color?: string;
  is_active?: boolean;
  sort_order?: number;
};

export const accountsService = {
  getAccounts: async (): Promise<Account[]> => {
    const { data, error } = await supabase
      .from("accounts")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) throw new Error(error.message);
    return data;
  },

  getAccountBalances: async (): Promise<AccountBalance[]> => {
    const { data, error } = await supabase
      .from("account_balances")
      .select("*");

    if (error) throw new Error(error.message);
    return data;
  },

  createAccount: async (payload: CreateAccountPayload): Promise<Account> => {
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      throw new Error(authError?.message ?? "Not authenticated");
    }

    const { data, error } = await supabase
      .from("accounts")
      .insert({ ...payload, user_id: authData.user.id })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  updateAccount: async (id: string, payload: UpdateAccountPayload): Promise<Account> => {
    const { data, error } = await supabase
      .from("accounts")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  deleteAccount: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from("accounts")
      .delete()
      .eq("id", id);

    if (error) throw new Error(error.message);
  },
};
```

- [ ] **Step 2: Create accounts hooks**

```typescript
// src/services/accounts/accounts.hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  accountsService,
  CreateAccountPayload,
  UpdateAccountPayload,
} from "./accounts.service";
import { QueryConfig, MutationConfig } from "@/lib/query-client";

export const accountKeys = {
  all: ["accounts"] as const,
  balances: ["accounts", "balances"] as const,
};

export const getAccountsQueryOptions = () => ({
  queryKey: accountKeys.all,
  queryFn: accountsService.getAccounts,
});

export const getAccountBalancesQueryOptions = () => ({
  queryKey: accountKeys.balances,
  queryFn: accountsService.getAccountBalances,
});

type UseGetAccountsParams = {
  queryConfig?: QueryConfig<typeof getAccountsQueryOptions>;
};

export const useGetAccounts = ({ queryConfig }: UseGetAccountsParams = {}) => {
  return useQuery({
    ...getAccountsQueryOptions(),
    ...queryConfig,
  });
};

type UseGetAccountBalancesParams = {
  queryConfig?: QueryConfig<typeof getAccountBalancesQueryOptions>;
};

export const useGetAccountBalances = ({ queryConfig }: UseGetAccountBalancesParams = {}) => {
  return useQuery({
    ...getAccountBalancesQueryOptions(),
    ...queryConfig,
  });
};

type UseCreateAccountParams = {
  mutationConfig?: MutationConfig<typeof accountsService.createAccount>;
};

export const useCreateAccount = ({ mutationConfig }: UseCreateAccountParams = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateAccountPayload) =>
      accountsService.createAccount(payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      mutationConfig?.onSuccess?.(...args);
    },
    ...mutationConfig,
  });
};

type UseUpdateAccountParams = {
  mutationConfig?: MutationConfig<
    (payload: { id: string } & UpdateAccountPayload) => Promise<unknown>
  >;
};

export const useUpdateAccount = ({ mutationConfig }: UseUpdateAccountParams = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateAccountPayload) =>
      accountsService.updateAccount(id, payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      mutationConfig?.onSuccess?.(...args);
    },
    ...mutationConfig,
  });
};

type UseDeleteAccountParams = {
  mutationConfig?: MutationConfig<typeof accountsService.deleteAccount>;
};

export const useDeleteAccount = ({ mutationConfig }: UseDeleteAccountParams = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => accountsService.deleteAccount(id),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      mutationConfig?.onSuccess?.(...args);
    },
    ...mutationConfig,
  });
};
```

- [ ] **Step 3: Commit**

```bash
git add src/services/accounts/
git commit -m "feat: add accounts service and TanStack Query hooks"
```

---

### Task 3: Transactions Service + Hooks

**Files:**
- Create: `src/services/transactions/transactions.service.ts`
- Create: `src/services/transactions/transactions.hooks.ts`

- [ ] **Step 1: Create transactions service**

```typescript
// src/services/transactions/transactions.service.ts
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
    return (data ?? []).map((row: Record<string, unknown>) => {
      const accounts = row.accounts as { name: string } | null;
      const categories = row.categories as { name: string; icon: string } | null;
      return {
        ...row,
        account_name: accounts?.name ?? "",
        category_name: categories?.name ?? row.category,
        category_icon: categories?.icon ?? "",
        accounts: undefined,
        categories: undefined,
      };
    }) as Transaction[];
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
```

- [ ] **Step 2: Create transactions hooks**

```typescript
// src/services/transactions/transactions.hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  transactionsService,
  CreateTransactionPayload,
  TransactionFilters,
} from "./transactions.service";
import { QueryConfig, MutationConfig } from "@/lib/query-client";
import { accountKeys } from "@/services/accounts/accounts.hooks";

export const transactionKeys = {
  all: ["transactions"] as const,
  filtered: (filters: TransactionFilters) => ["transactions", filters] as const,
  summary: (dateFrom: string, dateTo: string) =>
    ["transactions", "summary", dateFrom, dateTo] as const,
};

export const getTransactionsQueryOptions = (filters: TransactionFilters = {}) => ({
  queryKey: transactionKeys.filtered(filters),
  queryFn: () => transactionsService.getTransactions(filters),
});

export const getTransactionSummaryQueryOptions = (dateFrom: string, dateTo: string) => ({
  queryKey: transactionKeys.summary(dateFrom, dateTo),
  queryFn: () => transactionsService.getTransactionSummary(dateFrom, dateTo),
});

type UseGetTransactionsParams = {
  filters?: TransactionFilters;
  queryConfig?: QueryConfig<typeof getTransactionsQueryOptions>;
};

export const useGetTransactions = ({
  filters = {},
  queryConfig,
}: UseGetTransactionsParams = {}) => {
  return useQuery({
    ...getTransactionsQueryOptions(filters),
    ...queryConfig,
  });
};

type UseGetTransactionSummaryParams = {
  dateFrom: string;
  dateTo: string;
  queryConfig?: QueryConfig<typeof getTransactionSummaryQueryOptions>;
};

export const useGetTransactionSummary = ({
  dateFrom,
  dateTo,
  queryConfig,
}: UseGetTransactionSummaryParams) => {
  return useQuery({
    ...getTransactionSummaryQueryOptions(dateFrom, dateTo),
    ...queryConfig,
  });
};

type UseCreateTransactionParams = {
  mutationConfig?: MutationConfig<typeof transactionsService.createTransaction>;
};

export const useCreateTransaction = ({
  mutationConfig,
}: UseCreateTransactionParams = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTransactionPayload) =>
      transactionsService.createTransaction(payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.balances });
      mutationConfig?.onSuccess?.(...args);
    },
    ...mutationConfig,
  });
};

type UseDeleteTransactionsParams = {
  mutationConfig?: MutationConfig<typeof transactionsService.deleteTransactions>;
};

export const useDeleteTransactions = ({
  mutationConfig,
}: UseDeleteTransactionsParams = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => transactionsService.deleteTransactions(ids),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.balances });
      mutationConfig?.onSuccess?.(...args);
    },
    ...mutationConfig,
  });
};
```

- [ ] **Step 3: Commit**

```bash
git add src/services/transactions/
git commit -m "feat: add transactions service and TanStack Query hooks"
```

---

### Task 4: Budgets Service + Hooks

**Files:**
- Create: `src/services/budgets/budgets.service.ts`
- Create: `src/services/budgets/budgets.hooks.ts`

- [ ] **Step 1: Create budgets service**

```typescript
// src/services/budgets/budgets.service.ts
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

    // Get budgets for the month
    const { data: budgets, error: budgetsError } = await supabase
      .from("budgets")
      .select("*, categories(name, icon)")
      .eq("month_year", monthYear)
      .order("created_at", { ascending: true });

    if (budgetsError) throw new Error(budgetsError.message);

    // Calculate spent from transactions for each budget category in this month
    const [year, monthStr] = monthYear.split("-");
    const monthNum = parseInt(monthStr, 10);
    const daysInMonth = new Date(parseInt(year), monthNum, 0).getDate();
    const dateFrom = `${monthYear}-01`;
    const dateTo = `${monthYear}-${String(daysInMonth).padStart(2, "0")}`;

    // Get 7-day window for "recent" spending
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

    // Build spent map by category name (fallback) and category_id
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

    return (budgets ?? []).map((b: Record<string, unknown>) => {
      const categories = b.categories as { name: string; icon: string } | null;
      const spentKey = (b.category_id as string) || (b.category as string);
      const spentEntry = spentMap.get(spentKey) || { total: 0, recent: 0 };

      return {
        ...b,
        category_name: categories?.name ?? b.category,
        category_icon: categories?.icon ?? "",
        spent: spentEntry.total,
        recent: spentEntry.recent,
        categories: undefined,
      };
    }) as BudgetWithSpent[];
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
```

- [ ] **Step 2: Create budgets hooks**

```typescript
// src/services/budgets/budgets.hooks.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  budgetsService,
  CreateBudgetPayload,
  UpdateBudgetPayload,
} from "./budgets.service";
import { QueryConfig, MutationConfig } from "@/lib/query-client";

export const budgetKeys = {
  all: ["budgets"] as const,
  month: (monthYear: string) => ["budgets", monthYear] as const,
};

export const getBudgetsQueryOptions = (monthYear: string) => ({
  queryKey: budgetKeys.month(monthYear),
  queryFn: () => budgetsService.getBudgets(monthYear),
});

type UseGetBudgetsParams = {
  monthYear: string;
  queryConfig?: QueryConfig<typeof getBudgetsQueryOptions>;
};

export const useGetBudgets = ({ monthYear, queryConfig }: UseGetBudgetsParams) => {
  return useQuery({
    ...getBudgetsQueryOptions(monthYear),
    ...queryConfig,
  });
};

type UseCreateBudgetsParams = {
  mutationConfig?: MutationConfig<typeof budgetsService.createBudgets>;
};

export const useCreateBudgets = ({ mutationConfig }: UseCreateBudgetsParams = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payloads: CreateBudgetPayload[]) =>
      budgetsService.createBudgets(payloads),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      mutationConfig?.onSuccess?.(...args);
    },
    ...mutationConfig,
  });
};

type UseUpdateBudgetParams = {
  mutationConfig?: MutationConfig<
    (payload: { id: string } & UpdateBudgetPayload) => Promise<unknown>
  >;
};

export const useUpdateBudget = ({ mutationConfig }: UseUpdateBudgetParams = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string } & UpdateBudgetPayload) =>
      budgetsService.updateBudget(id, payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      mutationConfig?.onSuccess?.(...args);
    },
    ...mutationConfig,
  });
};

type UseDeleteBudgetParams = {
  mutationConfig?: MutationConfig<typeof budgetsService.deleteBudget>;
};

export const useDeleteBudget = ({ mutationConfig }: UseDeleteBudgetParams = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => budgetsService.deleteBudget(id),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      mutationConfig?.onSuccess?.(...args);
    },
    ...mutationConfig,
  });
};
```

- [ ] **Step 3: Commit**

```bash
git add src/services/budgets/
git commit -m "feat: add budgets service and TanStack Query hooks"
```

---

### Task 5: Default Account on Signup

**Files:**
- Modify: `src/services/auth/auth.service.ts`

- [ ] **Step 1: Add default Cash account creation after profile setup**

In `src/services/auth/auth.service.ts`, modify the `setupProfile` method to also create a default "Cash" account after upserting the profile:

```typescript
// After the existing profile upsert block, add:
const { error: accountError } = await supabase.from("accounts").insert([
  {
    user_id: userResponse.user.id,
    name: "Cash",
    type: "cash",
    icon: "💵",
  },
]);

if (accountError) {
  throw new Error(accountError.message);
}
```

- [ ] **Step 2: Commit**

```bash
git add src/services/auth/auth.service.ts
git commit -m "feat: create default Cash account on user signup"
```

---

### Task 6: Integrate Add Transaction Drawer

**Files:**
- Modify: `src/components/transactions/add-transaction-drawer.tsx`

- [ ] **Step 1: Replace hardcoded CATEGORIES and ACCOUNTS with hooks**

Replace the hardcoded `CATEGORIES` array and `ACCOUNTS` array at the top of the file with hook calls inside the component:

```typescript
// Remove the hardcoded CATEGORIES and ACCOUNTS constants

// Inside AddTransactionDrawer component, add:
const { data: categories = [] } = useGetCategories();
const { data: accountBalances = [] } = useGetAccountBalances();
const createTransaction = useCreateTransaction({
  mutationConfig: {
    onSuccess: () => {
      onOpenChange(false);
    },
  },
});

// Map categories for the grid (filter by transaction type)
const displayCategories = React.useMemo(() => {
  const typeFilter = type === "expense" ? "expense" : type === "income" ? "income" : "both";
  return categories
    .filter((c) => c.type === typeFilter || c.type === "both")
    .slice(0, 8);
}, [categories, type]);

// Map account balances for the picker
const displayAccounts = React.useMemo(() => {
  return accountBalances
    .filter((a) => a.is_active)
    .map((a) => ({
      id: a.account_id,
      name: a.name,
      meta: a.type,
      balance: a.balance,
      em: a.icon || "🏦",
      colorClass: "text-fg-1",
      isNeg: a.balance < 0,
    }));
}, [accountBalances]);
```

Update the category grid to use `displayCategories`:
```typescript
{displayCategories.map((c) => (
  <button
    key={c.id}
    onClick={() => setCat(c.id)}
    className={cn(
      "aspect-square border rounded-md flex flex-col items-center justify-center gap-1 cursor-pointer text-[11px] transition-colors",
      cat === c.id
        ? "border-brand bg-brand-soft text-brand"
        : "border-line bg-bg-2 text-fg-1 hover:bg-bg-3",
    )}
  >
    <span className="text-[18px]">{c.icon}</span>
    <span>{c.name}</span>
  </button>
))}
```

Update the `AccountPickerView` to accept accounts as props instead of using hardcoded data.

Update `handleSave` to call the mutation:
```typescript
const handleSave = () => {
  const selectedCategory = categories.find((c) => c.id === cat);
  createTransaction.mutate({
    account_id: acctKey,
    category_id: cat,
    type: type === "expense" ? "Expense" : type === "income" ? "Income" : "Transfer",
    category: selectedCategory?.name ?? "",
    amount: amount,
    date: format(date, "yyyy-MM-dd"),
    merchant: note || undefined,
    note: note || undefined,
  });
};
```

- [ ] **Step 2: Add loading/disabled state to Save button**

```typescript
<Button onClick={handleSave} disabled={amount === 0 || createTransaction.isPending}>
  {createTransaction.isPending ? "Saving..." : "Save transaction"}
</Button>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/transactions/add-transaction-drawer.tsx
git commit -m "feat: integrate add-transaction drawer with Supabase"
```

---

### Task 7: Integrate History Page

**Files:**
- Modify: `src/components/history/history-constants.ts`
- Modify: `src/app/(main)/history/page.tsx`
- Modify: `src/components/history/history-filter-drawer.tsx`

- [ ] **Step 1: Clean up history-constants.ts**

Remove `MOCK_TRANSACTIONS` from the file. Keep `Transaction` type (update id to string), `Filters`, `DEFAULT_FILTERS`, `DATE_RANGES`, `CATEGORIES`, `ACCOUNTS`.

Update the `Transaction` interface:
```typescript
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
}
```

- [ ] **Step 2: Update history page to use hooks**

Replace `MOCK_TRANSACTIONS` usage in `src/app/(main)/history/page.tsx` with `useGetTransactions` hook:

```typescript
import { useGetTransactions, useDeleteTransactions } from "@/services/transactions/transactions.hooks";
import { useGetCategories } from "@/services/categories/categories.hooks";
import { useGetAccounts } from "@/services/accounts/accounts.hooks";

// Inside component:
const { data: categories = [] } = useGetCategories();
const { data: accounts = [] } = useGetAccounts();

// Compute date range from filters
const dateRange = React.useMemo(() => {
  const today = new Date();
  let dateFrom: string;
  let dateTo: string = today.toISOString().split("T")[0];
  switch (filters.range) {
    case "7d":
      dateFrom = new Date(today.getTime() - 7 * 86400000).toISOString().split("T")[0];
      break;
    case "30d":
      dateFrom = new Date(today.getTime() - 30 * 86400000).toISOString().split("T")[0];
      break;
    case "this": {
      dateFrom = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-01`;
      break;
    }
    case "last": {
      const last = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      dateFrom = `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-01`;
      const lastEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      dateTo = lastEnd.toISOString().split("T")[0];
      break;
    }
    default:
      dateFrom = new Date(today.getTime() - 30 * 86400000).toISOString().split("T")[0];
  }
  return { dateFrom, dateTo };
}, [filters.range]);

const { data: transactions = [], isLoading } = useGetTransactions({
  filters: {
    type: filters.type !== "all" ? filters.type : undefined,
    categoryIds: filters.cats.length > 0
      ? categories.filter((c) => filters.cats.includes(c.name)).map((c) => c.id)
      : undefined,
    accountIds: filters.accts.length > 0
      ? accounts.filter((a) => filters.accts.includes(a.name)).map((a) => a.id)
      : undefined,
    amtMin: filters.amtMin || undefined,
    amtMax: filters.amtMax || undefined,
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
    search: searchQ || undefined,
  },
});

const deleteTransactions = useDeleteTransactions({
  mutationConfig: { onSuccess: () => exitSelectMode() },
});
```

Replace `filteredTx` with `transactions` (server-side filtering).

Update the Delete button:
```typescript
<button
  onClick={() => deleteTransactions.mutate(Array.from(selected))}
  className="..."
>
  <Trash2 size={14} strokeWidth={1.75} />
  Delete ({selected.size})
</button>
```

Update `isEmpty` / `isNoResults`:
```typescript
const isEmpty = !isLoading && transactions.length === 0 && !searchQ && filters.type === "all";
const isNoResults = !isLoading && transactions.length === 0 && !isEmpty;
```

- [ ] **Step 3: Update filter drawer to use live categories/accounts**

In `src/components/history/history-filter-drawer.tsx`, accept `categories` and `accounts` as props instead of importing from constants:

```typescript
interface HistoryFilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Filters;
  onApply: (filters: Filters) => void;
  categories: { id: string; name: string; icon: string }[];
  accounts: { id: string; name: string }[];
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/history/ src/app/(main)/history/
git commit -m "feat: integrate history page with Supabase transactions"
```

---

### Task 8: Integrate Budget Page

**Files:**
- Modify: `src/components/budget/budget-constants.ts`
- Modify: `src/app/(main)/budget/page.tsx`
- Modify: `src/components/budget/create-budget-drawer.tsx`

- [ ] **Step 1: Clean up budget-constants.ts**

Remove `MOCK_BUDGETS` from the file. Keep `DEFAULT_CATEGORY_TEMPLATE`, `ICON_PALETTE`, `MONTH_NAMES`, `monthKey`, `monthLabel`, and other utility functions.

- [ ] **Step 2: Update budget page to use hooks**

Replace local `createdBudgets` state and `MOCK_BUDGETS` with `useGetBudgets`:

```typescript
import { useGetBudgets, useCreateBudgets } from "@/services/budgets/budgets.hooks";
import { useGetCategories } from "@/services/categories/categories.hooks";

// Inside component:
const key = monthKey(year, month);
const { data: budgetData, isLoading } = useGetBudgets({ monthYear: key });
const { data: prevBudgetData } = useGetBudgets({ monthYear: prevKey });

// Map to BudgetCategory shape for existing components
const cats: BudgetCategory[] | null = React.useMemo(() => {
  if (!budgetData || budgetData.length === 0) return null;
  return budgetData.map((b) => ({
    id: b.id,
    name: b.category_name || b.category,
    icon: b.category_icon || "",
    budget: Number(b.planned_amount),
    spent: b.spent,
    recent: b.recent,
  }));
}, [budgetData]);

const previousCats: BudgetCategory[] | null = React.useMemo(() => {
  if (!prevBudgetData || prevBudgetData.length === 0) return null;
  return prevBudgetData.map((b) => ({
    id: b.id,
    name: b.category_name || b.category,
    icon: b.category_icon || "",
    budget: Number(b.planned_amount),
    spent: b.spent,
    recent: b.recent,
  }));
}, [prevBudgetData]);
```

- [ ] **Step 3: Update CreateBudgetDrawer to save to Supabase**

Replace the `onSave` callback pattern with a mutation:

```typescript
import { useCreateBudgets } from "@/services/budgets/budgets.hooks";
import { useGetCategories } from "@/services/categories/categories.hooks";

// Inside component:
const { data: categories = [] } = useGetCategories();
const createBudgets = useCreateBudgets({
  mutationConfig: {
    onSuccess: () => onOpenChange(false),
  },
});

// On save:
const handleSave = () => {
  const enabledRows = rows.filter((r) => r.enabled);
  const payloads = enabledRows.map((r) => {
    const cat = categories.find((c) => c.name === r.name);
    return {
      month_year: monthKey(year, month),
      category: r.name,
      category_id: cat?.id,
      planned_amount: r.budget,
    };
  });
  createBudgets.mutate(payloads);
};
```

- [ ] **Step 4: Commit**

```bash
git add src/components/budget/ src/app/(main)/budget/
git commit -m "feat: integrate budget page with Supabase"
```

---

### Task 9: Integrate Dashboard Page

**Files:**
- Modify: `src/app/(main)/page.tsx`

- [ ] **Step 1: Replace SEED_GROUPS and hardcoded values with hooks**

```typescript
import { useGetTransactions, useGetTransactionSummary } from "@/services/transactions/transactions.hooks";
import { useGetAccountBalances } from "@/services/accounts/accounts.hooks";
import { useGetCategories } from "@/services/categories/categories.hooks";
import { fmtIDR } from "@/lib/format";
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfDay, endOfDay, subMonths } from "date-fns";

// Inside component:
const now = new Date();

// Date range based on period
const { dateFrom, dateTo } = React.useMemo(() => {
  const today = new Date();
  switch (period) {
    case "Day":
      return {
        dateFrom: format(startOfDay(today), "yyyy-MM-dd"),
        dateTo: format(endOfDay(today), "yyyy-MM-dd"),
      };
    case "Week":
      return {
        dateFrom: format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"),
        dateTo: format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"),
      };
    case "Year":
      return {
        dateFrom: `${today.getFullYear()}-01-01`,
        dateTo: `${today.getFullYear()}-12-31`,
      };
    case "Month":
    default:
      return {
        dateFrom: format(startOfMonth(today), "yyyy-MM-dd"),
        dateTo: format(endOfMonth(today), "yyyy-MM-dd"),
      };
  }
}, [period]);

const { data: accountBalances = [] } = useGetAccountBalances();
const { data: recentTx = [] } = useGetTransactions({
  filters: { dateFrom, dateTo, limit: 20 },
});
const { data: summary } = useGetTransactionSummary({ dateFrom, dateTo });
const { data: categories = [] } = useGetCategories();

const totalBalance = React.useMemo(
  () => accountBalances.reduce((sum, a) => sum + Number(a.balance), 0),
  [accountBalances],
);

// Group transactions by date
const groups = React.useMemo(() => {
  const map = new Map<string, typeof recentTx>();
  for (const tx of recentTx) {
    const existing = map.get(tx.date) || [];
    existing.push(tx);
    map.set(tx.date, existing);
  }
  return Array.from(map.entries()).map(([date, items]) => ({
    day: date,
    dayLabel: formatDayLabel(date),
    total: items.reduce((s, t) =>
      s + (t.type === "Income" ? Number(t.amount) : -Number(t.amount)), 0),
    items,
  }));
}, [recentTx]);
```

Replace the hardcoded balance display with `fmtIDR(totalBalance)`.

Replace the income/expense strip with `summary?.totalIncome` and `summary?.totalExpense`.

Replace SEED_GROUPS iteration with `groups`.

Replace CHIPS with dynamic category chips from the `categories` data, with counts derived from `recentTx`.

Add a helper to format day labels:
```typescript
function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) {
    return `Today · ${format(date, "MMM d")}`;
  }
  if (format(date, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd")) {
    return `Yesterday · ${format(date, "MMM d")}`;
  }
  return format(date, "MMM d");
}
```

- [ ] **Step 2: Handle loading states**

Add skeleton/loading indicators while data is fetching.

- [ ] **Step 3: Commit**

```bash
git add src/app/(main)/page.tsx
git commit -m "feat: integrate dashboard with live Supabase data"
```

---

### Task 10: Accounts Section in Profile Page

**Files:**
- Create: `src/components/profile/accounts-section.tsx`
- Modify: `src/app/(main)/profile/page.tsx`

- [ ] **Step 1: Create accounts section component**

```typescript
// src/components/profile/accounts-section.tsx
"use client";

import * as React from "react";
import { Plus, Pencil, Trash2, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtIDR } from "@/lib/format";
import {
  useGetAccountBalances,
  useCreateAccount,
  useDeleteAccount,
} from "@/services/accounts/accounts.hooks";
import type { AccountBalance } from "@/services/accounts/accounts.service";
import type { Account } from "@/services/accounts/accounts.service";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const ACCOUNT_TYPES: { value: Account["type"]; label: string; icon: string }[] = [
  { value: "bank", label: "Bank", icon: "🏦" },
  { value: "cash", label: "Cash", icon: "💵" },
  { value: "e-wallet", label: "E-Wallet", icon: "📱" },
  { value: "credit-card", label: "Credit Card", icon: "💳" },
  { value: "investment", label: "Investment", icon: "📈" },
];

export function AccountsSection() {
  const { data: accounts = [] } = useGetAccountBalances();
  const [addOpen, setAddOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<Account["type"]>("bank");

  const createAccount = useCreateAccount({
    mutationConfig: {
      onSuccess: () => {
        setAddOpen(false);
        setName("");
        setType("bank");
      },
    },
  });

  const deleteAccount = useDeleteAccount();

  const handleAdd = () => {
    const selected = ACCOUNT_TYPES.find((t) => t.value === type);
    createAccount.mutate({
      name,
      type,
      icon: selected?.icon,
    });
  };

  return (
    <>
      <div className="flex flex-col gap-2">
        {accounts.map((a) => (
          <div
            key={a.account_id}
            className="flex items-center gap-3 p-3 bg-bg-0 border border-line rounded-md"
          >
            <div className="w-9 h-9 rounded-lg bg-bg-2 border border-line flex items-center justify-center text-[16px] flex-shrink-0">
              {a.icon || "🏦"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium text-fg-0">{a.name}</div>
              <div className="text-[11px] text-fg-2 font-mono mt-0.5">{a.type}</div>
            </div>
            <div className="font-mono tabular-nums text-[13px] font-medium text-fg-0">
              {fmtIDR(Number(a.balance))}
            </div>
          </div>
        ))}

        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center justify-center gap-2 h-11 border border-dashed border-line rounded-md text-[13px] text-fg-1 cursor-pointer hover:bg-bg-1 transition-colors"
        >
          <Plus size={16} strokeWidth={1.75} /> Add account
        </button>
      </div>

      <Drawer open={addOpen} onOpenChange={setAddOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Add account</DrawerTitle>
          </DrawerHeader>
          <div className="px-5 flex flex-col gap-4">
            <Input
              placeholder="Account name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="grid grid-cols-3 gap-2">
              {ACCOUNT_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setType(t.value)}
                  className={cn(
                    "p-3 border rounded-md cursor-pointer transition-colors text-center",
                    type === t.value
                      ? "border-brand bg-brand-soft"
                      : "border-line bg-bg-0 hover:bg-bg-2",
                  )}
                >
                  <div className="text-[18px]">{t.icon}</div>
                  <div className="text-[11px] mt-1">{t.label}</div>
                </button>
              ))}
            </div>
          </div>
          <DrawerFooter className="grid grid-cols-[1fr_2fr] gap-2 px-5">
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!name.trim() || createAccount.isPending}>
              {createAccount.isPending ? "Adding..." : "Add"}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
```

- [ ] **Step 2: Add accounts section to profile page**

In `src/app/(main)/profile/page.tsx`, import and add the AccountsSection inside the Account settings group:

```typescript
import { AccountsSection } from "@/components/profile/accounts-section";

// Inside the return, after the "Account" SettingsGroup:
<SettingsGroup label="Accounts">
  <div className="px-1 py-2">
    <AccountsSection />
  </div>
</SettingsGroup>
```

Also update the stats strip to show live transaction count:
```typescript
import { useGetTransactions } from "@/services/transactions/transactions.hooks";

// Add inside component:
const { data: allTransactions = [] } = useGetTransactions();
```

Replace hardcoded `247` with `allTransactions.length`.

- [ ] **Step 3: Commit**

```bash
git add src/components/profile/ src/app/(main)/profile/
git commit -m "feat: add accounts management section to profile page"
```

---

### Task 11: Build Verification

- [ ] **Step 1: Run build to check for type errors**

```bash
npm run build
```

Fix any type errors that arise from the integration.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Fix any lint issues.

- [ ] **Step 3: Manual smoke test**

Start dev server and test:
1. Register new account → verify default Cash account created
2. Add a transaction → verify it appears in history
3. Check dashboard shows live balance and recent transactions
4. Create a budget → verify it persists across page navigation
5. Check profile page shows accounts section
6. Add a new account from profile → verify it appears in transaction drawer

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "fix: resolve build and lint issues from Supabase integration"
```
