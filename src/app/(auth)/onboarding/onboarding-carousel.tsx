"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Logo } from "@/components/ui/logo";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "fintrack_onboarding_seen";

function BalanceArt() {
  return (
    <div className="relative w-[280px] h-[280px] flex items-center justify-center">
      {/* Rings */}
      <div className="absolute inset-0 rounded-full border border-line-soft" />
      <div className="absolute inset-6 rounded-full border border-line" />
      <div className="absolute inset-14 rounded-full border border-brand border-dashed opacity-50" />

      {/* Center card */}
      <div className="relative z-[2] w-[168px] h-[168px] bg-bg-1 border border-line rounded-3xl p-[22px] flex flex-col justify-between">
        <div className="text-[10px] uppercase tracking-[0.06em] text-fg-2">
          Total balance
        </div>
        <div>
          <div className="font-mono text-[30px] font-medium tracking-[-0.02em] tabular-nums">
            $4,283<span className="text-fg-2">.19</span>
          </div>
          <div className="font-mono text-[11px] text-pos">▲ 12.4%</div>
        </div>
      </div>

      {/* Floating cards */}
      <div className="absolute top-2 left-2 z-[3] bg-bg-1 border border-line rounded-xl px-2.5 py-2 flex items-center gap-2 text-[11px]">
        <div className="w-[22px] h-[22px] rounded-md bg-bg-2 border border-line flex items-center justify-center text-[11px]">
          ☕
        </div>
        <div>
          <div className="text-[10px] text-fg-2">Blue Bottle</div>
          <div className="font-mono text-[11px] font-medium text-neg tabular-nums">
            − $5.75
          </div>
        </div>
      </div>
      <div className="absolute bottom-6 right-0 z-[3] bg-bg-1 border border-line rounded-xl px-2.5 py-2 flex items-center gap-2 text-[11px]">
        <div className="w-[22px] h-[22px] rounded-md bg-bg-2 border border-line flex items-center justify-center text-pos text-[11px]">
          $
        </div>
        <div>
          <div className="text-[10px] text-fg-2">Payroll</div>
          <div className="font-mono text-[11px] font-medium text-pos tabular-nums">
            + $3,200
          </div>
        </div>
      </div>
      <div className="absolute top-[60%] -left-2 z-[3] bg-bg-1 border border-line rounded-xl px-2.5 py-2 flex items-center gap-2 text-[11px]">
        <div className="w-[22px] h-[22px] rounded-md bg-bg-2 border border-line flex items-center justify-center text-[11px]">
          🛒
        </div>
        <div>
          <div className="text-[10px] text-fg-2">Trader Joe&apos;s</div>
          <div className="font-mono text-[11px] font-medium text-neg tabular-nums">
            − $62.14
          </div>
        </div>
      </div>
    </div>
  );
}

