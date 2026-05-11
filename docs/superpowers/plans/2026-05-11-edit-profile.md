# Edit Profile Feature — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add edit profile drawer (display name, email, avatar upload) and currency picker drawer to the profile page.

**Architecture:** Two vaul bottom-sheet drawers triggered from existing profile page UI. Avatar uploads go to Supabase Storage. Email changes go through Supabase Auth. Currency selection is instant (no save button). Form state managed with react-hook-form + valibot.

**Tech Stack:** Next.js 16, React 19, Supabase (Auth + Storage), TanStack Query, vaul, react-hook-form, valibot, lucide-react

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/lib/currencies.ts` | Create | Currency data array (code, name, symbol, flag) |
| `src/services/profile/profile.service.ts` | Modify | Add `uploadAvatar` and `updateEmail` methods |
| `src/services/profile/profile.hooks.ts` | Modify | Add `useUploadAvatar` and `useUpdateEmail` hooks |
| `src/components/profile/edit-profile-drawer.tsx` | Create | Edit profile drawer with avatar, name, email |
| `src/components/profile/currency-picker-drawer.tsx` | Create | Currency picker with chips + searchable list |
| `src/app/(main)/profile/page.tsx` | Modify | Wire edit button and currency row to open drawers |
| `supabase/migrations/*_create_avatars_bucket.sql` | Create | Storage bucket + RLS policies |
| `src/components/ui/avatar.tsx` | Modify | Support image `src` prop for avatar URLs |

---

### Task 1: Install sonner for toast notifications

The spec requires toast feedback for email changes and errors. No toast library exists in the project.

**Files:**
- Modify: `package.json`
- Create: `src/components/ui/sonner.tsx`
- Modify: `src/app/(main)/layout.tsx`

- [ ] **Step 1: Install sonner**

```bash
npm install sonner
```

- [ ] **Step 2: Create Toaster wrapper component**

Create `src/components/ui/sonner.tsx`:

```tsx
"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      toastOptions={{
        className:
          "!bg-bg-1 !border !border-line !text-fg-0 !text-[13px] !font-sans !shadow-md",
      }}
    />
  );
}
```

- [ ] **Step 3: Add Toaster to main layout**

Read `src/app/(main)/layout.tsx` and add `<Toaster />` inside the layout's JSX, after the existing children. Import from `@/components/ui/sonner`.

- [ ] **Step 4: Verify dev server starts**

```bash
npm run dev
```

Open profile page, confirm no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/sonner.tsx src/app/\(main\)/layout.tsx package.json package-lock.json
git commit -m "feat: add sonner toast component"
```

---

### Task 2: Currency data file

**Files:**
- Create: `src/lib/currencies.ts`

- [ ] **Step 1: Create currency data**

Create `src/lib/currencies.ts`:

```ts
export type Currency = {
  code: string;
  name: string;
  symbol: string;
  flag: string;
};

export const POPULAR_CURRENCIES: Currency[] = [
  { code: "IDR", name: "Indonesian Rupiah", symbol: "Rp", flag: "🇮🇩" },
  { code: "USD", name: "US Dollar", symbol: "$", flag: "🇺🇸" },
  { code: "EUR", name: "Euro", symbol: "€", flag: "🇪🇺" },
  { code: "GBP", name: "British Pound", symbol: "£", flag: "🇬🇧" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", flag: "🇸🇬" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", flag: "🇯🇵" },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", flag: "🇲🇾" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$", flag: "🇦🇺" },
];

export const ALL_CURRENCIES: Currency[] = [
  ...POPULAR_CURRENCIES,
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", flag: "🇦🇪" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$", flag: "🇧🇷" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$", flag: "🇨🇦" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF", flag: "🇨🇭" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", flag: "🇨🇳" },
  { code: "DKK", name: "Danish Krone", symbol: "kr", flag: "🇩🇰" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$", flag: "🇭🇰" },
  { code: "INR", name: "Indian Rupee", symbol: "₹", flag: "🇮🇳" },
  { code: "KRW", name: "South Korean Won", symbol: "₩", flag: "🇰🇷" },
  { code: "MXN", name: "Mexican Peso", symbol: "$", flag: "🇲🇽" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr", flag: "🇳🇴" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$", flag: "🇳🇿" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱", flag: "🇵🇭" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł", flag: "🇵🇱" },
  { code: "SAR", name: "Saudi Riyal", symbol: "﷼", flag: "🇸🇦" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr", flag: "🇸🇪" },
  { code: "THB", name: "Thai Baht", symbol: "฿", flag: "🇹🇭" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺", flag: "🇹🇷" },
  { code: "TWD", name: "Taiwan Dollar", symbol: "NT$", flag: "🇹🇼" },
  { code: "VND", name: "Vietnamese Dong", symbol: "₫", flag: "🇻🇳" },
  { code: "ZAR", name: "South African Rand", symbol: "R", flag: "🇿🇦" },
].sort((a, b) => a.code.localeCompare(b.code));

const popularCodes = new Set(POPULAR_CURRENCIES.map((c) => c.code));

export function searchCurrencies(query: string): {
  popular: Currency[];
  all: Currency[];
} {
  const q = query.toLowerCase().trim();
  if (!q) return { popular: POPULAR_CURRENCIES, all: ALL_CURRENCIES };

  const match = (c: Currency) =>
    c.code.toLowerCase().includes(q) ||
    c.name.toLowerCase().includes(q) ||
    c.symbol.toLowerCase().includes(q);

  const filtered = ALL_CURRENCIES.filter(match);
  return {
    popular: filtered.filter((c) => popularCodes.has(c.code)),
    all: filtered,
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/currencies.ts
git commit -m "feat: add currency data with search"
```

---

### Task 3: Supabase Storage migration for avatars

**Files:**
- Create: `supabase/migrations/<timestamp>_create_avatars_bucket.sql`

- [ ] **Step 1: Create migration file**

Generate timestamp and create migration. The file should be named with current timestamp, e.g. `20260511000000_create_avatars_bucket.sql`:

```sql
-- Create avatars storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to avatars
CREATE POLICY "Public avatar read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to update their own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow authenticated users to delete their own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

- [ ] **Step 2: Apply migration locally**

```bash
npx supabase db reset
```

Or if you prefer not to reset:

```bash
npx supabase migration up
```

- [ ] **Step 3: Verify bucket exists**

Open Supabase Studio at `http://127.0.0.1:54321` → Storage → confirm `avatars` bucket exists.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/
git commit -m "feat: create avatars storage bucket with RLS"
```

---

### Task 4: Profile service — add uploadAvatar and updateEmail

**Files:**
- Modify: `src/services/profile/profile.service.ts`
- Modify: `src/services/profile/profile.hooks.ts`

- [ ] **Step 1: Add uploadAvatar and updateEmail to profile service**

Add these methods to the `profileService` object in `src/services/profile/profile.service.ts`:

```ts
uploadAvatar: async (file: File): Promise<string> => {
  const { data: authData, error: authError } =
    await supabase.auth.getUser();

  if (authError || !authData.user) {
    throw new Error(authError?.message ?? "Not authenticated");
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${authData.user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: urlData } = supabase.storage
    .from("avatars")
    .getPublicUrl(path);

  // Append cache-bust param so browser refetches after update
  return `${urlData.publicUrl}?t=${Date.now()}`;
},

updateEmail: async (newEmail: string): Promise<void> => {
  const { error } = await supabase.auth.updateUser({ email: newEmail });
  if (error) {
    throw new Error(error.message);
  }
},
```

- [ ] **Step 2: Add hooks for uploadAvatar and updateEmail**

Add to `src/services/profile/profile.hooks.ts`:

```ts
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
```

Also add import for `profileService` if `uploadAvatar` / `updateEmail` aren't already imported (they should be since `profileService` is already imported as the object).

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Should compile without errors.

- [ ] **Step 4: Commit**

```bash
git add src/services/profile/
git commit -m "feat: add uploadAvatar and updateEmail to profile service"
```

---

### Task 5: Update Avatar component to support image src

**Files:**
- Modify: `src/components/ui/avatar.tsx`

- [ ] **Step 1: Add src prop to Avatar**

In `src/components/ui/avatar.tsx`, update the `AvatarProps` interface and component to accept an optional `src` prop. When `src` is provided, render an `<img>` instead of the children (initials):

```tsx
import * as React from "react";
import { cn } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "brand";
  src?: string | null;
}

const sizeClasses = {
  sm: "w-9 h-9 text-[13px] rounded-full",
  md: "w-9 h-9 text-[13px] rounded-full",
  lg: "w-14 h-14 text-[19px] rounded-2xl",
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size = "md", variant = "default", src, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center font-semibold flex-shrink-0 overflow-hidden",
          sizeClasses[size],
          variant === "brand"
            ? "bg-brand text-brand-ink"
            : "bg-bg-2 border border-line text-fg-1",
          className
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          children
        )}
      </div>
    );
  }
);
Avatar.displayName = "Avatar";

export { Avatar };
```

Note: `referrerPolicy="no-referrer"` is needed for Google SSO avatar URLs which block referrer-based requests.

- [ ] **Step 2: Verify existing avatar usage still works**

```bash
npm run dev
```

Open profile page, confirm initials avatar still renders correctly.

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/avatar.tsx
git commit -m "feat: add src prop to Avatar for image support"
```

---

### Task 6: Edit Profile Drawer component

**Files:**
- Create: `src/components/profile/edit-profile-drawer.tsx`

- [ ] **Step 1: Create edit-profile-drawer.tsx**

Create `src/components/profile/edit-profile-drawer.tsx`:

```tsx
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
```

- [ ] **Step 2: Verify it compiles**

```bash
npm run build
```

Should compile without errors (component not mounted yet, just checking types).

- [ ] **Step 3: Commit**

```bash
git add src/components/profile/edit-profile-drawer.tsx
git commit -m "feat: create EditProfileDrawer component"
```

---

### Task 7: Currency Picker Drawer component

**Files:**
- Create: `src/components/profile/currency-picker-drawer.tsx`

- [ ] **Step 1: Create currency-picker-drawer.tsx**

Create `src/components/profile/currency-picker-drawer.tsx`:

```tsx
"use client";

import * as React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  POPULAR_CURRENCIES,
  searchCurrencies,
  type Currency,
} from "@/lib/currencies";
import { useUpdateProfile } from "@/services/profile/profile.hooks";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface CurrencyPickerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentCurrency: string;
}

export function CurrencyPickerDrawer({
  open,
  onOpenChange,
  currentCurrency,
}: CurrencyPickerDrawerProps) {
  const [query, setQuery] = React.useState("");
  const updateProfile = useUpdateProfile();

  const { popular, all } = searchCurrencies(query);

  const handleSelect = (code: string) => {
    updateProfile.mutate(
      { currency_preference: code },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  // Reset search when drawer closes
  React.useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-0">
          <DrawerTitle className="text-center">Currency</DrawerTitle>
          <DrawerDescription className="sr-only">
            Select your preferred currency
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 px-5 pb-8 pt-4">
          {/* Search */}
          <Input
            type="text"
            placeholder="Search currencies..."
            icon={<Search size={16} />}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="!h-11"
          />

          {/* Popular chips */}
          {popular.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {popular.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => handleSelect(c.code)}
                  disabled={updateProfile.isPending}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors cursor-pointer",
                    currentCurrency === c.code
                      ? "border-brand/30 bg-brand-soft text-brand"
                      : "border-line bg-bg-1 text-fg-0 hover:bg-bg-2"
                  )}
                >
                  <span>{c.flag}</span>
                  <span>{c.code}</span>
                  {currentCurrency === c.code && (
                    <Check size={12} strokeWidth={2.5} />
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Divider */}
          <div className="h-px bg-line" />

          {/* Full list */}
          <div className="flex flex-col overflow-y-auto max-h-[40vh] -mx-5">
            {all.length === 0 ? (
              <div className="py-8 text-center text-[13px] text-fg-2">
                No currencies found
              </div>
            ) : (
              all.map((c) => (
                <CurrencyRow
                  key={c.code}
                  currency={c}
                  selected={currentCurrency === c.code}
                  onSelect={handleSelect}
                  disabled={updateProfile.isPending}
                />
              ))
            )}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function CurrencyRow({
  currency,
  selected,
  onSelect,
  disabled,
}: {
  currency: Currency;
  selected: boolean;
  onSelect: (code: string) => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(currency.code)}
      disabled={disabled}
      className={cn(
        "flex items-center gap-3 px-5 py-3 transition-colors cursor-pointer",
        selected ? "bg-brand-soft" : "hover:bg-bg-1"
      )}
    >
      <span className="text-[18px]">{currency.flag}</span>
      <div className="flex-1 text-left">
        <div className="text-[14px] font-medium text-fg-0">
          {currency.name}
        </div>
        <div className="text-[12px] font-mono text-fg-2">
          {currency.code} · {currency.symbol}
        </div>
      </div>
      {selected && (
        <Check size={16} strokeWidth={2.5} className="text-brand" />
      )}
    </button>
  );
}
```

- [ ] **Step 2: Verify it compiles**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/components/profile/currency-picker-drawer.tsx
git commit -m "feat: create CurrencyPickerDrawer component"
```

