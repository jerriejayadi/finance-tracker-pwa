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
