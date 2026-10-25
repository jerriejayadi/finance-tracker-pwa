"use client";

import * as React from "react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  DATE_RANGES,
  DEFAULT_FILTERS,
  type Filters,
} from "./history-constants";

interface HistoryFilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: Filters;
  onApply: (filters: Filters) => void;
  categories: { id: string; name: string; icon: string }[];
  accounts: { id: string; name: string }[];
}

export function HistoryFilterDrawer({
  open,
  onOpenChange,
  filters,
  onApply,
  categories,
  accounts,
}: HistoryFilterDrawerProps) {
  const [draft, setDraft] = React.useState<Filters>(filters);

  React.useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  const customIncomplete = draft.range === "custom" && !draft.customFrom;

  const toggleArray = (key: "cats" | "accts", val: string) => {
    const arr = draft[key];
    const next = arr.includes(val)
      ? arr.filter((x) => x !== val)
      : [...arr, val];
    setDraft({ ...draft, [key]: next });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85dvh]">
        <DrawerHeader className="flex-row items-center justify-between pb-2">
          <DrawerTitle>Filters</DrawerTitle>
          <button
            onClick={() => setDraft(DEFAULT_FILTERS)}
            className="text-[12px] text-brand font-medium cursor-pointer hover:text-brand-hi"
          >
            Reset
          </button>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {/* Date range */}
          <Section label="Date range">
            <div className="grid grid-cols-3 gap-1.5">
              {DATE_RANGES.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setDraft({ ...draft, range: r.id })}
                  className={cn(
                    "h-9 px-3 rounded-sm text-[12px] border cursor-pointer transition-colors",
                    draft.range === r.id
                      ? "bg-brand-soft border-brand text-brand font-medium"
                      : "bg-bg-0 border-line text-fg-1 hover:bg-bg-2"
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
            {draft.range === "custom" && (
              <CustomRangePicker
                from={draft.customFrom}
                to={draft.customTo}
                onChange={(customFrom, customTo) =>
                  setDraft({ ...draft, customFrom, customTo })
                }
              />
            )}
          </Section>

          {/* Type */}
          <Section label="Type">
            <SegmentedControl
              value={draft.type}
              onValueChange={(v) => setDraft({ ...draft, type: v })}
              options={[
                { value: "all", label: "All" },
                { value: "income", label: "Income" },
                { value: "expense", label: "Expense" },
                { value: "transfer", label: "Transfer" },
              ]}
              className="w-full"
            />
          </Section>

          {/* Categories */}
          <Section
            label="Category"
            meta={draft.cats.length ? String(draft.cats.length) : "All"}
          >
            <div className="flex flex-wrap gap-1.5">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => toggleArray("cats", c.name)}
                  className={cn(
                    "h-7 px-3 rounded-full text-[12px] border cursor-pointer transition-colors",
                    draft.cats.includes(c.name)
                      ? "bg-brand-soft border-brand text-brand font-medium"
                      : "bg-bg-0 border-line text-fg-1 hover:bg-bg-2"
                  )}
                >
                  {c.icon} {c.name}
                </button>
              ))}
            </div>
          </Section>

          {/* Accounts */}
          <Section
            label="Account"
            meta={draft.accts.length ? String(draft.accts.length) : "All"}
          >
            <div className="flex flex-wrap gap-1.5">
              {accounts.map((a) => (
                <button
                  key={a.id}
                  onClick={() => toggleArray("accts", a.name)}
                  className={cn(
                    "h-7 px-3 rounded-full text-[12px] border cursor-pointer transition-colors",
                    draft.accts.includes(a.name)
                      ? "bg-brand-soft border-brand text-brand font-medium"
                      : "bg-bg-0 border-line text-fg-1 hover:bg-bg-2"
                  )}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </Section>

          {/* Amount range */}
          <Section label="Amount range (Rp)">
            <div className="grid grid-cols-[minmax(0,1fr)_12px_minmax(0,1fr)] gap-2 items-center">
              <div className="flex items-center gap-2 h-10 px-3 rounded-sm bg-bg-0 border border-line focus-within:border-brand">
                <span className="text-[10px] text-fg-2 uppercase tracking-[0.06em]">
                  Min
                </span>
                <input
                  inputMode="numeric"
                  className="flex-1 min-w-0 bg-transparent text-right font-mono text-[13px] tabular-nums text-fg-0 outline-none"
                  placeholder="0"
                  value={draft.amtMin ? draft.amtMin.toLocaleString("id-ID") : ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      amtMin: parseInt(e.target.value.replace(/\D/g, "")) || 0,
                    })
                  }
                />
              </div>
              <span className="text-center text-fg-2 font-mono">&mdash;</span>
              <div className="flex items-center gap-2 h-10 px-3 rounded-sm bg-bg-0 border border-line focus-within:border-brand">
                <span className="text-[10px] text-fg-2 uppercase tracking-[0.06em]">
                  Max
                </span>
                <input
                  inputMode="numeric"
                  className="flex-1 min-w-0 bg-transparent text-right font-mono text-[13px] tabular-nums text-fg-0 outline-none"
                  placeholder="Any"
                  value={draft.amtMax ? draft.amtMax.toLocaleString("id-ID") : ""}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      amtMax: parseInt(e.target.value.replace(/\D/g, "")) || 0,
                    })
                  }
                />
              </div>
            </div>
          </Section>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 pb-6 pt-3 border-t border-line">
          <button
            onClick={() => onOpenChange(false)}
            className="flex-1 h-11 rounded-sm border border-line text-[14px] text-fg-1 cursor-pointer hover:bg-bg-2 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={customIncomplete}
            onClick={() => {
              onApply(draft);
              onOpenChange(false);
            }}
            className="flex-1 h-11 rounded-sm bg-brand text-brand-ink text-[14px] font-medium cursor-pointer hover:bg-brand-hi transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            Apply filters
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

