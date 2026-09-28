/**
 * Bulk import file parsing — CSV / XLSX → validated transaction rows.
 * Pure (no Supabase); matching against accounts/categories happens later.
 */

export const IMPORT_MAX_BYTES = 5 * 1024 * 1024;
export const IMPORT_MAX_ROWS = 1000;

export const IMPORT_FIELDS = [
  "date",
  "amount",
  "description",
  "type",
  "category",
  "account",
] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];

const REQUIRED_FIELDS: ImportField[] = ["date", "amount"];

/** Header aliases (lowercase) — English template headers + common Indonesian bank exports. */
const HEADER_ALIASES: Record<ImportField, string[]> = {
  date: ["date", "tanggal", "tgl"],
  amount: ["amount", "jumlah", "nominal", "nilai"],
  description: ["description", "keterangan", "deskripsi", "merchant", "note", "catatan"],
  type: ["type", "jenis", "tipe"],
  category: ["category", "kategori"],
  account: ["account", "rekening", "akun"],
};

const INCOME_WORDS = ["income", "pemasukan", "masuk", "in", "credit", "kredit"];
const EXPENSE_WORDS = ["expense", "pengeluaran", "keluar", "out", "debit"];
const TRANSFER_WORDS = ["transfer"];

export type ImportColumn = {
  field: ImportField;
  /** Header text as written in the file, or null when not found */
  source: string | null;
};

export type ImportRow = {
  /** 1-based spreadsheet row number (header is row 1) */
  row: number;
  date: string; // yyyy-MM-dd
  amount: number; // always positive
  type: "Income" | "Expense";
  description: string;
  category: string;
  account: string;
};

export type ImportIssueCode =
  | "invalidDate"
  | "emptyAmount"
  | "invalidAmount"
  | "invalidType"
  | "transferUnsupported";

export type ImportIssue = { row: number; code: ImportIssueCode; value: string };

export type ParsedImportFile = {
  name: string;
  size: number;
  kind: "csv" | "xlsx";
  sheet: string | null;
  totalRows: number;
  columns: ImportColumn[];
  rows: ImportRow[];
  issues: ImportIssue[];
};

export type ImportParseErrorCode =
  | "unsupported"
  | "tooLarge"
  | "tooManyRows"
  | "empty"
  | "missingColumns"
  | "unreadable";

export class ImportParseError extends Error {
  constructor(
    public code: ImportParseErrorCode,
    public fields: ImportField[] = [],
  ) {
    super(code);
    this.name = "ImportParseError";
  }
}

type Cell = string | number | boolean | Date | null | undefined;

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function parseImportFile(file: File): Promise<ParsedImportFile> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext !== "csv" && ext !== "xlsx") throw new ImportParseError("unsupported");
  if (file.size > IMPORT_MAX_BYTES) throw new ImportParseError("tooLarge");

  let sheet: string | null = null;
  let table: Cell[][];
  try {
    if (ext === "csv") {
      table = parseCsv(await file.text());
    } else {
      const { default: readXlsxFile } = await import("read-excel-file/browser");
      const sheets = await readXlsxFile(file);
      sheet = sheets[0]?.sheet ?? null;
      table = (sheets[0]?.data ?? []) as Cell[][];
    }
  } catch {
    throw new ImportParseError("unreadable");
  }

  const nonEmpty = table.filter((r) => r.some((c) => cellText(c) !== ""));
  if (nonEmpty.length < 2) throw new ImportParseError("empty");

  const header = table.findIndex((r) => r.some((c) => cellText(c) !== ""));
  const columns = matchColumns(table[header]);
  const missing = REQUIRED_FIELDS.filter(
    (f) => !columns.find((c) => c.field === f)?.source,
  );
  if (missing.length) throw new ImportParseError("missingColumns", missing);

  const index = columnIndexes(table[header], columns);
  const rows: ImportRow[] = [];
  const issues: ImportIssue[] = [];
  let totalRows = 0;

  for (let i = header + 1; i < table.length; i++) {
    const raw = table[i];
    if (!raw.some((c) => cellText(c) !== "")) continue;
    totalRows++;
    if (totalRows > IMPORT_MAX_ROWS) throw new ImportParseError("tooManyRows");

    const result = parseRow(raw, index, i + 1);
    if ("code" in result) issues.push(result);
    else rows.push(result);
  }

  return {
    name: file.name,
    size: file.size,
    kind: ext,
    sheet,
    totalRows,
    columns,
    rows,
    issues,
  };
}

// ---------------------------------------------------------------------------
// Columns
// ---------------------------------------------------------------------------

function normalizeHeader(c: Cell) {
  return cellText(c).toLowerCase().replace(/[^a-z]/g, "");
}

function matchColumns(headerRow: Cell[]): ImportColumn[] {
  const headers = headerRow.map(normalizeHeader);
  return IMPORT_FIELDS.map((field) => {
    const i = headers.findIndex((h) => HEADER_ALIASES[field].includes(h));
    return { field, source: i >= 0 ? cellText(headerRow[i]) : null };
  });
}

function columnIndexes(headerRow: Cell[], columns: ImportColumn[]) {
  const headers = headerRow.map((c) => cellText(c));
  return Object.fromEntries(
    columns.map((c) => [c.field, c.source ? headers.indexOf(c.source) : -1]),
  ) as Record<ImportField, number>;
}

