"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fmtIDR } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ConfirmDrawer } from "@/components/ui/confirm-drawer";
import { useDeleteTransactions } from "@/services/transactions/transactions.hooks";
import type { Transaction } from "./history-constants";

interface DeleteTransactionsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Kept by the caller after close so the content doesn't vanish mid-animation */
  transactions: Transaction[];
  onDeleted?: () => void;
}

/** Confirms, then deletes, one or more transactions. Shows a preview row for a single one. */
export function DeleteTransactionsDrawer({
  open,
  onOpenChange,
  transactions,
  onDeleted,
}: DeleteTransactionsDrawerProps) {
  const t = useTranslations("history");
  const tCommon = useTranslations("common");
  const deleteTransactions = useDeleteTransactions({
    mutationConfig: {
      onSuccess: () => {
        onOpenChange(false);
        onDeleted?.();
      },
      onError: (err) => toast.error(err.message),
    },
  });
  const count = transactions.length;
  const single = count === 1 ? transactions[0] : null;

  return (
    <ConfirmDrawer
      open={open}
      onOpenChange={(next) => {
        if (!deleteTransactions.isPending) onOpenChange(next);
      }}
    >
      <ConfirmDrawer.Icon>
        <Trash2 size={20} strokeWidth={1.75} />
      </ConfirmDrawer.Icon>
      <ConfirmDrawer.Title>{t("deleteTitle", { count })}</ConfirmDrawer.Title>
      <ConfirmDrawer.Description>{t("deleteDescription")}</ConfirmDrawer.Description>
      {single && (
        <ConfirmDrawer.Body>
          <div className="flex items-center gap-3 p-3 rounded-md bg-bg-0 border border-line text-left">
            <div className="w-9 h-9 rounded-[10px] bg-bg-2 border border-line flex items-center justify-center text-[16px] flex-shrink-0">
              {single.category_icon || "💰"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-medium text-fg-0 truncate">
                {single.merchant || single.category_name || single.category}
              </div>
              <div className="font-mono text-[11px] text-fg-2 mt-0.5">{single.date}</div>
            </div>
            <div
              className={cn(
                "font-mono tabular-nums text-[13px] font-medium",
                single.type === "Income" ? "text-pos" : "text-neg",
              )}
            >
              {fmtIDR(Number(single.amount))}
            </div>
          </div>
        </ConfirmDrawer.Body>
      )}
      <ConfirmDrawer.Footer>
        <ConfirmDrawer.Cancel disabled={deleteTransactions.isPending}>
          {tCommon("cancel")}
        </ConfirmDrawer.Cancel>
        <Button
          variant="danger"
          disabled={deleteTransactions.isPending}
          onClick={() => deleteTransactions.mutate(transactions.map((tx) => tx.id))}
        >
          {deleteTransactions.isPending
            ? t("deleting")
            : `${tCommon("delete")}${count > 1 ? ` (${count})` : ""}`}
        </Button>
      </ConfirmDrawer.Footer>
    </ConfirmDrawer>
  );
}
