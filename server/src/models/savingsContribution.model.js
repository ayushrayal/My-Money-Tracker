import mongoose from 'mongoose';

const savingsContributionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Contribution owner is required'],
      index: true,
    },
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SavingsGoal',
      required: [true, 'Savings goal reference is required'],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Contribution amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
      max: [100000000, 'Amount cannot exceed 100,000,000'],
    },
    date: {
      type: Date,
      required: [true, 'Contribution date is required'],
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

savingsContributionSchema.virtual('contributionDate').get(function () {
  return this.date;
});

savingsContributionSchema.virtual('linkedTransactionId').get(function () {
  return this.transactionId;
});

savingsContributionSchema.index({ userId: 1, goalId: 1, date: -1 });

export const SavingsContribution = mongoose.model('SavingsContribution', savingsContributionSchema);
