import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileService, UpdateProfilePayload } from "./profile.service";
import { QueryConfig, MutationConfig } from "@/lib/query-client";

export const profileKeys = {
  all: ["profile"] as const,
};

export const getProfileQueryOptions = () => ({
  queryKey: profileKeys.all,
  queryFn: profileService.getProfile,
});

type UseGetProfileParams = {
  queryConfig?: QueryConfig<typeof getProfileQueryOptions>;
};

export const useGetProfile = ({ queryConfig }: UseGetProfileParams = {}) => {
  return useQuery({
    ...getProfileQueryOptions(),
    ...queryConfig,
  });
};

type UseUpdateProfileParams = {
  mutationConfig?: MutationConfig<typeof profileService.updateProfile>;
};

export const useUpdateProfile = ({
  mutationConfig,
}: UseUpdateProfileParams = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      profileService.updateProfile(payload),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      mutationConfig?.onSuccess?.(...args);
    },
    ...mutationConfig,
  });
};
