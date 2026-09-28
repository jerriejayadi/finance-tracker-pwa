"use client";

import * as React from "react";
import { AlertCircle, Download, Loader2, Upload, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  downloadImportTemplate,
  type ParsedImportFile,
} from "@/lib/import/parse-import-file";
import { ImportScreen } from "./import-screen";

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

interface UploadStepProps {
  file: ParsedImportFile | null;
  /** Name of a file that failed to parse, shown alongside `error` */
  failedName: string | null;
  error: string | null;
  loading: boolean;
  onSelect: (file: File) => void;
  onClear: () => void;
}

export function UploadStep({ file, failedName, error, loading, onSelect, onClear }: UploadStepProps) {
  const t = useTranslations("import");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [downloading, setDownloading] = React.useState(false);

  const howto = [
    [t("howDownload"), t("howDownloadDesc")],
    [t("howFill"), t("howFillDesc")],
    [t("howUpload"), t("howUploadDesc")],
  ];

  const templateColumns = [
    [t("colDate"), t("colDateHint")],
    [t("colAmount"), t("colAmountHint")],
    [t("colDescription"), t("colDescriptionHint")],
    [t("colType"), t("colTypeHint")],
    [t("colCategory"), t("colCategoryHint")],
    [t("colAccount"), t("colAccountHint")],
  ];

  const handleTemplate = async () => {
    setDownloading(true);
    try {
      await downloadImportTemplate();
    } finally {
      setDownloading(false);
    }
  };

  const shownName = file?.name ?? failedName;

  return (
    <>
      {/* How-to */}
      <div className="bg-bg-1 border-line flex flex-col gap-3.5 rounded-lg border p-4">
        {howto.map(([title, desc], i) => (
          <div key={i} className="relative flex items-start gap-3">
            {i < howto.length - 1 && (
              <div className="bg-line absolute top-[26px] -bottom-3 left-[11px] w-px" />
            )}
            <div className="bg-brand-soft text-brand grid h-[23px] w-[23px] flex-shrink-0 place-items-center rounded-full font-mono text-[12px] font-semibold">
              {i + 1}
            </div>
            <div>
              <div className="text-fg-0 text-[14px] font-medium">{title}</div>
              <div className="text-fg-2 mt-0.5 text-[12px] leading-[1.45]">{desc}</div>
            </div>
          </div>
        ))}
        <button
          type="button"
          onClick={handleTemplate}
          disabled={downloading}
          className="bg-brand text-brand-ink hover:bg-brand-hi mt-0.5 flex h-10 cursor-pointer items-center justify-center gap-2 rounded-sm text-[13px] font-semibold transition-colors disabled:opacity-70"
        >
          {downloading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Download size={14} strokeWidth={1.75} />
          )}
          {t("downloadTemplate")}
        </button>
      </div>

      <ImportScreen.Eyebrow>{t("yourFile")}</ImportScreen.Eyebrow>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onSelect(f);
          e.target.value = "";
        }}
      />

      {!shownName && !loading ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="border-line bg-bg-1 hover:border-brand flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-[1.5px] border-dashed px-5 py-8 text-center transition-colors"
        >
          <div className="bg-brand-soft text-brand mb-1.5 grid h-12 w-12 place-items-center rounded-lg">
            <Upload size={22} strokeWidth={1.75} />
          </div>
          <div className="text-fg-0 text-[15px] font-semibold">{t("chooseFile")}</div>
          <div className="text-fg-2 font-mono text-[12px]">{t("fileLimits")}</div>
          <span className="bg-bg-2 border-line text-fg-0 mt-3 inline-flex h-9 items-center rounded-sm border px-4 text-[13px] font-medium">
            {t("browse")}
          </span>
        </button>
      ) : (
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg border p-3.5",
            error ? "border-neg bg-neg-soft" : "border-brand bg-brand-soft",
          )}
        >
          <div
            className={cn(
              "grid h-10 w-10 flex-shrink-0 place-items-center rounded-md font-mono text-[10px] font-semibold uppercase",
              error ? "bg-neg-soft text-neg" : "bg-pos-soft text-pos",
            )}
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : error ? (
              <AlertCircle size={18} strokeWidth={1.75} />
            ) : (
              file?.kind
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-fg-0 truncate text-[14px] font-medium">
              {shownName ?? t("reading")}
            </div>
            <div className={cn("mt-0.5 font-mono text-[11px]", error ? "text-neg" : "text-fg-2")}>
              {loading
                ? t("reading")
                : error
                  ? error
                  : file &&
                    (file.sheet
                      ? t("fileMetaSheet", {
                          size: formatFileSize(file.size),
                          sheet: file.sheet,
                          rows: file.totalRows,
                        })
                      : t("fileMeta", { size: formatFileSize(file.size), rows: file.totalRows }))}
            </div>
          </div>
          {!loading && (
            <button
              type="button"
              onClick={onClear}
              aria-label={t("removeFile")}
              className="bg-bg-1 border-line text-fg-1 grid h-7 w-7 cursor-pointer place-items-center rounded-full border"
            >
              <X size={12} strokeWidth={2} />
            </button>
          )}
        </div>
      )}

      <ImportScreen.Eyebrow>{t("templateColumns")}</ImportScreen.Eyebrow>
      <ImportScreen.Panel>
        {templateColumns.map(([k, v]) => (
          <div key={k} className="flex items-center gap-2.5 px-3.5 py-[11px] text-[13px]">
            <span className="text-fg-0 w-[92px] flex-shrink-0 font-medium">{k}</span>
            <span className="text-fg-2 text-[12px]">{v}</span>
          </div>
        ))}
      </ImportScreen.Panel>
    </>
  );
}
