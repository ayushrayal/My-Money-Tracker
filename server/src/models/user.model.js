import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Excluded from query results by default
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      trim: true,
      enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'SGD', 'CHF', 'NZD'],
    },
    avatar: {
      type: String,
      default: '',
      trim: true,
    },
    preferences: {
      currency: {
        type: String,
        default: 'INR',
        uppercase: true,
        trim: true,
        enum: ['INR', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'SGD', 'CHF', 'NZD'],
      },
      budgetStartDay: {
        type: Number,
        default: 1,
        min: 1,
        max: 28,
      },
      defaultSalary: {
        type: Number,
        default: 25000,
        min: 0,
      },
      dashboard: {
        showSummaryCards: { type: Boolean, default: true },
        showTrends: { type: Boolean, default: true },
        showRecentTransactions: { type: Boolean, default: true },
      },
      notifications: {
        budgetAlerts: { type: Boolean, default: true },
        loanReminders: { type: Boolean, default: true },
        savingsMilestones: { type: Boolean, default: true },
      },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        if (ret._id) {
          ret.id = ret._id.toString();
          delete ret._id;
        }
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
    toObject: {
      transform(doc, ret) {
        if (ret._id) {
          ret.id = ret._id.toString();
          delete ret._id;
        }
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      },
    },
  }
);

// Keep root currency synced with preferences.currency if preferences changed
userSchema.pre('save', function () {
  if (this.isModified('preferences.currency') && this.preferences?.currency) {
    this.currency = this.preferences.currency;
  }
});

// Method to verify candidate password against stored hash
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.passwordHash) {
    throw new Error('Password hash not loaded on user document.');
  }
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static helper to hash passwords with work factor 12
userSchema.statics.hashPassword = async function (plainPassword) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(plainPassword, salt);
};

export const User = mongoose.model('User', userSchema);

