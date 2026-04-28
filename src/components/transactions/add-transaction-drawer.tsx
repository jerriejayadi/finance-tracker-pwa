"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Toggle } from "@/components/ui/toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { format, isSameDay, isToday, isYesterday, subDays } from "date-fns";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Calendar as CalendarIcon,
  Wallet,
  FileText,
  ChevronLeft,
  ChevronRight,
  Repeat,
  Search,
  Plus,
  Check,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const CATEGORIES = [
  { id: "food", name: "Food", em: "🍜" },
  { id: "coffee", name: "Coffee", em: "☕" },
  { id: "groceries", name: "Groceries", em: "🛒" },
  { id: "transport", name: "Transport", em: "🚗" },
  { id: "rent", name: "Rent", em: "🏠" },
  { id: "bills", name: "Bills", em: "⌁" },
  { id: "fun", name: "Fun", em: "🎬" },
  { id: "more", name: "More", em: "⋯" },
];

const ACCOUNTS = [
  {
    id: "chase",
    name: "Chase Checking",
    meta: "•• 4218",
    balance: "$4,283.19",
    em: "🏦",
    colorClass: "text-brand",
  },
  {
    id: "savings",
    name: "Ally Savings",
    meta: "•• 8821",
    balance: "$12,460.00",
    em: "💰",
    colorClass: "text-pos",
  },
  {
    id: "amex",
    name: "Amex Gold",
    meta: "•• 1003",
    balance: "− $612.40",
    em: "💳",
    colorClass: "text-neg",
    isNeg: true,
  },
  {
    id: "cash",
    name: "Cash",
    meta: "Wallet",
    balance: "$84.00",
    em: "💵",
    colorClass: "text-fg-1",
  },
  {
    id: "venmo",
    name: "Venmo",
    meta: "@alex.m",
    balance: "$24.50",
    em: "◆",
    colorClass: "text-brand",
  },
];

const QUICK_AMOUNTS = [5, 10, 20, 50, 100];

type TxType = "expense" | "income" | "transfer";
type ViewState = "main" | "date" | "account";

/* ------------------------------------------------------------------ */
/*  Date Picker View                                                   */
/* ------------------------------------------------------------------ */

function DatePickerView({
  date,
  onSelect,
  onBack,
}: {
  date: Date;
  onSelect: (date: Date) => void;
  onBack: () => void;
}) {
  const today = new Date();
  const yest = subDays(today, 1);
  const twoDays = subDays(today, 2);

  const presets = [
    { id: "today", label: "Today", date: today },
    { id: "yest", label: "Yesterday", date: yest },
    { id: "2d", label: "2 days ago", date: twoDays },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2 px-5">
        <Button
          variant="secondary"
          size="icon"
          onClick={onBack}
          className="w-8 h-8 rounded-full text-fg-1"
        >
          <ChevronLeft size={14} strokeWidth={1.75} />
        </Button>
        <h3 className="text-[17px] font-semibold tracking-[-0.005em]">
          Select date
        </h3>
        <div className="w-8" />
      </div>

      <div className="overflow-y-auto flex-1 px-5">
        {/* Presets */}
        <div className="grid grid-cols-3 gap-2 mb-3.5">
          {presets.map((p) => {
            const sel = date && isSameDay(date, p.date);
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p.date)}
                className={cn(
                  "p-2.5 border rounded-sm cursor-pointer transition-colors text-left",
                  sel
                    ? "border-brand bg-brand-soft"
                    : "border-line bg-bg-0 hover:bg-bg-2",
                )}
              >
                <div
                  className={cn(
                    "text-[13px] font-medium",
                    sel ? "text-brand" : "text-fg-0",
                  )}
                >
                  {p.label}
                </div>
                <div className="font-mono text-[11px] text-fg-2 mt-0.5">
                  {format(p.date, "MMM d")}
                </div>
              </button>
            );
          })}
        </div>

        {/* Calendar */}
        <div className="border border-line bg-bg-0 rounded-md p-2 mb-4">
          <Calendar
            captionLayout="dropdown-buttons"
            mode="single"
            selected={date}
            onSelect={(d) => {
              if (d) onSelect(d);
            }}
            fromYear={2020}
            toYear={2030}
            className="w-full"
            classNames={{
              months: "flex flex-col w-full space-y-4",
              month: "space-y-4 w-full",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "hidden",
              caption_dropdowns: "flex gap-2 items-center",
              vhidden: "hidden",
              dropdown_month: "relative",
              dropdown_year: "relative",
              dropdown:
                "appearance-none bg-bg-2 border border-line rounded-sm px-2 py-1 text-[13px] text-fg-0 font-medium cursor-pointer focus:outline-none focus:border-brand",
              head_row: "flex w-full",
              head_cell:
                "text-fg-2 rounded-md flex-1 font-normal text-[0.8rem] text-center",
              row: "flex w-full mt-2",
              cell: "flex-1 max-h-9 aspect-square text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-bg-2 [&:has([aria-selected])]:bg-bg-2 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: "inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer bg-transparent text-fg-0 rounded-lg hover:bg-bg-1 h-full w-full p-0 font-normal aria-selected:opacity-100",
            }}
            initialFocus
          />
        </div>
      </div>

      {/* Footer */}
      <DrawerFooter className="grid grid-cols-[1fr_2fr] gap-2 px-5">
        <Button variant="secondary" onClick={onBack}>
          Cancel
        </Button>
        <Button onClick={onBack}>Confirm</Button>
      </DrawerFooter>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Account Picker View                                                */
