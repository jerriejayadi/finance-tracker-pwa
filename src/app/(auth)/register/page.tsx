// TODO: Implement proper form validation
import { RegisterForm } from "./register-form";
import { Wallet } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sign Up — Fintrack",
  description: "Create your Fintrack account to start tracking your finances.",
};

export default function RegisterPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-background-light dark:bg-background-dark px-6 pb-safe">
      {/* Top spacing + branding */}
      <div className="flex flex-col items-center pt-16 pb-8 gap-3">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shadow-aura">
          <Wallet size={32} strokeWidth={1.5} className="text-primary" />
        </div>
        <h1 className="text-2xl font-extrabold text-text-navy dark:text-white tracking-tight">
          Create an Account
        </h1>
        <p className="text-sm font-semibold text-text-muted">
          Sign up to get started on your Fintrack journey.
        </p>
      </div>

      {/* Register form */}
      <div className=" flex flex-col w-full max-w-sm mx-auto">
        <RegisterForm />

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-text-muted/20" />
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
            or continue with
          </span>
          <div className="flex-1 h-px bg-text-muted/20" />
        </div>

        {/* Google SSO placeholder */}
        <button
          type="button"
          className="flex items-center justify-center gap-3 w-full h-12 rounded-full ring-1 ring-text-muted/20 bg-white dark:bg-white/5 text-text-navy dark:text-white font-bold text-base transition-all duration-300 hover:ring-primary/40 hover:shadow-soft active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path
              fill="#FFC107"
              d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
            />
            <path
              fill="#FF3D00"
              d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
            />
          </svg>
          Google
        </button>

        {/* Sign in link */}
        <p className="text-center text-sm text-text-muted font-semibold mt-8 mb-6">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-bold text-primary hover:text-primary/80 transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
