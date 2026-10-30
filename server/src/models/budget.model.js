import mongoose from 'mongoose';

const categoryAllocationSchema = new mongoose.Schema(
  {
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required'],
    },
    limit: {
      type: Number,
      required: [true, 'Category budget limit is required'],
      min: [0, 'Limit cannot be negative'],
      max: [100000000, 'Limit cannot exceed 100,000,000'],
      default: 0,
    },
  },
  {
    _id: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id ? ret._id.toString() : undefined;
        ret.allocatedAmount = ret.limit;
        if (doc.category && typeof doc.category === 'object' && doc.category.name) {
          ret.categoryName = doc.category.name;
          ret.categoryId = doc.category._id ? doc.category._id.toString() : undefined;
        } else if (doc.category) {
          ret.categoryId = doc.category.toString();
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Budget owner is required'],
      index: true,
    },
    month: {
      type: String,
      required: [true, 'Budget month is required (YYYY-MM)'],
      match: [/^\d{4}-(0[1-9]|1[0-2])$/, 'Month must follow YYYY-MM format'],
      index: true,
    },
    expectedIncome: {
      type: Number,
      required: [true, 'Expected monthly income is required'],
      min: [0, 'Expected income cannot be negative'],
      max: [100000000, 'Income cannot exceed 100,000,000'],
      default: 25000,
    },
    categoryAllocations: [categoryAllocationSchema],
    savingsTarget: {
      type: Number,
      min: [0, 'Savings target cannot be negative'],
      max: [100000000, 'Savings target cannot exceed 100,000,000'],
      default: 4000,
    },
    bufferAllocation: {
      type: Number,
      min: [0, 'Buffer allocation cannot be negative'],
      max: [100000000, 'Buffer allocation cannot exceed 100,000,000'],
      default: 2000,
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

// One budget per user per month
budgetSchema.index({ userId: 1, month: 1 }, { unique: true });

export const Budget = mongoose.model('Budget', budgetSchema);
