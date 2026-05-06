import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  budgetsService,
  CreateBudgetPayload,
  UpdateBudgetPayload,
} from "./budgets.service";
import { QueryConfig, MutationConfig } from "@/lib/query-client";

export const budgetKeys = {
  all: ["budgets"] as const,
  month: (monthYear: string) => ["budgets", monthYear] as const,
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
