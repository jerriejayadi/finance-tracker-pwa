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
import {
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Calendar,
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
  { id: "chase", name: "Chase Checking", meta: "•• 4218", balance: "$4,283.19", em: "🏦", colorClass: "text-brand" },
  { id: "savings", name: "Ally Savings", meta: "•• 8821", balance: "$12,460.00", em: "💰", colorClass: "text-pos" },
  { id: "amex", name: "Amex Gold", meta: "•• 1003", balance: "− $612.40", em: "💳", colorClass: "text-neg", isNeg: true },
  { id: "cash", name: "Cash", meta: "Wallet", balance: "$84.00", em: "💵", colorClass: "text-fg-1" },
  { id: "venmo", name: "Venmo", meta: "@alex.m", balance: "$24.50", em: "◆", colorClass: "text-brand" },
];

const QUICK_AMOUNTS = [5, 10, 20, 50, 100];

type TxType = "expense" | "income" | "transfer";
type ViewState = "main" | "date" | "account";

/* ------------------------------------------------------------------ */
/*  Date Picker View                                                   */
/* ------------------------------------------------------------------ */

function DatePickerView({
  value,
  onSelect,
  onBack,
}: {
  value: string;
  onSelect: (key: string, label: string) => void;
  onBack: () => void;
}) {
  const month = "April 2026";
  const firstDayOffset = 3; // Apr 1 2026 = Wednesday (Sun=0)
  const daysInMonth = 30;
  const today = 27;
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const presets = [
    { id: "today", label: "Today", sub: "Apr 27" },
    { id: "yest", label: "Yesterday", sub: "Apr 26" },
    { id: "2d", label: "2 days ago", sub: "Apr 25" },
  ];

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2 px-5">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-bg-2 border border-line flex items-center justify-center text-fg-1 cursor-pointer hover:bg-bg-3 transition-colors"
        >
          <ChevronLeft size={14} strokeWidth={1.75} />
        </button>
        <h3 className="text-[17px] font-semibold tracking-[-0.005em]">
          Select date
        </h3>
        <div className="w-8" />
      </div>

      <div className="overflow-y-auto flex-1 px-5">
        {/* Presets */}
        <div className="grid grid-cols-3 gap-2 mb-3.5">
          {presets.map((p) => {
            const sel = value === p.id;
            return (
              <button
                key={p.id}
                onClick={() =>
                  onSelect(p.id, p.label + " · " + p.sub + ", 2026")
                }
                className={cn(
                  "p-2.5 border rounded-sm cursor-pointer transition-colors text-left",
                  sel
                    ? "border-brand bg-brand-soft"
                    : "border-line bg-bg-0 hover:bg-bg-2"
                )}
              >
                <div
                  className={cn(
                    "text-[13px] font-medium",
                    sel ? "text-brand" : "text-fg-0"
                  )}
                >
                  {p.label}
                </div>
                <div className="font-mono text-[11px] text-fg-2 mt-0.5">
                  {p.sub}
                </div>
              </button>
            );
          })}
        </div>

        {/* Calendar */}
        <div className="border border-line bg-bg-0 rounded-md p-3.5 mb-4">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button className="w-7 h-7 rounded-full bg-bg-2 border border-line flex items-center justify-center text-fg-1 cursor-pointer hover:bg-bg-3 transition-colors">
              <ChevronLeft size={14} strokeWidth={1.75} />
            </button>
            <div className="text-[14px] font-semibold">{month}</div>
            <button className="w-7 h-7 rounded-full bg-bg-2 border border-line flex items-center justify-center text-fg-1 cursor-pointer hover:bg-bg-3 transition-colors">
              <ChevronRight size={14} strokeWidth={1.75} />
            </button>
          </div>

          {/* Day-of-week header */}
          <div className="grid grid-cols-7 text-center font-mono text-[10px] text-fg-2 uppercase tracking-[0.06em] mb-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((d, i) => {
              if (d === null)
                return <div key={i} className="aspect-square" />;
              const isToday = d === today;
              const isSel =
                value === "d" + d ||
                (value === "today" && d === today) ||
                (value === "yest" && d === today - 1) ||
                (value === "2d" && d === today - 2);
              return (
                <button
                  key={i}
                  onClick={() => onSelect("d" + d, "Apr " + d + ", 2026")}
                  className={cn(
                    "aspect-square flex items-center justify-center font-mono tabular-nums text-[13px] rounded-lg cursor-pointer transition-colors",
                    isSel
                      ? "bg-brand text-brand-ink font-semibold"
                      : isToday
                        ? "text-brand font-semibold hover:bg-bg-2"
                        : "text-fg-1 hover:bg-bg-2 hover:text-fg-0"
                  )}
                >
                  {d}
                </button>
              );
            })}
          </div>
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
      a.meta.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-2 px-5">
        <button
          onClick={onBack}
          className="w-8 h-8 rounded-full bg-bg-2 border border-line flex items-center justify-center text-fg-1 cursor-pointer hover:bg-bg-3 transition-colors"
        >
          <ChevronLeft size={14} strokeWidth={1.75} />
        </button>
        <h3 className="text-[17px] font-semibold tracking-[-0.005em]">
          Select account
        </h3>
        <div className="w-8" />
      </div>

      <div className="overflow-y-auto flex-1 px-5">
        {/* Search */}
        <div className="flex items-center gap-2.5 h-11 px-3.5 bg-bg-0 border border-line rounded-sm mb-3 text-fg-2">
          <Search size={16} strokeWidth={1.75} />
          <input
            className="flex-1 bg-transparent text-[14px] text-fg-0 outline-none placeholder:text-fg-2 font-sans"
            placeholder="Search accounts"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
                    : "border-line bg-bg-0 hover:bg-bg-2"
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-[10px] bg-bg-2 border border-line flex items-center justify-center text-[18px]",
                    a.colorClass,
                    sel && "border-transparent"
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
                      a.isNeg ? "text-neg" : "text-fg-0"
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
                      : "border-line"
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
            <ChevronRight
              size={14}
              strokeWidth={1.75}
              className="text-fg-2"
            />
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

  const [amount, setAmount] = React.useState("0.00");
  const [cat, setCat] = React.useState("food");
  const [note, setNote] = React.useState("");
  const [recurring, setRecurring] = React.useState(false);

  const [dateKey, setDateKey] = React.useState("today");
  const [dateLabel, setDateLabel] = React.useState("Today · Apr 27, 2026");
  const [acctKey, setAcctKey] = React.useState("chase");
  const [acctLabel, setAcctLabel] = React.useState(
    "Chase Checking · •• 4218"
  );

  React.useEffect(() => {
    if (open) {
      setType(defaultType);
      setView("main");
    }
  }, [open, defaultType]);

  const segIdx = type === "expense" ? 0 : type === "income" ? 1 : 2;
  const [whole, cents] = amount.split(".");
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
            value={dateKey}
            onSelect={(k, lbl) => {
              setDateKey(k);
              setDateLabel(lbl);
            }}
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
                    type === "expense" ? "text-neg" : "text-fg-2"
                  )}
                >
                  <ArrowUpRight size={14} strokeWidth={1.75} /> Expense
                </button>
                <button
                  onClick={() => setType("income")}
                  className={cn(
                    "relative z-[1] flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium rounded-xs cursor-pointer transition-colors",
                    type === "income" ? "text-pos" : "text-fg-2"
                  )}
                >
                  <ArrowDownLeft size={14} strokeWidth={1.75} /> Income
                </button>
                <button
                  onClick={() => setType("transfer")}
                  className={cn(
                    "relative z-[1] flex items-center justify-center gap-1.5 py-2.5 text-[13px] font-medium rounded-xs cursor-pointer transition-colors",
                    type === "transfer" ? "text-fg-0" : "text-fg-2"
                  )}
                >
                  <ArrowLeftRight size={14} strokeWidth={1.75} /> Transfer
                </button>
              </div>

              {/* Amount display */}
              <div className="flex items-baseline justify-center gap-1 py-4 pb-3 font-mono tabular-nums">
                <span className="text-[28px] text-fg-2">{sym}</span>
                <span className="text-[28px] text-fg-2">$</span>
                <span
                  className={cn(
                    "text-[56px] font-medium leading-none tracking-[-0.03em]",
                    type === "expense"
                      ? "text-neg"
                      : type === "income"
                        ? "text-pos"
                        : "text-fg-0",
                    amount === "0.00" && "text-fg-3"
                  )}
                >
                  {whole || "0"}
                </span>
                <span className="text-[32px] text-fg-2 tracking-[-0.01em]">
                  .{(cents || "00").padEnd(2, "0").slice(0, 2)}
                </span>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-1.5 flex-wrap justify-center mb-4">
                {QUICK_AMOUNTS.map((v) => (
                  <button
                    key={v}
                    onClick={() => setAmount(v.toFixed(2))}
                    className="h-7 px-3 rounded-full bg-bg-2 border border-line font-mono text-[12px] text-fg-1 cursor-pointer hover:bg-bg-3 hover:text-fg-0 transition-colors"
                  >
                    ${v}
                  </button>
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
                        : "border-line bg-bg-2 text-fg-1 hover:bg-bg-3"
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
                    <Calendar size={16} strokeWidth={1.75} />
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
                    <input
                      className="bg-transparent text-[14px] text-fg-0 outline-none placeholder:text-fg-3 font-sans w-full"
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
                <Toggle
                  checked={recurring}
                  onCheckedChange={setRecurring}
                />
              </div>
            </div>

            {/* Actions */}
            <DrawerFooter className="grid grid-cols-[1fr_2fr] gap-2 px-5">
              <Button
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
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
