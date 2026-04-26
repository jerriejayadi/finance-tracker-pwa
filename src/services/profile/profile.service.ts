import { supabase } from "@/lib/supabase/client";
import { SignInWithPasswordCredentials } from "@supabase/supabase-js";

export const profileService = {
  getProfile: async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .single();

    // TanStack Query needs this error thrown so it can catch it
    if (error) {
      throw new Error(error.message);
    }

    return data;
  },
  updateProfile: async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }

    return true;
  },
};