---

### Task 8: Wire drawers into profile page

**Files:**
- Modify: `src/app/(main)/profile/page.tsx`

- [ ] **Step 1: Add drawer state and imports**

In `src/app/(main)/profile/page.tsx`, add imports for the two drawers and state to control them.

Add imports at top:

```tsx
import { EditProfileDrawer } from "@/components/profile/edit-profile-drawer";
import { CurrencyPickerDrawer } from "@/components/profile/currency-picker-drawer";
```

Add state inside `ProfilePage` component (after existing state declarations):

```tsx
const [editOpen, setEditOpen] = React.useState(false);
const [currencyOpen, setCurrencyOpen] = React.useState(false);
```

- [ ] **Step 2: Wire edit button to open drawer**

Find the edit button in the profile card (the `<button>` with `<Edit size={16} ...>`). Add `onClick`:

```tsx
<button
  onClick={() => setEditOpen(true)}
  className="bg-bg-2 border-line text-fg-1 hover:bg-bg-3 relative z-[1] flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors"
>
  <Edit size={16} strokeWidth={1.75} />
</button>
```

- [ ] **Step 3: Update Avatar in profile card to show image**

Update the `<Avatar>` in the profile card to pass the `src` prop:

```tsx
<Avatar size="lg" variant="brand" src={profile?.avatar_url} className="relative z-[1]">
  {initials}
</Avatar>
```

