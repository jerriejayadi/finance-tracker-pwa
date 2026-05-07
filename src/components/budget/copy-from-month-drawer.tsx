"use client";

import * as React from "react";
import { Copy, Calendar } from "lucide-react";
import { fmtIDR } from "@/lib/format";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { MONTH_NAMES } from "./budget-constants";
import { useGetBudgetMonths } from "@/services/budgets/budgets.hooks";

interface CopyFromMonthDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Current month_year key to exclude from list */
  currentMonthYear: string;
  onSelect: (monthYear: string) => void;
}

function parseMonthYear(my: string): { year: number; month: number } {
  const [y, m] = my.split("-");
  return { year: parseInt(y, 10), month: parseInt(m, 10) - 1 };
}

function formatMonthYear(my: string): string {
  const { year, month } = parseMonthYear(my);
  return `${MONTH_NAMES[month]} ${year}`;
}

export function CopyFromMonthDrawer({
  open,
  onOpenChange,
  currentMonthYear,
  onSelect,
}: CopyFromMonthDrawerProps) {
  const { data: months = [], isLoading } = useGetBudgetMonths();

  const available = months.filter((m) => m.month_year !== currentMonthYear);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[70dvh]">
        <DrawerHeader className="pb-2">
          <DrawerTitle>Copy from template</DrawerTitle>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {isLoading && (
            <div className="flex justify-center py-8 text-[13px] text-fg-2">
              Loading...
            </div>
          )}

          {!isLoading && available.length === 0 && (
            <div className="flex flex-col items-center py-8 text-center">
              <Calendar size={28} strokeWidth={1.5} className="text-fg-2 mb-2" />
              <p className="text-[13px] text-fg-2">
                No other months with budgets yet.
              </p>
            </div>
          )}

          {!isLoading && available.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[12px] text-fg-2 mb-1">
                Pick a month to copy its budget categories and amounts.
              </p>
              {available.map((m) => (
                <button
                  key={m.month_year}
                  onClick={() => {
                    onSelect(m.month_year);
                    onOpenChange(false);
                  }}
                  className="flex items-center justify-between p-3.5 rounded-lg bg-bg-1 border border-line cursor-pointer hover:bg-bg-2 hover:border-brand transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand-soft text-brand flex items-center justify-center">
                      <Copy size={15} strokeWidth={1.75} />
                    </div>
                    <div className="text-left">
                      <div className="text-[13px] font-medium text-fg-0">
                        {formatMonthYear(m.month_year)}
                      </div>
                      <div className="text-[11px] text-fg-2">
                        {m.category_count} {m.category_count === 1 ? "category" : "categories"}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-mono tabular-nums text-fg-1 group-hover:text-fg-0">
                      {fmtIDR(m.total_planned)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
