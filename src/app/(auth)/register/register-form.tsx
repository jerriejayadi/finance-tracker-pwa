"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase/client";
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
import { useForm } from "react-hook-form";
import { valibotResolver } from "@hookform/resolvers/valibot";
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
  language: v.pipe(v.string(), v.nonEmpty("Please select a language.")),
});

type CredentialsFormValues = v.InferOutput<typeof CredentialsSchema>;
type OtpFormValues = v.InferOutput<typeof OtpSchema>;
type ProfileFormValues = v.InferOutput<typeof ProfileSchema>;

type Step = "CREDENTIALS" | "VERIFY_OTP" | "PROFILE";

export function RegisterForm() {
  const searchParams = useSearchParams();
  const initialStep = searchParams.get("step") === "profile" ? "PROFILE" : "CREDENTIALS";
  const [step, setStep] = React.useState<Step>(initialStep);
  const [showPwd, setShowPwd] = React.useState(false);
  const [agree, setAgree] = React.useState(false);

  // We need fullName and email across steps, so we store them here
  const [storedFullName, setStoredFullName] = React.useState("");
  const [storedEmail, setStoredEmail] = React.useState("");

  const registerMutation = useRegisterMutation({
    mutationConfig: {
      onSuccess: (_data, variables) => {
        // Also resend OTP in case user already exists but is unverified
        const email = "email" in variables ? variables.email : undefined;
        if (email) {
          resendOtpMutation.mutate({ type: "signup", email });
        }
        setStep("VERIFY_OTP");
      },
    },
  });

  const verifyOtpMutation = useVerifyOtpMutation({
    mutationConfig: {
      onSuccess: () => setStep("PROFILE"),
    },
  });

  const setupProfileMutation = useSetupProfileMutation();
  const resendOtpMutation = useResendOtpMutation();

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

  const handleCredentialsSubmit = (data: CredentialsFormValues) => {
    setStoredFullName(data.fullName);
    setStoredEmail(data.email);
    registerMutation.mutate({
      email: data.email,
      password: data.password,
    });
  };

  const handleOtpSubmit = (data: OtpFormValues) => {
    verifyOtpMutation.mutate({
      email: storedEmail,
      token: data.otp,
      type: "signup",
    });
  };

  const handleProfileSubmit = async (data: ProfileFormValues) => {
    let displayName = storedFullName;

    if (!displayName) {
      // SSO user — get name from auth metadata
      const { data: userData } = await supabase.auth.getUser();
      displayName =
        userData.user?.user_metadata?.full_name ||
        userData.user?.user_metadata?.name ||
        userData.user?.email?.split("@")[0] ||
        "User";
    }

    // Set locale cookie before redirect
    document.cookie = `NEXT_LOCALE=${data.language};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax`;

    setupProfileMutation.mutate({
      display_name: displayName,
      phone: data.phone,
      currency_preference: data.currency,
      language: data.language,
    });
  };

  return (
    <div className="flex flex-col gap-3 mt-9">
      {step === "CREDENTIALS" && (
        <CredentialsStep
          showPwd={showPwd}
          setShowPwd={setShowPwd}
          agree={agree}
          setAgree={setAgree}
          onSubmit={handleCredentialsSubmit}
          isPending={isPending}
          apiError={apiError}
        />
      )}

      {step === "VERIFY_OTP" && (
        <VerifyOtpStep
          email={storedEmail}
          onSubmit={handleOtpSubmit}
          onResend={() =>
            resendOtpMutation.mutate({ type: "signup", email: storedEmail })
          }
          onBack={() => setStep("CREDENTIALS")}
          isPending={isPending}
          apiError={apiError}
          isResendSuccess={resendOtpMutation.isSuccess}
        />
      )}

      {step === "PROFILE" && (
        <ProfileStep
          onSubmit={handleProfileSubmit}
          isPending={isPending}
          apiError={apiError}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step components
// ---------------------------------------------------------------------------

interface CredentialsStepProps {
  showPwd: boolean;
  setShowPwd: (val: boolean) => void;
  agree: boolean;
  setAgree: (val: boolean) => void;
  onSubmit: (data: CredentialsFormValues) => void;
  isPending: boolean;
  apiError?: string;
}

function CredentialsStep({
  showPwd,
  setShowPwd,
  agree,
  setAgree,
  onSubmit,
  isPending,
  apiError,
}: CredentialsStepProps) {
  const t = useTranslations("auth");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CredentialsFormValues>({
    resolver: valibotResolver(CredentialsSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  });

  const password = watch("password");

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-1">
        <Input
          type="text"
          placeholder={t("fullName")}
          icon={<User size={18} />}
          {...register("fullName")}
        />
        {errors.fullName && (
          <p className="text-[13px] text-neg px-1">
            {errors.fullName.message}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1">
        <Input
          type="email"
          placeholder={t("emailAddress")}
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
          placeholder={t("createPassword")}
          icon={<Lock size={18} />}
          {...register("password")}
          suffix={
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="text-[11px] text-fg-2 hover:text-fg-0 uppercase tracking-[0.04em] font-medium cursor-pointer"
            >
              {showPwd ? t("hide") : t("show")}
            </button>
          }
        />
        {errors.password && (
          <p className="text-[13px] text-neg px-1">
            {errors.password.message}
          </p>
        )}
      </div>

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
          {t("agreeToTerms")} <span className="text-brand ml-[-2px]">{t("terms")}</span>
        </button>
      </div>

      {apiError && (
        <p className="text-[13px] text-neg text-center">{apiError}</p>
      )}

      <Button className="w-full mt-4" type="submit" disabled={isPending}>
        {isPending ? t("creatingAccount") : t("createAccount")}
      </Button>
    </form>
  );
}

interface VerifyOtpStepProps {
  email: string;
  onSubmit: (data: OtpFormValues) => void;
  onResend: () => void;
  onBack: () => void;
  isPending: boolean;
  apiError?: string;
  isResendSuccess: boolean;
}

function VerifyOtpStep({
  email,
  onSubmit,
  onResend,
  onBack,
  isPending,
  apiError,
  isResendSuccess,
}: VerifyOtpStepProps) {
  const t = useTranslations("auth");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormValues>({
    resolver: valibotResolver(OtpSchema),
    defaultValues: { otp: "" },
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col items-center justify-center p-4 text-center">
        <p className="text-[13px] text-fg-1 mb-4">
          {t("otpSentTo")}{" "}
          <span className="text-fg-0 font-medium">{email}</span>.
        </p>
        <div className="flex flex-col gap-1.5 w-full text-left">
          <Label htmlFor="otp">{t("enterOtpCode")}</Label>
          <Input
            id="otp"
            type="text"
            placeholder="123456"
            {...register("otp")}
            className="text-center tracking-[0.5em] font-mono text-lg"
            minLength={6}
          />
          {errors.otp && (
            <p className="text-[13px] text-neg px-1">{errors.otp.message}</p>
          )}
        </div>
      </div>
      {apiError && (
        <p className="text-[13px] text-neg text-center">{apiError}</p>
      )}
      {isResendSuccess && (
        <p className="text-[13px] text-pos text-center">
          {t("newCodeSent")}
        </p>
      )}
      <div className="flex justify-center -mt-2">
        <button
          type="button"
          className="text-[13px] text-fg-2 hover:text-fg-0 transition-colors cursor-pointer"
          onClick={onResend}
          disabled={isPending}
        >
          {t("resendCode")}
        </button>
      </div>
      <div className="flex gap-2 mt-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onBack}
          disabled={isPending}
        >
          <ArrowLeft size={18} />
        </Button>
        <Button className="flex-1" type="submit" disabled={isPending}>
          {isPending ? t("verifying") : t("verifyEmail")}
        </Button>
      </div>
    </form>
  );
}

interface ProfileStepProps {
  onSubmit: (data: ProfileFormValues) => void;
  isPending: boolean;
  apiError?: string;
}

function ProfileStep({ onSubmit, isPending, apiError }: ProfileStepProps) {
  const t = useTranslations("auth");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: valibotResolver(ProfileSchema),
    defaultValues: { phone: "", currency: "IDR", language: "en" },
  });

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="phone">{t("phoneNumber")}</Label>
        <Input
          id="phone"
          type="tel"
          placeholder="+62812..."
          {...register("phone")}
        />
        {errors.phone && (
          <p className="text-[13px] text-neg px-1">{errors.phone.message}</p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="currency">{t("preferredCurrency")}</Label>
        <Input
          id="currency"
          type="text"
          placeholder="IDR"
          maxLength={3}
          className="uppercase"
          {...register("currency")}
        />
        {errors.currency && (
          <p className="text-[13px] text-neg px-1">
            {errors.currency.message}
          </p>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="language">{t("preferredLanguage")}</Label>
        <select
          id="language"
          {...register("language")}
          className="h-12 rounded-sm bg-bg-1 border border-line text-fg-0 px-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-brand/40"
        >
          <option value="en">English</option>
          <option value="id">Bahasa Indonesia</option>
        </select>
        {errors.language && (
          <p className="text-[13px] text-neg px-1">
            {errors.language.message}
          </p>
        )}
      </div>
      {apiError && (
        <p className="text-[13px] text-neg text-center">{apiError}</p>
      )}
      <Button className="w-full mt-2" type="submit" disabled={isPending}>
        {isPending ? t("saving") : t("completeSetup")}
      </Button>
    </form>
  );
}
