"use client";

import * as React from "react";
import { AlertTriangle, ArrowRight, Check, ChevronDown, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { fmtIDR, fmtIDRShort } from "@/lib/format";
import type { ImportIssueCode, ParsedImportFile } from "@/lib/import/parse-import-file";
import { accountTypeIcon, nameKey } from "@/lib/import/match-import-rows";
import type { Account } from "@/services/accounts/accounts.service";
import { ImportScreen } from "./import-screen";

const PREVIEW_COUNT = 5;

const ISSUE_KEYS: Record<ImportIssueCode, string> = {
  invalidDate: "issueInvalidDate",
  emptyAmount: "issueEmptyAmount",
  invalidAmount: "issueInvalidAmount",
  invalidType: "issueInvalidType",
  transferUnsupported: "issueTransferUnsupported",
};

const FIELD_KEYS = {
  date: "colDate",
  amount: "colAmount",
  description: "colDescription",
  type: "colType",
  category: "colCategory",
  account: "colAccount",
} as const;

interface ReviewStepProps {
  file: ParsedImportFile;
  accounts: Account[];
  defaultAccount: Account | null;
  noAccountRows: number;
  onPickAccount: () => void;
  /** Resolves a file category name to its display icon, and whether it will be newly created */
  categoryInfo: (name: string) => { icon: string; isNew: boolean } | null;
}

export function ReviewStep({
  file,
  accounts,
  defaultAccount,
  noAccountRows,
  onPickAccount,
  categoryInfo,
}: ReviewStepProps) {
  const t = useTranslations("import");
  const tCommon = useTranslations("common");

  const { income, expense } = React.useMemo(
    () =>
      file.rows.reduce(
        (acc, r) => {
          if (r.type === "Income") acc.income += r.amount;
          else acc.expense += r.amount;
          return acc;
        },
        { income: 0, expense: 0 },
      ),
    [file.rows],
  );

  const accountNames = React.useMemo(
    () => new Map(accounts.map((a) => [nameKey(a.name), a.name])),
    [accounts],
  );
  const detected = file.columns.filter((c) => c.source).length;
  const preview = file.rows.slice(0, PREVIEW_COUNT);

  return (
    <>
      {/* Stats */}
      <div className="bg-bg-1 border-line grid grid-cols-[1fr_1px_1fr_1px_1fr] items-center rounded-md border py-3.5 text-center">
        <Stat label={t("rows")} value={String(file.totalRows)} />
        <div className="bg-line h-7 w-px" />
        <Stat label={tCommon("income")} value={fmtIDRShort(income)} positive />
        <div className="bg-line h-7 w-px" />
        <Stat label={tCommon("expenses")} value={fmtIDRShort(expense)} />
      </div>

      {/* Default account */}
      {noAccountRows > 0 && (
        <>
          <ImportScreen.Eyebrow meta={t("defaultAccountMeta", { count: noAccountRows })}>
            {t("defaultAccount")}
          </ImportScreen.Eyebrow>
          {accounts.length > 0 ? (
            <button
              type="button"
              onClick={onPickAccount}
              className="bg-bg-1 border-line text-fg-2 hover:bg-bg-2 flex cursor-pointer items-center gap-3 rounded-md border px-3.5 py-3 text-left transition-colors"
            >
              <div className="bg-bg-2 border-line grid h-9 w-9 place-items-center rounded-md border text-[16px]">
                {defaultAccount?.icon || accountTypeIcon(defaultAccount?.type ?? "")}
              </div>
              <div className="flex-1">
                <div className="text-fg-0 text-[14px] font-medium">
                  {defaultAccount?.name ?? t("chooseAccount")}
                </div>
                {defaultAccount && (
                  <div className="text-fg-2 mt-0.5 font-mono text-[11px]">{defaultAccount.type}</div>
                )}
              </div>
              <ChevronDown size={14} strokeWidth={1.75} />
            </button>
          ) : (
            <div className="border-warn/35 bg-warn-soft text-fg-1 rounded-md border px-3.5 py-3 text-[13px]">
              <div className="text-warn font-medium">{t("noAccounts")}</div>
              <div className="mt-0.5 text-[12px]">{t("noAccountsHint", { count: noAccountRows })}</div>
            </div>
          )}
        </>
      )}

      {/* Column mapping */}
      <ImportScreen.Eyebrow
        meta={t("columnsDetected", { found: detected, total: file.columns.length })}
      >
        {t("columns")}
      </ImportScreen.Eyebrow>
      <ImportScreen.Panel>
        {file.columns.map((c) => (
          <div key={c.field} className="text-fg-2 flex items-center gap-2.5 px-3.5 py-[11px] text-[13px]">
            <span
              className={cn(
                "w-[88px] flex-shrink-0 truncate font-mono text-[12px]",
                c.source ? "text-fg-1" : "text-fg-3",
              )}
            >
              {c.source ?? t("notFound")}
            </span>
            <ArrowRight size={12} strokeWidth={1.75} />
            <span className={cn("flex-1 font-medium", c.source ? "text-fg-0" : "text-fg-2")}>
              {t(FIELD_KEYS[c.field])}
            </span>
            <span
              className={cn(
                "grid h-[18px] w-[18px] place-items-center rounded-full",
                c.source ? "bg-pos-soft text-pos" : "bg-bg-2 text-fg-3",
              )}
            >
              {c.source ? <Check size={11} strokeWidth={2} /> : <Minus size={11} strokeWidth={2} />}
            </span>
          </div>
        ))}
      </ImportScreen.Panel>

      {/* Issues */}
      {file.issues.length > 0 && (
        <div className="border-warn/35 bg-warn-soft flex flex-col gap-1.5 rounded-md border px-3.5 py-3">
          <div className="text-warn flex items-center gap-2 text-[13px] font-medium">
            <AlertTriangle size={14} strokeWidth={1.75} />
            {t("skippedHead", { count: file.issues.length })}
          </div>
          {file.issues.map((i) => (
            <div key={i.row} className="text-fg-1 grid grid-cols-[64px_1fr_auto] gap-2 text-[12px]">
              <span className="text-fg-2 font-mono">{t("rowN", { row: i.row })}</span>
              <span>{t(ISSUE_KEYS[i.code])}</span>
              <span className="text-fg-2 max-w-[110px] truncate font-mono">{i.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <>
          <ImportScreen.Eyebrow
            meta={t("previewMeta", { shown: preview.length, total: file.rows.length })}
          >
            {t("preview")}
          </ImportScreen.Eyebrow>
          <div className="bg-bg-1 border-line rounded-md border p-1">
            {preview.map((r) => {
              const cat = r.category ? categoryInfo(r.category) : null;
              const accountName = r.account
                ? (accountNames.get(nameKey(r.account)) ?? r.account)
                : defaultAccount?.name;
              return (
                <div key={r.row} className="grid grid-cols-[36px_1fr_auto] items-center gap-3 px-2.5 py-2.5">
                  <div className="bg-bg-2 border-line grid h-9 w-9 place-items-center rounded-md border text-[16px]">
                    {cat?.icon || "·"}
                  </div>
                  <div className="min-w-0">
                    <div className="text-fg-0 truncate text-[14px] font-medium">
                      {r.description || r.category || "—"}
                    </div>
                    <div className="text-fg-2 mt-0.5 flex items-center overflow-hidden text-[12px] whitespace-nowrap">
                      <span className="truncate">{r.category || t("noCategory")}</span>
                      {cat?.isNew && <ImportScreen.NewTag>{t("newTag")}</ImportScreen.NewTag>}
                      {accountName && <span className="ml-1 truncate">· {accountName}</span>}
                    </div>
                  </div>
                  <div
                    className={cn(
                      "font-mono text-[14px] font-medium tabular-nums",
                      r.type === "Income" ? "text-pos" : "text-fg-0",
                    )}
                  >
                    {r.type === "Income" ? "+" : "−"} {fmtIDR(r.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </>
  );
}

function Stat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div>
      <div className="text-fg-2 text-[10px] font-medium tracking-[0.06em] uppercase">{label}</div>
      <div
        className={cn(
          "mt-1 font-mono text-[14px] font-medium tabular-nums",
          positive ? "text-pos" : "text-fg-0",
        )}
      >
        {value}
      </div>
    </div>
  );
}