/* ------------------------------------------------------------------ */

function AccountPickerView({
  value,
  onSelect,
  onBack,
}: {
  value: string;
  onSelect: (key: string, label: string) => void;
  onBack: () => void;
}) {
  const [search, setSearch] = React.useState("");
  const filtered = ACCOUNTS.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.meta.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2 px-5">
        <Button
          variant="secondary"
          size="icon"
          onClick={onBack}
          className="w-8 h-8 rounded-full text-fg-1"
        >
          <ChevronLeft size={14} strokeWidth={1.75} />
        </Button>
        <h3 className="text-[17px] font-semibold tracking-[-0.005em]">
          Select account
        </h3>
        <div className="w-8" />
      </div>

      <div className="overflow-y-auto flex-1 px-5">
        {/* Search */}
        <div className="mb-3">
          <Input
            icon={<Search size={16} strokeWidth={1.75} />}
            placeholder="Search accounts"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 bg-bg-0"
          />
        </div>

        {/* Account list */}
        <div className="flex flex-col gap-2 mb-4">
          {filtered.map((a) => {
            const sel = value === a.id;
            return (
              <button
                key={a.id}
                onClick={() => onSelect(a.id, a.name + " · " + a.meta)}
                className={cn(
                  "grid grid-cols-[40px_1fr_auto_24px] gap-3 items-center p-3 border rounded-md cursor-pointer transition-colors text-left",
                  sel
                    ? "border-brand bg-brand-soft"
                    : "border-line bg-bg-0 hover:bg-bg-2",
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-[10px] bg-bg-2 border border-line flex items-center justify-center text-[18px]",
                    a.colorClass,
                    sel && "border-transparent",
                  )}
                >
                  {a.em}
                </div>

                {/* Name + meta */}
                <div className="min-w-0">
                  <div className="text-[14px] font-medium text-fg-0">
                    {a.name}
                  </div>
                  <div className="font-mono text-[11px] text-fg-2 mt-0.5">
                    {a.meta}
                  </div>
                </div>

                {/* Balance */}
                <div className="text-right">
                  <div
                    className={cn(
                      "font-mono tabular-nums text-[13px] font-medium",
                      a.isNeg ? "text-neg" : "text-fg-0",
                    )}
                  >
                    {a.balance}
                  </div>
                  <div className="text-[10px] text-fg-2 uppercase tracking-[0.04em] mt-0.5">
                    Balance
                  </div>
                </div>

                {/* Radio */}
                <div
                  className={cn(
                    "w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0",
                    sel
                      ? "bg-brand border-brand text-brand-ink"
                      : "border-line",
                  )}
                >
                  {sel && <Check size={12} strokeWidth={2} />}
                </div>
              </button>
            );
          })}

          {/* Add new account */}
          <button className="grid grid-cols-[40px_1fr_16px] gap-3 items-center p-3 border border-dashed border-line rounded-md cursor-pointer hover:bg-bg-2 transition-colors text-left">
            <div className="w-10 h-10 rounded-[10px] bg-bg-2 border border-line flex items-center justify-center text-fg-1">
              <Plus size={16} strokeWidth={1.75} />
            </div>
            <div>
              <div className="text-[14px] font-medium text-fg-0">
                Add new account
              </div>
              <div className="text-[11px] text-fg-2 mt-0.5">
                Bank, card, or cash
              </div>
            </div>
            <ChevronRight size={14} strokeWidth={1.75} className="text-fg-2" />
          </button>
        </div>
      </div>

      {/* Footer */}
      <DrawerFooter className="grid grid-cols-[1fr_2fr] gap-2 px-5">
        <Button variant="secondary" onClick={onBack}>
          Cancel
        </Button>
        <Button onClick={onBack}>Confirm</Button>
      </DrawerFooter>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Add Transaction Drawer                                        */
/* ------------------------------------------------------------------ */

interface AddTransactionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultType?: TxType;
}

