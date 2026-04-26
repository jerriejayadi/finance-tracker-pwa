"use client";

import * as React from "react";
import { 
  Plus, 
  Home, 
  PieChart, 
  User, 
  Search,
  Bell,
  ArrowUpRight,
  ChevronRight
} from "lucide-react";
import { TransactionItem } from "@/components/dashboard/transaction-item";
import Link from "next/link";

export default function DashboardPage() {
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
          <button className="w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center shadow-soft text-text-navy dark:text-white">
            <Search size={20} />
          </button>
          <button className="w-10 h-10 rounded-full bg-white dark:bg-white/5 flex items-center justify-center shadow-soft text-text-navy dark:text-white relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-accent-coral rounded-full border-2 border-white dark:border-background-dark"></span>
          </button>
        </div>
      </header>

      <main className="px-6 flex flex-col gap-8">
        {/* Safe to Spend Section */}
        <section className="bg-primary p-6 rounded-[2.5rem] text-white relative overflow-hidden shadow-colored animate-fade-in-up">
          <div className="relative z-10">
            <p className="text-white/80 font-bold text-sm tracking-wide mb-1">SAFE TO SPEND</p>
            <h2 className="text-4xl font-black mb-6">$2,450.80</h2>
            
            <div className="flex items-center justify-between bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="flex flex-col">
                <p className="text-[10px] font-bold text-white/70 uppercase">Daily Budget</p>
                <p className="text-lg font-extrabold">$80.00</p>
              </div>
              <div className="w-px h-8 bg-white/20" />
              <div className="flex flex-col text-right">
                <p className="text-[10px] font-bold text-white/70 uppercase">Left for Today</p>
                <p className="text-lg font-extrabold text-accent-yellow">$32.50</p>
              </div>
            </div>
          </div>
          {/* Decorative auras */}
          <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-[-20%] left-[-10%] w-32 h-32 bg-accent-yellow/20 rounded-full blur-2xl" />
        </section>

        {/* Categories / Highlights */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-white/5 p-4 rounded-3xl shadow-soft border border-black/5 dark:border-white/5 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-2xl bg-accent-yellow/10 flex items-center justify-center text-accent-yellow">
              <PieChart size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted">Total Budget</p>
              <p className="text-lg font-extrabold text-text-navy dark:text-white">$4,200</p>
            </div>
            <div className="w-full bg-text-muted/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-accent-yellow h-full rounded-full w-[65%]" />
            </div>
          </div>
          <div className="bg-white dark:bg-white/5 p-4 rounded-3xl shadow-soft border border-black/5 dark:border-white/5 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <ArrowUpRight size={20} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted">Spent</p>
              <p className="text-lg font-extrabold text-text-navy dark:text-white">$2,730</p>
            </div>
            <div className="w-full bg-text-muted/10 h-1.5 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full w-[80%]" />
            </div>
          </div>
        </section>

        {/* Recent Transactions */}
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-extrabold text-text-navy dark:text-white">Recent Activity</h3>
            <button className="text-sm font-bold text-primary flex items-center gap-1">
              See All <ChevronRight size={16} />
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <TransactionItem 
              title="Starbucks Coffee"
              category="coffee"
              amount={12.50}
              date="Today, 09:41 AM"
              type="expense"
            />
            <TransactionItem 
              title="Weekly Groceries"
              category="groceries"
              amount={84.20}
              date="Yesterday, 06:22 PM"
              type="expense"
            />
            <TransactionItem 
              title="Salary Deposit"
              category="income"
              amount={3200.00}
              date="28 Mar, 2024"
              type="income"
            />
            <TransactionItem 
              title="Shell Gas Station"
              category="gas"
              amount={45.00}
              date="27 Mar, 2024"
              type="expense"
            />
          </div>
        </section>
      </main>

      {/* Floating Action Button */}
      <button className="fixed right-6 bottom-28 w-16 h-16 bg-primary rounded-full shadow-colored flex items-center justify-center text-white active:scale-95 transition-transform z-20">
        <Plus size={32} strokeWidth={3} />
      </button>

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
        <Link href="/profile" className="flex flex-col items-center gap-1.5 text-text-muted hover:text-primary transition-colors">
          <User size={24} />
          <span className="text-[10px] font-black uppercase tracking-tighter">Profile</span>
        </Link>
      </nav>
    </div>
  );
}