- [ ] **Step 4: Wire currency row to open picker**

Find the `<SettingsRow>` for Currency and add `onClick`:

```tsx
<SettingsRow
  icon={<Globe size={16} strokeWidth={1.75} />}
  label="Currency"
  value={`${currencyCode} · ${currencySymbol}`}
  onClick={() => setCurrencyOpen(true)}
/>
```

- [ ] **Step 5: Render drawers at bottom of component JSX**

Add before the closing `</div>` of the return statement:

```tsx
<EditProfileDrawer open={editOpen} onOpenChange={setEditOpen} />
<CurrencyPickerDrawer
  open={currencyOpen}
  onOpenChange={setCurrencyOpen}
  currentCurrency={currencyCode}
/>
```

- [ ] **Step 6: Test manually**

```bash
npm run dev
```

1. Open profile page
2. Tap edit button → edit profile drawer opens with current name/email/avatar
3. Change display name → tap Save → drawer closes, name updates
4. Tap avatar → file picker opens → select image → preview shows → Save → avatar updates
5. Tap currency row → currency picker opens → search works → tap currency → drawer closes, currency updates

- [ ] **Step 7: Verify build**

```bash
npm run build
```

- [ ] **Step 8: Commit**

```bash
git add src/app/\(main\)/profile/page.tsx
git commit -m "feat: wire edit profile and currency picker drawers"
```

