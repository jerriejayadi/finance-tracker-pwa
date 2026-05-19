import { LoginForm } from "./login-form";
import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "Sign in — FinTrack",
  description: "Sign in to your FinTrack account to track your finances.",
};

export default async function LoginPage() {
  const t = await getTranslations("auth");

  return (
    <div className="flex flex-col min-h-dvh bg-bg-0 px-6 pb-8 pt-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <Logo size={28} />
        <Link
          href="/register"
          className="text-[13px] text-fg-1 hover:bg-bg-1 px-2 py-1.5 rounded-md cursor-pointer"
        >
          {t("signUp")}
        </Link>
      </div>

      {/* Hero */}
      <div className="mt-14">
        <h1 className="text-[34px] leading-[1.1] font-semibold tracking-[-0.025em] text-balance">
          {t("welcomeBack")} <span className="text-brand">{t("welcomeBackHighlight")}</span>
        </h1>
        <p className="text-[15px] text-fg-1 leading-[1.5] mt-3 max-w-[30ch]">
          {t("signInSubtitle")}
        </p>
      </div>

      {/* Form */}
      <LoginForm />

      {/* Footer */}
      <div className="mt-auto pt-6 text-center text-[13px] text-fg-2">
        {t("newToFinTrack")}{" "}
        <Link href="/register" className="text-brand hover:text-brand-hi">
          {t("createAccount")}
        </Link>
      </div>
    </div>
  );
}
