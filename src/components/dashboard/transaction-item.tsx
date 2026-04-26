import * as React from "react";
import { cn } from "@/lib/utils";
import { 
  Coffee, 
  ShoppingCart, 
  Coins, 
  Car, 
  Utensils, 
  ArrowUpRight, 
  ArrowDownRight,
  LucideIcon
} from "lucide-react";

interface TransactionItemProps {
  title: string;
  category: string;
  amount: number;
  date: string;
  type: "income" | "expense";
  icon?: string;
  className?: string;
}

const CATEGORY_ICONS: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  coffee: { icon: Coffee, color: "text-amber-600", bg: "bg-amber-100" },
  groceries: { icon: ShoppingCart, color: "text-blue-600", bg: "bg-blue-100" },
  income: { icon: Coins, color: "text-primary", bg: "bg-primary/10" },
  gas: { icon: Car, color: "text-slate-600", bg: "bg-slate-100" },
  food: { icon: Utensils, color: "text-rose-600", bg: "bg-rose-100" },
};

export function TransactionItem({
  title,
  category,
  amount,
  date,
  type,
  icon,
  className,
}: TransactionItemProps) {
  const meta = CATEGORY_ICONS[icon || category.toLowerCase()] || CATEGORY_ICONS.groceries;
  const Icon = meta.icon;

  const isIncome = type === "income";

  return (
    <div
      className={cn(
        "bg-white dark:bg-[#122A23] p-4 rounded-xl shadow-soft flex items-center justify-between active:scale-[0.98] transition-transform",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-full flex items-center justify-center text-xl", meta.bg)}>
          <Icon className={cn("w-6 h-6", meta.color)} />
        </div>
        <div>
          <p className="font-bold text-base text-text-navy dark:text-white leading-tight">
            {title}
          </p>
          <p className="text-xs font-semibold text-text-muted mt-1">{date}</p>
        </div>
      </div>
      <div className="text-right">
        <div className="flex items-center justify-end gap-0.5">
          {isIncome ? (
            <ArrowUpRight size={14} className="text-primary" />
          ) : (
            <ArrowDownRight size={14} className="text-accent-coral" />
          )}
          <p
            className={cn(
              "font-extrabold text-lg",
              isIncome ? "text-primary" : "text-accent-coral"
            )}
          >
            {isIncome ? "+" : "-"}${Math.abs(amount).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
