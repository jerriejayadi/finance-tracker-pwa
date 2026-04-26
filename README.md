# Finance Tracker PWA (Fintrack)

A Progressive Web App for tracking your personal income and expenses. Built to make financial tracking simple, accessible, and encouraging.

## Vision

We believe tracking your finances shouldn't be complicated or stressful. Finance Tracker PWA is designed to encourage healthy financial habits by making it easy to log transactions, visualize spending patterns, and stay on top of your financial goals.

## Features

- **Track Income & Expenses** — Log transactions quickly and categorize them
- **Offline Support** — Works offline as a PWA; your data syncs when you're back online
- **Dashboard Overview** — See your financial snapshot at a glance
- **Goal Progress** — Set and track savings goals
- **Secure Authentication** — Your data is protected with Supabase auth

## Tech Stack

- **Next.js 16** (App Router)
- **Supabase** — Backend, authentication, and database
- **TanStack React Query** — Data fetching and caching
- **PWA** — Service worker for offline support
- **Tailwind CSS** — Styling

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start tracking your finances.

## Authentication: Sign In and Sign Out

- **Sign In** — Go to `/login`, enter your email and password, then click **Sign In**.
- **Sign Up** — Go to `/register` and complete the 3-step flow: Account (email + password), Verify (enter the 6-digit OTP sent to your email; resend available), and Profile (display name, phone number, preferred currency).
- **Sign Out** — Open **Profile** from the bottom navigation and click **Sign Out** in **Account Management**.

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
