import { supabase } from "@/lib/supabase/client";

export type Profile = {
  id: string;
  display_name: string | null;
  currency_preference: string | null;
  phone: string | null;
  avatar_url: string | null;
  first_day_of_week: number;
  created_at: string;
  updated_at: string;
  email: string | null;
};

export type UpdateProfilePayload = {
  display_name?: string;
  currency_preference?: string;
  phone?: string;
  avatar_url?: string;
  first_day_of_week?: number;
};

export const profileService = {
  getProfile: async (): Promise<Profile> => {
    // Get the authenticated user (for email)
    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      throw new Error(authError?.message ?? "Not authenticated");
    }

    // Get the profile row
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Merge email from auth into the profile object
    return {
      ...data,
      email: authData.user.email ?? null,
    };
  },

  updateProfile: async (payload: UpdateProfilePayload) => {
    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      throw new Error(authError?.message ?? "Not authenticated");
    }

    const { data, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("id", authData.user.id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },
};