// ---------------------------------------------------------------------------
// Rows
// ---------------------------------------------------------------------------

function parseRow(
  raw: Cell[],
  index: Record<ImportField, number>,
  rowNumber: number,
): ImportRow | ImportIssue {
  const get = (f: ImportField) => (index[f] >= 0 ? raw[index[f]] : null);

  const dateCell = get("date");
  const date = parseDate(dateCell);
  if (!date) {
    return { row: rowNumber, code: "invalidDate", value: cellText(dateCell) || "—" };
  }

  const amountCell = get("amount");
  if (cellText(amountCell) === "") {
    return { row: rowNumber, code: "emptyAmount", value: "—" };
  }
  const signed = parseAmount(amountCell);
  if (signed === null || signed === 0) {
    return { row: rowNumber, code: "invalidAmount", value: cellText(amountCell) };
  }

  const typeText = cellText(get("type")).toLowerCase();
  let type: ImportRow["type"];
  // No Type column / blank cell → treat as expense (the common case for bank exports)
  if (!typeText) type = "Expense";
  else if (INCOME_WORDS.includes(typeText)) type = "Income";
  else if (EXPENSE_WORDS.includes(typeText)) type = "Expense";
  else if (TRANSFER_WORDS.includes(typeText)) {
    return { row: rowNumber, code: "transferUnsupported", value: cellText(get("type")) };
  } else {
    return { row: rowNumber, code: "invalidType", value: cellText(get("type")) };
  }

  return {
    row: rowNumber,
    date,
    amount: Math.abs(signed),
    type,
    description: cellText(get("description")),
    category: cellText(get("category")),
    account: cellText(get("account")),
  };
}

function cellText(c: Cell): string {
  if (c === null || c === undefined) return "";
  if (c instanceof Date) return isNaN(c.getTime()) ? "" : toIsoDate(c);
  return String(c).trim();
}

function toIsoDate(d: Date) {
  // Excel dates come back as UTC midnight
  return d.toISOString().slice(0, 10);
}

function isValidYmd(y: number, m: number, d: number) {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    y >= 1900 &&
    y <= 2200 &&
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

function ymd(y: number, m: number, d: number) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Accepts Date cells, Excel serials, YYYY-MM-DD and DD/MM/YYYY (also - or . separators). */
export function parseDate(c: Cell): string | null {
  if (c instanceof Date) return isNaN(c.getTime()) ? null : toIsoDate(c);
  if (typeof c === "number") {
    // Excel serial date (days since 1899-12-30)
    if (c < 20000 || c > 100000) return null;
    return toIsoDate(new Date(Date.UTC(1899, 11, 30) + Math.round(c) * 86_400_000));
  }
  const s = cellText(c);
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) {
    const [y, mo, d] = [+m[1], +m[2], +m[3]];
    return isValidYmd(y, mo, d) ? ymd(y, mo, d) : null;
  }
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (m) {
    const [d, mo, y] = [+m[1], +m[2], +m[3]];
    return isValidYmd(y, mo, d) ? ymd(y, mo, d) : null;
  }
  return null;
}

/**
 * Parses "185000", "Rp 185.000", "1,500,000.50", "-61.000", "(61000)".
 * A separator followed by exactly 3 digits (and nothing else) is a thousands separator.
 */
export function parseAmount(c: Cell): number | null {
  if (typeof c === "number") return isFinite(c) ? c : null;
  let s = cellText(c);
  const negative = /^-|^\(.*\)$|-$/.test(s.replace(/\s|rp/gi, ""));
  s = s.replace(/[^\d.,]/g, "");
  if (!s || !/\d/.test(s)) return null;

  const lastSep = Math.max(s.lastIndexOf("."), s.lastIndexOf(","));
  let intPart = s;
  let decPart = "";
  if (lastSep >= 0) {
    const tail = s.slice(lastSep + 1);
    const hasBoth = s.includes(".") && s.includes(",");
    const isThousands = !hasBoth && tail.length === 3;
    if (!isThousands) {
      intPart = s.slice(0, lastSep);
      decPart = tail;
    }
  }
  const n = Number(intPart.replace(/[.,]/g, "") + (decPart ? "." + decPart : ""));
  if (!isFinite(n)) return null;
  return negative ? -n : n;
}

/** Minimal RFC 4180 CSV parser; auto-detects `,` vs `;` delimiter. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const delimiter =
    (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

// ---------------------------------------------------------------------------
// Template
// ---------------------------------------------------------------------------

export async function downloadImportTemplate() {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const header = ["Date", "Amount", "Description", "Type", "Category", "Account"];
  const examples = [
    ["2026-04-27", 185000, "Ramen Tatsu", "Expense", "Food & Dining", "BCA Debit"],
    ["2026-04-26", 15000000, "Payroll", "Income", "Salary", "BCA Debit"],
    ["2026-04-25", 143500, "Gojek", "Expense", "Transport", ""],
  ];
  await writeXlsxFile(
    [
      header.map((value) => ({ value, fontWeight: "bold" as const })),
      ...examples,
    ],
    { sheet: "Transactions", columns: [14, 14, 28, 12, 18, 16].map((width) => ({ width })) },
  ).toFile("fintrack-import-template.xlsx");
}
