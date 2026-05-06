"use client";

import * as React from "react";
import { X, Plus, Trash2, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtIDR, fmtIDRShort } from "@/lib/format";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Toggle } from "@/components/ui/toggle";
import { MONTH_NAMES, ICON_PALETTE } from "./budget-constants";
import type { BudgetCategory, CreateBudgetRow } from "./budget-types";

interface EditBudgetDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  year: number;
  month: number;
  categories: BudgetCategory[];
  onSave: (rows: BudgetCategory[]) => void;
  onDelete: (ids: string[]) => void;
}

export function EditBudgetDrawer({
  open,
  onOpenChange,
  year,
  month,
  categories,
  onSave,
  onDelete,
}: EditBudgetDrawerProps) {
  const [rows, setRows] = React.useState<CreateBudgetRow[]>([]);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [addingCat, setAddingCat] = React.useState(false);
  const [newCatName, setNewCatName] = React.useState("");
  const [newCatIcon, setNewCatIcon] = React.useState("✨");
  const [newCatAmt, setNewCatAmt] = React.useState(500_000);
  const [removedIds, setRemovedIds] = React.useState<string[]>([]);

  // Populate rows from existing categories when drawer opens
  React.useEffect(() => {
    if (open) {
      setRows(
        categories.map((c) => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          suggested: c.budget,
          budget: c.budget,
          enabled: true,
        }))
      );
      setEditingId(null);
      setAddingCat(false);
      setRemovedIds([]);
    }
  }, [open, categories]);

  const totalAllocated = rows
    .filter((r) => r.enabled)
    .reduce((a, r) => a + r.budget, 0);

  const updateRow = (id: string, patch: Partial<CreateBudgetRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    // Track existing budget IDs for deletion
    if (!id.startsWith("new-")) {
      setRemovedIds((prev) => [...prev, id]);
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const addCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    setRows((prev) => [
      ...prev,
      {
        id: "new-" + Date.now(),
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
    if (removedIds.length > 0) {
      onDelete(removedIds);
    }
    const finalRows: BudgetCategory[] = rows
      .filter((r) => r.enabled && r.budget > 0)
      .map((r) => ({
        id: r.id,
        name: r.name,
        icon: r.icon,
        budget: r.budget,
        spent: categories.find((c) => c.id === r.id)?.spent ?? 0,
        recent: categories.find((c) => c.id === r.id)?.recent ?? 0,
      }));
    onSave(finalRows);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[92dvh]">
        <DrawerHeader className="flex-row items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenChange(false)}
              className="w-7 h-7 rounded-full bg-bg-2 border border-line flex items-center justify-center text-fg-1 cursor-pointer"
            >
              <X size={14} strokeWidth={1.75} />
            </button>
            <DrawerTitle className="!text-[16px]">
              Edit budget &middot; {MONTH_NAMES[month]}
            </DrawerTitle>
          </div>
          <span className="text-[12px] text-fg-2 font-mono">
            {rows.filter((r) => r.enabled).length} categories
          </span>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-5 pb-6">
          {/* Summary bar */}
          <div className="p-3.5 rounded-lg bg-bg-1 border border-line mb-4">
            <div className="flex justify-between text-[12px]">
              <span className="text-fg-2">Total allocated</span>
              <span className="font-mono tabular-nums text-fg-0 font-medium">
                {fmtIDR(totalAllocated)}
              </span>
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
                    r.enabled
                      ? "bg-bg-1 border-line"
                      : "bg-bg-0 border-line/50 opacity-60"
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
                              New
                            </span>
                          )}
                          <Pencil
                            size={10}
                            className="text-fg-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          />
                        </div>
                        <div className="text-[11px] text-fg-2 font-mono">
                          Current: {fmtIDRShort(r.suggested)}
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => removeRow(r.id)}
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
                          onChange={(e) =>
                            updateRow(r.id, { name: e.target.value })
                          }
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
                      <button
                        onClick={() => setEditingId(null)}
                        className="h-8 px-3 rounded-sm text-[12px] font-medium text-brand-ink bg-brand cursor-pointer hover:bg-brand-hi transition-colors self-start"
                      >
                        Done
                      </button>
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
                Add category
              </button>
            ) : (
              <div className="p-3 rounded-lg bg-bg-1 border border-line flex flex-col gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-bg-2 border border-line flex items-center justify-center text-[16px]">
                    {newCatIcon}
                  </div>
                  <input
                    className="flex-1 h-9 px-3 rounded-sm bg-bg-2 border border-line text-[13px] text-fg-0 outline-none focus:border-brand"
                    placeholder="Category name"
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
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-line">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11 rounded-sm border border-line text-[14px] text-fg-1 cursor-pointer hover:bg-bg-2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={save}
              disabled={totalAllocated <= 0}
              className="flex-1 h-11 rounded-sm bg-brand text-brand-ink text-[14px] font-medium cursor-pointer hover:bg-brand-hi transition-colors disabled:opacity-40"
            >
              Save changes
            </button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
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
