import type { BudgetKind } from "@/services/budgets/budgets.service";

export interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  budget: number;
  spent: number;
  /** Transactions of the budget's kind this month */
  count: number;
  kind?: BudgetKind;
}

export interface BudgetCategoryTemplate {
  id: string;
  name: string;
  icon: string;
  suggested: number;
}

export interface CreateBudgetRow extends BudgetCategoryTemplate {
  budget: number;
  enabled: boolean;
  custom?: boolean;
}
