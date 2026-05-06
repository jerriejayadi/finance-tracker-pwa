"use client";

import * as React from "react";
import { Pencil, Tag, Repeat, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Drawer,
  DrawerContent,
} from "@/components/ui/drawer";
import type { Transaction } from "./history-constants";

interface TxDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tx: Transaction | null;
  onDelete?: (id: string) => void;
  onEdit?: (tx: Transaction) => void;
}

export function TxDetailDrawer({
  open,
  onOpenChange,
  tx,
  onDelete,
  onEdit,
}: TxDetailDrawerProps) {
  if (!tx) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        {/* Hero */}
        <div className="flex flex-col items-center text-center gap-1.5 px-5 pt-2 pb-5">
          <div
            className={cn(
              "w-14 h-14 rounded-2xl flex items-center justify-center text-[24px] mb-1",
              tx.type === "Income"
                ? "bg-pos-soft text-pos"
                : "bg-neg-soft text-neg"
            )}
          >
            {tx.category_icon || "💰"}
          </div>
          <div className="text-[17px] font-semibold text-fg-0">
            {tx.merchant || tx.category_name || tx.category}
          </div>
          <div className="text-[12px] text-fg-2 font-mono">
            {tx.category_name || tx.category} &middot; {tx.account_name || ""}
          </div>
          <div
            className={cn(
              "font-mono tabular-nums text-[28px] font-medium tracking-tight mt-2",
              tx.type === "Income" ? "text-pos" : "text-neg"
            )}
          >
            {tx.type === "Income" ? "+ " : "\u2212 "}Rp{" "}
            {Number(tx.amount).toLocaleString("id-ID")}
          </div>
          {tx.recurring_transaction_id && (
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-brand bg-brand-soft px-2 py-1 rounded-full mt-1">
              <Repeat size={10} strokeWidth={2} /> Recurring
            </span>
          )}
        </div>

        {/* Details table */}
        <div className="mx-5 rounded-md bg-bg-0 border border-line overflow-hidden mb-4">
          <DetailRow label="Date" value={tx.date} />
          <DetailRow label="Account" value={tx.account_name || ""} />
          <DetailRow
            label="Category"
            value={
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-bg-2 border border-line text-[12px] text-fg-0">
                {tx.category_icon} {tx.category_name || tx.category}
              </span>
            }
          />
          <DetailRow
            label="Type"
            value={tx.type}
            valueClass={tx.type === "Income" ? "text-pos" : "text-neg"}
            last
          />
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mx-5 mb-4">
          <ActionButton
            icon={<Pencil size={14} />}
            label="Edit"
            onClick={() => {
              onEdit?.(tx);
              onOpenChange(false);
            }}
          />
          <ActionButton icon={<Tag size={14} />} label="Recategorize" />
          <ActionButton icon={<Repeat size={14} />} label="Duplicate" />
          <ActionButton
            icon={<Trash2 size={14} />}
            label="Delete"
            variant="danger"
            onClick={() => {
              onDelete?.(tx.id);
              onOpenChange(false);
            }}
          />
        </div>

        {/* Close */}
        <div className="px-5 pb-6">
          <button
            onClick={() => onOpenChange(false)}
            className="w-full h-11 rounded-sm bg-brand text-brand-ink text-[14px] font-medium cursor-pointer hover:bg-brand-hi transition-colors"
          >
            Done
          </button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

function DetailRow({
  label,
  value,
  valueClass,
  last,
}: {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
  last?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex justify-between items-center px-3.5 py-3 text-[13px]",
        !last && "border-b border-line-soft"
      )}
    >
      <span className="text-[11px] text-fg-2 uppercase tracking-[0.06em]">
        {label}
      </span>
      <span className={cn("font-mono text-fg-0", valueClass)}>{value}</span>
    </div>
  );
}

function ActionButton({
  icon,
  label,
  variant = "ghost",
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  variant?: "ghost" | "danger";
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "h-11 rounded-sm border text-[13px] font-medium flex items-center justify-center gap-2 cursor-pointer transition-colors",
        variant === "danger"
          ? "bg-transparent text-neg border-neg/40 hover:bg-neg-soft"
          : "bg-bg-2 text-fg-0 border-line hover:bg-bg-3"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
