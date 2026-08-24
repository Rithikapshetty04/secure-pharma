const {
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../services/notificationService");

const getUserNotifications = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const result = await getNotificationsForUser(req.user, {
      page,
      limit,
      unreadOnly,
    });
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    next(error);
  }
};

const markRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await markNotificationAsRead(id, req.user);
    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    next(error);
  }
};

const markAllRead = async (req, res, next) => {
  try {
    await markAllNotificationsAsRead(req.user);
    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUserNotifications,
  markRead,
  markAllRead,
};
