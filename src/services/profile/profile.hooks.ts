import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { profileService, UpdateProfilePayload } from "./profile.service";

export const profileKeys = {
  all: ["profile"] as const,
};

export const useGetProfile = () => {
  return useQuery({
    queryKey: profileKeys.all,
    queryFn: profileService.getProfile,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      profileService.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
};
