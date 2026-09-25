import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { createServerClient } from "@supabase/ssr";
import { defaultLocale, LOCALE_COOKIE, locales, type Locale } from "@/i18n/config";

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

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;

  // 1. Resolve locale and set cookie if missing
  const locale = resolveLocale(request);

  // 2. Update session (manages cookies for Supabase)
  const supabaseResponse = await updateSession(request);

  // Set locale cookie on response if not present on request
  if (!request.cookies.get(LOCALE_COOKIE)?.value) {
    supabaseResponse.cookies.set(LOCALE_COOKIE, locale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365, // 1 year
      sameSite: "lax",
    });
  }

  // 3. Check auth status for redirects
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPage = AUTH_PAGES.includes(nextUrl.pathname);
  const isOnboardingPage = nextUrl.pathname === "/onboarding";

  if (!user && !isAuthPage && !isOnboardingPage) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (user && isAuthPage) {
    const isProfileSetup =
      nextUrl.pathname === "/register" &&
      nextUrl.searchParams.get("step") === "profile";

    if (!isProfileSetup) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (user && !isAuthPage) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.redirect(new URL("/register?step=profile", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/auth/callback|.*\\.(?:svg|png|jpg|jpeg|gif|webp|js|webmanifest)$).*)",
  ],
};
