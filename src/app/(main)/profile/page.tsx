"use client";

import { AccountsSection } from "@/components/profile/accounts-section";
import { Avatar } from "@/components/ui/avatar";
import { SettingsGroup, SettingsRow } from "@/components/ui/settings-group";
import { Toggle } from "@/components/ui/toggle";
import { useSignOutMutation } from "@/services/auth/auth.hooks";
import { useGetProfile } from "@/services/profile/profile.hooks";
import {
  Bell,
  Calendar,
  Crown,
  Edit,
  Globe,
  HelpCircle,
  LogOut,
  Moon,
  Star,
  Sun,
  User,
  Wallet,
} from "lucide-react";
import { useTheme } from "next-themes";
import * as React from "react";

function getCurrencySymbol(code: string): string {
  try {
    return (
      new Intl.NumberFormat("en", { style: "currency", currency: code })
        .formatToParts(0)
        .find((p) => p.type === "currency")?.value ?? code
    );
  } catch {
    return code;
  }
}

export default function ProfilePage() {
  const signOutMutation = useSignOutMutation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const { data: profile } = useGetProfile();

  const [biometric, setBiometric] = React.useState(true);
  const [notifs, setNotifs] = React.useState(true);
  const [budgetAlerts, setBudgetAlerts] = React.useState(true);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignOut = () => {
    signOutMutation.mutate(undefined);
  };

  const displayName = profile?.display_name ?? "";
  const email = profile?.email ?? "";
  const initials = displayName
    ? displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "";

  const currencyCode = profile?.currency_preference ?? "IDR";
  const currencySymbol = getCurrencySymbol(currencyCode);
  const shortName = displayName
    ? `${displayName.split(" ")[0]} ${displayName.split(" ").slice(-1)[0]?.[0] ?? ""}.`
    : "";
  const firstDayLabel = profile?.first_day_of_week === 0 ? "Sun" : "Mon";

  return (
    <div className="flex flex-col gap-3.5 pb-8">
      {/* Profile header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="text-[17px] font-semibold tracking-[-0.005em]">
          Profile
        </div>
        {/* <button className="w-9 h-9 rounded-full bg-bg-1 border border-line flex items-center justify-center text-fg-1 cursor-pointer hover:bg-bg-2 transition-colors">
          <Edit size={16} strokeWidth={1.75} />
        </button> */}
      </div>

      {/* Profile card */}
      <div className="bg-bg-1 border-line relative mx-4 flex items-center gap-4 overflow-hidden rounded-lg border p-[22px_20px]">
        {/* Brand glow */}
        <div className="bg-brand-soft pointer-events-none absolute -top-10 -right-5 h-[140px] w-[140px] rounded-full blur-[40px]" />

        <Avatar size="lg" variant="brand" className="relative z-[1]">
          {initials}
        </Avatar>
        <div className="relative z-[1] min-w-0 flex-1">
          <div className="text-[17px] font-semibold tracking-[-0.01em]">
            {displayName}
          </div>
          <div className="text-fg-2 mt-0.5 truncate font-mono text-[13px]">
            {email}
          </div>
        </div>
        <button className="bg-bg-2 border-line text-fg-1 hover:bg-bg-3 relative z-[1] flex h-9 w-9 flex-shrink-0 cursor-pointer items-center justify-center rounded-full border transition-colors">
          <Edit size={16} strokeWidth={1.75} />
        </button>
      </div>

      {/* Stats strip */}
      <div className="border-line bg-bg-1 mx-4 grid grid-cols-2 overflow-hidden rounded-md border">
        <div className="border-line border-r p-3.5">
          <div className="text-fg-2 text-[10px] tracking-[0.06em] uppercase">
            Tracked
          </div>
          <div className="mt-1 font-mono text-[18px] font-medium tracking-[-0.01em] tabular-nums">
            247
          </div>
          <div className="text-fg-2 mt-0.5 font-mono text-[11px]">
            transactions
          </div>
        </div>
        <div className="border-line border-r p-3.5">
          <div className="text-fg-2 text-[10px] tracking-[0.06em] uppercase">
            Saved
          </div>
          <div className="text-pos mt-1 font-mono text-[18px] font-medium tracking-[-0.01em] tabular-nums">
            + 18%
          </div>
          <div className="text-fg-2 mt-0.5 font-mono text-[11px]">
            vs last yr
          </div>
        </div>
        {/* <div className="p-3.5">
          <div className="text-[10px] text-fg-2 uppercase tracking-[0.06em]">
            Streak
          </div>
          <div className="font-mono tabular-nums text-[18px] font-medium mt-1 tracking-[-0.01em]">
            42
          </div>
          <div className="text-[11px] text-fg-2 font-mono mt-0.5">days</div>
        </div> */}
      </div>

      {/* Settings sections */}
      <div className="mt-1 flex flex-col gap-3.5 px-4">
        {/* Account */}
        <SettingsGroup label="">
          <SettingsRow
            icon={<Crown size={16} strokeWidth={1.75} />}
            iconClassName="bg-brand-soft text-brand border-transparent"
            label="FinTrack Pro"
            description="Unlock Bulk Import, AI Chatbots, and more"
          />
          {/* <SettingsRow
            icon={<User size={16} strokeWidth={1.75} />}
            label="Personal info"
            value={shortName}
          /> */}
          <SettingsRow
            icon={<Globe size={16} strokeWidth={1.75} />}
            label="Currency"
            value={`${currencyCode} · ${currencySymbol}`}
          />
          {/* <SettingsRow
            icon={<Calendar size={16} strokeWidth={1.75} />}
            label="First day of week"
            value={firstDayLabel}
          /> */}
        </SettingsGroup>

        {/* Accounts */}
        <AccountsSection />

        {/* Preferences */}
        <SettingsGroup label="Preferences">
          <SettingsRow
            icon={<Sun size={16} strokeWidth={1.75} />}
            label="Appearance"
            trailing={
              mounted ? <ThemeToggle theme={theme} setTheme={setTheme} /> : null
            }
          />
          <SettingsRow
            icon={<Bell size={16} strokeWidth={1.75} />}
            label="Notifications"
            description="Daily summary at 8 PM"
            onClick={() => setNotifs(!notifs)}
            trailing={<Toggle checked={notifs} onCheckedChange={setNotifs} />}
          />
          <SettingsRow
            icon={<Wallet size={16} strokeWidth={1.75} />}
            label="Budget alerts"
            description="Quiet ping at 85% of limit"
            onClick={() => setBudgetAlerts(!budgetAlerts)}
            trailing={
              <Toggle
                checked={budgetAlerts}
                onCheckedChange={setBudgetAlerts}
              />
            }
          />
          {/* <SettingsRow
            icon={<Shield size={16} strokeWidth={1.75} />}
            label="Biometric unlock"
            onClick={() => setBiometric(!biometric)}
            trailing={
              <Toggle checked={biometric} onCheckedChange={setBiometric} />
            }
          /> */}
        </SettingsGroup>

        {/* Data */}
        {/* <SettingsGroup label="Data">
          <SettingsRow
            icon={<Download size={16} strokeWidth={1.75} />}
            label="Export data"
            value="CSV · PDF · JSON"
          />
          <SettingsRow
            icon={<Database size={16} strokeWidth={1.75} />}
            label="Backup"
            description="Last synced 2 min ago"
            value="iCloud"
          />
          <SettingsRow
            icon={<Tag size={16} strokeWidth={1.75} />}
            label="Categories & tags"
            value="14"
          />
        </SettingsGroup> */}

        {/* Support */}
        <SettingsGroup label="Support">
          <SettingsRow
            icon={<HelpCircle size={16} strokeWidth={1.75} />}
            label="Help center"
          />
          <SettingsRow
            icon={<Star size={16} strokeWidth={1.75} />}
            label="Rate FinTrack"
          />
          <SettingsRow
            icon={<LogOut size={16} strokeWidth={1.75} />}
            iconClassName="bg-neg-soft text-neg border-transparent"
            label={signOutMutation.isPending ? "Signing out..." : "Sign out"}
            danger
            onClick={handleSignOut}
            trailing={<span />}
          />
        </SettingsGroup>

        {/* App version */}
        <div className="text-fg-2 py-6 text-center font-mono text-[11px]">
          FinTrack · v2.4.0 (build 218)
        </div>
      </div>
    </div>
  );
}

function ThemeToggle({
  theme,
  setTheme,
}: {
  theme: string | undefined;
  setTheme: (t: string) => void;
}) {
  return (
    <div className="bg-bg-2 border-line inline-flex rounded-full border p-[3px]">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setTheme("dark");
        }}
        className={`flex h-[26px] w-[30px] cursor-pointer items-center justify-center rounded-full transition-all ${
          theme === "dark" ? "bg-bg-0 text-fg-0" : "text-fg-2"
        }`}
      >
        <Moon size={12} strokeWidth={1.75} />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setTheme("light");
        }}
        className={`flex h-[26px] w-[30px] cursor-pointer items-center justify-center rounded-full transition-all ${
          theme === "light" ? "bg-bg-0 text-fg-0" : "text-fg-2"
        }`}
      >
        <Sun size={12} strokeWidth={1.75} />
      </button>
    </div>
  );
}
