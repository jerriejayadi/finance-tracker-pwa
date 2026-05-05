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
