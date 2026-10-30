import mongoose from 'mongoose';
import { Loan } from '../models/loan.model.js';
import { LoanPayment } from '../models/loanPayment.model.js';
import { Transaction } from '../models/transaction.model.js';
import { Category } from '../models/category.model.js';

/**
 * Helper to retrieve loan expense category
 */
async function getLoanExpenseCategory(userId) {
  let cat = await Category.findOne({
    name: new RegExp('^loans?$', 'i'),
    type: 'expense',
    $or: [{ userId }, { isDefault: true, userId: null }],
  });
  if (!cat) {
    cat = await Category.findOne({
      type: 'expense',
      $or: [{ userId }, { isDefault: true, userId: null }],
    });
  }
  return cat;
}

/**
 * Recompute and update loan balance and status from actual payments
 */
async function syncLoanBalance(loanId, userId) {
  const loan = await Loan.findOne({ _id: loanId, userId });
  if (!loan) return null;

  const payments = await LoanPayment.find({ loanId, userId });
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  const roundedPaid = Math.round(totalPaid * 100) / 100;
  const newBalance = Math.max(0, Math.round((loan.originalPrincipal - roundedPaid) * 100) / 100);

  loan.outstandingBalance = newBalance;
  if (newBalance === 0 && loan.status === 'active') {
    loan.status = 'paid';
  } else if (newBalance > 0 && loan.status === 'paid') {
    loan.status = 'active';
  }

  await loan.save();
  return {
    loan,
    totalPaid: roundedPaid,
    paymentCount: payments.length,
    payments: payments.map((p) => p.toJSON()),
  };
}

/**
 * List all loans for the authenticated user with aggregate balance statistics
 */