---

### Task 9: Verify SettingsRow supports onClick

**Files:**
- Read: `src/components/ui/settings-group.tsx`

- [ ] **Step 1: Check SettingsRow component**

Read `src/components/ui/settings-group.tsx` and verify `onClick` prop is supported. If `SettingsRow` wraps content in a `<div>` without `onClick`, update it to accept and forward `onClick`. If it already supports `onClick` (it likely does since notifications/budget alerts use it), no changes needed.

- [ ] **Step 2: Fix if needed**

If `onClick` is not supported, add it to the props interface and forward it to the wrapper element. This step may be a no-op.

- [ ] **Step 3: Commit if changed**

```bash
git add src/components/ui/settings-group.tsx
git commit -m "fix: ensure SettingsRow supports onClick"
```

---

### Task 10: Final integration test

- [ ] **Step 1: Full manual test pass**

```bash
npm run dev
```

Test these flows end-to-end:

1. **Edit name**: Open drawer → change name → Save → verify name updates on profile card
2. **Upload avatar**: Open drawer → tap avatar → select image → see preview → Save → verify avatar shows on profile card and persists on reload
3. **Change email**: Open drawer → change email → Save → verify toast appears saying "Check your new email to confirm the change"
4. **Cancel edit**: Open drawer → make changes → close drawer by swiping down → reopen → verify original values restored
5. **Currency picker**: Tap currency row → search "dollar" → verify chips and list filter → tap USD → verify drawer closes and currency updates
6. **Avatar with Google SSO**: If Google SSO user, verify Google avatar appears by default in profile card

- [ ] **Step 2: Build check**

```bash
npm run build
```

- [ ] **Step 3: Lint check**

```bash
npm run lint
```

- [ ] **Step 4: Fix any issues found**

Address lint errors or build failures.

- [ ] **Step 5: Final commit if any fixes**

```bash
git add -A
git commit -m "fix: address lint and build issues from edit profile feature"
```
