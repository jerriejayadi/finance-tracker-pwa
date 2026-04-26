import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { authService } from "./auth.service";
import { MutationConfig } from "@/lib/query-client";

type UseLoginParams = {
  mutationConfig?: MutationConfig<typeof authService.login>;
};

export const useLoginMutation = ({ mutationConfig }: UseLoginParams = {}) => {
  const router = useRouter();

  return useMutation({
    mutationFn: authService.login,
    ...mutationConfig,
    onSuccess: (data, ...args) => {
      console.log("Login successful! User ID:", data.user?.id);
      router.push("/");
      mutationConfig?.onSuccess?.(data, ...args);
    },
    onError: (error, ...args) => {
      console.error("Login failed:", error.message);
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


