import mongoose from 'mongoose';

const NOTIFICATION_TYPES = [
  'budget_warning',
  'budget_exceeded',
  'loan_reminder',
  'savings_milestone',
  'system',
];

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Notification owner is required'],
      index: true,
    },
    type: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: {
        values: NOTIFICATION_TYPES,
        message: `Type must be one of: ${NOTIFICATION_TYPES.join(', ')}`,
      },
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    eventKey: {
      type: String,
      default: null,
      index: true,
    },
    meta: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
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

notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, eventKey: 1 });

export const Notification = mongoose.model('Notification', notificationSchema);
export { NOTIFICATION_TYPES };

