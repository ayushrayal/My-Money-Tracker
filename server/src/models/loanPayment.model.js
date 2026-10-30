import mongoose from 'mongoose';

const loanPaymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Payment owner is required'],
      index: true,
    },
    loanId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Loan',
      required: [true, 'Loan reference is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0.01, 'Payment amount must be greater than zero'],
      max: [100000000, 'Amount cannot exceed 100,000,000'],
    },
    paymentDate: {
      type: Date,
      required: [true, 'Payment date is required'],
      default: Date.now,
      index: true,
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null,
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

loanPaymentSchema.virtual('linkedTransactionId').get(function () {
  return this.transactionId;
});

loanPaymentSchema.index({ userId: 1, loanId: 1, paymentDate: -1 });

export const LoanPayment = mongoose.model('LoanPayment', loanPaymentSchema);
