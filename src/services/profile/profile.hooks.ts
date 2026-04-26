import { useMutation, useQuery } from "@tanstack/react-query";
import { profileService } from "./profile.service";

export const useGetProfile = () => {
  return useQuery({
    queryKey: ["profile"],
    queryFn: profileService.getProfile,
  });
};

