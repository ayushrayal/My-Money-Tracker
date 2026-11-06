import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { Transaction } from '../models/transaction.model.js';
import { Category } from '../models/category.model.js';
import { Salary } from '../models/salary.model.js';
import { Budget } from '../models/budget.model.js';
import { Loan } from '../models/loan.model.js';
import { SavingsGoal } from '../models/savingsGoal.model.js';
import { SavingsContribution } from '../models/savingsContribution.model.js';
import { UPLOADS_DIR, validateMagicBytes } from '../middleware/upload.middleware.js';

/**
 * Helper to compute precise start and end dates for a given month 'YYYY-MM'
 */
function getMonthDateBounds(monthStr) {
  const [yearStr, monthNumStr] = monthStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthNumStr, 10); // 1-12

  // Start of month: YYYY-MM-01 00:00:00.000 UTC
  const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  // Start of next month: YYYY-(MM+1)-01 00:00:00.000 UTC
  const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  return { startDate, endDate };
}

export async function createTransaction(req, res, next) {
  try {
    const { type, amount, category, description, date, paymentMethod, notes } = req.body;
    const userId = req.user._id;

    // Verify category exists and is accessible to this user
    let categoryDoc = null;
    if (category) {
      categoryDoc = await Category.findOne({
        _id: category,
        $or: [{ userId }, { isDefault: true, userId: null }],
      });

      if (!categoryDoc) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CATEGORY',
            message: 'Selected category does not exist or is not accessible',
          },
        });
      }
    }

    const transaction = await Transaction.create({
      userId,
      type,
      amount,
      category: categoryDoc ? categoryDoc._id : null,
      description,
      date: new Date(date),
      paymentMethod,
      notes: notes || '',
    });

    const populated = await transaction.populate('category');

    return res.status(201).json({
      success: true,
      data: {
        transaction: populated.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function listTransactions(req, res, next) {
  try {
    const userId = req.user._id;
    const {
      month,
      startDate,
      endDate,
      type,
      category,
      paymentMethod,
      search,
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc',
    } = req.query;

    const filter = { userId };

    // Month filter or explicit date range filter
    if (month) {
      const bounds = getMonthDateBounds(month);
      filter.date = { $gte: bounds.startDate, $lt: bounds.endDate };
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (type) {
      filter.type = type;
    }

    if (category) {
      filter.category = new mongoose.Types.ObjectId(category);
    }

    if (paymentMethod) {
      filter.paymentMethod = paymentMethod;
    }

    if (search) {
      const regex = new RegExp(search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');
      filter.$or = [{ description: regex }, { notes: regex }];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const sortOption = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    if (sortBy !== '_id') {
      sortOption._id = -1; // deterministic tie-breaker
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('category')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      Transaction.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    return res.status(200).json({
      success: true,
      data: {
        transactions: transactions.map((t) => t.toJSON()),
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages,
          hasMore: pageNum < totalPages,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getTransactionSummary(req, res, next) {
  try {
    const userId = req.user._id;
    const { month } = req.query;

    const matchFilter = { userId: new mongoose.Types.ObjectId(userId) };

    let targetMonth = month;
    if (!targetMonth) {
      const now = new Date();
      const currentYear = now.getUTCFullYear();
      const currentMonth = String(now.getUTCMonth() + 1).padStart(2, '0');
      targetMonth = `${currentYear}-${currentMonth}`;
    }
    const bounds = getMonthDateBounds(targetMonth);
    matchFilter.date = { $gte: bounds.startDate, $lt: bounds.endDate };

    // Concurrently fetch totals, category breakdown, salary, budget, loans, savings
    const [
      totalsResult,
      categoryBreakdown,
      salaryDoc,
      budgetDoc,
      loansList,
      savingsGoalsList,
      monthlyContributions,
    ] = await Promise.all([
      Transaction.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalIncome: {
              $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] },
            },
            totalExpense: {
              $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] },
            },
            totalTransfer: {
              $sum: { $cond: [{ $eq: ['$type', 'transfer'] }, '$amount', 0] },
            },
            transactionCount: { $sum: 1 },
          },
        },
      ]),

      Transaction.aggregate([
        { $match: { ...matchFilter, type: 'expense', category: { $ne: null } } },
        {
          $group: {
            _id: '$category',
            spent: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        {
          $lookup: {
            from: 'categories',
            localField: '_id',
            foreignField: '_id',
            as: 'categoryDetails',
          },
        },
        { $unwind: '$categoryDetails' },
        { $sort: { spent: -1 } },
        {
          $project: {
            categoryId: '$_id',
            name: '$categoryDetails.name',
            icon: '$categoryDetails.icon',
            color: '$categoryDetails.color',
            spent: 1,
            count: 1,
          },
        },
      ]),

      Salary.findOne({ userId, month: targetMonth }).lean(),
      Budget.findOne({ userId, month: targetMonth }).lean(),
      Loan.find({ userId, status: { $ne: 'archived' } }).lean(),
      SavingsGoal.find({ userId }).lean(),
      SavingsContribution.find({
        userId,
        date: { $gte: bounds.startDate, $lt: bounds.endDate },
      }).lean(),
    ]);

    const totals = totalsResult[0] || {
      totalIncome: 0,
      totalExpense: 0,
      totalTransfer: 0,
      transactionCount: 0,
    };

    const netSavings = totals.totalIncome - totals.totalExpense;
    const savingsRate =
      totals.totalIncome > 0
        ? Number(((netSavings / totals.totalIncome) * 100).toFixed(1))
        : 0;

    // Salary summary
    let salarySummary = null;
    if (salaryDoc) {
      const receivedAmt = salaryDoc.actualAmount ?? salaryDoc.receivedAmount ?? 0;
      const additionalTotal = (salaryDoc.additionalIncomes || []).reduce(
        (sum, item) => sum + (item.amount || 0),
        0
      );
      salarySummary = {
        month: salaryDoc.month,
        status: salaryDoc.status,
        plannedAmount: salaryDoc.plannedAmount,
        receivedAmount: receivedAmt,
        receivedDate: salaryDoc.receivedDate || null,
        paymentMethod: salaryDoc.paymentMethod,
        additionalIncomesTotal: additionalTotal,
        totalIncomeReceived:
          (salaryDoc.status === 'received' ? receivedAmt : 0) + additionalTotal,
      };
    }

    // Budget summary
    let budgetSummary = null;
    if (budgetDoc) {
      const totalAllocated = (budgetDoc.categoryAllocations || []).reduce(
        (sum, item) => sum + (item.limit ?? item.allocatedAmount ?? 0),
        0
      );
      const totalSpent = totals.totalExpense;
      const remainingBudget = Math.round((totalAllocated - totalSpent) * 100) / 100;
      const percentUsed =
        totalAllocated > 0
          ? Math.round((totalSpent / totalAllocated) * 1000) / 10
          : 0;

      budgetSummary = {
        month: budgetDoc.month,
        expectedIncome: budgetDoc.expectedIncome,
        totalAllocated,
        savingsTarget: budgetDoc.savingsTarget,
        bufferAllocation: budgetDoc.bufferAllocation,
        totalSpent,
        remainingBudget,
        percentUsed,
        status: budgetDoc.status,
      };
    }

    // Loans summary
    let loansSummary = null;
    if (loansList && loansList.length > 0) {
      const activeLoans = loansList.filter((l) => l.status === 'active');
      const paidLoans = loansList.filter((l) => l.status === 'paid');
      const totalOutstanding = activeLoans.reduce((sum, l) => sum + l.outstandingBalance, 0);
      const totalOriginalPrincipal = loansList.reduce((sum, l) => sum + l.originalPrincipal, 0);
      const totalPlannedMonthly = activeLoans.reduce(
        (sum, l) => sum + (l.plannedMonthlyPayment || 0),
        0
      );

      loansSummary = {
        totalLoans: loansList.length,
        activeLoansCount: activeLoans.length,
        paidLoansCount: paidLoans.length,
        totalOutstanding: Math.round(totalOutstanding * 100) / 100,
        totalOriginalPrincipal: Math.round(totalOriginalPrincipal * 100) / 100,
        totalPlannedMonthly: Math.round(totalPlannedMonthly * 100) / 100,
      };
    }

    // Savings summary
    let savingsSummary = null;
    if (savingsGoalsList && savingsGoalsList.length > 0) {
      const totalCurrent = savingsGoalsList.reduce((sum, g) => sum + g.currentAmount, 0);
      const totalTarget = savingsGoalsList.reduce((sum, g) => sum + g.targetAmount, 0);
      const monthlyContributionsTotal = (monthlyContributions || []).reduce(
        (sum, c) => sum + c.amount,
        0
      );
      const emergencyFundGoal = savingsGoalsList.find((g) => g.category === 'emergency_fund');

      savingsSummary = {
        totalCurrent: Math.round(totalCurrent * 100) / 100,
        totalTarget: Math.round(totalTarget * 100) / 100,
        overallProgress:
          totalTarget > 0
            ? Math.round((totalCurrent / totalTarget) * 1000) / 10
            : 0,
        monthlyContributionsTotal: Math.round(monthlyContributionsTotal * 100) / 100,
        emergencyFund: emergencyFundGoal
          ? {
              targetAmount: emergencyFundGoal.targetAmount,
              currentAmount: emergencyFundGoal.currentAmount,
              status: emergencyFundGoal.status,
              isMilestoneMet: emergencyFundGoal.milestones?.some(
                (m) => m.achieved && m.targetAmount === 10000
              ),
            }
          : null,
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        month: targetMonth,
        totals: {
          income: totals.totalIncome,
          expense: totals.totalExpense,
          netSavings,
          savingsRate,
          transfer: totals.totalTransfer, // Informational only, excluded from net savings
          count: totals.transactionCount,
        },
        categoryBreakdown,
        salary: salarySummary,
        budget: budgetSummary,
        loans: loansSummary,
        savings: savingsSummary,
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function getTransactionById(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid transaction identifier' },
      });
    }

    const transaction = await Transaction.findOne({
      _id: id,
      userId: req.user._id,
    }).populate('category');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Transaction not found' },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        transaction: transaction.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function updateTransaction(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid transaction identifier' },
      });
    }

    const transaction = await Transaction.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Transaction not found' },
      });
    }

    const { type, amount, category, description, date, paymentMethod, notes } = req.body;

    // Verify category if updated
    if (category !== undefined) {
      if (category) {
        const cat = await Category.findOne({
          _id: category,
          $or: [{ userId: req.user._id }, { isDefault: true, userId: null }],
        });
        if (!cat) {
          return res.status(400).json({
            success: false,
            error: { code: 'INVALID_CATEGORY', message: 'Selected category is not valid' },
          });
        }
        transaction.category = cat._id;
      } else {
        transaction.category = null;
      }
    }

    if (type !== undefined) transaction.type = type;
    if (amount !== undefined) transaction.amount = amount;
    if (description !== undefined) transaction.description = description;
    if (date !== undefined) transaction.date = new Date(date);
    if (paymentMethod !== undefined) transaction.paymentMethod = paymentMethod;
    if (notes !== undefined) transaction.notes = notes;

    await transaction.save();
    const populated = await transaction.populate('category');

    return res.status(200).json({
      success: true,
      data: {
        transaction: populated.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteTransaction(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_ID', message: 'Invalid transaction identifier' },
      });
    }

    const deleted = await Transaction.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Transaction not found' },
      });
    }

    // Clean up receipt file if exists
    if (deleted.receipt?.filename) {
      const filePath = path.join(UPLOADS_DIR, deleted.receipt.filename);
      fs.promises.unlink(filePath).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/transactions/:id/receipt
 * Upload or replace a receipt attachment on a transaction
 */
export async function uploadReceiptHandler(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      if (req.file) {
        await fs.promises.unlink(req.file.path).catch(() => {});
      }
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No receipt file uploaded',
      });
    }

    // Validate magic bytes
    const isValidSignature = await validateMagicBytes(req.file.path, req.file.mimetype);
    if (!isValidSignature) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(400).json({
        success: false,
        message: 'Invalid file signature or corrupted receipt file',
      });
    }

    const transaction = await Transaction.findOne({ _id: id, userId: req.user._id });
    if (!transaction) {
      await fs.promises.unlink(req.file.path).catch(() => {});
      return res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }

    // Remove old receipt if exists
    if (transaction.receipt?.filename) {
      const oldPath = path.join(UPLOADS_DIR, transaction.receipt.filename);
      await fs.promises.unlink(oldPath).catch(() => {});
    }

    transaction.receipt = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      uploadedAt: new Date(),
    };

    await transaction.save();
    const populated = await transaction.populate('category');

    return res.status(200).json({
      success: true,
      message: 'Receipt uploaded successfully',
      data: {
        transaction: populated.toJSON(),
      },
    });
  } catch (error) {
    if (req.file) {
      await fs.promises.unlink(req.file.path).catch(() => {});
    }
    next(error);
  }
}

