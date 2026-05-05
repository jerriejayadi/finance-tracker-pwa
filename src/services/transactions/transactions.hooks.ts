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
