import { supabase } from "@/lib/supabase/client";
import { SignInWithPasswordCredentials } from "@supabase/supabase-js";

export const authService = {
  login: async (credentials: SignInWithPasswordCredentials) => {
    const { data, error } = await supabase.auth.signInWithPassword(credentials);

    // TanStack Query needs this error thrown so it can catch it
    if (error) {
      throw new Error(error.message);
    }

    return data;
  },
  logout: async() => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }

    return true;
  },
};

