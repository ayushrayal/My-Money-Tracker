import mongoose from 'mongoose';
import { SavingsGoal } from '../models/savingsGoal.model.js';
import { SavingsContribution } from '../models/savingsContribution.model.js';
import { Transaction } from '../models/transaction.model.js';

/**
 * Recomputes goal's current amount and milestone achievements from actual contributions
 */
async function syncGoalAmount(goalId, userId) {
  if (!mongoose.Types.ObjectId.isValid(goalId)) return null;
  const goal = await SavingsGoal.findOne({ _id: goalId, userId });
  if (!goal) return null;

  const contributions = await SavingsContribution.find({ goalId, userId });
  const totalSaved = Math.round(contributions.reduce((sum, c) => sum + c.amount, 0) * 100) / 100;

  goal.currentAmount = totalSaved;

  // Update milestones
  if (goal.milestones && goal.milestones.length > 0) {
    for (const m of goal.milestones) {
      if (totalSaved >= m.targetAmount && !m.achieved) {
        m.achieved = true;
        m.achievedDate = new Date();
      } else if (totalSaved < m.targetAmount && m.achieved) {
        m.achieved = false;
        m.achievedDate = null;
      }
    }
  }

  await goal.save();
  return { goal, totalSaved, contributionCount: contributions.length };
}

/**
 * List all savings goals for the user with summary totals
 */
