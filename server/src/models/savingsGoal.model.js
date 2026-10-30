import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Milestone name is required'],
      trim: true,
      maxlength: 100,
    },
    targetAmount: {
      type: Number,
      required: [true, 'Milestone target amount is required'],
      min: [1, 'Target amount must be greater than zero'],
    },
    achieved: {
      type: Boolean,
      default: false,
    },
    achievedDate: {
      type: Date,
      default: null,
    },
  },
  { _id: true }
);

const savingsGoalSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Savings goal owner is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      minlength: [1, 'Title cannot be empty'],
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    targetAmount: {
      type: Number,
      required: [true, 'Target amount is required'],
      min: [1, 'Target amount must be at least ₹1'],
      max: [100000000, 'Amount cannot exceed 100,000,000'],
    },
    currentAmount: {
      type: Number,
      default: 0,
      min: [0, 'Current saved amount cannot be negative'],
      max: [100000000, 'Amount cannot exceed 100,000,000'],
    },
    targetDate: {
      type: Date,
      default: null,
    },
    category: {
      type: String,
      enum: ['emergency_fund', 'general', 'vacation', 'gadget', 'education', 'other'],
      default: 'general',
      index: true,
    },
    monthlyTarget: {
      type: Number,
      min: [0, 'Monthly target cannot be negative'],
      default: 0,
    },
    milestones: [milestoneSchema],
    isArchived: {
      type: Boolean,
      default: false,
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

savingsGoalSchema.virtual('name').get(function () {
  return this.title;
});

savingsGoalSchema.index({ userId: 1, isArchived: 1 });

export const SavingsGoal = mongoose.model('SavingsGoal', savingsGoalSchema);
