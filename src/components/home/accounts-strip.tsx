"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { fmtIDR, fmtIDRShort } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ConfirmDrawer } from "@/components/ui/confirm-drawer";
import { AddAccountDrawer } from "@/components/accounts/add-account-drawer";
import { useDeleteAccount, useGetAccountBalances } from "@/services/accounts/accounts.hooks";
import type { AccountBalance } from "@/services/accounts/accounts.service";

/** Horizontally scrolling account cards that break down the total balance. */
export function AccountsStrip({ className }: { className?: string }) {
  const t = useTranslations("dashboard");
  const { data: accounts = [] } = useGetAccountBalances();
  const [addOpen, setAddOpen] = React.useState(false);
  // Kept after close so the drawer content doesn't vanish mid-animation
  const [selected, setSelected] = React.useState<AccountBalance | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);

  return (
    <section className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between px-5">
        <h2 className="text-fg-2 text-[11px] font-semibold tracking-[0.06em] uppercase">
          {t("accounts")}
        </h2>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="text-brand hover:text-brand-hi flex cursor-pointer items-center gap-0.5 text-[12px]"
        >
          <Plus size={12} strokeWidth={2} /> {t("add")}
        </button>
      </div>

      <div className="hide-scrollbar flex gap-2 overflow-x-auto px-4 pb-1">
        {accounts.map((acc) => {
          const balance = Number(acc.balance);
          return (
            <button
              key={acc.account_id}
              type="button"
              onClick={() => {
                setSelected(acc);
                setDetailOpen(true);
              }}
              className="bg-bg-1 border-line hover:bg-bg-2 flex w-[136px] flex-shrink-0 cursor-pointer flex-col gap-2.5 rounded-md border p-3 text-left transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="bg-bg-2 border-line flex h-7 w-7 items-center justify-center rounded-lg border text-[14px]">
                  {acc.icon || "💰"}
                </span>
                <span className="text-fg-1 min-w-0 truncate text-[12px] font-medium">
                  {acc.name}
                </span>
              </div>
              <span
                className={cn(
                  "font-mono text-[15px] font-medium tabular-nums",
                  balance < 0 ? "text-neg" : "text-fg-0",
                )}
              >
                {fmtIDRShort(balance)}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="border-line text-fg-2 hover:bg-bg-1 hover:text-fg-1 flex w-[136px] flex-shrink-0 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed p-3 text-[12px] transition-colors"
        >
          <Plus size={16} strokeWidth={1.75} />
          {t("addAccount")}
        </button>
      </div>

      <AccountDetailDrawer account={selected} open={detailOpen} onOpenChange={setDetailOpen} />
      <AddAccountDrawer open={addOpen} onOpenChange={setAddOpen} />
    </section>
  );
}

/**
 * Account summary with a delete action. Deleting is two-step because it
 * cascades to every transaction in the account.
 */
function AccountDetailDrawer({
  account,
  open,
  onOpenChange,
}: {
  account: AccountBalance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const [confirming, setConfirming] = React.useState(false);
  const deleteAccount = useDeleteAccount({
    mutationConfig: {
      onSuccess: () => onOpenChange(false),
      onError: (err) => toast.error(err.message),
    },
  });

  // Every open starts on the summary, not a leftover confirm step
  React.useEffect(() => {
    if (open) setConfirming(false);
  }, [open]);

  if (!account) return null;
  const balance = Number(account.balance);

  return (
    <ConfirmDrawer
      open={open}
      onOpenChange={(next) => {
        if (!deleteAccount.isPending) onOpenChange(next);
      }}
    >
      {confirming ? (
        <>
          <ConfirmDrawer.Icon>
            <Trash2 size={20} strokeWidth={1.75} />
          </ConfirmDrawer.Icon>
          <ConfirmDrawer.Title>{t("deleteAccountTitle", { name: account.name })}</ConfirmDrawer.Title>
          <ConfirmDrawer.Description>{t("deleteAccountDescription")}</ConfirmDrawer.Description>
          <ConfirmDrawer.Footer>
            <Button
              variant="secondary"
              disabled={deleteAccount.isPending}
              onClick={() => setConfirming(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="danger"
              disabled={deleteAccount.isPending}
              onClick={() => deleteAccount.mutate(account.account_id)}
            >
              {deleteAccount.isPending ? t("deleting") : t("deleteAccount")}
            </Button>
          </ConfirmDrawer.Footer>
        </>
      ) : (
        <>
          <ConfirmDrawer.Icon variant="neutral">
            <span className="text-[22px]">{account.icon || "💰"}</span>
          </ConfirmDrawer.Icon>
          <ConfirmDrawer.Title>{account.name}</ConfirmDrawer.Title>
          <ConfirmDrawer.Description className="font-mono">{account.type}</ConfirmDrawer.Description>
          <ConfirmDrawer.Body>
            <div
              className={cn(
                "font-mono text-[28px] font-medium tracking-tight tabular-nums",
                balance < 0 ? "text-neg" : "text-fg-0",
              )}
            >
              {fmtIDR(balance)}
            </div>
          </ConfirmDrawer.Body>
          <ConfirmDrawer.Footer>
            <Button
              variant="outline"
              className="text-neg border-neg/40 hover:bg-neg-soft"
              onClick={() => setConfirming(true)}
            >
              <Trash2 size={14} strokeWidth={1.75} />
              {tCommon("delete")}
            </Button>
            <ConfirmDrawer.Cancel variant="default">{t("done")}</ConfirmDrawer.Cancel>
          </ConfirmDrawer.Footer>
        </>
      )}
    </ConfirmDrawer>
  );
}
