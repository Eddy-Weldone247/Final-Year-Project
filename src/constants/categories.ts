import type { Category } from '@/types/transaction';

export interface CategoryMeta {
  value: Category;
  label: string;
  icon: string;
  color: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { value: 'FOOD', label: 'Food', icon: '🍔', color: '#f97316' },
  { value: 'TRANSPORT', label: 'Transport', icon: '🚗', color: '#3b82f6' },
  { value: 'SHOPPING', label: 'Shopping', icon: '🛍️', color: '#ec4899' },
  { value: 'ENTERTAINMENT', label: 'Entertainment', icon: '🎬', color: '#8b5cf6' },
  { value: 'UTILITIES', label: 'Utilities', icon: '💡', color: '#eab308' },
  { value: 'HEALTHCARE', label: 'Healthcare', icon: '🏥', color: '#ef4444' },
  { value: 'EDUCATION', label: 'Education', icon: '📚', color: '#14b8a6' },
  { value: 'OTHERS', label: 'Others', icon: '📦', color: '#6b7280' },
];

const CATEGORY_MAP: Record<Category, CategoryMeta> = CATEGORIES.reduce(
  (acc, cat) => {
    acc[cat.value] = cat;
    return acc;
  },
  {} as Record<Category, CategoryMeta>,
);

export function getCategoryMeta(value: Category): CategoryMeta {
  return CATEGORY_MAP[value] ?? CATEGORIES[CATEGORIES.length - 1]!;
}
