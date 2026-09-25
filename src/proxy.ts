import { type NextRequest, NextResponse } from "next/server";
import { defaultLocale, LOCALE_COOKIE, locales, type Locale } from "@/i18n/config";

// Optimistic gate only: checks that a Supabase auth cookie exists, with no
// network calls, so navigations aren't blocked on Supabase round trips.
// Real verification happens client-side (AuthGuard) and in the DB (RLS).

const AUTH_PAGES = ["/login", "/onboarding", "/register"];

function resolveLocale(request: NextRequest): Locale {
  // 1. Check cookie
  const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  // 2. Check Accept-Language header
  const acceptLang = request.headers.get("accept-language") ?? "";
  if (acceptLang.includes("id")) {
    return "id";
  }

  return defaultLocale;
}

// @supabase/ssr stores the session as `sb-<project-ref>-auth-token`,
// chunked into `.0`, `.1`, ... when large.
const SESSION_COOKIE = `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0]}-auth-token`;

function hasSessionCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(({ name }) => name === SESSION_COOKIE || name.startsWith(`${SESSION_COOKIE}.`));
}

export function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const isAuthed = hasSessionCookie(request);
  const isAuthPage = AUTH_PAGES.includes(nextUrl.pathname);

  if (!isAuthed && !isAuthPage) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (isAuthed && isAuthPage) {
    const isProfileSetup =
      nextUrl.pathname === "/register" &&
      nextUrl.searchParams.get("step") === "profile";

    if (!isProfileSetup) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  const response = NextResponse.next();

  // Set locale cookie if missing (first visit), from Accept-Language
  if (!request.cookies.get(LOCALE_COOKIE)?.value) {
    response.cookies.set(LOCALE_COOKIE, resolveLocale(request), {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth/callback|serwist/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|webmanifest)$).*)",
  ],
};
