# Google SSO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google Sign-In to login page using Supabase OAuth, routing new users to profile setup and existing users to dashboard.

**Architecture:** Supabase PKCE OAuth flow with server-side code exchange via `/api/auth/callback`. Callback checks `profiles` table to determine redirect target. Middleware updated to allow authenticated users without profiles to access `/register?step=profile`.

**Tech Stack:** Supabase Auth (OAuth), Next.js Route Handler, TanStack Query

---

### Task 1: Add `signInWithGoogle` to Auth Service

**Files:**
- Modify: `src/services/auth/auth.service.ts`

- [ ] **Step 1: Add signInWithGoogle method**

Add to the `authService` object after the existing `login` method:

```ts
signInWithGoogle: async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/api/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }
},
```

- [ ] **Step 2: Commit**

```bash
git add src/services/auth/auth.service.ts
git commit -m "feat(auth): add signInWithGoogle service method"
```

---

### Task 2: Add `useGoogleSignInMutation` Hook

**Files:**
- Modify: `src/services/auth/auth.hooks.ts`

- [ ] **Step 1: Add mutation hook**

Add after the existing `useLoginMutation`:

```ts
type UseGoogleSignInParams = {
  mutationConfig?: MutationConfig<typeof authService.signInWithGoogle>;
};

export const useGoogleSignInMutation = ({
  mutationConfig,
}: UseGoogleSignInParams = {}) => {
  return useMutation({
    mutationFn: authService.signInWithGoogle,
    ...mutationConfig,
    onError: (error, ...args) => {
      console.error("Google sign-in failed:", error.message);
      mutationConfig?.onError?.(error, ...args);
    },
  });
};
```

No `onSuccess` redirect — OAuth flow redirects via browser navigation.

- [ ] **Step 2: Commit**

```bash
git add src/services/auth/auth.hooks.ts
git commit -m "feat(auth): add useGoogleSignInMutation hook"
```

---

### Task 3: Create OAuth Callback Route

**Files:**
- Create: `src/app/api/auth/callback/route.ts`

- [ ] **Step 1: Create the callback route handler**

```ts
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("OAuth callback error:", error.message);
    return NextResponse.redirect(new URL("/login", origin));
  }

  // Check if user has a profile
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (profile) {
    // Existing user with profile → dashboard
    return NextResponse.redirect(new URL("/", origin));
  }

  // New user, no profile → profile setup
  return NextResponse.redirect(new URL("/register?step=profile", origin));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/auth/callback/route.ts
git commit -m "feat(auth): add OAuth callback route with profile check"
```

---

### Task 4: Update Middleware to Allow Profile Setup for Authenticated Users

**Files:**
- Modify: `src/middleware.ts`

The current middleware redirects ALL authenticated users away from auth pages (including `/register`). SSO users who need profile setup must access `/register?step=profile` while authenticated.

- [ ] **Step 1: Update redirect logic**

Change the authenticated user redirect block (line 36-38) from:

```ts
if (user && isAuthPage) {
  return NextResponse.redirect(new URL("/", request.url));
}
```

To:

```ts
if (user && isAuthPage) {
  // Allow authenticated users to access profile setup (SSO users need this)
  const isProfileSetup =
    nextUrl.pathname === "/register" &&
    nextUrl.searchParams.get("step") === "profile";

  if (!isProfileSetup) {
    return NextResponse.redirect(new URL("/", request.url));
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "fix(auth): allow authenticated SSO users to access profile setup"
```

---

### Task 5: Update Register Form to Support SSO Profile Setup

**Files:**
- Modify: `src/app/(auth)/register/register-form.tsx`

SSO users arrive at `/register?step=profile` already authenticated. They need to:
1. Start at PROFILE step directly
2. Not see a back button (no previous step)
3. Get display name from Supabase user metadata (Google provides `full_name`)

- [ ] **Step 1: Add `useSearchParams` and initial step logic**

Add import at top:

```ts
import { useSearchParams } from "next/navigation";
```

Inside `RegisterForm`, before the existing `step` state, read search params:

```ts
const searchParams = useSearchParams();
const initialStep = searchParams.get("step") === "profile" ? "PROFILE" : "CREDENTIALS";
const isSSO = initialStep === "PROFILE";
```

Change the step state default:

```ts
const [step, setStep] = React.useState<Step>(initialStep);
```

- [ ] **Step 2: Update `handleProfileSubmit` to handle SSO display name**

For SSO users, `storedFullName` is empty. Get name from Supabase user metadata instead.

Add to imports:

