import mongoose from 'mongoose';

const additionalIncomeSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      required: [true, 'Income source name is required'],
      trim: true,
      maxlength: [100, 'Source name cannot exceed 100 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Income amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
      max: [100000000, 'Amount cannot exceed 100,000,000'],
    },
    receivedDate: {
      type: Date,
      required: [true, 'Received date is required'],
      default: Date.now,
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'upi', 'cash', 'card', 'other'],
      default: 'bank_transfer',
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
  },
  {
    _id: true,
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

additionalIncomeSchema.virtual('linkedTransactionId').get(function () {
  return this.transactionId;
});

const salarySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Salary record owner is required'],
      index: true,
    },
    month: {
      type: String,
      required: [true, 'Month format must be YYYY-MM'],
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must follow YYYY-MM format'],
      index: true,
    },
    plannedAmount: {
      type: Number,
      required: [true, 'Planned salary amount is required'],
      min: [0, 'Planned salary cannot be negative'],
      max: [100000000, 'Amount cannot exceed 100,000,000'],
      default: 25000,
    },
    status: {
      type: String,
      enum: {
        values: ['planned', 'received'],
        message: 'Salary status must be planned or received',
      },
      default: 'planned',
      index: true,
    },
    actualAmount: {
      type: Number,
      min: [0, 'Actual salary cannot be negative'],
      max: [100000000, 'Amount cannot exceed 100,000,000'],
      default: null,
    },
    receivedDate: {
      type: Date,
      default: null,
    },
    paymentMethod: {
      type: String,
      enum: ['bank_transfer', 'upi', 'cash', 'card', 'other'],
      default: 'bank_transfer',
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
    },
    additionalIncomes: [additionalIncomeSchema],
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
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

salarySchema.virtual('receivedAmount').get(function () {
  return this.actualAmount;
});

salarySchema.virtual('linkedTransactionId').get(function () {
  return this.transactionId;
});

// One salary configuration per user per month
salarySchema.index({ userId: 1, month: 1 }, { unique: true });

export const Salary = mongoose.model('Salary', salarySchema);