const toISODate = (d: Date) => format(d, "yyyy-MM-dd");
const fromISODate = (iso: string) => new Date(iso + "T00:00:00");

function CustomRangePicker({
  from,
  to,
  onChange,
}: {
  from?: string;
  to?: string;
  onChange: (from?: string, to?: string) => void;
}) {
  const today = React.useMemo(() => new Date(), []);
  const selected: DateRange | undefined = from
    ? { from: fromISODate(from), to: to ? fromISODate(to) : undefined }
    : undefined;

  return (
    <div className="mt-2 rounded-md border border-line bg-bg-0 p-2">
      <div className="grid grid-cols-2 gap-2 px-1 pb-1">
        <RangeEnd label="From" value={selected?.from} />
        <RangeEnd label="To" value={selected?.to ?? selected?.from} />
      </div>
      <Calendar
        mode="range"
        selected={selected}
        onSelect={(r) =>
          onChange(
            r?.from ? toISODate(r.from) : undefined,
            r?.to ? toISODate(r.to) : undefined,
          )
        }
        defaultMonth={selected?.from}
        toDate={today}
        disabled={{ after: today }}
        className="w-full"
        classNames={{
          months: "flex flex-col w-full space-y-4",
          month: "space-y-4 w-full",
          head_row: "flex w-full",
          head_cell:
            "text-fg-2 rounded-md flex-1 font-normal text-[0.8rem] text-center",
          row: "flex w-full mt-2",
          cell: "flex-1 max-h-9 aspect-square text-center text-sm p-0 relative [&:has([aria-selected])]:bg-brand-soft first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md [&:has(.day-range-start)]:rounded-l-md [&:has(.day-range-end)]:rounded-r-md focus-within:relative focus-within:z-20",
          day: "inline-flex items-center justify-center font-normal transition-colors cursor-pointer bg-transparent text-fg-0 rounded-lg hover:bg-bg-1 h-full w-full p-0 aria-selected:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
          day_range_start: "day-range-start",
          day_range_end: "day-range-end",
          day_range_middle:
            "bg-transparent! text-brand! rounded-none hover:bg-transparent!",
        }}
      />
    </div>
  );
}

function RangeEnd({ label, value }: { label: string; value?: Date }) {
  return (
    <div className="rounded-sm bg-bg-1 px-3 py-2">
      <div className="text-[10px] uppercase tracking-[0.06em] text-fg-2">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 font-mono text-[13px] tabular-nums",
          value ? "text-fg-0" : "text-fg-2",
        )}
      >
        {value ? format(value, "d MMM yyyy") : "Select date"}
      </div>
    </div>
  );
}

function Section({
  label,
  meta,
  children,
}: {
  label: string;
  meta?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 first:mt-0">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-fg-2">
          {label}
        </span>
        {meta && (
          <span className="text-[10px] font-mono text-fg-1">{meta}</span>
        )}
      </div>
      {children}
    </div>
  );
}
