import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";
import { createServerClient } from "@supabase/ssr";

const AUTH_PAGES = ["/login", "/onboarding", "/register"];

export async function middleware(request: NextRequest) {

  const { nextUrl } = request;
  
  // 1. Update session (manages cookies for Supabase)
  const supabaseResponse = await updateSession(request);

  // 2. Check auth status for redirects
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {}, // Handled by updateSession
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Redirect logic
  const isAuthPage = AUTH_PAGES.includes(nextUrl.pathname);
  const isOnboardingPage = nextUrl.pathname === "/onboarding";

  if (!user && !isAuthPage && !isOnboardingPage) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  if (user && isAuthPage) {
    // Allow authenticated users to access profile setup (SSO users need this)
    const isProfileSetup =
      nextUrl.pathname === "/register" &&
      nextUrl.searchParams.get("step") === "profile";

    if (!isProfileSetup) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

