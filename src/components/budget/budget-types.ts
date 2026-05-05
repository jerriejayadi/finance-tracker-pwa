export interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  budget: number;
  spent: number;
  recent: number;
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