export function AddTransactionDrawer({
  open,
  onOpenChange,
  defaultType = "expense",
}: AddTransactionDrawerProps) {
  const [type, setType] = React.useState<TxType>(defaultType);
  const [view, setView] = React.useState<ViewState>("main");

  const [amount, setAmount] = React.useState(0);
  const [editingValue, setEditingValue] = React.useState("");
  const [cat, setCat] = React.useState("food");
  const [note, setNote] = React.useState("");
  const [recurring, setRecurring] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const [date, setDate] = React.useState<Date>(new Date());
  const dateLabel = React.useMemo(() => {
    if (!date) return "Select date";
    const base = format(date, "MMM d, yyyy");
    if (isToday(date)) return `Today · ${base}`;
    if (isYesterday(date)) return `Yesterday · ${base}`;
    if (isSameDay(date, subDays(new Date(), 2))) return `2 days ago · ${base}`;
    return base;
  }, [date]);
  const [acctKey, setAcctKey] = React.useState("chase");
  const [acctLabel, setAcctLabel] = React.useState("Chase Checking · •• 4218");

  React.useEffect(() => {
    if (open) {
      setType(defaultType);
      setView("main");
    }
  }, [open, defaultType]);

  // Formatter: splits amount into whole (with commas) and cents (always 2 digits)
  const formatWhole = (n: number) => {
    const str = String(Math.trunc(n));
    return str.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const displayWhole = isFocused
    ? (editingValue.split(".")[0] || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    : formatWhole(amount);

  const displayCents = (() => {
    if (isFocused) {
      const parts = editingValue.split(".");
      if (parts.length < 2) return "00";
      return (parts[1] || "").padEnd(2, "0").slice(0, 2);
    }
    const dec = amount % 1;
    if (dec === 0) return "00";
    return dec.toFixed(2).slice(2);
  })();

  const segIdx = type === "expense" ? 0 : type === "income" ? 1 : 2;
  const sym = type === "expense" ? "−" : type === "income" ? "+" : "";

  const handleSave = () => {
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92dvh]">
        {/* Date Picker */}
        {view === "date" && (
          <DatePickerView
            date={date}
            onSelect={(d) => setDate(d)}
            onBack={() => setView("main")}
          />
        )}

        {/* Account Picker */}
        {view === "account" && (
          <AccountPickerView
            value={acctKey}
            onSelect={(k, lbl) => {
              setAcctKey(k);
              setAcctLabel(lbl);
            }}
            onBack={() => setView("main")}
          />
        )}

        {/* Main View */}
        {view === "main" && (
          <>
            <div className="overflow-y-auto flex-1 px-5">
              <DrawerHeader className="px-0 text-left">
                <DrawerTitle>Add transaction</DrawerTitle>
                <DrawerDescription>
                  All amounts are saved in USD.
                </DrawerDescription>
              </DrawerHeader>

              {/* Type segmented control */}
              <div className="relative grid grid-cols-3 bg-bg-2 border border-line rounded-sm p-[3px] mb-[18px]">
                <div
                  className="absolute top-[3px] bottom-[3px] rounded-xs bg-bg-0 border border-line transition-transform duration-220 ease-[cubic-bezier(0.16,1,0.3,1)]"
                  style={{
                    width: "calc((100% - 6px) / 3)",
                    transform: `translateX(${segIdx * 100}%)`,
                    left: 0,
                  }}
                />
                <button
                  onClick={() => setType("expense")}
                  className={cn(
                    "relative z-[1] flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium rounded-xs cursor-pointer transition-colors",
                    type === "expense" ? "text-neg" : "text-fg-2",
                  )}
                >
                  <ArrowUpRight size={14} strokeWidth={1.75} /> Expense
                </button>
                <button
                  onClick={() => setType("income")}
                  className={cn(
                    "relative z-[1] flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium rounded-xs cursor-pointer transition-colors",
                    type === "income" ? "text-pos" : "text-fg-2",
                  )}
                >
                  <ArrowDownLeft size={14} strokeWidth={1.75} /> Income
                </button>
                <button
                  onClick={() => setType("transfer")}
                  className={cn(
                    "relative z-[1] flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium rounded-xs cursor-pointer transition-colors",
                    type === "transfer" ? "text-fg-0" : "text-fg-2",
                  )}
                >
                  <ArrowLeftRight size={14} strokeWidth={1.75} /> Transfer
                </button>
              </div>

              {/* Amount display */}
              <div
                className="relative flex items-baseline justify-center gap-1 py-4 pb-3 font-mono tabular-nums cursor-text group"
                onClick={() => document.getElementById("amount-input")?.focus()}
              >
                {/* <span className="text-[28px] text-fg-2">{sym}</span> */}
                <span className="text-[28px] text-fg-2">$</span>
                <span
                  className={cn(
                    "text-[56px] font-medium leading-none tracking-[-0.03em]",
                    type === "expense"
                      ? "text-neg"
                      : type === "income"
                        ? "text-pos"
                        : "text-fg-0",
                    amount === 0 && !isFocused && "text-fg-3",
                  )}
                >
                  {displayWhole}
                </span>
                <span className="relative text-[32px] text-fg-2 tracking-[-0.01em]">
                  .{displayCents}
                  {isFocused && (
                    <span className="absolute -right-3 top-1 w-[2.5px] h-[34px] bg-brand animate-pulse rounded-full" />
                  )}
                </span>
                {/* {amount} */}
                <input
                  id="amount-input"
                  type="text"
                  inputMode="decimal"
                  className="absolute inset-0 opacity-0 w-full h-full cursor-text"
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && editingValue.endsWith(".0")) {
                      e.preventDefault();
                      if (editingValue.endsWith(".0")) {
                        const newVal = editingValue.slice(0, -3);
                        setEditingValue(newVal);
                        const parsed = parseFloat(newVal);
                        setAmount(isNaN(parsed) ? 0 : parsed);
                      } else if (editingValue.endsWith(".")) {
                        const newVal = editingValue.slice(0, -2);
                        setEditingValue(newVal);
                        const parsed = parseFloat(newVal);
                        setAmount(isNaN(parsed) ? 0 : parsed);
                      }
                    }
                  }}
                  value={isFocused ? editingValue : ""}
                  onFocus={() => {
                    setIsFocused(true);
                    setEditingValue(amount === 0 ? "" : String(amount));
                  }}
                  onChange={(e) => {
                    // Strip everything except digits and dot
                    let val = e.target.value.replace(/[^0-9.]/g, "");
                    const parts = val.split(".");
                    // Only allow one dot
                    if (parts.length > 2) return;
                    // Remove leading zeros (but keep "0" and "0.")
                    if (parts[0].length > 1) {
                      parts[0] = parts[0].replace(/^0+/, "") || "0";
                    }
                    // Limit to 2 decimal places and strip trailing zero
                    if (parts[1] !== undefined) {
                      if (parts[1].length > 2) {
                        parts[1] = parts[1].slice(0, 2);
                      }
                      if (parts[1].endsWith("0") && parts[1].length > 0) {
                        parts[1] = parts[1].slice(0, -1);
                      }
                    }
                    val = parts[1] !== undefined ? `${parts[0]}.${parts[1]}` : parts[0];
                    // If trailing dot from deletion (backspace), strip it
                    if (val.endsWith(".") && val.length < editingValue.length) {
                      val = val.slice(0, -1);
                    }
                    setEditingValue(val);
                    // Update the number state in real-time
                    const parsed = parseFloat(val);
                    if (!isNaN(parsed)) setAmount(parsed);
                    else if (val === "" || val === ".") setAmount(0);
                  }}
                  onBlur={() => {
                    setIsFocused(false);
                    // Finalize: parse the editing value to a clean number
                    const parsed = parseFloat(editingValue);
                    setAmount(isNaN(parsed) ? 0 : parsed);
                    setEditingValue("");
                  }}
                />
              </div>

              {/* Quick amounts */}
              <div className="flex gap-1.5 flex-wrap justify-center mb-4">
                {QUICK_AMOUNTS.map((v) => (
                  <Button
                    key={v}
                    variant="secondary"
                    size="sm"
                    onClick={() => setAmount(v)}
                    className="rounded-full font-mono text-[12px] text-fg-1 hover:text-fg-0"
                  >
                    ${v}
                  </Button>
                ))}
              </div>

              {/* Category grid */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setCat(c.id)}
                    className={cn(
                      "aspect-square border rounded-md flex flex-col items-center justify-center gap-1 cursor-pointer text-[11px] transition-colors",
                      cat === c.id
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-line bg-bg-2 text-fg-1 hover:bg-bg-3",
                    )}
                  >
                    <span className="text-[18px]">{c.em}</span>
                    <span>{c.name}</span>
                  </button>
                ))}
              </div>

              {/* Fields */}
              <div className="flex flex-col border border-line bg-bg-0 rounded-md overflow-hidden mb-4">
                <div
                  className="flex items-center gap-3 px-4 py-3.5 border-b border-line-soft cursor-pointer hover:bg-bg-1 transition-colors"
                  onClick={() => setView("date")}
                >
                  <div className="w-8 h-8 rounded-lg bg-bg-2 border border-line flex items-center justify-center text-fg-1 flex-shrink-0">
                    <CalendarIcon size={16} strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-fg-2 uppercase tracking-[0.04em]">
                      Date
                    </div>
                    <div className="text-[14px] text-fg-0 font-medium mt-0.5">
                      {dateLabel}
                    </div>
                  </div>
                  <ChevronRight
                    size={14}
                    strokeWidth={1.75}
                    className="text-fg-2 flex-shrink-0"
                  />
                </div>
                <div
                  className="flex items-center gap-3 px-4 py-3.5 border-b border-line-soft cursor-pointer hover:bg-bg-1 transition-colors"
                  onClick={() => setView("account")}
                >
                  <div className="w-8 h-8 rounded-lg bg-bg-2 border border-line flex items-center justify-center text-fg-1 flex-shrink-0">
                    <Wallet size={16} strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] text-fg-2 uppercase tracking-[0.04em]">
                      Account
                    </div>
                    <div className="text-[14px] text-fg-0 font-medium mt-0.5">
                      {acctLabel}
                    </div>
                  </div>
                  <ChevronRight
                    size={14}
                    strokeWidth={1.75}
                    className="text-fg-2 flex-shrink-0"
                  />
                </div>
                <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-bg-1 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-bg-2 border border-line flex items-center justify-center text-fg-1 flex-shrink-0">
                    <FileText size={16} strokeWidth={1.75} />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <div className="text-[11px] text-fg-2 uppercase tracking-[0.04em]">
                      Note
                    </div>
                    <Input
                      className="h-auto p-0 border-transparent bg-transparent text-[14px] focus-visible:border-transparent placeholder:text-fg-3"
                      placeholder="Optional"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Recurring toggle */}
              <div
                className="flex items-center justify-between px-4 py-3 bg-bg-0 border border-line rounded-sm mb-4 cursor-pointer"
                onClick={() => setRecurring(!recurring)}
              >
                <div>
                  <div className="text-[13px] text-fg-0 flex items-center gap-2">
                    <Repeat size={14} strokeWidth={1.75} /> Make recurring
                  </div>
                  <div className="text-[11px] text-fg-2 mt-0.5">
                    Repeats every month on the 27th
                  </div>
                </div>
                <Toggle checked={recurring} onCheckedChange={setRecurring} />
              </div>
            </div>

            {/* Actions */}
            <DrawerFooter className="grid grid-cols-[1fr_2fr] gap-2 px-5">
              <Button variant="secondary" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>Save transaction</Button>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}

