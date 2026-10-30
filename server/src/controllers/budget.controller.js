import { Budget } from '../models/budget.model.js';
import { Transaction } from '../models/transaction.model.js';
import { Category } from '../models/category.model.js';

function getMonthDateBounds(monthStr) {
  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10);

  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  return { startDate, endDate };
}

/**
 * Get monthly budget with computed actual category spending, remaining amounts, and 80%/100% threshold status
 */
export async function getBudget(req, res, next) {
  try {
    const userId = req.user._id;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const month = req.query.month || currentMonth;

    const budget = await Budget.findOne({ userId, month }).populate('categoryAllocations.category');

    if (!budget) {
      return res.status(200).json({
        success: true,
        data: {
          month,
          budget: null,
          categorySpending: [],
          summary: null,
        },
      });
    }

    const { startDate, endDate } = getMonthDateBounds(month);

    // Aggregate actual expense transactions for this month grouped by category
    const actualExpenses = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: 'expense',
          date: { $gte: startDate, $lt: endDate },
          category: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$category',
          totalSpent: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const expenseMap = new Map();
    for (const exp of actualExpenses) {
      expenseMap.set(exp._id.toString(), {
        totalSpent: Math.round(exp.totalSpent * 100) / 100,
        count: exp.count,
      });
    }

    let totalCategoryLimits = 0;
    let totalSpent = 0;

    const categorySpending = budget.categoryAllocations.map((alloc) => {
      const catId = alloc.category?._id ? alloc.category._id.toString() : alloc.category?.toString();
      const actual = expenseMap.get(catId) || { totalSpent: 0, count: 0 };
      const limit = Math.round(alloc.limit * 100) / 100;
      const spent = actual.totalSpent;
      const remaining = Math.round((limit - spent) * 100) / 100;
      const percentUsed = limit > 0 ? Math.round((spent / limit) * 100) : spent > 0 ? 100 : 0;

      let thresholdStatus = 'normal'; // 'normal' | 'warning' (>=80%) | 'exceeded' (>=100%)
      if (spent >= limit && limit > 0) {
        thresholdStatus = 'exceeded';
      } else if (percentUsed >= 80) {
        thresholdStatus = 'warning';
      }

      totalCategoryLimits += limit;
      totalSpent += spent;

      return {
        allocationId: alloc._id,
        categoryId: catId,
        categoryName: alloc.category?.name || '',
        category: alloc.category,
        limit,
        allocatedAmount: limit,
        spent,
        actualSpent: spent,
        remaining,
        remainingAmount: remaining,
        percentUsed,
        thresholdStatus,
        transactionCount: actual.count,
      };
    });

    totalCategoryLimits = Math.round(totalCategoryLimits * 100) / 100;
    totalSpent = Math.round(totalSpent * 100) / 100;
    const totalAllocated = Math.round((totalCategoryLimits + budget.savingsTarget + budget.bufferAllocation) * 100) / 100;
    const totalRemaining = Math.round((totalCategoryLimits - totalSpent) * 100) / 100;

    const summary = {
      expectedIncome: budget.expectedIncome,
      totalCategoryLimits,
      savingsTarget: budget.savingsTarget,
      bufferAllocation: budget.bufferAllocation,
      totalAllocated,
      unallocated: Math.round((budget.expectedIncome - totalAllocated) * 100) / 100,
      totalSpent,
      totalRemaining,
      overallPercentUsed: totalCategoryLimits > 0 ? Math.round((totalSpent / totalCategoryLimits) * 100) : 0,
    };

    return res.status(200).json({
      success: true,
      data: {
        month,
        budget: {
          ...budget.toJSON(),
          categoryAllocations: categorySpending,
        },
        categorySpending,
        summary,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create or configure monthly budget
 */
export async function createBudget(req, res, next) {
  try {
    const userId = req.user._id;
    const { month, expectedIncome, categoryAllocations, savingsTarget, bufferAllocation, notes } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { userId, month },
      {
        $set: {
          expectedIncome,
          categoryAllocations: categoryAllocations || [],
          savingsTarget: savingsTarget !== undefined ? savingsTarget : 4000,
          bufferAllocation: bufferAllocation !== undefined ? bufferAllocation : 2000,
          notes: notes || '',
        },
      },
      { upsert: true, new: true, runValidators: true }
    ).populate('categoryAllocations.category');

    return res.status(200).json({
      success: true,
      data: {
        budget: budget.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update existing budget
 */
export async function updateBudget(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const budget = await Budget.findOne({ _id: id, userId });
    if (!budget) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BUDGET_NOT_FOUND',
          message: 'Budget not found or not accessible',
        },
      });
    }

    const { expectedIncome, categoryAllocations, savingsTarget, bufferAllocation, notes } = req.body;

    if (expectedIncome !== undefined) budget.expectedIncome = expectedIncome;
    if (categoryAllocations !== undefined) budget.categoryAllocations = categoryAllocations;
    if (savingsTarget !== undefined) budget.savingsTarget = savingsTarget;
    if (bufferAllocation !== undefined) budget.bufferAllocation = bufferAllocation;
    if (notes !== undefined) budget.notes = notes;

    await budget.save();
    await budget.populate('categoryAllocations.category');

    return res.status(200).json({
      success: true,
      data: {
        budget: budget.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Copy budget from a previous month to a target month
 */
export async function copyBudget(req, res, next) {
  try {
    const userId = req.user._id;
    const { sourceMonth, targetMonth } = req.body;

    const source = await Budget.findOne({ userId, month: sourceMonth });
    if (!source) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SOURCE_BUDGET_NOT_FOUND',
          message: `No budget found for source month ${sourceMonth}`,
        },
      });
    }

    const copiedAllocations = source.categoryAllocations.map((a) => ({
      category: a.category,
      limit: a.limit,
    }));

    const targetBudget = await Budget.findOneAndUpdate(
      { userId, month: targetMonth },
      {
        $set: {
          expectedIncome: source.expectedIncome,
          categoryAllocations: copiedAllocations,
          savingsTarget: source.savingsTarget,
          bufferAllocation: source.bufferAllocation,
          notes: source.notes ? `Copied from ${sourceMonth}. ${source.notes}` : `Copied from ${sourceMonth}`,
        },
      },
      { upsert: true, new: true, runValidators: true }
    ).populate('categoryAllocations.category');

    return res.status(201).json({
      success: true,
      data: {
        budget: targetBudget.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Initialize owner's initial budget preset:
 * Monthly salary: ₹25,000
 * Allocations:
 * - Home: ₹7,000
 * - Loans: ₹5,000
 * - Family Support: ₹500
 * - Gym: ₹1,500
 * - Food: ₹2,000
 * - Petrol: ₹2,000
 * - Mobile: ₹1,000
 * - Savings target: ₹4,000
 * - Unallocated/emergency buffer: ₹2,000
 * Total: ₹25,000
 */
export async function applyOwnerPreset(req, res, next) {
  try {
    const userId = req.user._id;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const month = req.body.month || currentMonth;

    const presetLimits = [
      { name: 'Home', limit: 7000 },
      { name: 'Loans', limit: 5000 },
      { name: 'Family Support', limit: 500 },
      { name: 'Gym', limit: 1500 },
      { name: 'Food', limit: 2000 },
      { name: 'Petrol', limit: 2000 },
      { name: 'Mobile', limit: 1000 },
    ];

    const categoryAllocations = [];

    for (const item of presetLimits) {
      let cat = await Category.findOne({
        name: new RegExp(`^${item.name}$`, 'i'),
        type: 'expense',
        $or: [{ userId }, { isDefault: true, userId: null }],
      });

      if (!cat) {
        // Create if missing
        cat = await Category.create({
          name: item.name,
          type: 'expense',
          userId,
          isDefault: false,
        });
      }

      categoryAllocations.push({
        category: cat._id,
        limit: item.limit,
      });
    }

    const budget = await Budget.findOneAndUpdate(
      { userId, month },
      {
        $set: {
          expectedIncome: 25000,
          categoryAllocations,
          savingsTarget: 4000,
          bufferAllocation: 2000,
          notes: 'Owner standard financial budget profile (₹25,000)',
        },
      },
      { upsert: true, new: true, runValidators: true }
    ).populate('categoryAllocations.category');

    return res.status(200).json({
      success: true,
      data: {
        budget: budget.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List historical budgets
 */
export async function listBudgetHistory(req, res, next) {
  try {
    const userId = req.user._id;
    const budgets = await Budget.find({ userId })
      .sort({ month: -1 })
      .populate('categoryAllocations.category');

    return res.status(200).json({
      success: true,
      data: {
        budgets: budgets.map((b) => b.toJSON()),
      },
    });
  } catch (error) {
    next(error);
  }
}
