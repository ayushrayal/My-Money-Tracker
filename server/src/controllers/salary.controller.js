import { Salary } from '../models/salary.model.js';
import { Transaction } from '../models/transaction.model.js';
import { Category } from '../models/category.model.js';

/**
 * Helper to retrieve salary income category
 */
async function getSalaryCategory(userId) {
  let cat = await Category.findOne({
    name: 'Salary',
    type: 'income',
    $or: [{ userId }, { isDefault: true, userId: null }],
  });
  if (!cat) {
    cat = await Category.findOne({
      type: 'income',
      $or: [{ userId }, { isDefault: true, userId: null }],
    });
  }
  return cat;
}

/**
 * Get salary configuration & receipt status for a specific month
 */
export async function getSalary(req, res, next) {
  try {
    const userId = req.user._id;
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const month = req.query.month || currentMonth;

    let salary = await Salary.findOne({ userId, month });

    return res.status(200).json({
      success: true,
      data: {
        month,
        salary: salary ? salary.toJSON() : null,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create or configure planned salary for a month
 */
export async function configureSalary(req, res, next) {
  try {
    const userId = req.user._id;
    const { month, plannedAmount, notes } = req.body;

    const salary = await Salary.findOneAndUpdate(
      { userId, month },
      {
        $set: {
          plannedAmount,
          notes: notes !== undefined ? notes : '',
        },
        $setOnInsert: {
          userId,
          month,
          status: 'planned',
          actualAmount: null,
          receivedDate: null,
          additionalIncomes: [],
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      data: {
        salary: salary.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Record actual salary receipt and link/update income transaction in the ledger
 */
export async function receiveSalary(req, res, next) {
  try {
    const userId = req.user._id;
    const { month, actualAmount, receivedAmount, receivedDate, paymentMethod, notes } = req.body;
    const resolvedAmount = actualAmount !== undefined ? actualAmount : receivedAmount;

    let salary = await Salary.findOne({ userId, month });
    if (!salary) {
      salary = new Salary({
        userId,
        month,
        plannedAmount: resolvedAmount,
        notes: notes || '',
      });
    }

    const salaryCategory = await getSalaryCategory(userId);
    const categoryId = salaryCategory ? salaryCategory._id : null;
    const transactionDate = new Date(receivedDate);
    const desc = `Monthly Salary — ${month}`;

    let linkedTx = null;

    if (salary.transactionId) {
      // Update existing linked transaction to prevent duplicate transactions
      linkedTx = await Transaction.findOneAndUpdate(
        { _id: salary.transactionId, userId },
        {
          $set: {
            amount: resolvedAmount,
            date: transactionDate,
            paymentMethod: paymentMethod || 'bank_transfer',
            notes: notes || '',
            category: categoryId,
            description: desc,
          },
        },
        { returnDocument: 'after' }
      );
    }

    if (!linkedTx) {
      // Create new transaction in ledger
      linkedTx = await Transaction.create({
        userId,
        type: 'income',
        amount: resolvedAmount,
        category: categoryId,
        description: desc,
        date: transactionDate,
        paymentMethod: paymentMethod || 'bank_transfer',
        notes: notes || '',
      });
      salary.transactionId = linkedTx._id;
    }

    salary.status = 'received';
    salary.actualAmount = resolvedAmount;
    salary.receivedDate = transactionDate;
    salary.paymentMethod = paymentMethod || 'bank_transfer';
    if (notes !== undefined) salary.notes = notes;

    await salary.save();

    return res.status(200).json({
      success: true,
      data: {
        salary: salary.toJSON(),
        transaction: linkedTx.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Record additional income (freelance, bonus, etc.) and integrate with transaction ledger
 */
export async function addAdditionalIncome(req, res, next) {
  try {
    const userId = req.user._id;
    const { month, source, amount, receivedDate, date, paymentMethod, notes } = req.body;

    let salary = await Salary.findOne({ userId, month });
    if (!salary) {
      salary = new Salary({
        userId,
        month,
        plannedAmount: 25000,
        status: 'planned',
      });
    }

    // Find category matching source or default income
    let cat = await Category.findOne({
      type: 'income',
      $or: [{ userId }, { isDefault: true, userId: null }],
      name: new RegExp(source, 'i'),
    });
    if (!cat) {
      cat = await Category.findOne({
        type: 'income',
        $or: [{ userId }, { isDefault: true, userId: null }],
      });
    }

    const txDate = new Date(receivedDate || date || new Date());
    const tx = await Transaction.create({
      userId,
      type: 'income',
      amount,
      category: cat ? cat._id : null,
      description: `Additional Income: ${source}`,
      date: txDate,
      paymentMethod: paymentMethod || 'bank_transfer',
      notes: notes || '',
    });

    salary.additionalIncomes.push({
      source,
      amount,
      receivedDate: txDate,
      paymentMethod: paymentMethod || 'bank_transfer',
      transactionId: tx._id,
      notes: notes || '',
    });

    await salary.save();

    return res.status(200).json({
      success: true,
      data: {
        salary: salary.toJSON(),
        transaction: tx.toJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * List historical salary records
 */
export async function listSalaryHistory(req, res, next) {
  try {
    const userId = req.user._id;
    const records = await Salary.find({ userId }).sort({ month: -1 }).limit(24);

    return res.status(200).json({
      success: true,
      data: {
        salaries: records.map((r) => r.toJSON()),
      },
    });
  } catch (error) {
    next(error);
  }
}
