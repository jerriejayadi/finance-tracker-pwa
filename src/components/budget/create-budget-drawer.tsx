"use client";

import * as React from "react";
import { ChevronLeft, X, Plus, Trash2, Sparkles, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtIDR, fmtIDRShort } from "@/lib/format";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Toggle } from "@/components/ui/toggle";
import {
  MONTH_NAMES,
  DEFAULT_CATEGORY_TEMPLATE,
  ICON_PALETTE,
} from "./budget-constants";
import type { BudgetCategory, CreateBudgetRow } from "./budget-types";

interface CreateBudgetDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  month: number;
  onSave: (rows: BudgetCategory[]) => void;
  initialCategories?: BudgetCategory[] | null;
}

export function CreateBudgetDrawer({
  open,
  onOpenChange,
  year,
  month,
  onSave,
  initialCategories,
}: CreateBudgetDrawerProps) {
  const [step, setStep] = React.useState(1);
  const [income, setIncome] = React.useState(15_000_000);
  const [rows, setRows] = React.useState<CreateBudgetRow[]>(() =>
    DEFAULT_CATEGORY_TEMPLATE.map((c) => ({
      ...c,
      budget: c.suggested,
      enabled: true,
    }))
  );
  const [recurring, setRecurring] = React.useState(true);
  const [addingCat, setAddingCat] = React.useState(false);
  const [newCatName, setNewCatName] = React.useState("");
  const [newCatIcon, setNewCatIcon] = React.useState("✨");
  const [newCatAmt, setNewCatAmt] = React.useState(500_000);
  const [editingId, setEditingId] = React.useState<string | null>(null);

  // Reset when drawer opens
  React.useEffect(() => {
    if (open) {
      setStep(1);
      setIncome(15_000_000);
      if (initialCategories && initialCategories.length > 0) {
        setRows(
          initialCategories.map((c) => ({
            id: c.id,
            name: c.name,
            icon: c.icon,
            suggested: c.budget,
            budget: c.budget,
            enabled: true,
          }))
        );
      } else {
        setRows(
          DEFAULT_CATEGORY_TEMPLATE.map((c) => ({
            ...c,
            budget: c.suggested,
            enabled: true,
          }))
        );
      }
      setRecurring(true);
      setAddingCat(false);
      setEditingId(null);
    }
  }, [open, initialCategories]);

  const totalAllocated = rows
    .filter((r) => r.enabled)
    .reduce((a, r) => a + r.budget, 0);
  const unallocated = income - totalAllocated;
  const allocPct = income > 0 ? (totalAllocated / income) * 100 : 0;

  const updateRow = (id: string, patch: Partial<CreateBudgetRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    setRows((prev) => [
      ...prev,
      {
        id: "custom-" + Date.now(),
        name,
        icon: newCatIcon,
        suggested: newCatAmt,
        budget: newCatAmt,
        enabled: true,
        custom: true,
      },
    ]);
    setNewCatName("");
    setNewCatIcon("✨");
    setNewCatAmt(500_000);
    setAddingCat(false);
  };

  const save = () => {
    const finalRows: BudgetCategory[] = rows
      .filter((r) => r.enabled && r.budget > 0)
      .map((r) => ({
        id: r.id,
        name: r.name,
        icon: r.icon,
        budget: r.budget,
        spent: 0,
        recent: 0,
      }));
    onSave(finalRows);
  };

  const incomePresets = [5_000_000, 10_000_000, 15_000_000, 20_000_000, 30_000_000];

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92dvh]">
        <DrawerHeader className="flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            {step === 2 ? (
              <button
                onClick={() => setStep(1)}
                className="w-7 h-7 rounded-full bg-bg-2 border border-line flex items-center justify-center text-fg-1 cursor-pointer"
              >
                <ChevronLeft size={14} strokeWidth={1.75} />
              </button>
            ) : (
              <button
                onClick={() => onOpenChange(false)}
                className="w-7 h-7 rounded-full bg-bg-2 border border-line flex items-center justify-center text-fg-1 cursor-pointer"
              >
                <X size={14} strokeWidth={1.75} />
              </button>
            )}
            <DrawerTitle className="!text-[16px]">
              Create budget &middot; {MONTH_NAMES[month]}
            </DrawerTitle>
          </div>
          <span className="text-[12px] text-fg-2 font-mono">{step}/2</span>
        </DrawerHeader>

        {/* Stepper */}
        <div className="flex gap-1.5 px-5 mb-4">
          <div
            className={cn(
              "h-[3px] flex-1 rounded-full",
              step >= 1 ? "bg-brand" : "bg-bg-3"
            )}
          />
          <div
            className={cn(
              "h-[3px] flex-1 rounded-full",
              step >= 2 ? "bg-brand" : "bg-bg-3"
            )}
          />
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {step === 1 && (
            <StepIncome
              income={income}
              setIncome={setIncome}
              month={month}
              presets={incomePresets}
              onContinue={() => setStep(2)}
              onCancel={() => onOpenChange(false)}
            />
          )}

          {step === 2 && (
            <StepAllocate
              income={income}
              rows={rows}
              totalAllocated={totalAllocated}
              unallocated={unallocated}
              allocPct={allocPct}
              updateRow={updateRow}
              editingId={editingId}
              setEditingId={setEditingId}
              addingCat={addingCat}
              setAddingCat={setAddingCat}
              newCatName={newCatName}
              setNewCatName={setNewCatName}
              newCatIcon={newCatIcon}
              setNewCatIcon={setNewCatIcon}
              newCatAmt={newCatAmt}
              setNewCatAmt={setNewCatAmt}
              addCategory={addCategory}
              setRows={setRows}
              recurring={recurring}
              setRecurring={setRecurring}
              onCancel={() => onOpenChange(false)}
              onSave={save}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}

/* ─── Step 1: Income ─── */
function StepIncome({
  income,
  setIncome,
  month,
  presets,
  onContinue,
  onCancel,
}: {
  income: number;
  setIncome: (v: number) => void;
  month: number;
  presets: number[];
  onContinue: () => void;
  onCancel: () => void;
}) {
  const [isFocused, setIsFocused] = React.useState(false);
  const [editingValue, setEditingValue] = React.useState("");
  const textRef = React.useRef<HTMLSpanElement>(null);

  const displayFormatted = isFocused
    ? (editingValue || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".")
    : income.toLocaleString("id-ID");

  return (
    <div className="flex flex-col gap-4">
      <div className="text-[11px] text-fg-2 uppercase tracking-[0.06em] font-medium">
        Step 1 &middot; Monthly income
      </div>

      {/* Amount input — tap to edit */}
      <div
        className="relative flex items-baseline justify-center gap-1 py-4 pb-3 font-mono tabular-nums cursor-text group"
        onClick={() => document.getElementById("income-input")?.focus()}
      >
        <span className="text-[22px] text-fg-2">Rp</span>
        <span
          ref={textRef}
          className={cn(
            "text-[44px] font-medium leading-none tracking-[-0.02em] text-fg-0",
            income === 0 && !isFocused && "text-fg-3"
          )}
        >
          {displayFormatted}
        </span>
        {isFocused && (
          <span className="w-[2.5px] h-[34px] bg-brand animate-pulse rounded-full ml-0.5 self-center" />
        )}
        <input
          id="income-input"
          type="text"
          inputMode="numeric"
          className="absolute inset-0 opacity-0 w-full h-full cursor-text"
          value={isFocused ? editingValue : ""}
          onFocus={() => {
            setIsFocused(true);
            setEditingValue(income === 0 ? "" : String(income));
          }}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, "");
            setEditingValue(val);
            const parsed = parseInt(val) || 0;
            setIncome(parsed);
          }}
          onBlur={() => {
            setIsFocused(false);
            const parsed = parseInt(editingValue) || 0;
            setIncome(parsed);
            setEditingValue("");
          }}
        />
      </div>

      <p className="text-[13px] text-fg-1">
        How much do you expect to receive in {MONTH_NAMES[month]}? You can
        change this anytime.
      </p>

      {/* Preset chips */}
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p}
            onClick={() => setIncome(p)}
            className={cn(
              "h-7 px-3 rounded-full text-[12px] font-mono border cursor-pointer transition-colors",
              income === p
                ? "bg-brand-soft border-brand text-brand"
                : "bg-bg-2 border-line text-fg-1 hover:bg-bg-3"
            )}
          >
            {fmtIDRShort(p)}
          </button>
        ))}
      </div>

      {/* Slider */}
      <div className="mt-2">
        <input
          type="range"
          min={1_000_000}
          max={50_000_000}
          step={500_000}
          value={income}
          onChange={(e) => setIncome(parseInt(e.target.value))}
          className="w-full accent-brand"
        />
        <div className="flex justify-between text-[10px] text-fg-2 font-mono mt-1">
          <span>1jt</span>
          <span>15jt</span>
          <span>30jt</span>
          <span>50jt</span>
        </div>
      </div>

      {/* Tip */}
      <div className="flex items-center gap-2 text-[11px] text-fg-2 mt-2">
        <Sparkles size={12} strokeWidth={1.75} className="text-brand" />
        <span>
          Tip: Use your average take-home pay. We&apos;ll suggest 50/30/20
          splits.
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-line">
        <button
          onClick={onCancel}
          className="flex-1 h-11 rounded-sm border border-line text-[14px] text-fg-1 cursor-pointer hover:bg-bg-2 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onContinue}
          disabled={income <= 0}
          className="flex-1 h-11 rounded-sm bg-brand text-brand-ink text-[14px] font-medium cursor-pointer hover:bg-brand-hi transition-colors disabled:opacity-40"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

