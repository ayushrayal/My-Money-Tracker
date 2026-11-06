import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification as removeNotification,
} from '../services/notification.service.js';

/**
 * GET /api/notifications
 * Fetch notifications and unread count for current user
 */
export async function getNotifications(req, res, next) {
  try {
    const limit = req.query.limit ? Math.min(parseInt(req.query.limit, 10), 100) : 50;
    const data = await getUserNotifications(req.user._id, limit);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Mark a single notification as read
 */
export async function markAsRead(req, res, next) {
  try {
    const notification = await markNotificationAsRead(req.user._id, req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: notification,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for current user
 */
export async function markAllRead(req, res, next) {
  try {
    await markAllNotificationsAsRead(req.user._id);

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
export async function deleteNotification(req, res, next) {
  try {
    const notification = await removeNotification(req.user._id, req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Notification removed successfully',
    });
  } catch (error) {
    next(error);
  }
}

