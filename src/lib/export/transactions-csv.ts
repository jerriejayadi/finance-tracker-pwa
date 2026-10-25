/**
 * Transactions → CSV export. Column headers and Type values match the bulk
 * importer (`lib/import/parse-import-file.ts`) so exported files re-import cleanly.
 */

import type { Transaction } from "@/components/history/history-constants";

export const EXPORT_COLUMNS = [
  { id: "date", label: "Date", defaultOn: true },
  { id: "amount", label: "Amount", defaultOn: true },
  { id: "description", label: "Description", defaultOn: true },
  { id: "type", label: "Type", defaultOn: true },
  { id: "category", label: "Category", defaultOn: true },
  { id: "account", label: "Account", defaultOn: false },
] as const;

export type ExportColumnId = (typeof EXPORT_COLUMNS)[number]["id"];

export const DEFAULT_EXPORT_COLUMNS: ExportColumnId[] = EXPORT_COLUMNS.filter(
  (c) => c.defaultOn,
).map((c) => c.id);

function cellValue(tx: Transaction, col: ExportColumnId): string {
  const isTransfer = tx.type === "Transfer";
  switch (col) {
    case "date":
      return tx.date;
    case "amount":
      return String(Number(tx.amount));
    case "description":
      return isTransfer
        ? `${tx.account_name ?? ""} -> ${tx.to_account_name ?? ""}`
        : tx.merchant || tx.note || "";
    case "type":
      return tx.type;
    case "category":
      return isTransfer ? "" : tx.category_name || tx.category || "";
    case "account":
      return tx.account_name ?? "";
  }
}

function escapeCell(value: string): string {
  // Neutralize spreadsheet formula injection from user-entered text
  const safe = /^[=+\-@\t\r]/.test(value) && !/^-?\d/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

/** Builds CSV text; `columns` are emitted in EXPORT_COLUMNS order regardless of input order. */
export function buildTransactionsCsv(
  transactions: Transaction[],
  columns: ExportColumnId[],
): string {
  const cols = EXPORT_COLUMNS.filter((c) => columns.includes(c.id));
  const lines = [
    cols.map((c) => c.label).join(","),
    ...transactions.map((tx) =>
      cols.map((c) => escapeCell(cellValue(tx, c.id))).join(","),
    ),
  ];
  return lines.join("\r\n");
}

/** Downloads the CSV as a file. */
export function saveCsv(csv: string, filename: string): void {
  // BOM so Excel reads the file as UTF-8
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
