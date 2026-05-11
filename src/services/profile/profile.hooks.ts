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

type UseUploadAvatarParams = {
  mutationConfig?: MutationConfig<typeof profileService.uploadAvatar>;
};

export const useUploadAvatar = ({
  mutationConfig,
}: UseUploadAvatarParams = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => profileService.uploadAvatar(file),
    onSuccess: (...args) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
      mutationConfig?.onSuccess?.(...args);
    },
    ...mutationConfig,
  });
};

type UseUpdateEmailParams = {
  mutationConfig?: MutationConfig<typeof profileService.updateEmail>;
};

export const useUpdateEmail = ({
  mutationConfig,
}: UseUpdateEmailParams = {}) => {
  return useMutation({
    mutationFn: (email: string) => profileService.updateEmail(email),
    ...mutationConfig,
  });
};
