---
name: nextjs-tanstack-axios
description: 'Scaffolds Next.js API data fetching and mutations using Axios and TanStack Query best practices. Use when the user asks to create an API endpoint, fetch data, create a mutation hook, refactor useQuery, or build a data fetching service.'
---

# Goal

Ensure all Next.js API data fetching strictly adheres to a clean, DRY architecture using Axios and TanStack Query. Prevent the use of raw `useQuery` or `useMutation` inside UI components.

# Technical Blueprint & Instructions

When asked to create or refactor data fetching logic, follow these steps exactly:

## Step 1: Define the Axios Fetcher

Create a dedicated file for the API call (e.g., `api/todos.ts`). Define the expected request/response types and the Axios function.

## Step 2: Create Query Key Factories (No Magic Strings)

Never hardcode query key strings. Export a dedicated query key generator function.

```typescript
export const getTodoDetailQueryKey = (todoId: string) => ["todo", todoId];
```

## Step 3: Use Type-Safe Configuration Helpers

Rely on global TypeScript helpers (`QueryConfig` and `MutationConfig` from bulletproof-react style architectures) to infer parameters and responses from the underlying Axios function.

## Step 4: Abstract Queries into Custom Hooks

Extract the `queryOptions` and the `useQuery` implementation into a dedicated custom hook.

```typescript
export const getTodoDetailQueryOptions = (todoId: string) => ({
  queryKey: getTodoDetailQueryKey(todoId),
  queryFn: () => getTodoDetail(todoId),
});

type UseGetTodoDetailParams = {
  todoId: string;
  queryConfig?: QueryConfig<typeof getTodoDetailQueryOptions>;
};

export const useGetTodoDetail = ({
  todoId,
  queryConfig,
}: UseGetTodoDetailParams) => {
  return useQuery({
    ...getTodoDetailQueryOptions(todoId),
    ...queryConfig,
  });
};
```

## Step 5: Automate Cache Invalidation for Mutations

All mutation hooks must have a default `onSuccess` behavior that automatically invalidates the relevant query key. Allow components to pass optional `mutationConfig` to trigger additional side-effects (e.g., toasts) without breaking this default invalidation.

```typescript
type UseCreateTodoParams = {
  mutationConfig?: MutationConfig<typeof createTodo>;
};

export const useCreateTodo = ({ mutationConfig }: UseCreateTodoParams = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTodo,
    onSuccess: (...args) => {
      // Default Behavior: Synchronize data
      queryClient.invalidateQueries({ queryKey: getTodoQueryKey() });

      // Extensibility: Trigger component-level side effects
      if (mutationConfig?.onSuccess) {
        mutationConfig.onSuccess(...args);
      }
    },
    ...mutationConfig,
  });
};
```

# Constraints

- DO NOT place `useQuery` or `useMutation` directly inside `.tsx` UI components. UI components must only call the custom hooks (e.g., `const { data } = useGetTodoDetail({ todoId })`).
- DO NOT use raw string arrays for query keys in components or invalidation logic; always use the exported Query Key Factory functions.

