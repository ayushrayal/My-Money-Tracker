import mongoose from 'mongoose';
import { Category } from '../models/category.model.js';
import { Transaction } from '../models/transaction.model.js';
import { getCategoriesForUser } from '../services/category.service.js';

export async function listCategories(req, res, next) {
  try {
    const categories = await getCategoriesForUser(req.user._id);
    return res.status(200).json({
      success: true,
      data: {
        categories: categories.map((c) => c.toJSON()),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function createCategory(req, res, next) {
  try {
    const { name, type, icon, color } = req.body;
    const userId = req.user._id;

    // Check for duplicate category name for this user or within system defaults
    const existing = await Category.findOne({
      name: new RegExp(`^${name}$`, 'i'),
      type,
      $or: [{ userId }, { isDefault: true, userId: null }],
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_CATEGORY',
          message: `A ${type} category named "${name}" already exists.`,
        },
      });
    }

    const category = await Category.create({
      name,
      type,
      icon: icon || 'tag',
      color: color || '#10b981',
      userId,
      isDefault: false,
    });

    return res.status(201).json({
      success: true,
      data: {
        category: category.toJSON(),
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_CATEGORY',
          message: 'A category with this name already exists.',
        },
      });
    }
    next(error);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid category identifier' },
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Category not found' },
      });
    }

    // System default categories cannot be modified by users
    if (category.isDefault || !category.userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'System default categories cannot be modified' },
      });
    }

    // Ownership check
    if (category.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to modify this category' },
      });
    }

    const { name, icon, color } = req.body;
    if (name) category.name = name;
    if (icon) category.icon = icon;
    if (color) category.color = color;

    await category.save();

    return res.status(200).json({
      success: true,
      data: {
        category: category.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid category identifier' },
      });
    }

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Category not found' },
      });
    }

    // System default categories cannot be deleted
    if (category.isDefault || !category.userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'System default categories cannot be deleted' },
      });
    }

    // Ownership check
    if (category.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to delete this category' },
      });
    }

    // Safe deletion: prevent deletion if referenced by existing transactions
    const referencedCount = await Transaction.countDocuments({
      category: id,
      userId: req.user._id,
    });

    if (referencedCount > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CATEGORY_IN_USE',
          message: `Cannot delete category because it is used by ${referencedCount} transaction(s). Reassign or delete those transactions first.`,
        },
      });
    }

    await Category.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Category deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

