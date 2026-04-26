"use client";

import * as React from "react";
import { 
  User, 
  Flame, 
  Plus, 
  Moon, 
  Sun, 
  Globe, 
  LayoutGrid, 
  RefreshCcw, 
  Download, 
  HelpCircle, 
  LogOut, 
  Trash2, 
  ChevronRight,
  Home,
  PieChart,
  LucideIcon
} from "lucide-react";
import { useSignOutMutation } from "@/services/auth/auth.hooks";
import { GoalProgress } from "@/components/profile/goal-progress";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useTheme } from "next-themes";
import { useGetProfile } from "@/services/profile/profile.hooks";

export default function ProfilePage() {
  const signOutMutation = useSignOutMutation();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const { data: profile } = useGetProfile();

  // Avoid hydration mismatch for theme toggle
  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(()=>{
    console.log("Profile data:", profile);
  },[profile])

  const handleSignOut = () => {
    signOutMutation.mutate(undefined);
  };

  return (
    <div className="flex flex-col min-h-dvh bg-background-light dark:bg-background-dark pb-32">
      {/* Header / Identity Section */}
      <header className="px-6 pt-16 pb-8 flex flex-col items-center gap-4 bg-white/50 dark:bg-white/5 border-b border-black/5 dark:border-white/5">
        <div className="relative">
          <div className="w-24 h-24 rounded-[2rem] bg-primary/20 flex items-center justify-center border-4 border-white dark:border-background-dark shadow-aura">
            <User size={48} className="text-primary" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-accent-yellow px-3 py-1 rounded-full shadow-lg flex items-center gap-1 border-2 border-white dark:border-background-dark">
            <Flame size={14} className="text-white fill-white" />
            <span className="text-xs font-black text-white">3 DAYS</span>
          </div>
        </div>
        
        <div className="text-center">
          <h1 className="text-2xl font-extrabold text-text-navy dark:text-white leading-tight">
            {profile?.display_name}
          </h1>
          <p className="text-sm font-bold text-text-muted mt-1">{profile?.email}</p>
        </div>
      </header>

      <main className="px-6 py-8 flex flex-col gap-10">
        {/* Action Center */}
        <section className="flex flex-col gap-4">
          <button className="w-full h-16 bg-primary rounded-2xl shadow-colored flex items-center justify-center gap-3 text-white font-extrabold text-lg active:scale-95 transition-transform">
            <Plus size={24} strokeWidth={3} />
            Log Quick Expense
          </button>
          
          <div className="bg-white dark:bg-white/5 p-6 rounded-3xl shadow-soft border border-black/5 dark:border-white/5">
            <h3 className="text-sm font-black text-text-navy dark:text-white uppercase tracking-tighter mb-6 flex items-center gap-2">
              Active Goals
            </h3>
            <div className="flex flex-col gap-8">
              <GoalProgress 
                label="New Running Shoes" 
                current={1200000} 
                target={2000000} 
              />
              <GoalProgress 
                label="Home Coffee Station" 
                current={4500000} 
                target={15000000} 
              />
            </div>
          </div>
        </section>

        {/* App Preferences */}
        <section className="flex flex-col gap-4">
          <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-2">
            Preferences
          </h3>
          
          <div className="flex flex-col bg-white dark:bg-white/5 rounded-3xl shadow-soft border border-black/5 dark:border-white/5 overflow-hidden">
            <PreferenceItem 
              icon={Globe} 
              label="Default Currency" 
              value="IDR (Rp)" 
            />
            <div className="h-px bg-black/5 dark:bg-white/5 mx-6" />
            <div className="flex items-center justify-between px-6 py-5 hover:bg-black/2 dark:hover:bg-white/2 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                  {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                </div>
                <span className="font-bold text-text-navy dark:text-white">Dark Mode</span>
              </div>
              {mounted && (
                <button 
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className={cn(
                    "w-12 h-6 rounded-full transition-colors relative",
                    theme === 'dark' ? "bg-primary" : "bg-text-muted/20"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm",
                    theme === 'dark' ? "left-7" : "left-1"
                  )} />
                </button>
              )}
            </div>
            <div className="h-px bg-black/5 dark:bg-white/5 mx-6" />
            <PreferenceItem 
              icon={LayoutGrid} 
              label="Categories" 
              value="Manage" 
            />
          </div>
        </section>

        {/* PWA / Under the Hood */}
        <section className="flex flex-col gap-4">
          <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-2">
            Sync & Data
          </h3>
          <div className="flex flex-col bg-white dark:bg-white/5 rounded-3xl shadow-soft border border-black/5 dark:border-white/5 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <RefreshCcw size={20} className="animate-spin-slow" />
                </div>
                <div>
                  <p className="font-bold text-text-navy dark:text-white">Sync Status</p>
                  <p className="text-[10px] font-bold text-primary flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                    All data synced
                  </p>
                </div>
              </div>
            </div>
            <div className="h-px bg-black/5 dark:bg-white/5 mx-6" />
            <PreferenceItem 
              icon={Download} 
              label="Export Data" 
              value="CSV" 
            />
          </div>
        </section>

        {/* Account Management */}
        <section className="flex flex-col gap-4 pb-12">
          <h3 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-2">
            Account Management
          </h3>
          <div className="flex flex-col bg-white dark:bg-white/5 rounded-3xl shadow-soft border border-black/5 dark:border-white/5 overflow-hidden">
            <PreferenceItem 
              icon={HelpCircle} 
              label="Help & Support" 
            />
            <div className="h-px bg-black/5 dark:bg-white/5 mx-6" />
            <button 
              onClick={handleSignOut}
              disabled={signOutMutation.isPending}
              className="flex items-center justify-between px-6 py-5 hover:bg-black/2 dark:hover:bg-white/2 transition-colors text-left"
            >
              <div className="flex items-center gap-4 text-accent-coral">
                <div className="p-2.5 rounded-xl bg-accent-coral/10">
                  <LogOut size={20} />
                </div>
                <span className="font-bold uppercase tracking-tight text-sm">
                  {signOutMutation.isPending ? "Signing out..." : "Sign Out"}
                </span>
              </div>
              <ChevronRight size={18} className="text-text-muted/40" />
            </button>
            <div className="h-px bg-black/5 dark:bg-white/5 mx-6" />
            <button className="flex items-center gap-4 px-6 py-5 text-text-muted/50 hover:text-accent-coral transition-colors">
              <Trash2 size={18} />
              <span className="text-xs font-bold uppercase tracking-widest">Delete Account</span>
            </button>
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl border-t border-black/5 dark:border-white/5 px-8 pt-4 pb-8 flex items-center justify-between z-30 pb-safe">
        <Link href="/" className="flex flex-col items-center gap-1.5 text-text-muted hover:text-primary transition-colors">
          <Home size={24} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Home</span>
        </Link>
        <button className="flex flex-col items-center gap-1.5 text-text-muted hover:text-primary transition-colors">
          <PieChart size={24} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Stats</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 text-text-muted hover:text-primary transition-colors">
          <div className="w-6 h-6 rounded-md border-2 border-current flex items-center justify-center text-[10px] font-black">
            $
          </div>
          <span className="text-[10px] font-black uppercase tracking-tighter">Wallet</span>
        </button>
        <Link href="/profile" className="flex flex-col items-center gap-1.5 text-primary">
          <User size={24} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Profile</span>
        </Link>
      </nav>
    </div>
  );
}

function PreferenceItem({ icon: Icon, label, value }: { icon: LucideIcon, label: string, value?: string }) {
  return (
    <button className="flex items-center justify-between px-6 py-5 hover:bg-black/2 dark:hover:bg-white/2 transition-colors text-left w-full">
      <div className="flex items-center gap-4">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
          <Icon size={20} />
        </div>
        <span className="font-bold text-text-navy dark:text-white capitalize">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {value && <span className="text-xs font-black text-primary uppercase">{value}</span>}
        <ChevronRight size={18} className="text-text-muted/40" />
      </div>
    </button>
  );
}

