"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { accountTypeIcon } from "@/lib/import/match-import-rows";
import type { Account } from "@/services/accounts/accounts.service";

interface DefaultAccountDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: Account[];
  selectedId: string | null;
  onPick: (id: string) => void;
}

export function DefaultAccountDrawer({
  open,
  onOpenChange,
  accounts,
  selectedId,
  onPick,
}: DefaultAccountDrawerProps) {
  const t = useTranslations("import");
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="pb-2">
          <DrawerTitle>{t("defaultAccount")}</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-1 px-4 pb-8">
          {accounts.map((a) => {
            const active = a.id === selectedId;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => {
                  onPick(a.id);
                  onOpenChange(false);
                }}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-md border px-3.5 py-3 text-left transition-colors",
                  active ? "border-brand bg-brand-soft" : "hover:bg-bg-2 border-transparent",
                )}
              >
                <div className="bg-bg-2 border-line grid h-9 w-9 place-items-center rounded-md border text-[16px]">
                  {a.icon || accountTypeIcon(a.type)}
                </div>
                <div className="flex-1">
                  <div className="text-fg-0 text-[14px] font-medium">{a.name}</div>
                  <div className="text-fg-2 mt-0.5 font-mono text-[11px]">{a.type}</div>
                </div>
                {active && <Check size={16} strokeWidth={2} className="text-brand" />}
              </button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
