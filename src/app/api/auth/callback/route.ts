import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const host = request.headers.get("host");
  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const origin = `${protocol}://${host}`;

  if (!code) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  const response = NextResponse.redirect(new URL("/", origin));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  console.log("[callback] exchanging code for session...");
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[callback] exchange error:", error.message);
    return NextResponse.redirect(new URL("/login", origin));
  }
  console.log("[callback] exchange success");

  // Check if user has a profile
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("[callback] user:", user?.id, user?.email);

  if (!user) {
    console.log("[callback] no user, redirecting to /login");
    return NextResponse.redirect(new URL("/login", origin));
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .single();

  if (profile) {
    return response; // → dashboard (/)
  }

  // New user, no profile → profile setup
  const profileResponse = NextResponse.redirect(
    new URL("/register?step=profile", origin),
  );
  // Copy cookies to new redirect response
  response.cookies.getAll().forEach((cookie) => {
    profileResponse.cookies.set(cookie.name, cookie.value);
  });
  return profileResponse;
}