export async function listLoans(req, res, next) {
  try {
    const userId = req.user._id;
    const loans = await Loan.find({ userId }).sort({ status: 1, createdAt: -1 });

    const payments = await LoanPayment.find({ userId });
    const paymentMap = new Map();

    for (const p of payments) {
      const lid = p.loanId.toString();
      const current = paymentMap.get(lid) || { totalPaid: 0, count: 0 };
      current.totalPaid += p.amount;
      current.count += 1;
      paymentMap.set(lid, current);
    }

    let totalOriginalPrincipal = 0;
    let totalOutstandingBalance = 0;
    let totalPaidSoFar = 0;
    let activeLoansCount = 0;
    let paidLoansCount = 0;

    const enrichedLoans = loans.map((loan) => {
      const stat = paymentMap.get(loan._id.toString()) || { totalPaid: 0, count: 0 };
      const paid = Math.round(stat.totalPaid * 100) / 100;
      const progressPercent =
        loan.originalPrincipal > 0 ? Math.min(100, Math.round((paid / loan.originalPrincipal) * 100)) : 0;

      totalOriginalPrincipal += loan.originalPrincipal;
      totalOutstandingBalance += loan.outstandingBalance;
      totalPaidSoFar += paid;

      if (loan.status === 'active') activeLoansCount += 1;
      if (loan.status === 'paid') paidLoansCount += 1;

      return {
        ...loan.toJSON(),
        totalPaid: paid,
        paymentCount: stat.count,
        progressPercent,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        loans: enrichedLoans,
        summary: {
          totalOriginalPrincipal: Math.round(totalOriginalPrincipal * 100) / 100,
          totalOutstandingBalance: Math.round(totalOutstandingBalance * 100) / 100,
          totalPaidSoFar: Math.round(totalPaidSoFar * 100) / 100,
          activeLoansCount,
          paidLoansCount,
        },
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single loan details along with complete repayment history
 */
export async function getLoan(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        error: { code: 'LOAN_NOT_FOUND', message: 'Loan not found or not accessible' },
      });
    }

    const loan = await Loan.findOne({ _id: id, userId });
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: { code: 'LOAN_NOT_FOUND', message: 'Loan not found or not accessible' },
      });
    }

    const payments = await LoanPayment.find({ loanId: id, userId })
      .sort({ paymentDate: -1 })
      .populate('transactionId');

    const totalPaid = Math.round(payments.reduce((sum, p) => sum + p.amount, 0) * 100) / 100;
    const progressPercent =
      loan.originalPrincipal > 0 ? Math.min(100, Math.round((totalPaid / loan.originalPrincipal) * 100)) : 0;

    const paymentList = payments.map((p) => p.toJSON());

    return res.status(200).json({
      success: true,
      data: {
        loan: {
          ...loan.toJSON(),
          totalPaid,
          progressPercent,
          payments: paymentList,
        },
        payments: paymentList,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create a new informal loan
 */
export async function createLoan(req, res, next) {
  try {
    const userId = req.user._id;
    const {
      lenderName,
      originalPrincipal,
      startDate,
      plannedMonthlyPayment,
      firstScheduledPaymentMonth,
      notes,
    } = req.body;

    const loan = await Loan.create({
      userId,
      lenderName,
      originalPrincipal,
      outstandingBalance: originalPrincipal,
      startDate: new Date(startDate),
      plannedMonthlyPayment: plannedMonthlyPayment || 0,
      firstScheduledPaymentMonth: firstScheduledPaymentMonth || null,
      notes: notes || '',
      status: 'active',
    });

    return res.status(201).json({
      success: true,
      data: {
        loan: loan.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing loan
 */
export async function updateLoan(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        error: { code: 'LOAN_NOT_FOUND', message: 'Loan not found or not accessible' },
      });
    }

    const loan = await Loan.findOne({ _id: id, userId });
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: { code: 'LOAN_NOT_FOUND', message: 'Loan not found or not accessible' },
      });
    }

    const {
      lenderName,
      plannedMonthlyPayment,
      firstScheduledPaymentMonth,
      status,
      notes,
    } = req.body;

    if (lenderName !== undefined) loan.lenderName = lenderName;
    if (plannedMonthlyPayment !== undefined) loan.plannedMonthlyPayment = plannedMonthlyPayment;
    if (firstScheduledPaymentMonth !== undefined) loan.firstScheduledPaymentMonth = firstScheduledPaymentMonth;
    if (status !== undefined) loan.status = status;
    if (notes !== undefined) loan.notes = notes;

    await loan.save();

    return res.status(200).json({
      success: true,
      data: {
        loan: loan.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Record an actual loan payment, update balance atomically, and optionally link transaction
 */
export async function recordLoanPayment(req, res, next) {
  try {
    const userId = req.user._id;
    const { id } = req.params;
    const { amount, paymentDate, recordAsExpense, createTransaction, paymentMethod, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        error: { code: 'LOAN_NOT_FOUND', message: 'Loan not found or not accessible' },
      });
    }

    const loan = await Loan.findOne({ _id: id, userId });
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: { code: 'LOAN_NOT_FOUND', message: 'Loan not found or not accessible' },
      });
    }

    // Prevent payment exceeding current outstanding balance
    if (amount > loan.outstandingBalance) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'OVERPAYMENT_NOT_ALLOWED',
          message: `Payment amount (₹${amount}) exceeds outstanding balance (₹${loan.outstandingBalance})`,
        },
      });
    }

    let linkedTx = null;
    const shouldRecordExpense = recordAsExpense !== undefined ? recordAsExpense : (createTransaction !== undefined ? createTransaction : true);

    if (shouldRecordExpense) {
      const loanCat = await getLoanExpenseCategory(userId);
      linkedTx = await Transaction.create({
        userId,
        type: 'expense',
        amount,
        category: loanCat ? loanCat._id : null,
        description: `Loan Repayment — ${loan.lenderName}`,
        date: new Date(paymentDate),
        paymentMethod: paymentMethod || 'upi',
        notes: notes || '',
      });
    }

    const payment = await LoanPayment.create({
      userId,
      loanId: loan._id,
      amount,
      paymentDate: new Date(paymentDate),
      transactionId: linkedTx ? linkedTx._id : null,
      notes: notes || '',
    });

    const syncResult = await syncLoanBalance(loan._id, userId);
    const loanJson = {
      ...syncResult.loan.toJSON(),
      payments: syncResult.payments,
      totalPaid: syncResult.totalPaid,
    };

    return res.status(201).json({
      success: true,
      data: {
        payment: payment.toJSON(),
        loan: loanJson,
        transaction: linkedTx ? linkedTx.toJSON() : null,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update an existing loan payment and recompute loan balance
 */
export async function updateLoanPayment(req, res, next) {
  try {
    const userId = req.user._id;
    const { id, paymentId } = req.params;
    const { amount, paymentDate, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).json({
        success: false,
        error: { code: 'LOAN_NOT_FOUND', message: 'Loan not found or not accessible' },
      });
    }

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(404).json({
        success: false,
        error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment record not found' },
      });
    }

    const loan = await Loan.findOne({ _id: id, userId });
    if (!loan) {
      return res.status(404).json({
        success: false,
        error: { code: 'LOAN_NOT_FOUND', message: 'Loan not found or not accessible' },
      });
    }

    const payment = await LoanPayment.findOne({ _id: paymentId, loanId: id, userId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment record not found' },
      });
    }

    if (amount !== undefined && amount !== payment.amount) {
      // Check total other payments
      const otherPayments = await LoanPayment.find({ loanId: id, userId, _id: { $ne: paymentId } });
      const otherTotal = otherPayments.reduce((sum, p) => sum + p.amount, 0);

      if (otherTotal + amount > loan.originalPrincipal) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'OVERPAYMENT_NOT_ALLOWED',
            message: `New total payments (₹${otherTotal + amount}) would exceed original principal (₹${loan.originalPrincipal})`,
          },
        });
      }

      payment.amount = amount;

      // Update linked transaction if present
      if (payment.transactionId) {
        await Transaction.findOneAndUpdate(
          { _id: payment.transactionId, userId },
          { $set: { amount } }
        );
      }
    }

    if (paymentDate !== undefined) {
      const pDate = new Date(paymentDate);
      payment.paymentDate = pDate;
      if (payment.transactionId) {
        await Transaction.findOneAndUpdate(
          { _id: payment.transactionId, userId },
          { $set: { date: pDate } }
        );
      }
    }

    if (notes !== undefined) {
      payment.notes = notes;
      if (payment.transactionId) {
        await Transaction.findOneAndUpdate(
          { _id: payment.transactionId, userId },
          { $set: { notes } }
        );
      }
    }

    await payment.save();
    const syncResult = await syncLoanBalance(id, userId);

    return res.status(200).json({
      success: true,
      data: {
        payment: payment.toJSON(),
        loan: syncResult
          ? {
              ...syncResult.loan.toJSON(),
              payments: syncResult.payments,
              totalPaid: syncResult.totalPaid,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reverse / delete an existing loan payment and safely update loan balance and ledger
 */
export async function deleteLoanPayment(req, res, next) {
  try {
    const userId = req.user._id;
    const { id, paymentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(paymentId)) {
      return res.status(404).json({
        success: false,
        error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment record not found' },
      });
    }

    const payment = await LoanPayment.findOne({ _id: paymentId, loanId: id, userId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: { code: 'PAYMENT_NOT_FOUND', message: 'Payment record not found' },
      });
    }

    // Delete linked transaction if exists
    if (payment.transactionId) {
      await Transaction.deleteOne({ _id: payment.transactionId, userId });
    }

    await LoanPayment.deleteOne({ _id: paymentId, userId });
    const syncResult = await syncLoanBalance(id, userId);

    return res.status(200).json({
      success: true,
      data: {
        message: 'Payment reversed successfully',
        loan: syncResult
          ? {
              ...syncResult.loan.toJSON(),
              payments: syncResult.payments,
              totalPaid: syncResult.totalPaid,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Initialize owner's initial 5 loans:
 * - Loan A: ₹8,000 (Nov plan: ₹1,000; Dec onward: ₹1,000/mo)
 * - Loan B: ₹5,000 (Dec onward: ₹2,000/mo)
 * - Loan C: ₹10,000 (Dec onward: ₹2,000/mo)
 * - Small Loan 1: ₹2,000 (Nov plan: ₹2,000 close)
 * - Small Loan 2: ₹2,000 (Nov plan: ₹2,000 close)
 */
export async function applyOwnerLoansPreset(req, res, next) {
  try {
    const userId = req.user._id;

    const ownerLoans = [
      {
        lenderName: 'Loan A',
        originalPrincipal: 8000,
        plannedMonthlyPayment: 1000,
        firstScheduledPaymentMonth: '2026-11',
        notes: 'November planned: ₹1,000; December onward: ₹1,000/mo',
      },
      {
        lenderName: 'Loan B',
        originalPrincipal: 5000,
        plannedMonthlyPayment: 2000,
        firstScheduledPaymentMonth: '2026-12',
        notes: 'First scheduled payment: December 2026 (₹2,000/mo)',
      },
      {
        lenderName: 'Loan C',
        originalPrincipal: 10000,
        plannedMonthlyPayment: 2000,
        firstScheduledPaymentMonth: '2026-12',
        notes: 'First scheduled payment: December 2026 (₹2,000/mo)',
      },
      {
        lenderName: 'Small Loan 1',
        originalPrincipal: 2000,
        plannedMonthlyPayment: 2000,
        firstScheduledPaymentMonth: '2026-11',
        notes: 'Targeted to be fully closed in November 2026 (₹2,000)',
      },
      {
        lenderName: 'Small Loan 2',
        originalPrincipal: 2000,
        plannedMonthlyPayment: 2000,
        firstScheduledPaymentMonth: '2026-11',
        notes: 'Targeted to be fully closed in November 2026 (₹2,000)',
      },
    ];

    const results = [];

    for (const item of ownerLoans) {
      let loan = await Loan.findOne({ userId, lenderName: item.lenderName });
      if (!loan) {
        loan = await Loan.create({
          userId,
          lenderName: item.lenderName,
          originalPrincipal: item.originalPrincipal,
          outstandingBalance: item.originalPrincipal,
          plannedMonthlyPayment: item.plannedMonthlyPayment,
          firstScheduledPaymentMonth: item.firstScheduledPaymentMonth,
          notes: item.notes,
          status: 'active',
          startDate: new Date('2026-10-01'),
        });
      }
      results.push(loan.toJSON());
    }

    return res.status(200).json({
      success: true,
      data: {
        loans: results,
      },
    });
  } catch (error) {
    next(error);
  }
}