/* ─── Step 2: Allocate ─── */
function StepAllocate({
  income,
  rows,
  totalAllocated,
  unallocated,
  allocPct,
  updateRow,
  editingId,
  setEditingId,
  addingCat,
  setAddingCat,
  newCatName,
  setNewCatName,
  newCatIcon,
  setNewCatIcon,
  newCatAmt,
  setNewCatAmt,
  addCategory,
  setRows,
  recurring,
  setRecurring,
  onCancel,
  onSave,
}: {
  income: number;
  rows: CreateBudgetRow[];
  totalAllocated: number;
  unallocated: number;
  allocPct: number;
  updateRow: (id: string, patch: Partial<CreateBudgetRow>) => void;
  editingId: string | null;
  setEditingId: (id: string | null) => void;
  addingCat: boolean;
  setAddingCat: (v: boolean) => void;
  newCatName: string;
  setNewCatName: (v: string) => void;
  newCatIcon: string;
  setNewCatIcon: (v: string) => void;
  newCatAmt: number;
  setNewCatAmt: (v: number) => void;
  addCategory: () => void;
  setRows: React.Dispatch<React.SetStateAction<CreateBudgetRow[]>>;
  recurring: boolean;
  setRecurring: (v: boolean) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="text-[11px] text-fg-2 uppercase tracking-[0.06em] font-medium">
        Step 2 &middot; Allocate by category
      </div>

      {/* Allocation summary */}
      <div className="p-3.5 rounded-lg bg-bg-1 border border-line">
        <div className="h-[5px] bg-bg-3 rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: Math.min(100, allocPct) + "%",
              background:
                allocPct > 100
                  ? "var(--neg)"
                  : allocPct >= 95
                    ? "var(--warn)"
                    : "var(--brand)",
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[12px]">
            <span className="text-fg-2">Income</span>
            <span className="font-mono tabular-nums text-fg-1">
              {fmtIDR(income)}
            </span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className="text-fg-2">Allocated</span>
            <span className="font-mono tabular-nums text-fg-1">
              {fmtIDR(totalAllocated)}
            </span>
          </div>
          <div className="flex justify-between text-[12px]">
            <span className="text-fg-0 font-medium">Unallocated</span>
            <span
              className={cn(
                "font-mono tabular-nums font-medium",
                unallocated < 0
                  ? "text-neg"
                  : unallocated > 0
                    ? "text-pos"
                    : "text-fg-1"
              )}
            >
              {fmtIDR(unallocated)}
            </span>
          </div>
        </div>
      </div>

      {/* Category rows */}
      <div className="flex flex-col gap-2">
        {rows.map((r) => {
          const isEditing = editingId === r.id;
          return (
            <div
              key={r.id}
              className={cn(
                "p-3 rounded-lg border transition-colors",
                r.enabled ? "bg-bg-1 border-line" : "bg-bg-0 border-line/50 opacity-60"
              )}
            >
              {/* Row header */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setEditingId(isEditing ? null : r.id)}
                  className="flex items-center gap-2.5 cursor-pointer group"
                >
                  <div className="w-8 h-8 rounded-lg bg-bg-2 border border-line flex items-center justify-center text-[16px]">
                    {r.icon}
                  </div>
                  <div className="text-left">
                    <div className="text-[13px] font-medium text-fg-0 flex items-center gap-1.5">
                      {r.name}
                      {r.custom && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-soft text-brand">
                          Custom
                        </span>
                      )}
                      <Pencil
                        size={10}
                        className="text-fg-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                    </div>
                    <div className="text-[11px] text-fg-2">
                      Suggested {fmtIDRShort(r.suggested)}
                    </div>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      setRows((prev) => prev.filter((x) => x.id !== r.id))
                    }
                    className="w-7 h-7 rounded-md flex items-center justify-center text-fg-2 hover:text-neg hover:bg-neg-soft cursor-pointer transition-colors"
                  >
                    <Trash2 size={14} strokeWidth={1.75} />
                  </button>
                  <Toggle
                    checked={r.enabled}
                    onCheckedChange={(v) => updateRow(r.id, { enabled: v })}
                  />
                </div>
              </div>

              {/* Amount input (default view) */}
              {r.enabled && !isEditing && (
                <div className="mt-2.5">
                  <AmountInput
                    value={r.budget}
                    onChange={(v) => updateRow(r.id, { budget: v })}
                  />
                </div>
              )}

              {/* Edit panel */}
              {isEditing && (
                <div className="mt-3 pt-3 border-t border-line flex flex-col gap-3">
                  <div>
                    <div className="text-[10px] text-fg-2 uppercase tracking-[0.06em] mb-1">
                      Name
                    </div>
                    <input
                      className="w-full h-9 px-3 rounded-sm bg-bg-2 border border-line text-[13px] text-fg-0 outline-none focus:border-brand"
                      value={r.name}
                      onChange={(e) => updateRow(r.id, { name: e.target.value })}
                      maxLength={24}
                    />
                  </div>
                  <div>
                    <div className="text-[10px] text-fg-2 uppercase tracking-[0.06em] mb-1">
                      Icon
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ICON_PALETTE.map((em) => (
                        <button
                          key={em}
                          onClick={() => updateRow(r.id, { icon: em })}
                          className={cn(
                            "w-8 h-8 rounded-md flex items-center justify-center text-[16px] border cursor-pointer transition-colors",
                            r.icon === em
                              ? "bg-brand-soft border-brand"
                              : "bg-bg-2 border-line hover:bg-bg-3"
                          )}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-fg-2 uppercase tracking-[0.06em] mb-1">
                      Monthly amount
                    </div>
                    <AmountInput
                      value={r.budget}
                      onChange={(v) => updateRow(r.id, { budget: v })}
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {!r.custom && (
                      <button
                        onClick={() => {
                          const tpl = DEFAULT_CATEGORY_TEMPLATE.find(
                            (t) => t.id === r.id
                          );
                          if (tpl)
                            updateRow(r.id, {
                              name: tpl.name,
                              icon: tpl.icon,
                              budget: tpl.suggested,
                            });
                        }}
                        className="h-8 px-3 rounded-sm text-[12px] text-fg-2 border border-line cursor-pointer hover:bg-bg-2 transition-colors"
                      >
                        Reset to default
                      </button>
                    )}
                    <button
                      onClick={() => setEditingId(null)}
                      className="h-8 px-3 rounded-sm text-[12px] font-medium text-brand-ink bg-brand cursor-pointer hover:bg-brand-hi transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add category */}
        {!addingCat ? (
          <button
            onClick={() => setAddingCat(true)}
            className="h-12 rounded-lg border border-dashed border-line flex items-center justify-center gap-2 text-[13px] text-fg-1 cursor-pointer hover:bg-bg-1 hover:border-brand transition-colors"
          >
            <Plus size={14} strokeWidth={1.75} />
            Add custom category
          </button>
        ) : (
          <div className="p-3 rounded-lg bg-bg-1 border border-line flex flex-col gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-bg-2 border border-line flex items-center justify-center text-[16px]">
                {newCatIcon}
              </div>
              <input
                className="flex-1 h-9 px-3 rounded-sm bg-bg-2 border border-line text-[13px] text-fg-0 outline-none focus:border-brand"
                placeholder="Category name (e.g. Tithe)"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                autoFocus
                maxLength={24}
              />
            </div>

            <div>
              <div className="text-[10px] text-fg-2 uppercase tracking-[0.06em] mb-1">
                Pick an icon
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ICON_PALETTE.map((em) => (
                  <button
                    key={em}
                    onClick={() => setNewCatIcon(em)}
                    className={cn(
                      "w-8 h-8 rounded-md flex items-center justify-center text-[16px] border cursor-pointer transition-colors",
                      newCatIcon === em
                        ? "bg-brand-soft border-brand"
                        : "bg-bg-2 border-line hover:bg-bg-3"
                    )}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-fg-2 uppercase tracking-[0.06em] mb-1">
                Monthly amount
              </div>
              <AmountInput value={newCatAmt} onChange={setNewCatAmt} />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setAddingCat(false);
                  setNewCatName("");
                }}
                className="h-8 px-3 rounded-sm text-[12px] text-fg-2 border border-line cursor-pointer hover:bg-bg-2 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addCategory}
                disabled={!newCatName.trim()}
                className="h-8 px-3 rounded-sm text-[12px] font-medium text-brand-ink bg-brand cursor-pointer hover:bg-brand-hi transition-colors disabled:opacity-40"
              >
                Add category
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recurring toggle */}
      <div className="flex items-center justify-between p-3.5 rounded-lg bg-bg-1 border border-line">
        <div>
          <div className="text-[13px] text-fg-0 font-medium">
            Repeat every month
          </div>
          <div className="text-[11px] text-fg-2">
            Auto-create the same budget for future months
          </div>
        </div>
        <Toggle checked={recurring} onCheckedChange={setRecurring} />
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 pt-4 border-t border-line">
        <button
          onClick={onCancel}
          className="flex-1 h-11 rounded-sm border border-line text-[14px] text-fg-1 cursor-pointer hover:bg-bg-2 transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          disabled={totalAllocated <= 0}
          className="flex-1 h-11 rounded-sm bg-brand text-brand-ink text-[14px] font-medium cursor-pointer hover:bg-brand-hi transition-colors disabled:opacity-40"
        >
          Save budget
        </button>
      </div>
    </div>
  );
}

/* ─── Shared AmountInput ─── */
function AmountInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center h-9 rounded-sm bg-bg-2 border border-line overflow-hidden focus-within:border-brand">
      <span className="pl-3 pr-1 text-[12px] text-fg-2 font-mono">Rp</span>
      <input
        type="text"
        inputMode="numeric"
        className="flex-1 h-full px-2 bg-transparent text-[13px] font-mono tabular-nums text-fg-0 outline-none"
        value={value.toLocaleString("id-ID")}
        onChange={(e) => {
          const n = parseInt(e.target.value.replace(/\D/g, "")) || 0;
          onChange(n);
        }}
      />
    </div>
  );
}
