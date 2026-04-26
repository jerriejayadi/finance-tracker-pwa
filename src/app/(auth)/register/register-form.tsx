"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  useRegisterMutation,
  useVerifyOtpMutation,
  useSetupProfileMutation,
  useResendOtpMutation,
} from "@/services/auth/auth.hooks";
import * as v from "valibot";
import { ArrowLeft } from "lucide-react";

const CredentialsSchema = v.object({
  email: v.pipe(
    v.string(),
    v.nonEmpty("Please enter your email."),
    v.email("The email address is badly formatted."),
  ),
  password: v.pipe(
    v.string(),
    v.nonEmpty("Please enter your password."),
    v.minLength(6, "Your password must have 6 characters or more."),
  ),
});

const OtpSchema = v.object({
  otp: v.pipe(
    v.string(),
    v.nonEmpty("Please enter the OTP code."),
    v.minLength(6, "OTP must be at least 6 characters."),
  ),
});

const ProfileSchema = v.object({
  displayName: v.pipe(
    v.string(),
    v.nonEmpty("Please enter your name."),
    v.minLength(2, "Your name must have 2 characters or more."),
  ),
  phone: v.pipe(v.string(), v.nonEmpty("Please enter your phone number.")),
  currency: v.pipe(
    v.string(),
    v.length(3, "Currency code must be 3 characters."),
  ),
});

type Step = "CREDENTIALS" | "VERIFY_OTP" | "PROFILE";

