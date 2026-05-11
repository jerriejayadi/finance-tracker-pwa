"use client";

import * as React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGetProfile } from "@/services/profile/profile.hooks";
import {
  useUpdateProfile,
  useUploadAvatar,
  useUpdateEmail,
} from "@/services/profile/profile.hooks";
import { Camera } from "lucide-react";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
import * as v from "valibot";
import { toast } from "sonner";

const EditProfileSchema = v.object({
  displayName: v.pipe(
    v.string(),
    v.nonEmpty("Display name is required."),
    v.maxLength(100, "Display name is too long.")
  ),
  email: v.pipe(
    v.string(),
    v.nonEmpty("Email is required."),
    v.email("Invalid email address.")
  ),
});

type EditProfileValues = v.InferOutput<typeof EditProfileSchema>;

interface EditProfileDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProfileDrawer({
  open,
  onOpenChange,
}: EditProfileDrawerProps) {
  const { data: profile } = useGetProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const updateEmail = useUpdateEmail();

  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditProfileValues>({
    resolver: valibotResolver(EditProfileSchema),
    values: {
      displayName: profile?.display_name ?? "",
      email: profile?.email ?? "",
    },
  });

  // Clean up blob URL on unmount or when file changes
  React.useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }

    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      // Discard unsaved changes
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarFile(null);
      setAvatarPreview(null);
      reset();
    }
    onOpenChange(isOpen);
  };

  const isPending =
    updateProfile.isPending ||
    uploadAvatar.isPending ||
    updateEmail.isPending;

  const currentAvatarUrl =
    profile?.avatar_url || null;

  const displayInitials = profile?.display_name
    ? profile.display_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "";

  const onSubmit = async (data: EditProfileValues) => {
    try {
      let newAvatarUrl: string | undefined;

      // Upload avatar if changed
      if (avatarFile) {
        newAvatarUrl = await uploadAvatar.mutateAsync(avatarFile);
      }

      // Update profile fields
      await updateProfile.mutateAsync({
        display_name: data.displayName,
        ...(newAvatarUrl ? { avatar_url: newAvatarUrl } : {}),
      });

      // Update email if changed
      if (data.email !== profile?.email) {
        await updateEmail.mutateAsync(data.email);
        toast.success("Check your new email to confirm the change");
      }

      // Clean up and close
      setAvatarFile(null);
      setAvatarPreview(null);
      onOpenChange(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile"
      );
    }
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent>
        <DrawerHeader className="flex flex-row items-center justify-between px-5 pb-0">
          <DrawerTitle>Edit Profile</DrawerTitle>
          <DrawerDescription className="sr-only">
            Update your display name, email, and avatar
          </DrawerDescription>
          <button
            type="button"
            onClick={handleSubmit(onSubmit)}
            disabled={isPending}
            className="text-[13px] font-medium text-brand hover:text-brand-hi disabled:opacity-50 cursor-pointer"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        </DrawerHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5 px-5 pb-8 pt-4"
        >
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <button
              type="button"
              className="relative cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Avatar
                size="lg"
                variant="brand"
                src={avatarPreview ?? currentAvatarUrl}
                className="!h-[72px] !w-[72px] !rounded-full !text-[22px]"
              >
                {displayInitials}
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 flex h-6 w-6 items-center justify-center rounded-full border-2 border-bg-0 bg-bg-2">
                <Camera size={12} strokeWidth={1.75} className="text-brand" />
              </div>
            </button>
            <span className="text-[12px] text-fg-2">Tap to change photo</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarSelect}
            />
          </div>

          {/* Display Name */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-display-name">Display Name</Label>
            <Input
              id="edit-display-name"
              type="text"
              placeholder="Your name"
              {...register("displayName")}
            />
            {errors.displayName && (
              <p className="text-[13px] text-neg px-1">
                {errors.displayName.message}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="edit-email">Email</Label>
            <Input
              id="edit-email"
              type="email"
              placeholder="your@email.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-[13px] text-neg px-1">
                {errors.email.message}
              </p>
            )}
            <p className="text-[11px] text-fg-2 px-1">
              Changing email requires verification
            </p>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
