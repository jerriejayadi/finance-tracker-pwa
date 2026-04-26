import Link from "next/link";
import type { ReactNode } from "react";
import { Bell, Home, PieChart, Search, User } from "lucide-react";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-dvh bg-background-light dark:bg-background-dark pb-24">
      {/* App Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between sticky top-0 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="text-primary w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-text-muted">Good Morning,</p>
            <p className="text-base font-extrabold text-text-navy dark:text-white">Alex Johnson</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            aria-label="Search"
            className="w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center shadow-soft text-text-navy dark:text-white"
          >
            <Search size={20} />
          </button>
          <button
            aria-label="Notifications"
            className="w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center shadow-soft text-text-navy dark:text-white relative"
          >
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-accent-coral rounded-full border-2 border-white dark:border-background-dark" />
          </button>
        </div>
      </header>

      {children}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-background-dark/80 backdrop-blur-xl border-t border-black/5 dark:border-white/5 px-8 pt-4 pb-8 flex items-center justify-between z-30 pb-safe">
        <Link href="/" className="flex flex-col items-center gap-1.5 text-primary">
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
        <Link
          href="/profile"
          className="flex flex-col items-center gap-1.5 text-text-muted hover:text-primary transition-colors"
        >
          <User size={24} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Profile</span>
        </Link>
      </nav>
    </div>
  );
}