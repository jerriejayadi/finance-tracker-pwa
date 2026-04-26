"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Wallet, PieChart, Sprout, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const SLIDES = [
  {
    icon: Wallet,
    title: "Track Every Penny",
    description:
      "See where your money goes. Log expenses in seconds and stay on top of every transaction.",
    color: "bg-primary/10 text-primary",
    aura: "shadow-[0_0_60px_rgba(5,189,137,0.2)]",
  },
  {
    icon: PieChart,
    title: "Set Smart Budgets",
    description:
      "Create budgets that work for you. Get gentle nudges when you\u2019re close to your limits.",
    color: "bg-accent-yellow/15 text-accent-yellow",
    aura: "shadow-[0_0_60px_rgba(255,209,102,0.2)]",
  },
  {
    icon: Sprout,
    title: "Build Better Habits",
    description:
      "Watch your financial health grow over time with insights and progress tracking.",
    color: "bg-primary/10 text-primary",
    aura: "shadow-[0_0_60px_rgba(5,189,137,0.2)]",
  },
];

const STORAGE_KEY = "fintrack_onboarding_seen";

export function OnboardingCarousel() {
  const router = useRouter();
  const [current, setCurrent] = React.useState(0);
  const [direction, setDirection] = React.useState<"next" | "prev">("next");
  const touchStartX = React.useRef(0);
  const isLast = current === SLIDES.length - 1;

  const goTo = (index: number) => {
    setDirection(index > current ? "next" : "prev");
    setCurrent(index);
  };

  const next = () => {
    if (isLast) {
      finish();
    } else {
      goTo(current + 1);
    }
  };

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    router.push("/login");
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) {
      if (delta > 0 && current < SLIDES.length - 1) {
        goTo(current + 1);
      } else if (delta < 0 && current > 0) {
        goTo(current - 1);
      }
    }
  };

  const slide = SLIDES[current];
  const Icon = slide.icon;

  return (
    <div
      className="flex flex-col min-h-dvh bg-background-light dark:bg-background-dark px-6 pb-safe"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Skip button */}
      <div className="flex justify-end pt-14 pb-4">
        {!isLast && (
          <button
            onClick={finish}
            className="text-sm font-bold text-text-muted hover:text-primary transition-colors px-2 py-1"
          >
            Skip
          </button>
        )}
      </div>

      {/* Main content area — fills the middle of the screen */}
      <div className="flex-1 flex flex-col items-center justify-center gap-10">
        {/* Animated icon */}
        <div
          key={`icon-${current}`}
          className={`animate-scale-in animate-float w-36 h-36 rounded-full flex items-center justify-center ${slide.color} ${slide.aura}`}
        >
          <Icon size={64} strokeWidth={1.5} />
        </div>

        {/* Text content */}
        <div
          key={`text-${current}-${direction}`}
          className="animate-fade-in-up text-center max-w-xs mx-auto flex flex-col gap-4"
        >
          <h2 className="text-3xl font-extrabold text-text-navy dark:text-white leading-tight">
            {slide.title}
          </h2>
          <p className="text-base font-semibold text-text-muted leading-relaxed">
            {slide.description}
          </p>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex flex-col items-center gap-8 pb-10">
        {/* Dot indicators */}
        <div className="flex gap-2.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className={`h-2.5 rounded-full transition-all duration-300 ${
                i === current
                  ? "w-8 bg-primary"
                  : "w-2.5 bg-text-muted/30 hover:bg-text-muted/50"
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Action button */}
        <Button
          onClick={next}
          className="w-full max-w-xs gap-2 text-base"
        >
          {isLast ? "Get Started" : "Next"}
          <ArrowRight size={18} strokeWidth={2.5} />
        </Button>
      </div>
    </div>
  );
}