/**
 * GET /api/transactions/:id/receipt
 * Download receipt attachment strictly scoped to authenticated user
 */
export async function downloadReceiptHandler(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID',
      });
    }

    const transaction = await Transaction.findOne({ _id: id, userId: req.user._id });
    if (!transaction || !transaction.receipt?.filename) {
      return res.status(404).json({
        success: false,
        message: 'Receipt attachment not found for this transaction',
      });
    }

    const filePath = path.join(UPLOADS_DIR, transaction.receipt.filename);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Receipt file no longer exists on disk',
      });
    }

    res.setHeader('Content-Type', transaction.receipt.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(transaction.receipt.originalName || 'receipt')}"`
    );
    res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');

    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => next(err));
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/transactions/:id/receipt
 * Remove receipt attachment from transaction
 */
export async function deleteReceiptHandler(req, res, next) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID',
      });
    }

    const transaction = await Transaction.findOne({ _id: id, userId: req.user._id });
    if (!transaction || !transaction.receipt?.filename) {
      return res.status(404).json({
        success: false,
        message: 'Receipt not found on this transaction',
      });
    }

    const filePath = path.join(UPLOADS_DIR, transaction.receipt.filename);
    await fs.promises.unlink(filePath).catch(() => {});

    transaction.receipt = {
      filename: null,
      originalName: null,
      mimeType: null,
      size: null,
      uploadedAt: null,
    };

    await transaction.save();
    const populated = await transaction.populate('category');

    return res.status(200).json({
      success: true,
      message: 'Receipt deleted successfully',
      data: {
        transaction: populated.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
}