export function RegisterForm() {
  const [step, setStep] = React.useState<Step>("CREDENTIALS");

  // Form State
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [displayName, setDisplayName] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [currency, setCurrency] = React.useState("IDR");

  const [validationError, setValidationError] = React.useState("");

  const registerMutation = useRegisterMutation({
    mutationConfig: {
      onSuccess: () => {
        setValidationError("");
        setStep("VERIFY_OTP");
      },
    },
  });

  const verifyOtpMutation = useVerifyOtpMutation({
    mutationConfig: {
      onSuccess: () => {
        setValidationError("");
        setStep("PROFILE");
      },
    },
  });

  const setupProfileMutation = useSetupProfileMutation();
  const resendOtpMutation = useResendOtpMutation();

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    try {
      const parsedData = v.parse(CredentialsSchema, { email, password });
      registerMutation.mutate({
        email: parsedData.email,
        password: parsedData.password,
      });
    } catch (err: unknown) {
      if (err instanceof v.ValiError) setValidationError(err.issues[0].message);
    }
  };

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    try {
      const parsedData = v.parse(OtpSchema, { otp });
      verifyOtpMutation.mutate({
        email,
        token: parsedData.otp,
        type: "signup",
      });
    } catch (err: unknown) {
      if (err instanceof v.ValiError) setValidationError(err.issues[0].message);
    }
  };

  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    try {
      const parsedData = v.parse(ProfileSchema, {
        displayName,
        phone,
        currency,
      });
      setupProfileMutation.mutate({
        display_name: parsedData.displayName,
        phone: parsedData.phone,
        currency_preference: parsedData.currency,
      });
    } catch (err: unknown) {
      if (err instanceof v.ValiError) setValidationError(err.issues[0].message);
    }
  };

  const isPending =
    registerMutation.isPending ||
    verifyOtpMutation.isPending ||
    setupProfileMutation.isPending ||
    resendOtpMutation.isPending;

  // Active mutation error
  const apiError =
    (step === "CREDENTIALS" ? registerMutation.error?.message : "") ||
    (step === "VERIFY_OTP"
      ? verifyOtpMutation.error?.message || resendOtpMutation.error?.message
      : "") ||
    (step === "PROFILE" ? setupProfileMutation.error?.message : "");

  const errorMessage = validationError || apiError;

  return (
    <div className="flex flex-col gap-6 mt-2">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between px-2 text-sm font-semibold text-text-muted">
        <div
          className={`flex flex-col items-center gap-1 ${step === "CREDENTIALS" ? "text-primary" : ""}`}
        >
          <div
            className={`w-8 h-1 rounded-full ${step === "CREDENTIALS" ? "bg-primary" : "bg-text-muted/30"}`}
          />
          Account
        </div>
        <div
          className={`flex flex-col items-center gap-1 ${step === "VERIFY_OTP" ? "text-primary" : ""}`}
        >
          <div
            className={`w-8 h-1 rounded-full ${step === "VERIFY_OTP" ? "bg-primary" : "bg-text-muted/30"}`}
          />
          Verify
        </div>
        <div
          className={`flex flex-col items-center gap-1 ${step === "PROFILE" ? "text-primary" : ""}`}
        >
          <div
            className={`w-8 h-1 rounded-full ${step === "PROFILE" ? "bg-primary" : "bg-text-muted/30"}`}
          />
          Profile
        </div>
      </div>

      {step === "CREDENTIALS" && (
        <form
          className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2"
          onSubmit={handleStep1Submit}
        >
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
            <Label
              htmlFor="password"
              className="font-bold text-text-navy dark:text-white"
            >
              Password
            </Label>
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
          <Button className="w-full mt-2" type="submit" disabled={isPending}>
            {isPending ? "Continuing..." : "Continue"}
          </Button>
        </form>
      )}

      {step === "VERIFY_OTP" && (
        <form
          className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2"
          onSubmit={handleStep2Submit}
        >
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <p className="text-sm font-semibold text-text-muted mb-4">
              We&apos;ve sent a verification code to{" "}
              <span className="text-text-navy dark:text-white font-bold">
                {email}
              </span>
              .
            </p>
            <div className="flex flex-col gap-2 w-full text-left">
              <Label
                htmlFor="otp"
                className="font-bold text-text-navy dark:text-white"
              >
                Enter 6-digit Code
              </Label>
              <Input
                id="otp"
                type="text"
                placeholder="123456"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="text-center tracking-[0.5em] font-mono text-lg"
                maxLength={6}
              />
            </div>
          </div>
          {errorMessage && (
            <p className="text-sm font-bold text-accent-coral text-center">
              {errorMessage}
            </p>
          )}
          {resendOtpMutation.isSuccess && (
            <p className="text-sm font-bold text-green-500 text-center">
              A new code has been sent!
            </p>
          )}
          <div className="flex justify-center -mt-2">
            <button
              type="button"
              className="text-sm font-bold text-primary hover:text-primary/80 transition-colors"
              onClick={() =>
                resendOtpMutation.mutate({ type: "signup", email })
              }
              disabled={isPending}
            >
              Resend Code
            </button>
          </div>
          <div className="flex gap-3 mt-2">
            <Button
              type="button"
              variant="outline"
              className="px-3"
              onClick={() => {
                setStep("CREDENTIALS");
                setValidationError("");
              }}
              disabled={isPending}
            >
              <ArrowLeft size={20} />
            </Button>
            <Button className="flex-1" type="submit" disabled={isPending}>
              {isPending ? "Verifying..." : "Verify Email"}
            </Button>
          </div>
        </form>
      )}

      {step === "PROFILE" && (
        <form
          className="flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-2"
          onSubmit={handleStep3Submit}
        >
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="displayName"
              className="font-bold text-text-navy dark:text-white"
            >
              Display Name
            </Label>
            <Input
              id="displayName"
              type="text"
              placeholder="John Doe"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="phone"
              className="font-bold text-text-navy dark:text-white"
            >
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+62812..."
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="currency"
              className="font-bold text-text-navy dark:text-white"
            >
              Preferred Currency
            </Label>
            <Input
              id="currency"
              type="text"
              placeholder="IDR"
              maxLength={3}
              required
              className="uppercase"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            />
          </div>
          {errorMessage && (
            <p className="text-sm font-bold text-accent-coral text-center">
              {errorMessage}
            </p>
          )}
          <Button className="w-full mt-2" type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Complete Setup"}
          </Button>
        </form>
      )}
    </div>
  );
}