export async function listSavingsGoals(req, res, next) {
  try {
    const userId = req.user._id;
    const includeArchived = req.query.includeArchived === 'true';

    const filter = { userId };
    if (!includeArchived) {
      filter.isArchived = false;
    }

    const goals = await SavingsGoal.find(filter).sort({ createdAt: -1 });

    let totalTarget = 0;
    let totalCurrentSaved = 0;
    let monthlySavingsTarget = 0;

    const enrichedGoals = goals.map((g) => {
      totalTarget += g.targetAmount;
      totalCurrentSaved += g.currentAmount;
      if (!g.isArchived && g.monthlyTarget) {
        monthlySavingsTarget += g.monthlyTarget;
      }

      const progressPercent =
        g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;

      return {
        ...g.toJSON(),
        progressPercent,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        goals: enrichedGoals,
        summary: {
          totalTarget: Math.round(totalTarget * 100) / 100,
          totalCurrentSaved: Math.round(totalCurrentSaved * 100) / 100,
          monthlySavingsTarget: Math.round(monthlySavingsTarget * 100) / 100,
          activeGoalsCount: goals.filter((g) => !g.isArchived).length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single savings goal with contribution history
 */
export async function getSavingsGoal(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        error: { code: 'GOAL_NOT_FOUND', message: 'Savings goal not found or not accessible' },
      });
    }

    const goal = await SavingsGoal.findOne({ _id: id, userId });
    if (!goal) {
      return res.status(404).json({
        success: false,
        error: { code: 'GOAL_NOT_FOUND', message: 'Savings goal not found or not accessible' },
      });
    }

    const contributions = await SavingsContribution.find({ goalId: id, userId }).sort({ date: -1 });
    const progressPercent =
      goal.targetAmount > 0 ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100)) : 0;

    return res.status(200).json({
      success: true,
      data: {
        goal: {
          ...goal.toJSON(),
          progressPercent,
        },
        contributions: contributions.map((c) => c.toJSON()),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new savings goal
 */
export async function createSavingsGoal(req, res, next) {
  try {
    const userId = req.user._id;
    const { title, name, targetAmount, targetDate, category, monthlyTarget, milestones, notes } = req.body;

    const goal = await SavingsGoal.create({
      userId,
      title: title || name,
      targetAmount,
      targetDate: targetDate ? new Date(targetDate) : null,
      category: category || 'general',
      monthlyTarget: monthlyTarget || 0,
      milestones: milestones || [],
      notes: notes || '',
    });

    return res.status(201).json({
      success: true,
      data: {
        goal: goal.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a savings goal
 */
export async function updateSavingsGoal(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        error: { code: 'GOAL_NOT_FOUND', message: 'Savings goal not found or not accessible' },
      });
    }

    const goal = await SavingsGoal.findOne({ _id: id, userId });
    if (!goal) {
      return res.status(404).json({
        success: false,
        error: { code: 'GOAL_NOT_FOUND', message: 'Savings goal not found or not accessible' },
      });
    }

    const { title, name, targetAmount, targetDate, category, monthlyTarget, milestones, isArchived, notes } = req.body;

    if (title !== undefined) goal.title = title;
    else if (name !== undefined) goal.title = name;
    if (targetAmount !== undefined) goal.targetAmount = targetAmount;
    if (targetDate !== undefined) goal.targetDate = targetDate ? new Date(targetDate) : null;
    if (category !== undefined) goal.category = category;
    if (monthlyTarget !== undefined) goal.monthlyTarget = monthlyTarget;
    if (milestones !== undefined) goal.milestones = milestones;
    if (isArchived !== undefined) goal.isArchived = isArchived;
    if (notes !== undefined) goal.notes = notes;

    await goal.save();

    return res.status(200).json({
      success: true,
      data: {
        goal: goal.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Record a contribution to a savings goal
 */
export async function recordSavingsContribution(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { amount, date, contributionDate, paymentMethod, recordAsTransfer, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        error: { code: 'GOAL_NOT_FOUND', message: 'Savings goal not found or not accessible' },
      });
    }

    const goal = await SavingsGoal.findOne({ _id: id, userId });
    if (!goal) {
      return res.status(404).json({
        success: false,
        error: { code: 'GOAL_NOT_FOUND', message: 'Savings goal not found or not accessible' },
      });
    }

    let linkedTx = null;
    const resolvedDate = new Date(date || contributionDate || new Date());

    if (recordAsTransfer) {
      // Record as transfer (internal allocation, not expense or income)
      linkedTx = await Transaction.create({
        userId,
        type: 'transfer',
        amount,
        description: `Savings Contribution — ${goal.title}`,
        date: resolvedDate,
        paymentMethod: paymentMethod || 'bank_transfer',
        notes: notes || '',
      });
    }

    const contrib = await SavingsContribution.create({
      userId,
      goalId: id,
      amount,
      date: resolvedDate,
      transactionId: linkedTx ? linkedTx._id : null,
      notes: notes || '',
    });

    const syncResult = await syncGoalAmount(id, userId);

    return res.status(201).json({
      success: true,
      data: {
        contribution: contrib.toJSON(),
        goal: syncResult.goal.toJSON(),
        transaction: linkedTx ? linkedTx.toJSON() : null,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reverse a savings contribution and recompute goal amount
 */
export async function deleteSavingsContribution(req, res, next) {
  try {
    const userId = req.user._id;
    const { id, contribId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(contribId)) {
      return res.status(404).json({
        success: false,
        error: { code: 'CONTRIBUTION_NOT_FOUND', message: 'Contribution record not found' },
      });
    }

    const contrib = await SavingsContribution.findOne({ _id: contribId, goalId: id, userId });
    if (!contrib) {
      return res.status(404).json({
        success: false,
        error: { code: 'CONTRIBUTION_NOT_FOUND', message: 'Contribution record not found' },
      });
    }

    // Delete linked transaction if exists
    if (contrib.transactionId) {
      await Transaction.deleteOne({ _id: contrib.transactionId, userId });
    }

    await SavingsContribution.deleteOne({ _id: contribId, userId });
    const syncResult = await syncGoalAmount(id, userId);

    return res.status(200).json({
      success: true,
      data: {
        message: 'Contribution reversed successfully',
        goal: syncResult ? syncResult.goal.toJSON() : null,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Initialize owner's savings configuration:
 * - Monthly savings target: ₹4,000
 * - Emergency fund milestone 1: ₹10,000
 * - Emergency fund target: ₹30,000
 */
export async function applyOwnerSavingsPreset(req, res, next) {
  try {
    const userId = req.user._id;

    let emergencyGoal = await SavingsGoal.findOne({ userId, category: 'emergency_fund' });

    if (!emergencyGoal) {
      emergencyGoal = await SavingsGoal.create({
        userId,
        title: 'Emergency Fund',
        targetAmount: 30000,
        currentAmount: 0,
        category: 'emergency_fund',
        monthlyTarget: 4000,
        milestones: [
          { name: 'Initial Safety Net', targetAmount: 10000, achieved: false },
          { name: 'Midway Reserve', targetAmount: 20000, achieved: false },
          { name: 'Full Emergency Fund', targetAmount: 30000, achieved: false },
        ],
        notes: 'Owner initial emergency fund (Milestone: ₹10,000, Target: ₹30,000)',
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        goal: emergencyGoal.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
}