```ts
import { supabase } from "@/lib/supabase/client";
```

Replace `handleProfileSubmit`:

```ts
const handleProfileSubmit = async (data: ProfileFormValues) => {
  let displayName = storedFullName;

  if (!displayName) {
    // SSO user — get name from auth metadata
    const { data: userData } = await supabase.auth.getUser();
    displayName =
      userData.user?.user_metadata?.full_name ||
      userData.user?.user_metadata?.name ||
      userData.user?.email?.split("@")[0] ||
      "User";
  }

  setupProfileMutation.mutate({
    display_name: displayName,
    phone: data.phone,
    currency_preference: data.currency,
  });
};
```

- [ ] **Step 3: Hide back button on ProfileStep when entered via SSO**

The `ProfileStep` component currently has no back button (only `VerifyOtpStep` does), so no change needed here. Verified from existing code — `ProfileStep` only renders the form and submit button.

- [ ] **Step 4: Commit**

```bash
git add src/app/(auth)/register/register-form.tsx
git commit -m "feat(auth): support SSO profile setup via query param"
```

---

### Task 6: Wire Google Button on Login Page

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/login/login-form.tsx`

The login page is a server component, but the Google button needs `useGoogleSignInMutation` (client hook). Move social auth buttons into `login-form.tsx` (already a client component).

- [ ] **Step 1: Remove social auth section from `page.tsx`**

Remove the divider and social auth `<div>` blocks (lines 38-82) from `page.tsx`. Replace with just:

```tsx
{/* Form + Social auth */}
<LoginForm />
```

(Remove the divider and social buttons — they move to `login-form.tsx`.)

- [ ] **Step 2: Add social auth to `login-form.tsx`**

Add import:

```ts
import { useGoogleSignInMutation } from "@/services/auth/auth.hooks";
```

Inside `LoginForm`, add:

```ts
const googleSignIn = useGoogleSignInMutation();
```

After the closing `</form>` tag, add the divider and social buttons (moving them from `page.tsx`):

```tsx
{/* Divider */}
<div className="flex items-center gap-3 my-5">
  <div className="flex-1 h-px bg-line" />
  <span className="text-[11px] text-fg-2 uppercase tracking-[0.06em]">
    or continue with
  </span>
  <div className="flex-1 h-px bg-line" />
</div>

{/* Social auth */}
<div className="flex gap-2.5">
  <button className="flex-1 h-12 rounded-sm bg-bg-1 border border-line text-fg-0 text-[14px] font-medium flex items-center justify-center gap-2 cursor-pointer hover:bg-bg-2 transition-colors">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 12.5a4.5 4.5 0 0 1 .8-2.5 4.6 4.6 0 0 0-3.6-2c-1.5 0-3 1-3.8 1s-2-1-3.4-1c-1.7 0-3.4 1-4.3 2.6-1.9 3.2-.5 7.9 1.3 10.5.9 1.3 2 2.7 3.4 2.7s1.9-.9 3.5-.9 2.1.9 3.5.9 2.4-1.3 3.3-2.6a11.4 11.4 0 0 0 1.5-3.1 4.4 4.4 0 0 1-2.2-3.6z" />
      <path d="M15 4.5A4.4 4.4 0 0 0 16 1a4.5 4.5 0 0 0-2.9 1.5A4.2 4.2 0 0 0 12 5.9a3.7 3.7 0 0 0 3-1.4z" />
    </svg>
    Apple
  </button>
  <button
    type="button"
    onClick={() => googleSignIn.mutate()}
    disabled={googleSignIn.isPending}
    className="flex-1 h-12 rounded-sm bg-bg-1 border border-line text-fg-0 text-[14px] font-medium flex items-center justify-center gap-2 cursor-pointer hover:bg-bg-2 transition-colors"
  >
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A11 11 0 0 0 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
    {googleSignIn.isPending ? "Connecting..." : "Google"}
  </button>
</div>
```

Wrap the return in a fragment `<>...</>` since it now returns form + divider + social buttons.

- [ ] **Step 3: Commit**

```bash
git add src/app/(auth)/login/page.tsx src/app/(auth)/login/login-form.tsx
git commit -m "feat(auth): wire Google SSO button on login page"
```

---

### Task 7: Verify Build

**Files:** None (verification only)

- [ ] **Step 1: Run lint**

```bash
npm run lint
```

Expected: No errors.

- [ ] **Step 2: Run build**

```bash
npm run build
```

Expected: Build succeeds with no type errors.

- [ ] **Step 3: Fix any issues found, then commit fixes**
