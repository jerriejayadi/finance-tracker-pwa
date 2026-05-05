"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { MONTH_NAMES, monthKey, MOCK_BUDGETS } from "./budget-constants";

interface MonthPickerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  month: number;
  onPick: (year: number, month: number) => void;
  createdBudgets: Record<string, unknown[]>;
}

export function MonthPickerDrawer({
  open,
  onOpenChange,
  year,
  month,
  onPick,
  createdBudgets,
}: MonthPickerDrawerProps) {
  const [viewYear, setViewYear] = React.useState(year);

  React.useEffect(() => {
    if (open) setViewYear(year);
  }, [open, year]);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="pb-2">
          <DrawerTitle>Select month</DrawerTitle>
        </DrawerHeader>

        {/* Year nav */}
        <div className="flex items-center justify-between px-5 py-3">
          <button
            onClick={() => setViewYear((y) => y - 1)}
            className="w-8 h-8 rounded-full bg-bg-2 border border-line flex items-center justify-center text-fg-1 cursor-pointer hover:bg-bg-3 transition-colors"
          >
            <ChevronLeft size={14} strokeWidth={1.75} />
          </button>
          <span className="text-[15px] font-semibold text-fg-0">
            {viewYear}
          </span>
          <button
            onClick={() => setViewYear((y) => y + 1)}
            className="w-8 h-8 rounded-full bg-bg-2 border border-line flex items-center justify-center text-fg-1 cursor-pointer hover:bg-bg-3 transition-colors"
          >
            <ChevronRight size={14} strokeWidth={1.75} />
          </button>
        </div>

        {/* Month grid */}
        <div className="grid grid-cols-4 gap-2 px-5 pb-4">
          {MONTH_NAMES.map((mn, idx) => {
            const k = monthKey(viewYear, idx);
            const hasData =
              (createdBudgets && createdBudgets[k]) || MOCK_BUDGETS[k];
            const isCurrent = viewYear === year && idx === month;

            return (
              <button
                key={mn}
                onClick={() => {
                  onPick(viewYear, idx);
                  onOpenChange(false);
                }}
                className={cn(
                  "h-14 rounded-lg border flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors",
                  isCurrent
                    ? "bg-brand-soft border-brand text-brand"
                    : "bg-bg-1 border-line text-fg-1 hover:bg-bg-2"
                )}
              >
                <span className="text-[12px] font-medium">
                  {mn.slice(0, 3)}
                </span>
                {hasData ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand" />
                ) : (
                  <span className="text-[11px] text-fg-2">+</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-5 px-5 pb-6 text-[11px] text-fg-2">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-brand" /> Has budget
          </span>
          <span className="flex items-center gap-1.5">
            <span className="text-fg-2">+</span> Create new
          </span>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
