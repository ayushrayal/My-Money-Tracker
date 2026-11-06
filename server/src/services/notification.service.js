import { Notification } from '../models/notification.model.js';

/**
 * Creates a notification if it doesn't already exist with the same eventKey for this user.
 * Prevents spamming alerts for the same budget threshold, loan due date, or savings milestone.
 */
export async function createNotificationIfNew({
  userId,
  type,
  title,
  message,
  eventKey = null,
  meta = {},
}) {
  if (eventKey) {
    const existing = await Notification.findOne({ userId, eventKey });
    if (existing) {
      return { created: false, notification: existing };
    }
  }

  const notification = await Notification.create({
    userId,
    type,
    title,
    message,
    eventKey,
    meta,
  });

  return { created: true, notification };
}

/**
 * Get user notifications and unread count
 */
export async function getUserNotifications(userId, limit = 50) {
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean({ transform: true }),
    Notification.countDocuments({ userId, read: false }),
  ]);

  return {
    notifications,
    unreadCount,
  };
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(userId, notificationId) {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { $set: { read: true } },
    { new: true }
  );
  return notification;
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(userId) {
  const result = await Notification.updateMany(
    { userId, read: false },
    { $set: { read: true } }
  );
  return result;
}

/**
 * Delete a single notification
 */
export async function deleteNotification(userId, notificationId) {
  const result = await Notification.findOneAndDelete({ _id: notificationId, userId });
  return result;
}

