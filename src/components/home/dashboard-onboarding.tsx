"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Check, ChevronRight } from "lucide-react";

interface StepConfig {
  title: string;
  subtitle: string;
  icon: string;
  completed: boolean;
}

interface DashboardOnboardingProps {
  currencyLabel: string;
  hasBudgets: boolean;
  onChangeCurrency: () => void;
  onCreateBudget: () => void;
  onAddTransaction: () => void;
}

function StepCard({
  step,
  active,
  onClick,
}: {
  step: StepConfig;
  active: boolean;
  onClick: () => void;
}) {
  const isUpcoming = !step.completed && !active;

  return (
    <button
      onClick={onClick}
      disabled={isUpcoming}
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3.5 text-left transition-colors",
        step.completed && "border-brand/25 bg-bg-1",
        active && "border-brand bg-bg-1 cursor-pointer",
        isUpcoming && "border-line bg-bg-1 opacity-50",
        !isUpcoming && "cursor-pointer",
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-[18px]",
          step.completed && "bg-brand-soft",
          active && "bg-brand-soft",
          isUpcoming && "bg-bg-2",
        )}
      >
        {step.icon}
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            "text-[13px] font-medium",
            step.completed && "text-fg-1",
            active && "text-fg-0",
            isUpcoming && "text-fg-2",
          )}
        >
          {step.title}
        </div>
        <div
          className={cn(
            "text-[11px] mt-0.5",
            isUpcoming ? "text-fg-3" : "text-fg-2",
          )}
        >
          {step.subtitle}
        </div>
      </div>
      {step.completed && (
        <div className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-brand">
          <Check size={12} strokeWidth={2.5} className="text-brand-ink" />
        </div>
      )}
      {active && (
        <ChevronRight
          size={16}
          strokeWidth={1.75}
          className="flex-shrink-0 text-brand"
        />
      )}
    </button>
  );
}

export function DashboardOnboarding({
  currencyLabel,
  hasBudgets,
  onChangeCurrency,
  onCreateBudget,
  onAddTransaction,
}: DashboardOnboardingProps) {
  const steps: StepConfig[] = [
    {
      title: "Choose currency",
      subtitle: `Already set to ${currencyLabel}`,
      icon: "💱",
      completed: true,
    },
    {
      title: "Define budgets",
      subtitle: hasBudgets ? "Budget created" : "Set monthly limits",
      icon: "📊",
      completed: hasBudgets,
    },
    {
      title: "Add first transaction",
      subtitle: "Log your first expense",
      icon: "💸",
      completed: false,
    },
  ];

  const handlers = [onChangeCurrency, onCreateBudget, onAddTransaction];

  return (
    <div className="flex flex-col items-center px-5 pt-4">
      <div className="text-[28px] mb-2">👋</div>
      <h2 className="text-[20px] font-semibold text-fg-0 text-center">
        Let&apos;s set you up
      </h2>
      <p className="text-[13px] text-fg-2 mt-1 mb-5">
        3 quick steps to get started
      </p>

      <div className="flex gap-1.5 mb-6">
        {steps.map((s, i) => (
          <div
            key={i}
            className={cn(
              "h-[5px] rounded-full transition-all",
              s.completed ? "w-[22px] bg-brand" : "w-[5px] bg-bg-3",
            )}
          />
        ))}
      </div>

      <div className="flex w-full flex-col gap-2">
        {steps.map((step, i) => {
          const active =
            !step.completed &&
            (i === 0 || steps.slice(0, i).every((s) => s.completed) || i === 2);

          return (
            <StepCard
              key={i}
              step={step}
              active={active}
              onClick={handlers[i]}
            />
          );
        })}
      </div>
    </div>
  );
}
