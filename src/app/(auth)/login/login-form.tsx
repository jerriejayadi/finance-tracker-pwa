"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useLoginMutation } from "@/services/auth/auth.hooks";
import { Mail, Lock, Check } from "lucide-react";
import * as v from "valibot";

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

export function LoginForm() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPwd, setShowPwd] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [validationError, setValidationError] = React.useState("");

  const loginMutation = useLoginMutation();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    try {
      const parsedData = v.parse(LoginSchema, { email, password });
      loginMutation.mutate(parsedData);
    } catch (err: unknown) {
      if (err instanceof v.ValiError) {
        setValidationError(err.issues[0].message);
      }
    }
  };

  const errorMessage =
    validationError || (loginMutation.error?.message ?? "");

  return (
    <form className="flex flex-col gap-3 mt-9" onSubmit={handleSubmit}>
      <Input
        type="email"
        placeholder="Email address"
        icon={<Mail size={18} />}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Input
        type={showPwd ? "text" : "password"}
        placeholder="Password"
        icon={<Lock size={18} />}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
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

      {errorMessage && (
        <p className="text-[13px] text-neg text-center">{errorMessage}</p>
      )}

      <Button className="w-full mt-4" type="submit" disabled={loginMutation.isPending}>
        {loginMutation.isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}
