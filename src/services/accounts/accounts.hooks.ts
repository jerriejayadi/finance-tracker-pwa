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
    ...mutationConfig,
    mutationFn: (payload: CreateAccountPayload) =>
      accountsService.createAccount(payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.balances });
      mutationConfig?.onSuccess?.(...args);
    },
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
    ...mutationConfig,
    mutationFn: ({ id, ...payload }: { id: string } & UpdateAccountPayload) =>
      accountsService.updateAccount(id, payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.balances });
      mutationConfig?.onSuccess?.(...args);
    },
  });
};

type UseDeleteAccountParams = {
  mutationConfig?: MutationConfig<typeof accountsService.deleteAccount>;
};

export const useDeleteAccount = ({ mutationConfig }: UseDeleteAccountParams = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...mutationConfig,
    mutationFn: (id: string) => accountsService.deleteAccount(id),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.balances });
      mutationConfig?.onSuccess?.(...args);
    },
  });
};
