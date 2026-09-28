import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importService, ImportTransactionsPayload } from "./import.service";
import { MutationConfig } from "@/lib/query-client";
import { accountKeys } from "@/services/accounts/accounts.hooks";
import { budgetKeys } from "@/services/budgets/budgets.hooks";
import { categoryKeys } from "@/services/categories/categories.hooks";
import { transactionKeys } from "@/services/transactions/transactions.hooks";

type UseImportTransactionsParams = {
  mutationConfig?: MutationConfig<typeof importService.importTransactions>;
};

export const useImportTransactions = ({
  mutationConfig,
}: UseImportTransactionsParams = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...mutationConfig,
    mutationFn: (payload: ImportTransactionsPayload) =>
      importService.importTransactions(payload),
    // Invalidate on error too — a failure can leave accounts/categories/chunks partially written
    onSettled: (...args) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all });
      queryClient.invalidateQueries({ queryKey: accountKeys.all });
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      queryClient.invalidateQueries({ queryKey: budgetKeys.all });
      mutationConfig?.onSettled?.(...args);
    },
  });
};
