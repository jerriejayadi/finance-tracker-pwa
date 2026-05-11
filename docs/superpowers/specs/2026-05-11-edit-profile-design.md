# Edit Profile Feature — Design Spec

## Overview

Two new bottom-sheet drawers on the profile page:

1. **Edit Profile Drawer** — edit display name, email, and avatar
2. **Currency Picker Drawer** — select currency preference

## 1. Edit Profile Drawer

### Trigger

Edit button (pencil icon) on profile card — already rendered in `src/app/(main)/profile/page.tsx`.

### Layout (Compact — Option A)

```
┌──────────────────────────────┐
│         ── drag handle ──    │
│                              │
│  Edit Profile          Save  │
│                              │
│          ┌──────┐            │
│          │  JJ  │ ← avatar   │
│          └──────┘            │
│     Tap to change photo      │
│                              │
│  DISPLAY NAME                │
│  ┌──────────────────────┐    │
│  │ Jerrie Jayadi         │    │
│  └──────────────────────┘    │
│                              │
│  EMAIL                       │
│  ┌──────────────────────┐    │
│  │ jerrie@example.com    │    │
│  └───────── Requires ───┘    │
│             verification     │
└──────────────────────────────┘
```

- Header: "Edit Profile" title left, "Save" text button right (brand color)
- Avatar: centered, 72px circle with camera badge overlay (bottom-right)
- Below avatar: "Tap to change photo" hint text
- Fields: display_name (text input), email (text input with verification hint)

### Avatar Flow

1. **Default source**: Google SSO avatar from `auth.users.raw_user_meta_data.avatar_url`, or initials fallback
2. **Tap avatar**: opens native file picker (`accept="image/*"`, max 5MB client-side check)
3. **Preview**: `URL.createObjectURL(file)` shown immediately in avatar circle — no upload yet
4. **On Save**: upload file to Supabase Storage → get public URL → save to `profiles.avatar_url`
5. **Cancel/close drawer**: discard preview, no upload, no change

### Email Change Flow

1. User modifies email field
2. On Save: call `supabase.auth.updateUser({ email: newEmail })`
3. Supabase sends confirmation to both old and new email addresses
4. Show toast: "Check your new email to confirm the change"
5. Profile email does not change until user confirms via email link

### Save Behavior

1. Validate: `display_name` required (non-empty), `email` valid format (valibot)
2. If avatar file selected → upload to Storage → get public URL
3. Call `profileService.updateProfile({ display_name, avatar_url })` for profile fields
4. If email changed → call `supabase.auth.updateUser({ email })` separately
5. Invalidate profile query cache
6. Close drawer on success
7. Show error toast on failure

### Validation

- `display_name`: required, min 1 char, max 100 chars
- `email`: valid email format (valibot `email()`)
- Avatar file: max 5MB, image/* MIME type

## 2. Currency Picker Drawer

### Trigger

Currency settings row tap in profile page (currently shows `{code} · {symbol}`).

### Layout (Chips + List — Option B)

```
┌──────────────────────────────┐
│         ── drag handle ──    │
│                              │
│          Currency            │
│                              │
│  ┌─🔍 Search...────────────┐ │
│                              │
│  [🇮🇩 IDR ✓] [🇺🇸 USD]      │
│  [🇪🇺 EUR] [🇬🇧 GBP]        │
│  [🇸🇬 SGD] [🇯🇵 JPY]        │
│  [🇲🇾 MYR] [🇦🇺 AUD]        │
│  ─────────────────────────── │
│  🇦🇪 UAE Dirham         AED  │
│  🇦🇺 Australian Dollar  AUD  │
│  🇧🇷 Brazilian Real      BRL  │
│  · · · scrollable · · ·     │
└──────────────────────────────┘
```

- Centered title "Currency"
- Search bar: filters both chips and list simultaneously
- Popular chips: tappable pills, selected one has brand highlight + checkmark
- Divider
- Full alphabetical list: flag + name + code, scrollable

### Behavior

- Tap any currency (chip or list row) → instant select + close drawer
- No save button — selection is immediate
- Calls `profileService.updateProfile({ currency_preference: code })`
- Invalidates profile query cache
- Selected currency shows checkmark in both chip and list

## 3. Supabase Storage Setup

### Bucket: `avatars`

- **Access**: public (avatar URLs displayed in UI)
- **File size limit**: 5MB
- **Allowed MIME types**: `image/*`
- **Path convention**: `{userId}/avatar.{ext}` (overwrite on re-upload)

### RLS Policies

- SELECT: public (anyone can view avatar images)
- INSERT/UPDATE: authenticated user can only write to own folder (`auth.uid()::text = (storage.foldername(name))[1]`)
- DELETE: authenticated user can only delete own files

## 4. New Files

| File | Purpose |
|------|---------|
| `src/components/profile/edit-profile-drawer.tsx` | Edit profile drawer component |
| `src/components/profile/currency-picker-drawer.tsx` | Currency picker drawer component |
| `src/lib/currencies.ts` | Currency data: code, name, symbol, flag emoji |

## 5. Modified Files

| File | Changes |
|------|---------|
| `src/app/(main)/profile/page.tsx` | Wire edit button to open drawer, wire currency row to open picker |
| `src/services/profile/profile.service.ts` | Add `uploadAvatar(file)` method |
| `src/services/profile/profile.hooks.ts` | Add `useUploadAvatar` mutation hook (if needed) |
| Supabase migration | Create `avatars` storage bucket + RLS policies |

## 6. Form Handling

- `react-hook-form` for edit profile drawer form state
- `valibot` schema for validation
- Existing `useUpdateProfile` hook for profile mutations
- `supabase.auth.updateUser` for email changes (called directly, not via service layer)

## 7. Edge Cases

- **No avatar**: show initials (current behavior)
- **Google avatar deleted upstream**: fallback to initials if URL returns 404
- **Email change pending**: show current email, toast explains confirmation needed
- **Large file selected**: reject client-side before upload attempt, show error
- **Network failure on save**: show error toast, keep drawer open with form state intact
- **Concurrent edits**: last-write-wins (acceptable for single-user profile)
