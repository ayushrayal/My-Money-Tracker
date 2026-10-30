import mongoose from 'mongoose';

const LOAN_STATUSES = ['active', 'paid', 'paused', 'archived'];

const loanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Loan owner is required'],
      index: true,
    },
    lenderName: {
      type: String,
      required: [true, 'Lender name is required'],
      trim: true,
      minlength: [1, 'Lender name cannot be empty'],
      maxlength: [100, 'Lender name cannot exceed 100 characters'],
    },
    originalPrincipal: {
      type: Number,
      required: [true, 'Original principal amount is required'],
      min: [1, 'Principal must be at least ₹1'],
      max: [100000000, 'Amount cannot exceed 100,000,000'],
    },
    outstandingBalance: {
      type: Number,
      required: [true, 'Outstanding balance is required'],
      min: [0, 'Outstanding balance cannot be negative'],
      max: [100000000, 'Amount cannot exceed 100,000,000'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
      default: Date.now,
    },
    plannedMonthlyPayment: {
      type: Number,
      min: [0, 'Planned payment cannot be negative'],
      max: [100000000, 'Amount cannot exceed 100,000,000'],
      default: 0,
    },
    firstScheduledPaymentMonth: {
      type: String,
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'First scheduled payment month must follow YYYY-MM format'],
      default: null,
    },
    status: {
      type: String,
      enum: {
        values: LOAN_STATUSES,
        message: 'Loan status must be active, paid, paused, or archived',
      },
      default: 'active',
      index: true,
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

loanSchema.index({ userId: 1, status: 1 });

export const Loan = mongoose.model('Loan', loanSchema);
export { LOAN_STATUSES };

