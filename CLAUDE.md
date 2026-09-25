# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev          # Start dev server (Next.js with webpack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
```

No test runner is configured.

## Architecture

**Finance Tracker PWA** — a mobile-first Progressive Web App built with Next.js 16 (App Router), React 19, Supabase, and TanStack Query.

### Route Groups

- `src/app/(auth)/` — login, register, onboarding (unauthenticated users)
- `src/app/(main)/` — dashboard, profile, subs, budget (authenticated users, shared bottom nav + FAB)
- `src/app/api/` — API routes (push notifications)

### Data Layer

- **Supabase** for auth and PostgreSQL database with RLS
- **Supabase clients** in `src/lib/supabase/`: `client.ts` (browser — used for all data access), `server.ts` (server components/actions)
- **Service pattern**: `src/services/{domain}/{domain}.service.ts` exports a class with static methods; `{domain}.hooks.ts` wraps those in TanStack Query hooks
- **Query defaults**: 1min stale time, 10min GC, max 3 retries (fails immediately on 401)

### Auth Flow

Proxy (`src/proxy.ts`, formerly middleware) is an **optimistic gate with no network calls**: it only checks the Supabase session cookie exists — redirects unauthenticated to `/onboarding`, authenticated away from auth pages. `AuthGuard` (`src/components/auth/auth-guard.tsx`, mounted in `(main)/layout`) verifies the session with Supabase once per app load and redirects to `/login` (invalid session) or `/register?step=profile` (no profile row). Registration is multi-step: account creation → OTP verification → profile setup.

### Static pages & i18n

`(main)` pages are prerendered static so `<Link>` can fully prefetch them — **don't read `cookies()`/`headers()` in the root or `(main)` layouts**. Locale is resolved client-side by `LocaleProvider` (`src/i18n/locale-provider.tsx`) from the `NEXT_LOCALE` cookie; change it with `useSetLocale()`, never by writing the cookie directly. Auth pages still use server `getTranslations` (dynamic).

### UI System

- **Dark-mode-first** design tokens in `src/app/globals.css` (CSS variables: `--color-bg-0..3`, `--color-fg-0..3`, `--color-brand`, `--color-pos/neg`)
- Tailwind CSS 4 with `tailwind-merge` + `clsx` via `cn()` utility in `src/lib/utils.ts`
- Reusable components in `src/components/ui/`; feature components in `src/components/{feature}/`
- `vaul` for drawer modals, `lucide-react` for icons, `class-variance-authority` for component variants

### PWA

Uses `@serwist/turbopack` (works with Turbopack builds — no `--webpack` needed). Worker source is `src/app/sw.ts` (precaching + push handlers), served at `/serwist/sw.js` by `src/app/serwist/[path]/route.ts`, registered via `<SerwistProvider>` in the root layout. Push notifications use VAPID keys (env vars `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`). Disabled in dev unless `TEST_WITH_PWA=true`.

### Component Pattern

Follow **compound component pattern** (shadcn-style). Components should be composable with subcomponents rather than monolithic with many props. This maximizes style reusability and flexibility. Example: `<Card>`, `<Card.Header>`, `<Card.Content>` over a single `<Card title={...} content={...} />`.

### Key Conventions

- Path alias: `@/*` → `src/*`
- Form handling: `react-hook-form` + `valibot` for validation
- Local Supabase dev URL: `http://127.0.0.1:54321`
- Supabase MCP server configured in `.vscode/mcp.json`
