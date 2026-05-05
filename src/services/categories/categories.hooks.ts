import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { categoriesService, CreateCategoryPayload } from "./categories.service";
import { QueryConfig, MutationConfig } from "@/lib/query-client";

export const categoryKeys = {
  all: ["categories"] as const,
};

export const getCategoriesQueryOptions = () => ({
  queryKey: categoryKeys.all,
  queryFn: categoriesService.getCategories,
});

type UseGetCategoriesParams = {
  queryConfig?: QueryConfig<typeof getCategoriesQueryOptions>;
};

export const useGetCategories = ({ queryConfig }: UseGetCategoriesParams = {}) => {
  return useQuery({
    ...getCategoriesQueryOptions(),
    ...queryConfig,
  });
};

type UseCreateCategoryParams = {
  mutationConfig?: MutationConfig<typeof categoriesService.createCategory>;
};

export const useCreateCategory = ({ mutationConfig }: UseCreateCategoryParams = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) =>
      categoriesService.createCategory(payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      mutationConfig?.onSuccess?.(...args);
    },
    ...mutationConfig,
  });
};
