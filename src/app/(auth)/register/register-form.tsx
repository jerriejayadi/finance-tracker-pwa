"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordStrength } from "@/components/ui/password-strength";
import {
  useRegisterMutation,
  useVerifyOtpMutation,
  useSetupProfileMutation,
  useResendOtpMutation,
} from "@/services/auth/auth.hooks";
import { Mail, Lock, User, Check, ArrowLeft } from "lucide-react";
import * as v from "valibot";
import { Label } from "@/components/ui/label";

const CredentialsSchema = v.object({
  fullName: v.pipe(
    v.string(),
    v.nonEmpty("Please enter your name."),
    v.minLength(2, "Name must have 2 characters or more.")
  ),
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

const OtpSchema = v.object({
  otp: v.pipe(
    v.string(),
    v.nonEmpty("Please enter the OTP code."),
    v.minLength(6, "OTP must be at least 6 characters.")
  ),
});

const ProfileSchema = v.object({
  phone: v.pipe(v.string(), v.nonEmpty("Please enter your phone number.")),
  currency: v.pipe(
    v.string(),
    v.length(3, "Currency code must be 3 characters.")
  ),
});

type Step = "CREDENTIALS" | "VERIFY_OTP" | "PROFILE";

export function RegisterForm() {
  const [step, setStep] = React.useState<Step>("CREDENTIALS");

  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [showPwd, setShowPwd] = React.useState(false);
  const [agree, setAgree] = React.useState(false);
  const [otp, setOtp] = React.useState("");
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
      const parsedData = v.parse(CredentialsSchema, {
        fullName,
        email,
        password,
      });
      registerMutation.mutate({
        email: parsedData.email,
        password: parsedData.password,
      });
    } catch (err: unknown) {
      if (err instanceof v.ValiError)
        setValidationError(err.issues[0].message);
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
      if (err instanceof v.ValiError)
        setValidationError(err.issues[0].message);
    }
  };

  const handleStep3Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");
    try {
      const parsedData = v.parse(ProfileSchema, { phone, currency });
      setupProfileMutation.mutate({
        display_name: fullName,
        phone: parsedData.phone,
        currency_preference: parsedData.currency,
      });
    } catch (err: unknown) {
      if (err instanceof v.ValiError)
        setValidationError(err.issues[0].message);
    }
  };

  const isPending =
    registerMutation.isPending ||
    verifyOtpMutation.isPending ||
    setupProfileMutation.isPending ||
    resendOtpMutation.isPending;

  const apiError =
    (step === "CREDENTIALS" ? registerMutation.error?.message : "") ||
    (step === "VERIFY_OTP"
      ? verifyOtpMutation.error?.message || resendOtpMutation.error?.message
      : "") ||
    (step === "PROFILE" ? setupProfileMutation.error?.message : "");

  const errorMessage = validationError || apiError;

  return (
    <div className="flex flex-col gap-3 mt-9">
      {step === "CREDENTIALS" && (
        <form className="flex flex-col gap-3" onSubmit={handleStep1Submit}>
          <Input
            type="text"
            placeholder="Full name"
            icon={<User size={18} />}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
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
            placeholder="Create a password"
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

          <PasswordStrength value={password} className="-mt-1 px-0.5" />

          {/* Terms checkbox */}
          <div className="mt-1">
            <button
              type="button"
              className="inline-flex items-center gap-2 text-[13px] text-fg-1 cursor-pointer"
              onClick={() => setAgree(!agree)}
            >
              <div
                className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                  agree
                    ? "bg-brand border-brand text-brand-ink"
                    : "bg-bg-1 border-line"
                }`}
              >
                {agree && <Check size={11} />}
              </div>
              I agree to the{" "}
              <span className="text-brand ml-[-2px]">Terms</span>
            </button>
          </div>

          {errorMessage && (
            <p className="text-[13px] text-neg text-center">{errorMessage}</p>
          )}

          <Button
            className="w-full mt-4"
            type="submit"
            disabled={isPending}
          >
            {isPending ? "Creating account..." : "Create account"}
          </Button>
        </form>
      )}

      {step === "VERIFY_OTP" && (
        <form className="flex flex-col gap-4" onSubmit={handleStep2Submit}>
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <p className="text-[13px] text-fg-1 mb-4">
              We&apos;ve sent a verification code to{" "}
              <span className="text-fg-0 font-medium">{email}</span>.
            </p>
            <div className="flex flex-col gap-1.5 w-full text-left">
              <Label htmlFor="otp">Enter 6-digit code</Label>
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
            <p className="text-[13px] text-neg text-center">{errorMessage}</p>
          )}
          {resendOtpMutation.isSuccess && (
            <p className="text-[13px] text-pos text-center">
              A new code has been sent.
            </p>
          )}
          <div className="flex justify-center -mt-2">
            <button
              type="button"
              className="text-[13px] text-fg-2 hover:text-fg-0 transition-colors cursor-pointer"
              onClick={() =>
                resendOtpMutation.mutate({ type: "signup", email })
              }
              disabled={isPending}
            >
              Resend code
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => {
                setStep("CREDENTIALS");
                setValidationError("");
              }}
              disabled={isPending}
            >
              <ArrowLeft size={18} />
            </Button>
            <Button className="flex-1" type="submit" disabled={isPending}>
              {isPending ? "Verifying..." : "Verify email"}
            </Button>
          </div>
        </form>
      )}

      {step === "PROFILE" && (
        <form className="flex flex-col gap-4" onSubmit={handleStep3Submit}>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+62812..."
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="currency">Preferred currency</Label>
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
            <p className="text-[13px] text-neg text-center">{errorMessage}</p>
          )}
          <Button className="w-full mt-2" type="submit" disabled={isPending}>
            {isPending ? "Saving..." : "Complete setup"}
          </Button>
        </form>
      )}
    </div>
  );
}
