import { Category } from '../models/category.model.js';

export const DEFAULT_CATEGORIES = [
  // Income categories
  { name: 'Salary', type: 'income', icon: 'briefcase', color: '#10b981', isDefault: true, userId: null },
  { name: 'Freelance', type: 'income', icon: 'laptop', color: '#38bdf8', isDefault: true, userId: null },
  { name: 'Other Income', type: 'income', icon: 'plus-circle', color: '#a855f7', isDefault: true, userId: null },

  // Expense categories
  { name: 'Home', type: 'expense', icon: 'home', color: '#f59e0b', isDefault: true, userId: null },
  { name: 'Food', type: 'expense', icon: 'utensils', color: '#f43f5e', isDefault: true, userId: null },
  { name: 'Petrol', type: 'expense', icon: 'fuel', color: '#f97316', isDefault: true, userId: null },
  { name: 'Gym', type: 'expense', icon: 'dumbbell', color: '#06b6d4', isDefault: true, userId: null },
  { name: 'Loans', type: 'expense', icon: 'hand-coins', color: '#8b5cf6', isDefault: true, userId: null },
  { name: 'Family Support', type: 'expense', icon: 'heart', color: '#e11d48', isDefault: true, userId: null },
  { name: 'Mobile', type: 'expense', icon: 'smartphone', color: '#ec4899', isDefault: true, userId: null },
  { name: 'Shopping', type: 'expense', icon: 'shopping-bag', color: '#14b8a6', isDefault: true, userId: null },
  { name: 'Health', type: 'expense', icon: 'heart-pulse', color: '#ef4444', isDefault: true, userId: null },
  { name: 'Transport', type: 'expense', icon: 'car', color: '#6366f1', isDefault: true, userId: null },
  { name: 'Other', type: 'expense', icon: 'tag', color: '#64748b', isDefault: true, userId: null },
];

/**
 * Ensures system default categories exist in the database without creating duplicates
 */
export async function ensureDefaultCategories() {
  try {
    for (const cat of DEFAULT_CATEGORIES) {
      await Category.findOneAndUpdate(
        { name: cat.name, type: cat.type, isDefault: true, userId: null },
        { $setOnInsert: cat },
        { upsert: true, returnDocument: 'after' }
      );
    }
  } catch (err) {
    console.error('[Category] Error seeding default categories:', err.message);
  }
}

/**
 * Fetch all categories accessible by a given user (system defaults + user's custom categories)
 */
export async function getCategoriesForUser(userId) {
  return Category.find({
    $or: [{ userId }, { isDefault: true, userId: null }],
  }).sort({ type: 1, name: 1 });
}

