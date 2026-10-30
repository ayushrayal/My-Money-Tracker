import mongoose from 'mongoose';

const PAYMENT_METHODS = ['cash', 'upi', 'card', 'bank_transfer', 'other'];
const TRANSACTION_TYPES = ['income', 'expense', 'transfer'];

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Transaction owner is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Transaction type is required'],
      enum: {
        values: TRANSACTION_TYPES,
        message: 'Type must be income, expense, or transfer',
      },
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
      max: [100000000, 'Amount cannot exceed 100,000,000'],
      validate: {
        validator: (v) => Number.isFinite(v) && !Number.isNaN(v),
        message: 'Amount must be a valid finite number',
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
      index: true,
      validate: {
        validator: function (v) {
          // If transaction is income or expense, category should ideally be present
          // Transfers do not require a category
          if (this.type === 'transfer') return true;
          return v != null;
        },
        message: 'Category is required for income and expense transactions',
      },
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [1, 'Description cannot be empty'],
      maxlength: [150, 'Description cannot exceed 150 characters'],
    },
    date: {
      type: Date,
      required: [true, 'Transaction date is required'],
      default: Date.now,
      index: true,
    },
    paymentMethod: {
      type: String,
      required: [true, 'Payment method is required'],
      enum: {
        values: PAYMENT_METHODS,
        message: 'Payment method must be cash, upi, card, bank_transfer, or other',
      },
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
      default: '',
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Compound indexes for high-frequency queries
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
export { PAYMENT_METHODS, TRANSACTION_TYPES };

