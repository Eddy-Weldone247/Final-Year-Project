import { Ionicons } from '@expo/vector-icons';

import type { Category } from '@/types/transaction';

type IoniconName = keyof typeof Ionicons.glyphMap;

export interface CategoryMeta {
  value: Category;
  label: string;
  /** Emoji glyph — used by category chips and transaction rows. */
  icon: string;
  /** Ionicons glyph — used by the spending-breakdown legend. */
  ionicon: IoniconName;
  color: string;
}

export const CATEGORIES: CategoryMeta[] = [
  { value: 'FOOD', label: 'Food', icon: '🍔', ionicon: 'fast-food', color: '#f97316' },
  { value: 'TRANSPORT', label: 'Transport', icon: '🚗', ionicon: 'car', color: '#3b82f6' },
  { value: 'SHOPPING', label: 'Shopping', icon: '🛍️', ionicon: 'cart', color: '#ec4899' },
  { value: 'ENTERTAINMENT', label: 'Entertainment', icon: '🎬', ionicon: 'film', color: '#8b5cf6' },
  { value: 'UTILITIES', label: 'Utilities', icon: '💡', ionicon: 'bulb', color: '#eab308' },
  { value: 'HEALTHCARE', label: 'Healthcare', icon: '🏥', ionicon: 'medkit', color: '#ef4444' },
  { value: 'EDUCATION', label: 'Education', icon: '📚', ionicon: 'school', color: '#14b8a6' },
  { value: 'OTHERS', label: 'Others', icon: '📦', ionicon: 'cube', color: '#6b7280' },
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
