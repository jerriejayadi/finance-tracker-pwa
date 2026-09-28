"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------------
 * ImportScreen — full-height shell for the bulk import flow.
 * <ImportScreen>
 *   <ImportScreen.Header />  <ImportScreen.Stepper />
 *   <ImportScreen.Body> … </ImportScreen.Body>
 *   <ImportScreen.Footer> … </ImportScreen.Footer>
 * </ImportScreen>
 * ------------------------------------------------------------------------- */

function ImportScreenRoot({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("bg-bg-0 flex h-dvh min-h-0 flex-col", className)}
      {...props}
    />
  );
}

interface HeaderProps {
  title: string;
  subtitle?: string;
  meta?: string;
  backIcon: React.ReactNode;
  backLabel: string;
  onBack: () => void;
}

function Header({ title, subtitle, meta, backIcon, backLabel, onBack }: HeaderProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <button
        type="button"
        onClick={onBack}
        aria-label={backLabel}
        className="bg-bg-1 border-line text-fg-1 hover:bg-bg-2 flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors"
      >
        {backIcon}
      </button>
      <div className="min-w-0 flex-1">
        <div className="text-fg-0 text-[17px] font-semibold">{title}</div>
        {subtitle && (
          <div className="text-fg-2 mt-0.5 font-mono text-[11px]">{subtitle}</div>
        )}
      </div>
      {meta && <span className="text-fg-2 font-mono text-[12px]">{meta}</span>}
    </div>
  );
}

function Stepper({ step, total }: { step: number; total: number }) {
  return (
    <div
      className="grid gap-1.5 px-5 pb-4"
      style={{ gridTemplateColumns: `repeat(${total}, 1fr)` }}
    >
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-[3px] rounded-full transition-colors",
            step > i ? "bg-brand" : "bg-bg-3",
          )}
        />
      ))}
    </div>
  );
}

function Body({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "hide-scrollbar flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto px-4 pb-4 [&>*]:flex-shrink-0",
        className,
      )}
      {...props}
    />
  );
}

function Footer({
  className,
  columns = "1fr 2fr",
  ...props
}: React.ComponentProps<"div"> & { columns?: string }) {
  return (
    <div
      className={cn(
        "border-line grid flex-shrink-0 gap-2 border-t px-4 pt-3 pb-[max(20px,env(safe-area-inset-bottom))]",
        className,
      )}
      style={{ gridTemplateColumns: columns }}
      {...props}
    />
  );
}

function FooterButton({
  variant = "primary",
  className,
  ...props
}: React.ComponentProps<"button"> & { variant?: "primary" | "secondary" }) {
  return (
    <button
      type="button"
      className={cn(
        "flex h-12 cursor-pointer items-center justify-center rounded-sm text-[14px] font-semibold transition-colors",
        variant === "primary"
          ? "bg-brand text-brand-ink hover:bg-brand-hi disabled:bg-bg-3 disabled:text-fg-2 disabled:cursor-not-allowed"
          : "bg-bg-2 border-line text-fg-0 hover:bg-bg-3 border",
        className,
      )}
      {...props}
    />
  );
}

function Eyebrow({ children, meta }: { children: React.ReactNode; meta?: React.ReactNode }) {
  return (
    <div className="text-fg-2 flex items-baseline justify-between px-1 pt-2.5 text-[10px] font-semibold tracking-[0.08em] uppercase">
      <span>{children}</span>
      {meta !== undefined && (
        <span className="text-fg-1 font-mono font-normal tracking-normal normal-case">
          {meta}
        </span>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-fg-0 px-1 pt-3 text-[15px] font-semibold">{children}</div>;
}

/** Bordered card that stacks rows with hairline dividers. */
function Panel({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "bg-bg-1 border-line overflow-hidden rounded-md border [&>*]:border-line-soft [&>*:not(:last-child)]:border-b",
        className,
      )}
      {...props}
    />
  );
}

function NewTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="bg-brand-soft text-brand ml-1.5 rounded-full px-1.5 py-px text-[9px] font-medium">
      {children}
    </span>
  );
}

export const ImportScreen = Object.assign(ImportScreenRoot, {
  Header,
  Stepper,
  Body,
  Footer,
  FooterButton,
  Eyebrow,
  SectionTitle,
  Panel,
  NewTag,
});
