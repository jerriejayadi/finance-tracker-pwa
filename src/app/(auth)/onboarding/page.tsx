import { OnboardingCarousel } from "./onboarding-carousel";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Welcome to Fintrack",
  description: "Get started with Fintrack — your personal budgeting companion.",
};

export default function OnboardingPage() {
  return <OnboardingCarousel />;
}
