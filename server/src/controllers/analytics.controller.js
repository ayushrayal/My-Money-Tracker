import mongoose from 'mongoose';
import { Transaction } from '../models/transaction.model.js';
import { Budget } from '../models/budget.model.js';
import { Loan } from '../models/loan.model.js';
import { SavingsGoal } from '../models/savingsGoal.model.js';
import { SavingsContribution } from '../models/savingsContribution.model.js';
import { createNotificationIfNew } from '../services/notification.service.js';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * GET /api/analytics/overview
 * Comprehensive financial analytics for selected year & month
 */
export async function getAnalyticsOverview(req, res, next) {
  try {
    const userId = req.user._id;
    const now = new Date();
    const queryYear = parseInt(req.query.year, 10) || now.getFullYear();
    const currentMonthStr = `${queryYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const selectedMonth = req.query.month || currentMonthStr;

    // Parse month
    const [mYear, mNum] = selectedMonth.split('-').map((v) => parseInt(v, 10));
    const startOfMonth = new Date(Date.UTC(mYear, mNum - 1, 1, 0, 0, 0));
    const endOfMonth = new Date(Date.UTC(mYear, mNum, 1, 0, 0, 0));

    // Previous month for MoM comparison
    const prevMonthDate = new Date(Date.UTC(mYear, mNum - 2, 1, 0, 0, 0));
    const prevMonthStr = `${prevMonthDate.getUTCFullYear()}-${String(prevMonthDate.getUTCMonth() + 1).padStart(2, '0')}`;
    const startOfPrevMonth = new Date(Date.UTC(prevMonthDate.getUTCFullYear(), prevMonthDate.getUTCMonth(), 1, 0, 0, 0));
    const endOfPrevMonth = new Date(Date.UTC(prevMonthDate.getUTCFullYear(), prevMonthDate.getUTCMonth() + 1, 1, 0, 0, 0));

    // Full year bounds
    const startOfYear = new Date(Date.UTC(queryYear, 0, 1, 0, 0, 0));
    const endOfYear = new Date(Date.UTC(queryYear + 1, 0, 1, 0, 0, 0));

    // 1. Monthly income vs expenses for all 12 months of the year
    const monthlyTransactionData = await Transaction.aggregate([
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
    ]);

    // Monthly savings contributions
    const monthlySavingsData = await SavingsContribution.aggregate([
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
    ]);

    const savingsByMonth = new Map();
    for (const item of monthlySavingsData) {
      savingsByMonth.set(item._id, Math.round(item.total * 100) / 100);
    }

    const incomeVsExpenses = [];
    let yearlyIncome = 0;
    let yearlyExpense = 0;
    let yearlySavings = 0;

    for (let m = 1; m <= 12; m++) {
      const monthKey = `${queryYear}-${String(m).padStart(2, '0')}`;
      const incMatch = monthlyTransactionData.find(
        (d) => d._id.month === m && d._id.type === 'income'
      );
      const expMatch = monthlyTransactionData.find(
        (d) => d._id.month === m && d._id.type === 'expense'
      );

      const income = incMatch ? Math.round(incMatch.total * 100) / 100 : 0;
      const expense = expMatch ? Math.round(expMatch.total * 100) / 100 : 0;
      const savings = savingsByMonth.get(m) || 0;
      const net = Math.round((income - expense) * 100) / 100;

      yearlyIncome += income;
      yearlyExpense += expense;
      yearlySavings += savings;

      incomeVsExpenses.push({
        month: monthKey,
        monthIndex: m,
        monthLabel: MONTH_NAMES[m - 1],
        income,
        expense,
        net,
        savings,
      });
    }

    // 2. Spending trend over days in the selected month
    const dailySpendingData = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startOfMonth, $lt: endOfMonth },
          type: 'expense',
        },
      },
      {
        $group: {
          _id: { $dayOfMonth: '$date' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id': 1 } },
    ]);

    const daysInMonth = new Date(mYear, mNum, 0).getDate();
    const dailyMap = new Map();
    for (const d of dailySpendingData) {
      dailyMap.set(d._id, Math.round(d.total * 100) / 100);
    }

    const spendingTrend = [];
    let cumulativeSpending = 0;
    for (let day = 1; day <= daysInMonth; day++) {
      const amount = dailyMap.get(day) || 0;
      cumulativeSpending += amount;
      spendingTrend.push({
        day,
        date: `${selectedMonth}-${String(day).padStart(2, '0')}`,
        amount,
        cumulative: Math.round(cumulativeSpending * 100) / 100,
      });
    }

    // 3. Category-wise spending breakdown for the selected month
    const categorySpendingData = await Transaction.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startOfMonth, $lt: endOfMonth },
          type: 'expense',
          category: { $ne: null },
        },
      },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    await Transaction.populate(categorySpendingData, {
      path: '_id',
      select: 'name color icon type',
      model: 'Category',
    });

    const totalCategorySpent = categorySpendingData.reduce(
      (sum, item) => sum + item.totalAmount,
      0
    );

    const categoryBreakdown = categorySpendingData.map((item) => {
      const categoryDoc = item._id;
      const amount = Math.round(item.totalAmount * 100) / 100;
      const percentage =
        totalCategorySpent > 0 ? Math.round((amount / totalCategorySpent) * 100) : 0;
      return {
        categoryId: categoryDoc?._id || item._id,
        categoryName: categoryDoc?.name || 'Uncategorized',
        color: categoryDoc?.color || '#087F5B',
        icon: categoryDoc?.icon || 'tag',
        amount,
        count: item.count,
        percentage,
      };
    });

    // 4. Budget utilization for selected month
    const budgetDoc = await Budget.findOne({ userId, month: selectedMonth }).populate(
      'categoryAllocations.category'
    );

    let budgetUtilization = null;
    if (budgetDoc) {
      const categoryLimits = [];
      let totalBudgetLimit = 0;
      let totalBudgetSpent = 0;

      for (const alloc of budgetDoc.categoryAllocations) {
        const catId = alloc.category?._id
          ? alloc.category._id.toString()
          : alloc.category?.toString();
        const catSpendingMatch = categoryBreakdown.find(
          (c) => c.categoryId.toString() === catId
        );
        const limit = Math.round(alloc.limit * 100) / 100;
        const spent = catSpendingMatch ? catSpendingMatch.amount : 0;
        const remaining = Math.round((limit - spent) * 100) / 100;
        const percentUsed = limit > 0 ? Math.round((spent / limit) * 100) : spent > 0 ? 100 : 0;

        let thresholdStatus = 'normal';
        if (spent >= limit && limit > 0) {
          thresholdStatus = 'exceeded';
          // Trigger notification if new
          createNotificationIfNew({
            userId,
            type: 'budget_exceeded',
            title: `Budget exceeded: ${alloc.category?.name || 'Category'}`,
            message: `You spent ₹${spent} which exceeded your budget limit of ₹${limit} for ${alloc.category?.name || 'this category'} in ${selectedMonth}.`,
            eventKey: `budget_100_${budgetDoc._id}_${catId}`,
            meta: { budgetId: budgetDoc._id, categoryId: catId, month: selectedMonth, limit, spent },
          }).catch(() => {});
        } else if (percentUsed >= 80) {
          thresholdStatus = 'warning';
          createNotificationIfNew({
            userId,
            type: 'budget_warning',
            title: `Budget warning: ${alloc.category?.name || 'Category'} at ${percentUsed}%`,
            message: `You have used ${percentUsed}% of your budget (₹${spent} of ₹${limit}) for ${alloc.category?.name || 'this category'} in ${selectedMonth}.`,
            eventKey: `budget_80_${budgetDoc._id}_${catId}`,
            meta: { budgetId: budgetDoc._id, categoryId: catId, month: selectedMonth, limit, spent },
          }).catch(() => {});
        }

        totalBudgetLimit += limit;
        totalBudgetSpent += spent;

        categoryLimits.push({
          categoryId: catId,
          categoryName: alloc.category?.name || '',
          limit,
          spent,
          remaining,
          percentUsed,
          thresholdStatus,
        });
      }

      budgetUtilization = {
        budgetId: budgetDoc._id,
        month: selectedMonth,
        totalLimit: Math.round(totalBudgetLimit * 100) / 100,
        totalSpent: Math.round(totalBudgetSpent * 100) / 100,
        remaining: Math.round((totalBudgetLimit - totalBudgetSpent) * 100) / 100,
        overallPercent:
          totalBudgetLimit > 0
            ? Math.round((totalBudgetSpent / totalBudgetLimit) * 100)
            : 0,
        categories: categoryLimits,
      };
    }

    // 5. Savings Goals progress
    const savingsGoals = await SavingsGoal.find({ userId, isArchived: false }).sort({
      createdAt: -1,
    });
    let totalSavingsTarget = 0;
    let totalSavingsCurrent = 0;
    const goalsOverview = savingsGoals.map((g) => {
      totalSavingsTarget += g.targetAmount;
      totalSavingsCurrent += g.currentAmount;
      const progressPercent =
        g.targetAmount > 0
          ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100))
          : 0;
      return {
        id: g._id,
        title: g.title,
        category: g.category,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        progressPercent,
        isCompleted: g.currentAmount >= g.targetAmount,
        targetDate: g.targetDate,
      };
    });

    // 6. Loans progress
    const loans = await Loan.find({ userId });
    let totalLoanPrincipal = 0;
    let totalLoanRemaining = 0;
    let activeLoansCount = 0;
    let paidLoansCount = 0;

    for (const l of loans) {
      totalLoanPrincipal += l.originalPrincipal;
      totalLoanRemaining += l.outstandingBalance;
      if (l.status === 'active') activeLoansCount++;
      if (l.status === 'paid') paidLoansCount++;
    }

    const totalLoanRepaid = Math.max(
      0,
      Math.round((totalLoanPrincipal - totalLoanRemaining) * 100) / 100
    );
    const loanProgressPercent =
      totalLoanPrincipal > 0
        ? Math.round((totalLoanRepaid / totalLoanPrincipal) * 100)
        : 100;

    // 7. Month-over-Month comparison
    const [currMonthData, prevMonthData] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            userId,
            date: { $gte: startOfMonth, $lt: endOfMonth },
            type: { $in: ['income', 'expense'] },
          },
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]),
      Transaction.aggregate([
        {
          $match: {
            userId,
            date: { $gte: startOfPrevMonth, $lt: endOfPrevMonth },
            type: { $in: ['income', 'expense'] },
          },
        },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
          },
        },
      ]),
    ]);

    const getTotals = (arr) => {
      let income = 0;
      let expense = 0;
      for (const item of arr) {
        if (item._id === 'income') income = Math.round(item.total * 100) / 100;
        if (item._id === 'expense') expense = Math.round(item.total * 100) / 100;
      }
      return { income, expense, net: Math.round((income - expense) * 100) / 100 };
    };

    const currTotals = getTotals(currMonthData);
    const prevTotals = getTotals(prevMonthData);

    const calcChange = (curr, prev) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    const monthOverMonth = {
      currentMonth: { month: selectedMonth, ...currTotals },
      previousMonth: { month: prevMonthStr, ...prevTotals },
      changes: {
        incomeChangePct: calcChange(currTotals.income, prevTotals.income),
        expenseChangePct: calcChange(currTotals.expense, prevTotals.expense),
        netChangePct: calcChange(currTotals.net, prevTotals.net),
      },
    };

    // 8. Yearly overview
    const netCashFlow = Math.round((yearlyIncome - yearlyExpense) * 100) / 100;
    const savingsRate =
      yearlyIncome > 0 ? Math.round((yearlySavings / yearlyIncome) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        year: queryYear,
        selectedMonth,
        incomeVsExpenses,
        spendingTrend,
        categoryBreakdown,
        budgetUtilization,
        savingsGoals: {
          goals: goalsOverview,
          totalTarget: Math.round(totalSavingsTarget * 100) / 100,
          totalCurrent: Math.round(totalSavingsCurrent * 100) / 100,
          overallProgress:
            totalSavingsTarget > 0
              ? Math.min(100, Math.round((totalSavingsCurrent / totalSavingsTarget) * 100))
              : 0,
        },
        loanProgress: {
          totalPrincipal: Math.round(totalLoanPrincipal * 100) / 100,
          totalRepaid: totalLoanRepaid,
          remainingBalance: Math.round(totalLoanRemaining * 100) / 100,
          activeLoansCount,
          paidLoansCount,
          progressPercent: loanProgressPercent,
        },
        monthOverMonth,
        yearlyOverview: {
          totalIncome: Math.round(yearlyIncome * 100) / 100,
          totalExpense: Math.round(yearlyExpense * 100) / 100,
          netCashFlow,
          totalSaved: Math.round(yearlySavings * 100) / 100,
          savingsRate,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}
