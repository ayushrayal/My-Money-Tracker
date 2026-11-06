import mongoose from 'mongoose';
import { Transaction } from '../models/transaction.model.js';
import { Budget } from '../models/budget.model.js';
import { Loan } from '../models/loan.model.js';
import { LoanPayment } from '../models/loanPayment.model.js';
import { SavingsGoal } from '../models/savingsGoal.model.js';
import { SavingsContribution } from '../models/savingsContribution.model.js';
import { buildCsv } from '../utils/csv.util.js';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * GET /api/reports/summary
 * Consolidated JSON report summary for month and year
 */
export async function getReportSummary(req, res, next) {
  try {
    const userId = req.user._id;
    const now = new Date();
    const queryYear = parseInt(req.query.year, 10) || now.getFullYear();
    const currentMonthStr = `${queryYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const selectedMonth = req.query.month || currentMonthStr;

    const [mYear, mNum] = selectedMonth.split('-').map((v) => parseInt(v, 10));
    const startOfMonth = new Date(Date.UTC(mYear, mNum - 1, 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(mYear, mNum, 1, 0, 0, 0));

    const startOfYear = new Date(Date.UTC(queryYear, 0, 1, 0, 0, 0));
    const endOfYear = new Date(Date.UTC(queryYear + 1, 0, 1, 0, 0, 0));

    // Monthly transactions breakdown
    const [monthTransactions, yearTransactions, monthSavings, loans, savingsGoals] =
      await Promise.all([
        Transaction.find({
          userId,
          date: { $gte: startOfMonth, $lt: endOfMonth },
        })
          .populate('category')
          .sort({ date: -1 }),
        Transaction.aggregate([
          {
            $match: {
              userId,
              date: { $gte: startOfYear, $lt: endOfYear },
              type: { $in: ['income', 'expense'] },
            },
          },
          {
            $group: {
              _id: '$type',
              total: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
        ]),
        SavingsContribution.aggregate([
          {
            $match: {
              userId,
              contributionDate: { $gte: startOfMonth, $lt: endOfMonth },
            },
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' },
              count: { $sum: 1 },
            },
          },
        ]),
        Loan.find({ userId }).sort({ createdAt: -1 }),
        SavingsGoal.find({ userId, isArchived: false }).sort({ createdAt: -1 }),
      ]);

    let monthIncome = 0;
    let monthExpense = 0;
    let monthTransfers = 0;

    const categoryMap = new Map();
    for (const t of monthTransactions) {
      if (t.type === 'income') monthIncome += t.amount;
      if (t.type === 'expense') {
        monthExpense += t.amount;
        const catName = t.category?.name || 'Uncategorized';
        categoryMap.set(catName, (categoryMap.get(catName) || 0) + t.amount);
      }
      if (t.type === 'transfer') monthTransfers += t.amount;
    }

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([name, amount]) => ({
      name,
      amount: Math.round(amount * 100) / 100,
      percentage:
        monthExpense > 0 ? Math.round((amount / monthExpense) * 100) : 0,
    }));

    let yearIncome = 0;
    let yearExpense = 0;
    for (const item of yearTransactions) {
      if (item._id === 'income') yearIncome = item.total;
      if (item._id === 'expense') yearExpense = item.total;
    }

    const monthSaved = monthSavings[0]?.total || 0;

    res.status(200).json({
      success: true,
      data: {
        month: selectedMonth,
        year: queryYear,
        monthly: {
          income: Math.round(monthIncome * 100) / 100,
          expenses: Math.round(monthExpense * 100) / 100,
          transfers: Math.round(monthTransfers * 100) / 100,
          netCashFlow: Math.round((monthIncome - monthExpense) * 100) / 100,
          savingsContributions: Math.round(monthSaved * 100) / 100,
          transactionCount: monthTransactions.length,
          categoryBreakdown,
        },
        yearly: {
          income: Math.round(yearIncome * 100) / 100,
          expenses: Math.round(yearExpense * 100) / 100,
          netCashFlow: Math.round((yearIncome - yearExpense) * 100) / 100,
        },
        loans: {
          totalCount: loans.length,
          totalPrincipal: loans.reduce((s, l) => s + l.originalPrincipal, 0),
          totalOutstanding: loans.reduce((s, l) => s + l.outstandingBalance, 0),
        },
        savingsGoals: {
          totalCount: savingsGoals.length,
          totalTarget: savingsGoals.reduce((s, g) => s + g.targetAmount, 0),
          totalSaved: savingsGoals.reduce((s, g) => s + g.currentAmount, 0),
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/reports/export/transactions
 * Export filtered transactions to CSV
 */
export async function exportTransactionsCsv(req, res, next) {
  try {
    const userId = req.user._id;
    const { month, startDate, endDate, type, category } = req.query;

    const filter = { userId };

    if (month) {
      const [y, m] = month.split('-').map((v) => parseInt(v, 10));
      filter.date = {
        $gte: new Date(Date.UTC(y, m - 1, 1, 0, 0, 0)),
        $lt: new Date(Date.UTC(y, m, 1, 0, 0, 0)),
      };
    } else if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (type) filter.type = type;
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      filter.category = new mongoose.Types.ObjectId(category);
    }

    const transactions = await Transaction.find(filter)
      .populate('category')
      .sort({ date: -1 });

    const headers = [
      'Date',
      'Type',
      'Category',
      'Description',
      'Amount',
      'Payment Method',
      'Notes',
      'Has Receipt',
    ];

    const rows = transactions.map((t) => [
      t.date ? new Date(t.date).toISOString().split('T')[0] : '',
      t.type,
      t.category?.name || 'N/A',
      t.description,
      t.amount,
      t.paymentMethod,
      t.notes || '',
      t.receipt?.filename ? 'Yes' : 'No',
    ]);

    const csvContent = buildCsv(headers, rows);
    const filename = `transactions_${month || 'export'}_${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/reports/export/monthly-summary
 * Export 12-month summary for a given year to CSV
 */
export async function exportMonthlySummaryCsv(req, res, next) {
  try {
    const userId = req.user._id;
    const now = new Date();
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
    const endOfYear = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0));

    const [transactionsData, savingsData] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            userId,
            date: { $gte: startOfYear, $lt: endOfYear },
            type: { $in: ['income', 'expense'] },
          },
        },
        {
          $group: {
            _id: {
              month: { $month: '$date' },
              type: '$type',
            },
            total: { $sum: '$amount' },
          },
        },
      ]),
      SavingsContribution.aggregate([
        {
          $match: {
            userId,
            contributionDate: { $gte: startOfYear, $lt: endOfYear },
          },
        },
        {
          $group: {
            _id: { $month: '$contributionDate' },
            total: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const savingsMap = new Map();
    for (const s of savingsData) {
      savingsMap.set(s._id, s.total);
    }

    const headers = [
      'Month',
      'Total Income',
      'Total Expenses',
      'Net Cash Flow',
      'Savings Contributions',
      'Savings Rate %',
    ];

    const rows = [];
    for (let m = 1; m <= 12; m++) {
      const incMatch = transactionsData.find(
        (t) => t._id.month === m && t._id.type === 'income'
      );
      const expMatch = transactionsData.find(
        (t) => t._id.month === m && t._id.type === 'expense'
      );

      const income = incMatch ? Math.round(incMatch.total * 100) / 100 : 0;
      const expense = expMatch ? Math.round(expMatch.total * 100) / 100 : 0;
      const savings = savingsMap.get(m) ? Math.round(savingsMap.get(m) * 100) / 100 : 0;
      const net = Math.round((income - expense) * 100) / 100;
      const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;

      rows.push([
        `${MONTH_NAMES[m - 1]} ${year}`,
        income,
        expense,
        net,
        savings,
        `${savingsRate}%`,
      ]);
    }

    const csvContent = buildCsv(headers, rows);
    const filename = `monthly_summary_${year}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/reports/export/loans
 * Export loans to CSV
 */
export async function exportLoansCsv(req, res, next) {
  try {
    const userId = req.user._id;
    const loans = await Loan.find({ userId }).sort({ createdAt: -1 });

    const headers = [
      'Loan Name',
      'Counterparty',
      'Type',
      'Original Principal',
      'Total Repaid',
      'Outstanding Balance',
      'Status',
      'Due Day',
      'Start Date',
      'Notes',
    ];

    const rows = loans.map((l) => {
      const repaid = Math.max(0, Math.round((l.originalPrincipal - l.outstandingBalance) * 100) / 100);
      return [
        l.name,
        l.lenderOrBorrower || '',
        l.type === 'given' ? 'Lent to someone' : 'Borrowed by me',
        l.originalPrincipal,
        repaid,
        l.outstandingBalance,
        l.status,
        l.dueDay || 'N/A',
        l.startDate ? new Date(l.startDate).toISOString().split('T')[0] : '',
        l.notes || '',
      ];
    });

    const csvContent = buildCsv(headers, rows);
    const filename = `loans_report_${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/reports/export/savings
 * Export savings goals to CSV
 */
export async function exportSavingsCsv(req, res, next) {
  try {
    const userId = req.user._id;
    const goals = await SavingsGoal.find({ userId }).sort({ createdAt: -1 });

    const headers = [
      'Goal Name',
      'Category',
      'Target Amount',
      'Current Saved',
      'Remaining Amount',
      'Progress %',
      'Target Date',
      'Status',
      'Notes',
    ];

    const rows = goals.map((g) => {
      const remaining = Math.max(0, Math.round((g.targetAmount - g.currentAmount) * 100) / 100);
      const progress =
        g.targetAmount > 0
          ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))
          : 0;
      return [
        g.title,
        g.category || 'General',
        g.targetAmount,
        g.currentAmount,
        remaining,
        `${progress}%`,
        g.targetDate ? new Date(g.targetDate).toISOString().split('T')[0] : 'N/A',
        g.isArchived ? 'Archived' : g.currentAmount >= g.targetAmount ? 'Completed' : 'Active',
        g.description || '',
      ];
    });

    const csvContent = buildCsv(headers, rows);
    const filename = `savings_report_${Date.now()}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
}

