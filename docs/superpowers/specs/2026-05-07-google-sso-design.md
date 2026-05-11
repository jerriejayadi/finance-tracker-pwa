# Google SSO Integration — Design Spec

## Overview

Add Google Sign-In to the login page using Supabase OAuth with PKCE flow. New users without a profile are redirected to the profile setup step; existing users go straight to the dashboard.

## Decisions

- **Account linking**: Automatic — same email = same account (Supabase default)
- **Password for SSO users**: None set initially. Users can add one later via password reset.
- **Callback route**: `/api/auth/callback` (server-side code exchange)
- **New user flow**: SSO → callback → profile setup (reuse register step 3)
- **Existing user flow**: SSO → callback → dashboard

## Flow

```
Login page → "Google" button → signInWithOAuth({ provider: 'google' })
  → Google consent screen
  → Redirect to /api/auth/callback?code=...
  → Server exchanges code for session
  → Check profiles table for user
    → Has profile → redirect to /
    → No profile → redirect to /register?step=profile
```

## Changes

### 1. Auth Service (`src/services/auth/auth.service.ts`)

Add static method:

```ts
static async signInWithGoogle() {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback`,
    },
  });
  if (error) throw error;
}
```

### 2. Auth Hooks (`src/services/auth/auth.hooks.ts`)

Add mutation hook `useGoogleSignInMutation` that calls `AuthService.signInWithGoogle()`. No `onSuccess` redirect needed — OAuth redirects via browser.

### 3. Callback Route (`src/app/api/auth/callback/route.ts`) — NEW

GET handler:

1. Extract `code` from `request.nextUrl.searchParams`
2. Create server Supabase client
3. Call `supabase.auth.exchangeCodeForSession(code)`
4. Query `profiles` table for current user
5. If profile exists → redirect to `/`
6. If no profile → redirect to `/register?step=profile`
7. If no code or error → redirect to `/login`

### 4. Login Page (`src/app/(auth)/login/page.tsx`)

Convert Google button to call `useGoogleSignInMutation`. Keep Apple button as UI stub.

Since hooks require client component, the Google button needs to be extracted or the social auth section needs to be a client component. Options:
- Extract `<SocialAuthButtons />` client component in the login directory
- Or add onClick to existing button in `login-form.tsx` and move social buttons there

**Decision**: Move social auth buttons into `login-form.tsx` (already a client component) below the form.

### 5. Register Form (`src/app/(auth)/register/register-form.tsx`)

Support direct entry at profile step:
- Read `step` from URL search params
- If `step=profile`, initialize at PROFILE step, skip CREDENTIALS and VERIFY_OTP
- Hide back button on profile step when entered via SSO (no previous step to go back to)

### 6. Supabase Configuration

In Supabase dashboard (or local config):
- Enable Google provider
- Set Google Client ID and Client Secret (from Google Cloud Console)
- Add authorized redirect URI: `{app_url}/api/auth/callback`

## Out of Scope

- Apple SSO (same pattern, wire later)
- "This account uses Google sign-in" error on email/password attempt
- Password backup option in profile/settings
- Manual account linking UI
