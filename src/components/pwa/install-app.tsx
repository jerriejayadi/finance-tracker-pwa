"use client";

import * as React from "react";
import { Download, Maximize2, Share, Smartphone, SquarePlus, X, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { promptInstall, useInstallPrompt, type InstallState } from "./install-prompt";

interface InstallAppContextValue {
  state: InstallState;
  visible: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  install: () => Promise<void>;
  openShare: () => Promise<void>;
  dismiss: () => void;
}

const InstallAppContext = React.createContext<InstallAppContextValue | null>(null);

function useInstallApp() {
  const ctx = React.useContext(InstallAppContext);
  if (!ctx) throw new Error("InstallApp.* must be used inside <InstallApp>");
  return ctx;
}

function InstallApp({ children }: { children: React.ReactNode }) {
  const state = useInstallPrompt();
  // In-memory only: dismissal lasts until the next full reload.
  const [dismissed, setDismissed] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const canInstall = state === "prompt" || state === "ios";

  const install = React.useCallback(async () => {
    setOpen(false);
    await promptInstall();
  }, []);

  // iOS has no install API. The closest we can get is opening the Share
  // sheet, where the user picks "Add to Home Screen" themselves.
  const openShare = React.useCallback(async () => {
    setOpen(false);
    if (!navigator.share) return;
    try {
      await navigator.share({ title: document.title, url: window.location.origin });
    } catch {
      // User closed the share sheet.
    }
  }, []);

  const dismiss = React.useCallback(() => {
    setDismissed(true);
    setOpen(false);
  }, []);

  const value = React.useMemo(
    () => ({ state, visible: canInstall && !dismissed, open, setOpen, install, openShare, dismiss }),
    [state, canInstall, dismissed, open, install, openShare, dismiss],
  );

  return <InstallAppContext.Provider value={value}>{children}</InstallAppContext.Provider>;
}

function InstallAppTrigger({ className }: { className?: string }) {
  const { visible, setOpen, dismiss } = useInstallApp();
  const t = useTranslations("install");

  if (!visible) return null;

  return (
    <div
      className={cn(
        "bg-bg-1 border-line fixed inset-x-4 bottom-[calc(env(safe-area-inset-bottom)+88px)] z-30 flex items-center rounded-md border shadow-lg shadow-black/30",
        className,
      )}
    >
      <button
        onClick={() => setOpen(true)}
        className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 py-2.5 pl-3 text-left"
      >
        <span className="bg-brand text-brand-ink flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg">
          <Download size={16} strokeWidth={2} />
        </span>
        <span className="min-w-0">
          <span className="text-fg-0 block text-[14px] font-medium">{t("trigger")}</span>
          <span className="text-fg-2 block truncate text-[12px]">{t("triggerDescription")}</span>
        </span>
      </button>
      <button
        onClick={dismiss}
        aria-label={t("notNow")}
        className="text-fg-2 hover:text-fg-0 flex h-11 w-11 flex-shrink-0 cursor-pointer items-center justify-center transition-colors"
      >
        <X size={18} strokeWidth={1.75} />
      </button>
    </div>
  );
}

function InstallAppSheet() {
  const { state, open, setOpen, install, openShare, dismiss } = useInstallApp();
  const t = useTranslations("install");
  const isIos = state === "ios";

  const benefits = [
    { icon: Smartphone, label: t("benefitHomeScreen") },
    { icon: Maximize2, label: t("benefitFullscreen") },
    { icon: Zap, label: t("benefitFast") },
  ];

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerContent>
        <DrawerHeader className="items-center pt-2 text-center sm:text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon-192x192.png"
            alt=""
            className="border-line mx-auto mb-2 h-16 w-16 rounded-[18px] border"
          />
          <DrawerTitle>{t("title")}</DrawerTitle>
          <DrawerDescription className="text-[13px]">{t("description")}</DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-2 px-5 py-5">
          {isIos ? (
            <ol className="bg-bg-2 border-line flex flex-col gap-3 rounded-md border p-4 text-[14px]">
              <li className="flex items-center gap-3">
                <span className="text-fg-2 font-mono text-[12px]">1</span>
                <Share size={16} strokeWidth={1.75} className="text-brand" />
                {t("iosStepShare")}
              </li>
              <li className="flex items-center gap-3">
                <span className="text-fg-2 font-mono text-[12px]">2</span>
                <SquarePlus size={16} strokeWidth={1.75} className="text-brand" />
                {t("iosStepAdd")}
              </li>
            </ol>
          ) : (
            benefits.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 text-[14px]">
                <span className="bg-brand-soft text-brand flex h-8 w-8 items-center justify-center rounded-lg">
                  <Icon size={16} strokeWidth={1.75} />
                </span>
                {label}
              </div>
            ))
          )}
        </div>

        <DrawerFooter className="pb-[max(24px,env(safe-area-inset-bottom))]">
          {isIos ? (
            <Button onClick={openShare}>{t("gotIt")}</Button>
          ) : (
            <Button onClick={install}>{t("install")}</Button>
          )}
          <Button variant="ghost" size="md" onClick={dismiss}>
            {t("notNow")}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

InstallApp.Trigger = InstallAppTrigger;
InstallApp.Sheet = InstallAppSheet;

export { InstallApp };
