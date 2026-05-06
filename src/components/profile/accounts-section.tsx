"use client";

import * as React from "react";
import { Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmtIDR } from "@/lib/format";
import {
  useGetAccountBalances,
  useCreateAccount,
  useDeleteAccount,
} from "@/services/accounts/accounts.hooks";
import type { Account } from "@/services/accounts/accounts.service";
import { Drawer } from "vaul";

const ACCOUNT_TYPES: { value: Account["type"]; label: string; icon: string }[] = [
  { value: "cash", label: "Cash", icon: "💵" },
  { value: "bank", label: "Bank", icon: "🏦" },
  { value: "e-wallet", label: "E-Wallet", icon: "📱" },
  { value: "credit-card", label: "Credit Card", icon: "💳" },
  { value: "investment", label: "Investment", icon: "📈" },
];

export function AccountsSection() {
  const { data: accounts = [] } = useGetAccountBalances();
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const deleteAccount = useDeleteAccount();

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-[11px] font-semibold text-fg-2 uppercase tracking-[0.06em]">
          Accounts
        </h3>
        <button
          onClick={() => setDrawerOpen(true)}
          className="text-[12px] text-brand flex items-center gap-0.5 cursor-pointer hover:text-brand-hi"
        >
          <Plus size={12} strokeWidth={2} /> Add
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="py-6 text-center text-[13px] text-fg-2">
          No accounts yet
        </div>
      ) : (
        <div className="bg-bg-1 border border-line rounded-lg overflow-hidden divide-y divide-line">
          {accounts.map((acc) => (
            <div
              key={acc.account_id}
              className="flex items-center gap-3 px-4 py-3"
            >
              <div className="w-9 h-9 rounded-lg bg-bg-2 border border-line flex items-center justify-center text-[16px]">
                {acc.icon || "💰"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium text-fg-0 truncate">
                  {acc.name}
                </div>
                <div className="text-[12px] text-fg-2 font-mono mt-0.5">
                  {acc.type}
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono tabular-nums text-[14px] font-medium text-fg-0">
                  {fmtIDR(Number(acc.balance))}
                </div>
              </div>
              <button
                onClick={() => deleteAccount.mutate(acc.account_id)}
                className="w-7 h-7 rounded-full flex items-center justify-center text-fg-2 hover:text-neg hover:bg-neg-soft cursor-pointer transition-colors"
              >
                <Trash2 size={13} strokeWidth={1.75} />
              </button>
            </div>
          ))}
        </div>
      )}

      <AddAccountDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
    </div>
  );
}

function AddAccountDrawer({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState<Account["type"]>("bank");

  const createAccount = useCreateAccount({
    mutationConfig: {
      onSuccess: () => {
        onOpenChange(false);
        setName("");
        setType("bank");
      },
    },
  });

  const selectedType = ACCOUNT_TYPES.find((t) => t.value === type);

  const handleSave = () => {
    if (!name.trim()) return;
    createAccount.mutate({
      name: name.trim(),
      type,
      icon: selectedType?.icon,
    });
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 z-50" />
        <Drawer.Content className="fixed bottom-0 left-0 right-0 z-50 flex flex-col rounded-t-2xl bg-bg-0 border-t border-line max-h-[85dvh]">
          <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-line" />

          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <Drawer.Title className="text-[17px] font-semibold text-fg-0">
              Add Account
            </Drawer.Title>
            <button
              onClick={() => onOpenChange(false)}
              className="w-8 h-8 rounded-full bg-bg-1 border border-line flex items-center justify-center text-fg-1 cursor-pointer"
            >
              <X size={14} strokeWidth={2} />
            </button>
          </div>

          <div className="flex flex-col gap-4 px-5 py-4">
            {/* Name input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-fg-2 font-medium">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. BCA, GoPay, Cash"
                className="h-11 px-3.5 bg-bg-1 border border-line rounded-sm text-[14px] text-fg-0 outline-none placeholder:text-fg-2 focus:border-brand transition-colors"
              />
            </div>

            {/* Type selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] text-fg-2 font-medium">Type</label>
              <div className="grid grid-cols-3 gap-2">
                {ACCOUNT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setType(t.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-3 rounded-lg border cursor-pointer transition-colors",
                      type === t.value
                        ? "bg-brand-soft border-brand text-brand"
                        : "bg-bg-1 border-line text-fg-1 hover:bg-bg-2"
                    )}
                  >
                    <span className="text-[18px]">{t.icon}</span>
                    <span className="text-[11px] font-medium">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="px-5 pb-[calc(16px+env(safe-area-inset-bottom))]">
            <button
              onClick={handleSave}
              disabled={!name.trim() || createAccount.isPending}
              className="w-full h-12 rounded-sm bg-brand text-brand-ink text-[14px] font-semibold cursor-pointer hover:bg-brand-hi transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createAccount.isPending ? "Adding..." : "Add Account"}
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
