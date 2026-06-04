export type TransactionType = 'INCOME' | 'EXPENSE';

export type Category =
  | 'FOOD'
  | 'TRANSPORT'
  | 'SHOPPING'
  | 'ENTERTAINMENT'
  | 'UTILITIES'
  | 'HEALTHCARE'
  | 'EDUCATION'
  | 'OTHERS';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: Category;
  note: string | null;
  date: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionPayload {
  type: TransactionType;
  amount: number;
  category: Category;
  note?: string;
  date?: string;
}

export type UpdateTransactionPayload = Partial<CreateTransactionPayload>;

export interface TransactionFilters {
  type?: TransactionType;
  category?: Category;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface TransactionPage {
  items: Transaction[];
  total: number;
  page: number;
  limit: number;
}

export interface TransactionSummary {
  income: number;
  expense: number;
  balance: number;
  count: number;
}
