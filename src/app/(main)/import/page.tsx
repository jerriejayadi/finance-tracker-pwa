"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronLeft, X } from "lucide-react";
import { toast } from "sonner";
import { ImportScreen } from "@/components/import/import-screen";
import { UploadStep } from "@/components/import/upload-step";
import { ReviewStep } from "@/components/import/review-step";
import { MatchStep } from "@/components/import/match-step";
import { ImportResult } from "@/components/import/import-result";
import { DefaultAccountDrawer } from "@/components/import/default-account-drawer";
import {
  ImportParseError,
  parseImportFile,
  type ImportParseErrorCode,
  type ParsedImportFile,
} from "@/lib/import/parse-import-file";
import {
  guessAccountType,
  IMPORT_ICON_PALETTE,
  matchImportRows,
  nameKey,
  previewImportBudgets,
} from "@/lib/import/match-import-rows";
import { useGetAccounts } from "@/services/accounts/accounts.hooks";
import { useGetCategories } from "@/services/categories/categories.hooks";
import { useGetProfile } from "@/services/profile/profile.hooks";
import { useImportTransactions } from "@/services/import/import.hooks";
import type {
  ImportNewAccount,
  ImportNewCategory,
  ImportTransactionsResult,
} from "@/services/import/import.service";

type Step = 1 | 2 | 3;
type Phase = "form" | "importing" | "done";

const ERROR_KEYS: Record<ImportParseErrorCode, string> = {
  unsupported: "errUnsupported",
  tooLarge: "errTooLarge",
  tooManyRows: "errTooManyRows",
  empty: "errEmpty",
  missingColumns: "errMissingColumns",
  unreadable: "errUnreadable",
};

