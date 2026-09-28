"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { format } from "date-fns";
import { getDateLocale } from "@/lib/date-locale";
import { cn } from "@/lib/utils";
import { Toggle } from "@/components/ui/toggle";
import {
  accountTypeIcon,
  IMPORT_ACCOUNT_TYPES,
  IMPORT_ICON_PALETTE,
  type ImportBudgetMonth,
  type ImportMatches,
} from "@/lib/import/match-import-rows";
import type { ImportNewAccount, ImportNewCategory } from "@/services/import/import.service";
import { ImportScreen } from "./import-screen";

/* ---------------------------------------------------------------------------
 * MatchItem — one account/category row.
 * <MatchItem new off>
 *   <MatchItem.Avatar onClick>☕</MatchItem.Avatar>
 *   <MatchItem.Body title subtitle tag />
 *   <MatchItem.Linked /> | <Toggle />
 * </MatchItem>
 * ------------------------------------------------------------------------- */

const MatchItemContext = React.createContext({ isNew: false, off: false });

function MatchItemRoot({
  isNew = false,
  off = false,
  children,
}: {
  isNew?: boolean;
  off?: boolean;
  children: React.ReactNode;
}) {
  return (
    <MatchItemContext.Provider value={{ isNew, off }}>
      <div className="flex items-center gap-3 px-3.5 py-3">{children}</div>
    </MatchItemContext.Provider>
  );
}

function MatchAvatar({
  children,
  onClick,
  label,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  label?: string;
}) {
  const { isNew, off } = React.useContext(MatchItemContext);
  const className = cn(
    "grid h-9 w-9 flex-shrink-0 place-items-center rounded-md border text-[16px]",
    isNew && !off ? "bg-brand-soft border-brand border-dashed" : "bg-bg-2 border-line",
    off && "opacity-50",
    onClick && "cursor-pointer",
  );
  return onClick ? (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={className}>
      {children}
    </button>
  ) : (
    <div className={className}>{children}</div>
  );
}

