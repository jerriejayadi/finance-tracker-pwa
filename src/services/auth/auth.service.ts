import { supabase } from "@/lib/supabase/client";
import {
  SignInWithPasswordCredentials,
  SignUpWithPasswordCredentials,
  VerifyOtpParams,
  ResendParams,
} from "@supabase/supabase-js";

export const authService = {
  login: async (credentials: SignInWithPasswordCredentials) => {
    const { data, error } = await supabase.auth.signInWithPassword(credentials);

    // TanStack Query needs this error thrown so it can catch it
    if (error) {
      throw new Error(error.message);
    }

    return data;
  },
  register: async (credentials: SignUpWithPasswordCredentials) => {
    const { data, error } = await supabase.auth.signUp(credentials);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },
  verifyOtp: async (params: VerifyOtpParams) => {
    const { data, error } = await supabase.auth.verifyOtp(params);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },
  resendOtp: async (params: ResendParams) => {
    const { data, error } = await supabase.auth.resend(params);

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },
  setupProfile: async (profileData: {
    display_name: string;
    phone: string;
    currency_preference: string;
  }) => {
    const { data: userResponse, error: userError } =
      await supabase.auth.getUser();

    if (userError || !userResponse.user) {
      throw new Error("Unable to identify logged-in user to setup profile.");
    }

    const { error: profileError } = await supabase.from("profiles").upsert([
      {
        id: userResponse.user.id,
        display_name: profileData.display_name,
        phone: profileData.phone,
        currency_preference: profileData.currency_preference,
      },
    ]);

    if (profileError) {
      throw new Error(profileError.message);
    }

    // Create default Cash account for new user
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

    return true;
  },
  logout: async () => {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error(error.message);
    }

    return true;
  },
  getProfile: async () => {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },
};
