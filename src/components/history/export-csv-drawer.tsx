"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Toggle } from "@/components/ui/toggle";
import {
  DEFAULT_EXPORT_COLUMNS,
  EXPORT_COLUMNS,
  buildTransactionsCsv,
  saveCsv,
  type ExportColumnId,
} from "@/lib/export/transactions-csv";
import type { Transaction } from "./history-constants";

interface ExportCsvDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Already filtered + sorted, as shown in the list */
  transactions: Transaction[];
  rangeLabel: string;
  dateFrom: string;
  dateTo: string;
}

export function ExportCsvDrawer({
  open,
  onOpenChange,
  transactions,
  rangeLabel,
  dateFrom,
  dateTo,
}: ExportCsvDrawerProps) {
  const [columns, setColumns] = React.useState<ExportColumnId[]>(
    DEFAULT_EXPORT_COLUMNS,
  );
  const [includeTransfers, setIncludeTransfers] = React.useState(false);

  const rows = React.useMemo(
    () =>
      includeTransfers
        ? transactions
        : transactions.filter((tx) => tx.type !== "Transfer"),
    [transactions, includeTransfers],
  );

  const toggleColumn = (id: ExportColumnId) =>
    setColumns((cols) =>
      cols.includes(id) ? cols.filter((c) => c !== id) : [...cols, id],
    );

  const handleExport = () => {
    try {
      saveCsv(
        buildTransactionsCsv(rows, columns),
        `transactions_${dateFrom}_${dateTo}.csv`,
      );
      onOpenChange(false);
    } catch {
      toast.error("Couldn't export the file");
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85dvh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle>Export CSV</DrawerTitle>
          <DrawerDescription className="text-fg-2 font-mono text-[11px]">
            {rangeLabel} &middot; current filters
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-fg-2">
            Columns
          </div>
          <div className="border-line bg-bg-0 divide-line flex flex-col divide-y rounded-md border">
            {EXPORT_COLUMNS.map((c) => {
              const on = columns.includes(c.id);
              return (
                <button
                  key={c.id}
                  role="checkbox"
                  aria-checked={on}
                  onClick={() => toggleColumn(c.id)}
                  className="hover:bg-bg-1 flex h-11 cursor-pointer items-center gap-3 px-3 text-left transition-colors"
                >
                  <span
                    className={cn(
                      "flex h-[20px] w-[20px] items-center justify-center rounded-md border-[1.5px] transition-colors",
                      on
                        ? "bg-brand border-brand text-brand-ink"
                        : "bg-bg-1 border-line",
                    )}
                  >
                    {on && <Check size={12} strokeWidth={2.5} />}
                  </span>
                  <span className="text-fg-0 text-[14px]">{c.label}</span>
                </button>
              );
            })}
          </div>

          <div className="border-line bg-bg-0 mt-4 flex items-center gap-3 rounded-md border px-3 py-3">
            <div className="min-w-0 flex-1">
              <div className="text-fg-0 text-[14px]">Include transfers</div>
              <div className="text-fg-2 mt-0.5 text-[11px]">
                Moves between your own accounts. Not income or spending.
              </div>
            </div>
            <Toggle
              checked={includeTransfers}
              onCheckedChange={setIncludeTransfers}
            />
          </div>
        </div>

        <div className="border-line flex items-center gap-3 border-t px-5 pt-3 pb-6">
          <button
            onClick={() => onOpenChange(false)}
            className="border-line text-fg-1 hover:bg-bg-2 h-11 flex-1 cursor-pointer rounded-sm border text-[14px] transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={columns.length === 0 || rows.length === 0}
            onClick={handleExport}
            className="bg-brand text-brand-ink hover:bg-brand-hi h-11 flex-1 cursor-pointer rounded-sm text-[14px] font-medium transition-colors disabled:pointer-events-none disabled:opacity-50"
          >
            Export {rows.length} {rows.length === 1 ? "row" : "rows"}
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
