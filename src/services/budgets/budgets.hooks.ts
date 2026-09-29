import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  budgetsService,
  CreateBudgetPayload,
  UpdateBudgetPayload,
  BudgetMonthSummary,
  SaveBudgetChangesPayload,
} from "./budgets.service";
import { QueryConfig, MutationConfig } from "@/lib/query-client";
import { categoryKeys } from "@/services/categories/categories.hooks";

export const budgetKeys = {
  all: ["budgets"] as const,
  month: (monthYear: string) => ["budgets", monthYear] as const,
  months: () => ["budgets", "months"] as const,
};

export const getBudgetsQueryOptions = (monthYear: string) => ({
  queryKey: budgetKeys.month(monthYear),
  queryFn: () => budgetsService.getBudgets(monthYear),
});

type UseGetBudgetsParams = {
  monthYear: string;
  queryConfig?: QueryConfig<typeof getBudgetsQueryOptions>;
};

export const useGetBudgets = ({ monthYear, queryConfig }: UseGetBudgetsParams) => {
  return useQuery({
    ...getBudgetsQueryOptions(monthYear),
    ...queryConfig,
  });
};

export const getBudgetMonthsQueryOptions = () => ({
  queryKey: budgetKeys.months(),
  queryFn: () => budgetsService.getBudgetMonths(),
});

type UseGetBudgetMonthsParams = {
  queryConfig?: QueryConfig<typeof getBudgetMonthsQueryOptions>;
};

export const useGetBudgetMonths = ({ queryConfig }: UseGetBudgetMonthsParams = {}) => {
  return useQuery({
    ...getBudgetMonthsQueryOptions(),
    ...queryConfig,
  });
};

type UseCreateBudgetsParams = {
  mutationConfig?: MutationConfig<typeof budgetsService.createBudgets>;
};

export const useCreateBudgets = ({ mutationConfig }: UseCreateBudgetsParams = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...mutationConfig,
    mutationFn: (payloads: CreateBudgetPayload[]) =>
      budgetsService.createBudgets(payloads),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      // createBudgets may have created categories for custom budget names
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      mutationConfig?.onSuccess?.(...args);
    },
  });
};

type UseUpdateBudgetParams = {
  mutationConfig?: MutationConfig<
    (payload: { id: string } & UpdateBudgetPayload) => Promise<unknown>
  >;
};

export const useUpdateBudget = ({ mutationConfig }: UseUpdateBudgetParams = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...mutationConfig,
    mutationFn: ({ id, ...payload }: { id: string } & UpdateBudgetPayload) =>
      budgetsService.updateBudget(id, payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      mutationConfig?.onSuccess?.(...args);
    },
  });
};

type UseDeleteBudgetParams = {
  mutationConfig?: MutationConfig<typeof budgetsService.deleteBudget>;
};

export const useDeleteBudget = ({ mutationConfig }: UseDeleteBudgetParams = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...mutationConfig,
    mutationFn: (id: string) => budgetsService.deleteBudget(id),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      mutationConfig?.onSuccess?.(...args);
    },
  });
};

type UseSaveBudgetChangesParams = {
  mutationConfig?: MutationConfig<typeof budgetsService.saveBudgetChanges>;
};

export const useSaveBudgetChanges = ({ mutationConfig }: UseSaveBudgetChangesParams = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...mutationConfig,
    mutationFn: (payload: SaveBudgetChangesPayload) => budgetsService.saveBudgetChanges(payload),
    // Returning the promise keeps the mutation pending until fresh data is in,
    // so the drawer closes onto the updated list. Runs on error too (partial writes).
    onSettled: (...args) => {
      mutationConfig?.onSettled?.(...args);
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      return queryClient.invalidateQueries({ queryKey: budgetKeys.all });
    },
  });
};