function BudgetArt() {
  const rows = [
    { cat: "Groceries", amt: "$214 / $400", pct: 53, color: "bg-pos" },
    { cat: "Food & Drink", amt: "$182 / $200", pct: 91, color: "bg-warn" },
    { cat: "Transport", amt: "$48 / $150", pct: 32, color: "bg-fg-0" },
    { cat: "Entertainment", amt: "$24 / $80", pct: 30, color: "bg-fg-0" },
  ];
  return (
    <div className="w-[280px] p-6 bg-bg-1 border border-line rounded-[20px] flex flex-col gap-4">
      {rows.map((r) => (
        <div key={r.cat} className="flex flex-col gap-2">
          <div className="flex justify-between items-baseline text-[12px]">
            <span className="font-medium">{r.cat}</span>
            <span className="font-mono text-[11px] text-fg-2">{r.amt}</span>
          </div>
          <div className="h-1.5 bg-bg-3 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${r.color}`}
              style={{ width: `${r.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function InsightsArt() {
  const bars = [40, 62, 28, 78, 92, 54, 22];
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  return (
    <div className="w-[280px] p-6 bg-bg-1 border border-line rounded-[20px] flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] text-fg-2 uppercase tracking-[0.06em]">
            Income
          </div>
          <div className="font-mono text-[18px] font-medium text-pos mt-1 tabular-nums">
            + $3,200
          </div>
        </div>
        <div>
          <div className="text-[10px] text-fg-2 uppercase tracking-[0.06em]">
            Expenses
          </div>
          <div className="font-mono text-[18px] font-medium text-neg mt-1 tabular-nums">
            − $1,876
          </div>
        </div>
      </div>
      <div className="flex items-end gap-1.5 h-20">
        {bars.map((v, i) => (
          <div
            key={i}
            className={`flex-1 rounded-[3px] ${
              i === 4 ? "bg-brand" : i >= 5 ? "bg-bg-3" : "bg-fg-0"
            }`}
            style={{ height: `${v}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-fg-2 font-mono">
        {days.map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
    </div>
  );
}

function OnbArt({ kind }: { kind: "balance" | "budget" | "insights" }) {
  if (kind === "balance") return <BalanceArt />;
  if (kind === "budget") return <BudgetArt />;
  return <InsightsArt />;
}

export function OnboardingCarousel() {
  const router = useRouter();
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  const tAuth = useTranslations("auth");

  const SLIDES = [
    {
      title: (<>{t("slide1Title")} <span className="text-brand">{t("slide1Highlight")}</span></>),
      body: t("slide1Body"),
      art: "balance" as const,
    },
    {
      title: (<>{t("slide2Title")} <span className="text-brand">{t("slide2Highlight")}</span></>),
      body: t("slide2Body"),
      art: "budget" as const,
    },
    {
      title: (<>{t("slide3Title")} <span className="text-brand">{t("slide3Highlight")}</span></>),
      body: t("slide3Body"),
      art: "insights" as const,
    },
  ];

  const [current, setCurrent] = React.useState(0);
  const touchStartX = React.useRef(0);
  const isLast = current === SLIDES.length - 1;
  const slide = SLIDES[current];

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    router.push("/login");
  };

  const next = () => {
    if (isLast) {
      finish();
    } else {
      setCurrent(current + 1);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const delta = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(delta) > 50) {
      if (delta > 0 && current < SLIDES.length - 1) setCurrent(current + 1);
      else if (delta < 0 && current > 0) setCurrent(current - 1);
    }
  };

  return (
    <div
      className="flex flex-col min-h-dvh bg-bg-0 px-6 pb-8 pt-3"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between h-9">
        <Logo size={24} />
        <button
          onClick={finish}
          className="text-[13px] text-fg-2 hover:text-fg-0 cursor-pointer px-1 py-2"
        >
          {tCommon("skip")}
        </button>
      </div>

      {/* Art */}
      <div className="flex-1 flex items-center justify-center py-8 min-h-[280px]">
        <OnbArt kind={slide.art} />
      </div>

      {/* Copy */}
      <div className="pb-3">
        <h2 className="text-[28px] leading-[1.15] font-semibold tracking-[-0.02em] text-balance">
          {slide.title}
        </h2>
        <p className="text-[15px] text-fg-1 leading-[1.5] mt-3 max-w-[32ch]">
          {slide.body}
        </p>
      </div>

      {/* Dots */}
      <div className="flex gap-1.5 my-6">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-1.5 rounded-full transition-all duration-200 ${
              i === current
                ? "w-[22px] bg-brand"
                : "w-1.5 bg-bg-3"
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      {/* CTA */}
      <div className="flex gap-2.5">
        {current > 0 && (
          <Button
            variant="outline"
            onClick={() => setCurrent(current - 1)}
            className="w-[88px] flex-shrink-0"
          >
            {tCommon("back")}
          </Button>
        )}
        <Button onClick={next} className="flex-1">
          {isLast ? tAuth("getStarted") : tCommon("next")}
        </Button>
      </div>
    </div>
  );
}
