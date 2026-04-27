"use client";

import * as React from "react";
import {
  Crown,
  User,
  Globe,
  Calendar,
  Sun,
  Moon,
  Bell,
  Wallet,
  Shield,
  Download,
  Database,
  Tag,
  HelpCircle,
  Star,
  LogOut,
  Edit,
} from "lucide-react";
import { useSignOutMutation } from "@/services/auth/auth.hooks";
import { useTheme } from "next-themes";
import { useGetProfile } from "@/services/profile/profile.hooks";
import { Avatar } from "@/components/ui/avatar";
import { SettingsGroup, SettingsRow } from "@/components/ui/settings-group";
import { Toggle } from "@/components/ui/toggle";

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

  const displayName = profile?.display_name || "Alex Morgan";
  const email = profile?.email || "alex@morgan.co";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex flex-col gap-3.5 pb-8">
      {/* Profile header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-2">
        <div className="text-[17px] font-semibold tracking-[-0.005em]">
          Profile
        </div>
        <button className="w-9 h-9 rounded-full bg-bg-1 border border-line flex items-center justify-center text-fg-1 cursor-pointer hover:bg-bg-2 transition-colors">
          <Edit size={16} strokeWidth={1.75} />
        </button>
      </div>

      {/* Profile card */}
      <div className="mx-4 p-[22px_20px] bg-bg-1 border border-line rounded-lg flex items-center gap-4 relative overflow-hidden">
        {/* Brand glow */}
        <div className="absolute -top-10 -right-5 w-[140px] h-[140px] rounded-full bg-brand-soft blur-[40px] pointer-events-none" />

        <Avatar size="lg" variant="brand" className="relative z-[1]">
          {initials}
        </Avatar>
        <div className="flex-1 min-w-0 relative z-[1]">
          <div className="text-[17px] font-semibold tracking-[-0.01em]">
            {displayName}
          </div>
          <div className="text-[13px] text-fg-2 font-mono mt-0.5 truncate">
            {email}
          </div>
        </div>
        <button className="w-9 h-9 rounded-full bg-bg-2 border border-line flex items-center justify-center text-fg-1 cursor-pointer hover:bg-bg-3 transition-colors flex-shrink-0 relative z-[1]">
          <Edit size={16} strokeWidth={1.75} />
        </button>
      </div>

      {/* Stats strip */}
      <div className="mx-4 grid grid-cols-3 border border-line bg-bg-1 rounded-md overflow-hidden">
        <div className="p-3.5 border-r border-line">
          <div className="text-[10px] text-fg-2 uppercase tracking-[0.06em]">
            Tracked
          </div>
          <div className="font-mono tabular-nums text-[18px] font-medium mt-1 tracking-[-0.01em]">
            247
          </div>
          <div className="text-[11px] text-fg-2 font-mono mt-0.5">
            transactions
          </div>
        </div>
        <div className="p-3.5 border-r border-line">
          <div className="text-[10px] text-fg-2 uppercase tracking-[0.06em]">
            Saved
          </div>
          <div className="font-mono tabular-nums text-[18px] font-medium mt-1 tracking-[-0.01em] text-pos">
            + 18%
          </div>
          <div className="text-[11px] text-fg-2 font-mono mt-0.5">
            vs last yr
          </div>
        </div>
        <div className="p-3.5">
          <div className="text-[10px] text-fg-2 uppercase tracking-[0.06em]">
            Streak
          </div>
          <div className="font-mono tabular-nums text-[18px] font-medium mt-1 tracking-[-0.01em]">
            42
          </div>
          <div className="text-[11px] text-fg-2 font-mono mt-0.5">days</div>
        </div>
      </div>

      {/* Settings sections */}
      <div className="px-4 flex flex-col gap-3.5 mt-1">
        {/* Account */}
        <SettingsGroup label="Account">
          <SettingsRow
            icon={<Crown size={16} strokeWidth={1.75} />}
            iconClassName="bg-brand-soft text-brand border-transparent"
            label="FinTrack Pro"
            description="Unlock budgets, exports, sync"
          />
          <SettingsRow
            icon={<User size={16} strokeWidth={1.75} />}
            label="Personal info"
            value="Alex M."
          />
          <SettingsRow
            icon={<Globe size={16} strokeWidth={1.75} />}
            label="Currency"
            value="USD · $"
          />
          <SettingsRow
            icon={<Calendar size={16} strokeWidth={1.75} />}
            label="First day of week"
            value="Mon"
          />
        </SettingsGroup>

        {/* Preferences */}
        <SettingsGroup label="Preferences">
          <SettingsRow
            icon={<Sun size={16} strokeWidth={1.75} />}
            label="Appearance"
            trailing={
              mounted ? (
                <ThemeToggle theme={theme} setTheme={setTheme} />
              ) : null
            }
          />
          <SettingsRow
            icon={<Bell size={16} strokeWidth={1.75} />}
            label="Notifications"
            description="Daily summary at 8 PM"
            onClick={() => setNotifs(!notifs)}
            trailing={
              <Toggle checked={notifs} onCheckedChange={setNotifs} />
            }
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
          <SettingsRow
            icon={<Shield size={16} strokeWidth={1.75} />}
            label="Biometric unlock"
            onClick={() => setBiometric(!biometric)}
            trailing={
              <Toggle checked={biometric} onCheckedChange={setBiometric} />
            }
          />
        </SettingsGroup>

        {/* Data */}
        <SettingsGroup label="Data">
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
        </SettingsGroup>

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
            label={
              signOutMutation.isPending ? "Signing out..." : "Sign out"
            }
            danger
            onClick={handleSignOut}
            trailing={<span />}
          />
        </SettingsGroup>

        {/* App version */}
        <div className="text-center font-mono text-[11px] text-fg-2 py-6">
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
    <div className="inline-flex p-[3px] bg-bg-2 border border-line rounded-full">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setTheme("dark");
        }}
        className={`w-[30px] h-[26px] flex items-center justify-center rounded-full cursor-pointer transition-all ${
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
        className={`w-[30px] h-[26px] flex items-center justify-center rounded-full cursor-pointer transition-all ${
          theme === "light" ? "bg-bg-0 text-fg-0" : "text-fg-2"
        }`}
      >
        <Sun size={12} strokeWidth={1.75} />
      </button>
    </div>
  );
}
