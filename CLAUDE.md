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
- **Three Supabase client variants** in `src/lib/supabase/`: `client.ts` (browser), `server.ts` (server components/actions), `proxy.ts` (middleware session refresh)
- **Service pattern**: `src/services/{domain}/{domain}.service.ts` exports a class with static methods; `{domain}.hooks.ts` wraps those in TanStack Query hooks
- **Query defaults**: 1min stale time, 10min GC, max 3 retries (fails immediately on 401)

### Auth Flow

Middleware (`src/middleware.ts`) checks session on every request — redirects unauthenticated to `/onboarding`, authenticated away from auth pages. Registration is multi-step: account creation → OTP verification → profile setup.

### UI System

- **Dark-mode-first** design tokens in `src/app/globals.css` (CSS variables: `--color-bg-0..3`, `--color-fg-0..3`, `--color-brand`, `--color-pos/neg`)
- Tailwind CSS 4 with `tailwind-merge` + `clsx` via `cn()` utility in `src/lib/utils.ts`
- Reusable components in `src/components/ui/`; feature components in `src/components/{feature}/`
- `vaul` for drawer modals, `lucide-react` for icons, `class-variance-authority` for component variants

### PWA

Configured via `@ducanh2912/next-pwa` in `next.config.ts`. Service worker output to `public/sw.js`. Push notifications use VAPID keys (env vars `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`). PWA is disabled in dev mode.

### Component Pattern

Follow **compound component pattern** (shadcn-style). Components should be composable with subcomponents rather than monolithic with many props. This maximizes style reusability and flexibility. Example: `<Card>`, `<Card.Header>`, `<Card.Content>` over a single `<Card title={...} content={...} />`.

### Key Conventions

- Path alias: `@/*` → `src/*`
- Form handling: `react-hook-form` + `valibot` for validation
- Local Supabase dev URL: `http://127.0.0.1:54321`
- Supabase MCP server configured in `.vscode/mcp.json`
