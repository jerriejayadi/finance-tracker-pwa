"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useLoginMutation } from "@/services/auth/auth.hooks";
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
    <form className="flex flex-col gap-5 mt-2" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="email"
          className="font-bold text-text-navy dark:text-white"
        >
          Email
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="m@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label
            htmlFor="password"
            className="font-bold text-text-navy dark:text-white"
          >
            Password
          </Label>
          <a
            href="#"
            className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
          >
            Forgot password?
          </a>
        </div>
        <Input
          id="password"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>
      {errorMessage && (
        <p className="text-sm font-bold text-accent-coral text-center">
          {errorMessage}
        </p>
      )}
      <Button
        className="w-full mt-2"
        type="submit"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  );
}
