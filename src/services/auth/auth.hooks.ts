import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "./auth.service";
import { MutationConfig } from "@/lib/query-client";
import { supabase } from "@/lib/supabase/client";
import { useSetLocale } from "@/i18n/locale-provider";
import { locales, type Locale } from "@/i18n/config";

type UseLoginParams = {
  mutationConfig?: MutationConfig<typeof authService.login>;
};

export const useLoginMutation = ({ mutationConfig }: UseLoginParams = {}) => {
  const router = useRouter();
  const setLocale = useSetLocale();

  return useMutation({
    mutationFn: authService.login,
    ...mutationConfig,
    onSuccess: async (data, ...args) => {
      console.log("Login successful! User ID:", data.user?.id);

      // Fetch user profile to get language preference and set cookie
      if (data.user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("language")
          .eq("id", data.user.id)
          .single();

        if (locales.includes(profile?.language as Locale)) {
          setLocale(profile!.language as Locale);
        }
      }

      router.push("/");
      mutationConfig?.onSuccess?.(data, ...args);
    },
    onError: (error, ...args) => {
      console.error("Login failed:", error.message);
      mutationConfig?.onError?.(error, ...args);
    },
  });
};

type UseGoogleSignInParams = {
  mutationConfig?: MutationConfig<typeof authService.signInWithGoogle>;
};

export const useGoogleSignInMutation = ({
  mutationConfig,
}: UseGoogleSignInParams = {}) => {
  return useMutation({
    mutationFn: authService.signInWithGoogle,
    ...mutationConfig,
    onError: (error, ...args) => {
      console.error("Google sign-in failed:", error.message);
      mutationConfig?.onError?.(error, ...args);
    },
  });
};

type UseRegisterParams = {
  mutationConfig?: MutationConfig<typeof authService.register>;
};

export const useRegisterMutation = ({
  mutationConfig,
}: UseRegisterParams = {}) => {
  return useMutation({
    mutationFn: authService.register,
    ...mutationConfig,
    onSuccess: (data, ...args) => {
      console.log("Registration step 1 successful for", data.user?.email);
      mutationConfig?.onSuccess?.(data, ...args);
    },
    onError: (error, ...args) => {
      console.error("Registration failed:", error.message);
      mutationConfig?.onError?.(error, ...args);
    },
  });
};

type UseVerifyOtpParams = {
  mutationConfig?: MutationConfig<typeof authService.verifyOtp>;
};

export const useVerifyOtpMutation = ({
  mutationConfig,
}: UseVerifyOtpParams = {}) => {
  return useMutation({
    mutationFn: authService.verifyOtp,
    ...mutationConfig,
    onSuccess: (data, ...args) => {
      console.log("OTP verification successful!");
      mutationConfig?.onSuccess?.(data, ...args);
    },
    onError: (error, ...args) => {
      console.error("OTP verification failed:", error.message);
      mutationConfig?.onError?.(error, ...args);
    },
  });
};

type UseResendOtpParams = {
  mutationConfig?: MutationConfig<typeof authService.resendOtp>;
};

export const useResendOtpMutation = ({
  mutationConfig,
}: UseResendOtpParams = {}) => {
  return useMutation({
    mutationFn: authService.resendOtp,
    ...mutationConfig,
    onSuccess: (data, ...args) => {
      console.log("OTP Resent successfully!");
      mutationConfig?.onSuccess?.(data, ...args);
    },
    onError: (error, ...args) => {
      console.error("OTP Resend failed:", error.message);
      mutationConfig?.onError?.(error, ...args);
    },
  });
};

type UseSetupProfileParams = {
  mutationConfig?: MutationConfig<typeof authService.setupProfile>;
};

export const useSetupProfileMutation = ({
  mutationConfig,
}: UseSetupProfileParams = {}) => {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.setupProfile,
    ...mutationConfig,
    onSuccess: (data, ...args) => {
      console.log("Profile setup successful!");
      router.push("/");
      mutationConfig?.onSuccess?.(data, ...args);
    },
    onError: (error, ...args) => {
      console.error("Profile setup failed:", error.message);
      mutationConfig?.onError?.(error, ...args);
    },
  });
};

type UseSignOutParams = {
  mutationConfig?: MutationConfig<typeof authService.logout>;
};

export const useSignOutMutation = ({
  mutationConfig,
}: UseSignOutParams = {}) => {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.logout,
    ...mutationConfig,
    onSuccess: (data, ...args) => {
      console.log("Logout successful!");
      router.push("/login");
      mutationConfig?.onSuccess?.(data, ...args);
    },
    onError: (error, ...args) => {
      console.error("Logout failed:", error.message);
      mutationConfig?.onError?.(error, ...args);
    },
  });
};
