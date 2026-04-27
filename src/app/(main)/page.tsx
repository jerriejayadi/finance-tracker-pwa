"use client";

import * as React from "react";
import {
  ChevronRight,
  ChevronDown,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
} from "lucide-react";
import { TransactionItem } from "@/components/home/transaction-item";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Chip } from "@/components/ui/chip";
import { useAddTransaction } from "./layout";

const SEED_GROUPS = [
  {
    day: "Today · Apr 27",
    total: -34.14,
    items: [
      {
        id: 1,
        merchant: "Ramen Tatsu",
        category: "Food",
        icon: "🍜",
        amount: 18.4,
        type: "expense" as const,
        time: "12:48",
        recurring: false,
      },
      {
        id: 2,
        merchant: "Spotify",
        category: "Subscriptions",
        icon: "♪",
        amount: 9.99,
        type: "expense" as const,
        time: "09:12",
        recurring: true,
      },
      {
        id: 3,
        merchant: "Blue Bottle",
        category: "Coffee",
        icon: "☕",
        amount: 5.75,
        type: "expense" as const,
        time: "08:19",
        recurring: false,
      },
    ],
  },
  {
    day: "Yesterday · Apr 26",
    total: 3137.86,
    items: [
      {
        id: 4,
        merchant: "Payroll · Acme Co.",
        category: "Income",
        icon: "$",
        amount: 3200.0,
        type: "income" as const,
        time: "08:00",
        recurring: false,
      },
      {
        id: 5,
        merchant: "Trader Joe's",
        category: "Groceries",
        icon: "🛒",
        amount: 62.14,
        type: "expense" as const,
        time: "18:31",
        recurring: false,
      },
    ],
  },
  {
    day: "Apr 25",
    total: -96.45,
    items: [
      {
        id: 6,
        merchant: "PG&E Electricity",
        category: "Utilities",
        icon: "⌁",
        amount: 82.15,
        type: "expense" as const,
        time: "07:02",
        recurring: true,
      },
      {
        id: 7,
        merchant: "Uber",
        category: "Transport",
        icon: "🚗",
        amount: 14.3,
        type: "expense" as const,
        time: "22:04",
        recurring: false,
      },
    ],
  },
];

const CHIPS = [
  { id: "All", count: 247 },
  { id: "Food", count: 38 },
  { id: "Transport", count: 12 },
  { id: "Income", count: 4 },
  { id: "Bills", count: 9 },
  { id: "Fun", count: 16 },
];

const PERIOD_OPTIONS = [
  { value: "Day", label: "Day" },
  { value: "Week", label: "Week" },
  { value: "Month", label: "Month" },
  { value: "Year", label: "Year" },
];

