"use client";

import * as React from "react";
import { Check, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { fmtIDR } from "@/lib/format";
import type { ImportTransactionsResult } from "@/services/import/import.service";

interface ImportResultProps {
  /** Rows being inserted — shown while importing */
  total: number;
  /** 0–100 */
  progress: number;
  result: ImportTransactionsResult | null;
  /** Accounts the imported rows landed in */
  accountCount: number;
  /** Rows dropped at the review step */
  skippedRows: number;
}

export function ImportResult({ total, progress, result, accountCount, skippedRows }: ImportResultProps) {
  const t = useTranslations("import");
  const tCommon = useTranslations("common");
  const done = !!result;
  const count = result?.inserted ?? total;
  const skipped = skippedRows + (result?.skippedNoAccount ?? 0);

  return (
    <div className="flex flex-1 flex-col items-center overflow-y-auto px-6 pt-24 text-center">
      <div
        className={cn(
          "mb-5 grid h-16 w-16 place-items-center rounded-[20px]",
          done ? "bg-pos-soft text-pos" : "bg-brand-soft text-brand",
        )}
      >
        {done ? <Check size={28} strokeWidth={2} /> : <Upload size={24} strokeWidth={1.75} />}
      </div>
      <h2 className="text-fg-0 m-0 text-[22px] font-semibold tracking-[-0.01em]">
        {done ? t("complete") : t("importing")}
      </h2>
      <p className="text-fg-1 mt-2 mb-6 max-w-[30ch] text-[14px]">
        {done
          ? t("completeDesc", { count, accounts: accountCount })
          : t("importingDesc", { count })}
      </p>

      <div className="bg-bg-3 h-[5px] w-full overflow-hidden rounded-full">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-300 ease-out",
            done ? "bg-pos" : "bg-brand",
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="text-fg-2 mt-1.5 flex w-full justify-between font-mono text-[11px]">
        <span>
          {Math.round((count * progress) / 100)} / {count}
        </span>
        <span>{Math.round(progress)}%</span>
      </div>

      {result && (
        <div className="bg-bg-1 border-line [&>*]:border-line-soft mt-6 w-full overflow-hidden rounded-md border text-left [&>*:not(:last-child)]:border-b">
          <SummaryRow label={tCommon("income")}>
            <b className="text-pos font-medium">+ {fmtIDR(result.totalIncome)}</b>
          </SummaryRow>
          <SummaryRow label={tCommon("expenses")}>
            <b className="text-fg-0 font-medium">{"−"} {fmtIDR(result.totalExpense)}</b>
          </SummaryRow>
          <SummaryRow label={t("accountsCreated")}>
            <b className="text-fg-0 font-medium">{result.accountsCreated}</b>
          </SummaryRow>
          <SummaryRow label={t("categoriesCreated")}>
            <b className="text-fg-0 font-medium">{result.categoriesCreated}</b>
          </SummaryRow>
          {result.budgetsCreated > 0 && (
            <SummaryRow label={t("budgetsCreated")}>
              <b className="text-fg-0 font-medium">{result.budgetsCreated}</b>
            </SummaryRow>
          )}
          {result.uncategorized > 0 && (
            <SummaryRow label={t("uncategorized")}>
              <b className="text-fg-0 font-medium">{t("rowsCount", { count: result.uncategorized })}</b>
            </SummaryRow>
          )}
          {skipped > 0 && (
            <SummaryRow label={t("skipped")}>
              <b className="text-warn font-medium">{t("rowsCount", { count: skipped })}</b>
            </SummaryRow>
          )}
        </div>
      )}
    </div>
  );
}

function SummaryRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="text-fg-2 flex justify-between px-3.5 py-3 font-mono text-[13px] [&>span]:font-sans">
      <span>{label}</span>
      {children}
    </div>
  );
}
