import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      minlength: [1, 'Category name cannot be empty'],
      maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    type: {
      type: String,
      required: [true, 'Category type is required'],
      enum: {
        values: ['income', 'expense'],
        message: 'Category type must be either income or expense',
      },
    },
    icon: {
      type: String,
      trim: true,
      default: 'tag',
      maxlength: 30,
    },
    color: {
      type: String,
      trim: true,
      default: '#10b981',
      maxlength: 20,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // null for global system-default categories
      index: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
      index: true,
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

// Compound index to ensure uniqueness per user (and system defaults where userId is null)
categorySchema.index({ userId: 1, name: 1, type: 1 }, { unique: true });

export const Category = mongoose.model('Category', categorySchema);

