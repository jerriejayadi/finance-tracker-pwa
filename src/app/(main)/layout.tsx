"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  Home,
  Receipt,
  Wallet,
  User,
  Plus,
  Search,
  Bell,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { AddTransactionDrawer } from "@/components/transactions/add-transaction-drawer";
import { Toaster } from "@/components/ui/sonner";
import { InstallApp } from "@/components/pwa/install-app";
import { useGetProfile } from "@/services/profile/profile.hooks";
import { useTranslations } from "next-intl";

type TxType = "expense" | "income" | "transfer";

const AddTxContext = React.createContext<(type?: TxType) => void>(() => {});
export const useAddTransaction = () => React.useContext(AddTxContext);

const TAB_LEFT = [
  { id: "/", icon: Home },
  { id: "/history", icon: Receipt },
] as const;

const TAB_RIGHT = [
  { id: "/budget", icon: Wallet },
  { id: "/profile", icon: User },
] as const;

const navKeys: Record<string, "home" | "history" | "budget" | "you"> = {
  "/": "home",
  "/history": "history",
  "/budget": "budget",
  "/profile": "you",
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const pathname = usePathname();
  const [addTxOpen, setAddTxOpen] = React.useState(false);
  const [addTxType, setAddTxType] = React.useState<TxType>("expense");
  const { data: profile } = useGetProfile();
  const tNav = useTranslations("nav");
  const tGreeting = useTranslations("greeting");

  const openAddTx = React.useCallback((type: TxType = "expense") => {
    setAddTxType(type);
    setAddTxOpen(true);
  }, []);

  const firstName = profile?.display_name?.split(" ")[0] ?? "";
  const initials = profile?.display_name
    ? profile.display_name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "";

  const hour = new Date().getHours();
  const greetingKey = hour < 12 ? "morning" : hour < 17 ? "afternoon" : ("evening" as const);

  return (
    <AddTxContext.Provider value={openAddTx}>
    <div className="flex flex-col min-h-dvh bg-bg-0 w-full mx-auto relative overflow-x-hidden">
      {/* App header */}
      <header className="flex items-center justify-between px-5 pt-3 pb-2">
        <div>
          <div className="text-[12px] text-fg-2">{tGreeting(greetingKey)}</div>
          <div className="text-[17px] font-semibold text-fg-0 mt-0.5">
            {firstName}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* <button className="w-9 h-9 rounded-full bg-bg-1 border border-line flex items-center justify-center text-fg-1 cursor-pointer hover:bg-bg-2 transition-colors">
            <Search size={18} strokeWidth={1.75} />
          </button> */}
          {/* <button className="relative w-9 h-9 rounded-full bg-bg-1 border border-line flex items-center justify-center text-fg-1 cursor-pointer hover:bg-bg-2 transition-colors">
            <Bell size={18} strokeWidth={1.75} />
            <span className="absolute top-2 right-2 w-[7px] h-[7px] rounded-full bg-brand border-2 border-bg-0" />
          </button> */}
          <Link href="/profile">
            <Avatar size="sm">{initials}</Avatar>
          </Link>
        </div>
      </header>

      <div className="flex-1 pb-24">{children}</div>

      {/* Tab bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full  grid grid-cols-5 bg-bg-0/[0.78] backdrop-blur-[18px] border-t border-line px-2 pt-2 pb-[26px] pb-safe z-30">
        {TAB_LEFT.map((item) => {
          const isActive = pathname === item.id;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.id}
              className={`flex flex-col items-center gap-[3px] py-1.5 text-[10px] tracking-[0.02em] transition-colors cursor-pointer ${
                isActive ? "text-fg-0" : "text-fg-2"
              }`}
            >
              <Icon size={20} strokeWidth={1.75} />
              <span>{tNav(navKeys[item.id])}</span>
              <span
                className={`w-1 h-1 rounded-full bg-brand -mt-0.5 ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
              />
            </Link>
          );
        })}

        {/* FAB */}
        <div className="flex items-center justify-center">
          <button
            onClick={() => openAddTx("expense")}
            className="w-14 h-14 rounded-[18px] bg-brand text-brand-ink flex items-center justify-center cursor-pointer -mt-4 hover:bg-brand-hi transition-colors"
          >
            <Plus size={24} strokeWidth={1.75} />
          </button>
        </div>

        {TAB_RIGHT.map((item) => {
          const isActive = pathname === item.id;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.id}
              className={`flex flex-col items-center gap-[3px] py-1.5 text-[10px] tracking-[0.02em] transition-colors cursor-pointer ${
                isActive ? "text-fg-0" : "text-fg-2"
              }`}
            >
              <Icon size={20} strokeWidth={1.75} />
              <span>{tNav(navKeys[item.id])}</span>
              <span
                className={`w-1 h-1 rounded-full bg-brand -mt-0.5 ${
                  isActive ? "opacity-100" : "opacity-0"
                }`}
              />
            </Link>
          );
        })}
      </nav>

      {/* Add Transaction Drawer */}
      <AddTransactionDrawer open={addTxOpen} onOpenChange={setAddTxOpen} defaultType={addTxType} />
      <InstallApp>
        <InstallApp.Trigger />
        <InstallApp.Sheet />
      </InstallApp>
      <Toaster />
    </div>
    </AddTxContext.Provider>
  );
}