export default function BulkImportPage() {
  const router = useRouter();
  const t = useTranslations("import");
  const tCommon = useTranslations("common");

  const [step, setStep] = React.useState<Step>(1);
  const [phase, setPhase] = React.useState<Phase>("form");
  const [file, setFile] = React.useState<ParsedImportFile | null>(null);
  const [failedName, setFailedName] = React.useState<string | null>(null);
  const [parseError, setParseError] = React.useState<string | null>(null);
  const [parsing, setParsing] = React.useState(false);
  const [defaultAccountId, setDefaultAccountId] = React.useState<string | null>(null);
  const [accountPickerOpen, setAccountPickerOpen] = React.useState(false);
  // User edits to new accounts/categories, keyed by lowercase name
  const [accountEdits, setAccountEdits] = React.useState<Record<string, Partial<ImportNewAccount>>>({});
  const [categoryEdits, setCategoryEdits] = React.useState<Record<string, Partial<ImportNewCategory>>>({});
  const [createBudgets, setCreateBudgets] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [result, setResult] = React.useState<ImportTransactionsResult | null>(null);

  const { data: accounts = [], isPending: accountsPending } = useGetAccounts();
  const { data: categories = [], isPending: categoriesPending } = useGetCategories();
  const { data: profile } = useGetProfile();
  const importMutation = useImportTransactions();

  const activeAccounts = React.useMemo(() => accounts.filter((a) => a.is_active), [accounts]);
  const defaultAccount =
    activeAccounts.find((a) => a.id === defaultAccountId) ?? activeAccounts[0] ?? null;

  const matches = React.useMemo(
    () => matchImportRows(file?.rows ?? [], accounts, categories),
    [file, accounts, categories],
  );

  const hasFallbackAccount = !!defaultAccount;
  const newAccounts = React.useMemo<ImportNewAccount[]>(
    () =>
      matches.newAccounts.map((a) => ({
        name: a.name,
        type: guessAccountType(a.name),
        create: true,
        ...accountEdits[nameKey(a.name)],
        // No existing account to fall back to → must be created
        ...(hasFallbackAccount ? {} : { create: true }),
      })),
    [matches, accountEdits, hasFallbackAccount],
  );
  const newCategories = React.useMemo<ImportNewCategory[]>(
    () =>
      matches.newCategories.map((c, i) => ({
        name: c.name,
        icon: IMPORT_ICON_PALETTE[i % IMPORT_ICON_PALETTE.length],
        kind: c.kind,
        create: true,
        ...categoryEdits[nameKey(c.name)],
      })),
    [matches, categoryEdits],
  );

  const categoryInfo = React.useCallback(
    (name: string) => {
      const key = nameKey(name);
      const existing = categories.find((c) => nameKey(c.name) === key);
      if (existing) return { icon: existing.icon, isNew: false };
      const draft = newCategories.find((c) => nameKey(c.name) === key);
      return draft?.create ? { icon: draft.icon, isNew: true } : null;
    },
    [categories, newCategories],
  );

  const budgetMonths = React.useMemo(
    () => previewImportBudgets(file?.rows ?? [], (name) => !!categoryInfo(name)),
    [file, categoryInfo],
  );

  const validRows = file?.rows.length ?? 0;

  /* ---- File handling ---- */

  const handleSelect = async (f: File) => {
    setParsing(true);
    setParseError(null);
    setFile(null);
    setFailedName(f.name);
    setAccountEdits({});
    setCategoryEdits({});
    try {
      setFile(await parseImportFile(f));
      setFailedName(null);
    } catch (e) {
      const code = e instanceof ImportParseError ? e.code : "unreadable";
      const fields =
        e instanceof ImportParseError ? e.fields.map((f) => tField(f)).join(", ") : "";
      setParseError(t(ERROR_KEYS[code], { fields }));
    } finally {
      setParsing(false);
    }
  };

  const tField = (f: string) =>
    t(`col${f.charAt(0).toUpperCase()}${f.slice(1)}` as "colDate");

  const handleClear = () => {
    setFile(null);
    setFailedName(null);
    setParseError(null);
  };

  /* ---- Import ---- */

  const accountCount = React.useMemo(() => {
    const keys = new Set<string>();
    const matchedKeys = new Set(matches.matchedAccounts.map((m) => nameKey(m.account.name)));
    const createdKeys = new Set(newAccounts.filter((a) => a.create).map((a) => nameKey(a.name)));
    for (const r of file?.rows ?? []) {
      const k = nameKey(r.account);
      if (matchedKeys.has(k) || createdKeys.has(k)) keys.add(k);
      else if (defaultAccount) keys.add(nameKey(defaultAccount.name));
    }
    return keys.size;
  }, [file, matches, newAccounts, defaultAccount]);

  const handleImport = () => {
    if (!file) return;
    setPhase("importing");
    setProgress(0);
    importMutation.mutate(
      {
        rows: file.rows,
        currency: profile?.currency_preference ?? "IDR",
        defaultAccountId: defaultAccount?.id ?? null,
        accounts,
        categories,
        newAccounts,
        newCategories,
        createBudgets: createBudgets && budgetMonths.length > 0,
        onProgress: (done, total) => setProgress(total ? (done / total) * 100 : 100),
      },
      {
        onSuccess: (res) => {
          setProgress(100);
          setResult(res);
          setPhase("done");
        },
        onError: (err) => {
          toast.error(t("failed", { message: err.message }));
          setPhase("form");
        },
      },
    );
  };

  /* ---- Render ---- */

  if (phase !== "form") {
    return (
      <ImportScreen>
        <ImportResult
          total={validRows}
          progress={progress}
          result={result}
          accountCount={accountCount}
          skippedRows={file?.issues.length ?? 0}
        />
        {phase === "done" && (
          <ImportScreen.Footer columns="1fr 1fr">
            <ImportScreen.FooterButton variant="secondary" onClick={() => router.push("/")}>
              {t("done")}
            </ImportScreen.FooterButton>
            <ImportScreen.FooterButton onClick={() => router.push("/history")}>
              {t("viewHistory")}
            </ImportScreen.FooterButton>
          </ImportScreen.Footer>
        )}
      </ImportScreen>
    );
  }

  const subtitles = { 1: t("stepUpload"), 2: t("stepReview"), 3: t("stepMatch") };
  const lookupsPending = accountsPending || categoriesPending;

  return (
    <ImportScreen>
      <ImportScreen.Header
        title={t("title")}
        subtitle={subtitles[step]}
        meta={`${step}/3`}
        backLabel={step === 1 ? tCommon("cancel") : tCommon("back")}
        backIcon={
          step === 1 ? <X size={14} strokeWidth={2} /> : <ChevronLeft size={16} strokeWidth={2} />
        }
        onBack={() => (step === 1 ? router.push("/") : setStep((step - 1) as Step))}
      />
      <ImportScreen.Stepper step={step} total={3} />

      <ImportScreen.Body>
        {step === 1 && (
          <UploadStep
            file={file}
            failedName={failedName}
            error={parseError}
            loading={parsing}
            onSelect={handleSelect}
            onClear={handleClear}
          />
        )}
        {step === 2 && file && (
          <ReviewStep
            file={file}
            accounts={activeAccounts}
            defaultAccount={defaultAccount}
            noAccountRows={matches.noAccountRows}
            onPickAccount={() => setAccountPickerOpen(true)}
            categoryInfo={categoryInfo}
          />
        )}
        {step === 3 && file && (
          <MatchStep
            matches={matches}
            newAccounts={newAccounts}
            onNewAccountsChange={(next) =>
              setAccountEdits(Object.fromEntries(next.map((a) => [nameKey(a.name), a])))
            }
            newCategories={newCategories}
            onNewCategoriesChange={(next) =>
              setCategoryEdits(Object.fromEntries(next.map((c) => [nameKey(c.name), c])))
            }
            defaultAccountName={defaultAccount?.name ?? null}
            budgetMonths={budgetMonths}
            createBudgets={createBudgets}
            onCreateBudgetsChange={setCreateBudgets}
          />
        )}
      </ImportScreen.Body>

      <ImportScreen.Footer>
        <ImportScreen.FooterButton variant="secondary" onClick={() => router.push("/")}>
          {tCommon("cancel")}
        </ImportScreen.FooterButton>
        {step === 1 && (
          <ImportScreen.FooterButton
            disabled={!file || parsing || lookupsPending}
            onClick={() => setStep(2)}
          >
            {t("continue")}
          </ImportScreen.FooterButton>
        )}
        {step === 2 && (
          <ImportScreen.FooterButton disabled={validRows === 0} onClick={() => setStep(3)}>
            {t("continueRows", { count: validRows })}
          </ImportScreen.FooterButton>
        )}
        {step === 3 && (
          <ImportScreen.FooterButton disabled={validRows === 0} onClick={handleImport}>
            {t("importN", { count: validRows })}
          </ImportScreen.FooterButton>
        )}
      </ImportScreen.Footer>

      <DefaultAccountDrawer
        open={accountPickerOpen}
        onOpenChange={setAccountPickerOpen}
        accounts={activeAccounts}
        selectedId={defaultAccount?.id ?? null}
        onPick={setDefaultAccountId}
      />
    </ImportScreen>
  );
}