function MatchBody({
  title,
  tag,
  children,
}: {
  title: string;
  tag?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { off } = React.useContext(MatchItemContext);
  return (
    <div className="min-w-0 flex-1">
      <div className={cn("flex items-center text-[14px] font-medium", off ? "text-fg-2" : "text-fg-0")}>
        <span className="truncate">{title}</span>
        {tag}
      </div>
      <div className="text-fg-2 mt-0.5 text-[11px]">{children}</div>
    </div>
  );
}

function MatchLinked({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-pos inline-flex items-center gap-1 text-[11px] font-medium">
      <Check size={11} strokeWidth={2} /> {children}
    </span>
  );
}

const MatchItem = Object.assign(MatchItemRoot, {
  Avatar: MatchAvatar,
  Body: MatchBody,
  Linked: MatchLinked,
});

/* ------------------------------------------------------------------------- */

interface MatchStepProps {
  matches: ImportMatches;
  newAccounts: ImportNewAccount[];
  onNewAccountsChange: (next: ImportNewAccount[]) => void;
  newCategories: ImportNewCategory[];
  onNewCategoriesChange: (next: ImportNewCategory[]) => void;
  /** Fallback for accounts switched off; null when the user has no accounts */
  defaultAccountName: string | null;
  budgetMonths: ImportBudgetMonth[];
  createBudgets: boolean;
  onCreateBudgetsChange: (next: boolean) => void;
}

export function MatchStep({
  matches,
  newAccounts,
  onNewAccountsChange,
  newCategories,
  onNewCategoriesChange,
  defaultAccountName,
  budgetMonths,
  createBudgets,
  onCreateBudgetsChange,
}: MatchStepProps) {
  const t = useTranslations("import");
  const dateLocale = getDateLocale(useLocale());
  const rowsOf = (list: { name: string; rows: number }[], name: string) =>
    list.find((x) => x.name === name)?.rows ?? 0;

  const updateAccount = (idx: number, patch: Partial<ImportNewAccount>) =>
    onNewAccountsChange(newAccounts.map((a, i) => (i === idx ? { ...a, ...patch } : a)));
  const updateCategory = (idx: number, patch: Partial<ImportNewCategory>) =>
    onNewCategoriesChange(newCategories.map((c, i) => (i === idx ? { ...c, ...patch } : c)));

  const created = newCategories.filter((c) => c.create).length;
  const hasAccounts = newAccounts.length + matches.matchedAccounts.length > 0;
  const hasCategories = newCategories.length + matches.matchedCategories.length > 0;

  return (
    <>
      <p className="text-fg-1 mx-1 text-[13px] leading-normal text-pretty">{t("matchHelp")}</p>

      {!hasAccounts && !hasCategories && (
        <div className="text-fg-2 py-6 text-center text-[13px]">{t("nothingToMatch")}</div>
      )}

      {hasAccounts && (
        <>
          <ImportScreen.SectionTitle>{t("accounts")}</ImportScreen.SectionTitle>
          <ImportScreen.Panel>
            {newAccounts.map((a, idx) => {
              const rows = rowsOf(matches.newAccounts, a.name);
              // Without an existing account there is no fallback, so new accounts stay on
              const canSwitchOff = !!defaultAccountName;
              return (
                <MatchItem key={a.name} isNew off={!a.create}>
                  <MatchItem.Avatar>{accountTypeIcon(a.type)}</MatchItem.Avatar>
                  <MatchItem.Body
                    title={a.name}
                    tag={a.create && <ImportScreen.NewTag>{t("newTag")}</ImportScreen.NewTag>}
                  >
                    {t("rowsCount", { count: rows })} ·{" "}
                    {a.create ? (
                      <button
                        type="button"
                        aria-label={t("changeType")}
                        className="text-brand inline-flex cursor-pointer items-center gap-0.5 font-mono"
                        onClick={() => {
                          const i = IMPORT_ACCOUNT_TYPES.findIndex((x) => x.value === a.type);
                          updateAccount(idx, {
                            type: IMPORT_ACCOUNT_TYPES[(i + 1) % IMPORT_ACCOUNT_TYPES.length].value,
                          });
                        }}
                      >
                        {a.type} <ChevronDown size={10} strokeWidth={2} />
                      </button>
                    ) : (
                      t("goesTo", { account: defaultAccountName ?? "" })
                    )}
                  </MatchItem.Body>
                  {canSwitchOff && (
                    <Toggle checked={a.create} onCheckedChange={(create) => updateAccount(idx, { create })} />
                  )}
                </MatchItem>
              );
            })}
            {matches.matchedAccounts.map(({ account, rows }) => (
              <MatchItem key={account.id}>
                <MatchItem.Avatar>{account.icon || accountTypeIcon(account.type)}</MatchItem.Avatar>
                <MatchItem.Body title={account.name}>{t("rowsCount", { count: rows })}</MatchItem.Body>
                <MatchItem.Linked>{t("linked")}</MatchItem.Linked>
              </MatchItem>
            ))}
          </ImportScreen.Panel>
        </>
      )}

      {hasCategories && (
        <>
          <ImportScreen.SectionTitle>{t("categories")}</ImportScreen.SectionTitle>

          {newCategories.length > 0 && (
            <>
              <ImportScreen.Eyebrow meta={t("createdMeta", { created, total: newCategories.length })}>
                {t("willBeCreated")}
              </ImportScreen.Eyebrow>
              <ImportScreen.Panel>
                {newCategories.map((c, idx) => (
                  <MatchItem key={c.name} isNew off={!c.create}>
                    <MatchItem.Avatar
                      label={t("changeIcon")}
                      onClick={
                        c.create
                          ? () => {
                              const i = IMPORT_ICON_PALETTE.indexOf(c.icon);
                              updateCategory(idx, {
                                icon: IMPORT_ICON_PALETTE[(i + 1) % IMPORT_ICON_PALETTE.length],
                              });
                            }
                          : undefined
                      }
                    >
                      {c.icon}
                    </MatchItem.Avatar>
                    <MatchItem.Body
                      title={c.name}
                      tag={c.create && <ImportScreen.NewTag>{t("newTag")}</ImportScreen.NewTag>}
                    >
                      {t("rowsCount", { count: rowsOf(matches.newCategories, c.name) })}
                      {!c.create && ` · ${t("asUncategorized")}`}
                    </MatchItem.Body>
                    <Toggle checked={c.create} onCheckedChange={(create) => updateCategory(idx, { create })} />
                  </MatchItem>
                ))}
              </ImportScreen.Panel>
            </>
          )}

          {matches.matchedCategories.length > 0 && (
            <>
              <ImportScreen.Eyebrow meta={matches.matchedCategories.length}>
                {t("matchedExisting")}
              </ImportScreen.Eyebrow>
              <ImportScreen.Panel>
                {matches.matchedCategories.map(({ category, rows }) => (
                  <MatchItem key={category.id}>
                    <MatchItem.Avatar>{category.icon}</MatchItem.Avatar>
                    <MatchItem.Body title={category.name}>{t("rowsCount", { count: rows })}</MatchItem.Body>
                    <MatchItem.Linked>{t("linked")}</MatchItem.Linked>
                  </MatchItem>
                ))}
              </ImportScreen.Panel>
            </>
          )}
        </>
      )}

      <ImportScreen.SectionTitle>{t("budgets")}</ImportScreen.SectionTitle>
      <ImportScreen.Panel>
        <MatchItem isNew={budgetMonths.length > 0} off={!createBudgets || budgetMonths.length === 0}>
          <MatchItem.Avatar>📊</MatchItem.Avatar>
          <MatchItem.Body title={t("budgetsToggle")}>
            {budgetMonths.length === 0
              ? t("budgetsNone")
              : createBudgets
                ? t("budgetsHint")
                : t("budgetsOff")}
          </MatchItem.Body>
          {budgetMonths.length > 0 && (
            <Toggle checked={createBudgets} onCheckedChange={onCreateBudgetsChange} />
          )}
        </MatchItem>
        {createBudgets &&
          budgetMonths.map((m) => (
            <div key={m.month} className="flex items-center justify-between px-3.5 py-2.5 text-[13px]">
              <span className="text-fg-0">
                {format(new Date(`${m.month}-01T00:00:00`), "MMM yyyy", { locale: dateLocale })}
              </span>
              <span className="text-fg-2 font-mono text-[12px]">
                {t("budgetMonthMeta", { count: m.categories })}
              </span>
            </div>
          ))}
      </ImportScreen.Panel>
    </>
  );
}
