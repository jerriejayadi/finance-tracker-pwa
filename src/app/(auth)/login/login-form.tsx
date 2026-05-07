"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLoginMutation, useGoogleSignInMutation } from "@/services/auth/auth.hooks";
import { Mail, Lock, Check } from "lucide-react";
import * as v from "valibot";
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";

const LoginSchema = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty("Please enter your email."),
    v.email("The email address is badly formatted.")
  ),
  password: v.pipe(
    v.string(),
    v.nonEmpty("Please enter your password."),
    v.minLength(6, "Your password must have 6 characters or more.")
  ),
});

type LoginFormValues = v.InferOutput<typeof LoginSchema>;

export function LoginForm() {
  const [showPwd, setShowPwd] = React.useState(false);
  const [remember, setRemember] = React.useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: valibotResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const loginMutation = useLoginMutation();
  const googleSignIn = useGoogleSignInMutation();

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const apiError = loginMutation.error?.message ?? "";

  return (
    <>
    <form className="flex flex-col gap-3 mt-9" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-1">
        <Input
          type="email"
          placeholder="Email address"
          icon={<Mail size={18} />}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-[13px] text-neg px-1">{errors.email.message}</p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <Input
          type={showPwd ? "text" : "password"}
          placeholder="Password"
          icon={<Lock size={18} />}
          {...register("password")}
          suffix={
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="text-[11px] text-fg-2 hover:text-fg-0 uppercase tracking-[0.04em] font-medium cursor-pointer"
            >
              {showPwd ? "Hide" : "Show"}
            </button>
          }
        />
        {errors.password && (
          <p className="text-[13px] text-neg px-1">{errors.password.message}</p>
        )}
      </div>

      {/* Extras row */}
      <div className="flex items-center justify-between mt-1">
        <button
          type="button"
          className="inline-flex items-center gap-2 text-[13px] text-fg-1 cursor-pointer"
          onClick={() => setRemember(!remember)}
        >
          <div
            className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
              remember
                ? "bg-brand border-brand text-brand-ink"
                : "bg-bg-1 border-line"
            }`}
          >
            {remember && <Check size={11} />}
          </div>
          Remember me
        </button>
        <a className="text-[13px] text-brand hover:text-brand-hi cursor-pointer">
          Forgot password?
        </a>
      </div>

      {apiError && (
        <p className="text-[13px] text-neg text-center">{apiError}</p>
      )}

      <Button className="w-full mt-4" type="submit" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>

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
    </>
  );
}