export default function DashboardPage() {
  const openAddTx = useAddTransaction();
  const [period, setPeriod] = React.useState("Month");
  const [chip, setChip] = React.useState("All");

  return (
    <main className="flex flex-col gap-4">
      {/* Balance hero */}
      <section className="mx-4 p-[22px_22px_20px] bg-bg-1 border border-line rounded-lg relative overflow-hidden">
        {/* Brand glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand-soft blur-[40px] pointer-events-none" />

        <div className="flex items-center justify-between relative z-[1]">
          <div className="text-[11px] uppercase tracking-[0.06em] text-fg-2 font-medium">
            Total balance
          </div>
          <button className="inline-flex items-center gap-1 h-6 px-2.5 rounded-full bg-bg-2 border border-line text-[11px] text-fg-1 font-mono cursor-pointer">
            April · 2026 <ChevronDown size={12} strokeWidth={1.75} />
          </button>
        </div>

        <div className="font-mono tabular-nums text-[42px] leading-[1.05] tracking-[-0.025em] font-medium mt-3 relative z-[1]">
          $4,283<span className="text-fg-2 text-[28px]">.19</span>
        </div>

        <div className="flex items-center gap-2 mt-1.5 relative z-[1]">
          <span className="inline-flex items-center gap-1 font-mono text-[11px] px-2 py-[3px] rounded-full bg-pos-soft text-pos">
            ▲ 12.4%
          </span>
          <span className="text-[11px] text-fg-2">
            vs March · + $471.20
          </span>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-3 gap-2 mt-[18px] relative z-[1]">
          <button onClick={() => openAddTx("expense")} className="h-11 rounded-sm bg-brand text-brand-ink text-[13px] font-medium border border-transparent flex items-center justify-center gap-1.5 cursor-pointer hover:bg-brand-hi transition-colors">
            <Plus size={16} strokeWidth={1.75} /> Expense
          </button>
          <button onClick={() => openAddTx("income")} className="h-11 rounded-sm bg-bg-2 text-fg-0 text-[13px] font-medium border border-line flex items-center justify-center gap-1.5 cursor-pointer hover:bg-bg-3 transition-colors">
            <ArrowDownLeft size={16} strokeWidth={1.75} /> Income
          </button>
          <button onClick={() => openAddTx("transfer")} className="h-11 rounded-sm bg-bg-2 text-fg-0 text-[13px] font-medium border border-line flex items-center justify-center gap-1.5 cursor-pointer hover:bg-bg-3 transition-colors">
            <ArrowLeftRight size={16} strokeWidth={1.75} /> Transfer
          </button>
        </div>
      </section>

      {/* In/Out strip */}
      <section className="mx-4 grid grid-cols-[1fr_1px_1fr] bg-bg-1 border border-line rounded-md py-3.5 items-center">
        <div className="flex items-center gap-3 px-3.5">
          <div className="w-8 h-8 rounded-lg bg-pos-soft text-pos flex items-center justify-center flex-shrink-0">
            <ArrowDownLeft size={16} strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-[11px] text-fg-2 uppercase tracking-[0.04em]">
              Income
            </div>
            <div className="font-mono tabular-nums text-[15px] font-medium mt-0.5">
              + $3,200.00
            </div>
          </div>
        </div>
        <div className="w-px h-7 bg-line" />
        <div className="flex items-center gap-3 px-3.5">
          <div className="w-8 h-8 rounded-lg bg-neg-soft text-neg flex items-center justify-center flex-shrink-0">
            <ArrowUpRight size={16} strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-[11px] text-fg-2 uppercase tracking-[0.04em]">
              Expenses
            </div>
            <div className="font-mono tabular-nums text-[15px] font-medium mt-0.5">
              − $1,876.81
            </div>
          </div>
        </div>
      </section>

      {/* Section title */}
      <div className="flex items-center justify-between px-5 mt-[18px]">
        <h2 className="text-[11px] font-semibold text-fg-2 uppercase tracking-[0.06em]">
          Recent activity
        </h2>
        <button className="text-[12px] text-fg-1 flex items-center gap-0.5 cursor-pointer hover:text-fg-0">
          See all <ChevronRight size={12} strokeWidth={1.75} />
        </button>
      </div>

      {/* Period picker */}
      <div className="px-5">
        <SegmentedControl
          value={period}
          onValueChange={setPeriod}
          options={PERIOD_OPTIONS}
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-1.5 overflow-x-auto px-5 hide-scrollbar pb-1">
        {CHIPS.map((c) => (
          <Chip
            key={c.id}
            active={chip === c.id}
            count={c.count}
            onClick={() => setChip(c.id)}
          >
            {c.id}
          </Chip>
        ))}
      </div>

      {/* Transaction list */}
      <div className="px-4 flex flex-col gap-0.5">
        {SEED_GROUPS.map((g) => (
          <React.Fragment key={g.day}>
            <div className="text-[11px] text-fg-2 uppercase tracking-[0.04em] px-1 pt-3.5 pb-1.5 flex justify-between items-baseline">
              <span>{g.day}</span>
              <span className="font-mono text-fg-1 normal-case tracking-normal">
                {g.total >= 0 ? "+ " : "− "}$
                {Math.abs(g.total).toFixed(2)}
              </span>
            </div>
            {g.items.map((tx) => (
              <TransactionItem
                key={tx.id}
                title={tx.merchant}
                category={tx.category}
                amount={tx.amount}
                time={tx.time}
                type={tx.type}
                icon={tx.icon}
                recurring={tx.recurring}
              />
            ))}
          </React.Fragment>
        ))}
      </div>

      <div className="h-5" />
    </main>
  );
}
