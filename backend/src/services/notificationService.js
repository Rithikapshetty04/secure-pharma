const Notification = require("../../models/Notification");

const createNotification = async ({
  recipientUser = null,
  recipientRole = "ALL",
  recipientOrg = null,
  type = "GENERAL",
  title,
  message,
  relatedEntity = null,
  relatedEntityId = null,
}) => {
  try {
    const notification = await Notification.create({
      recipientUser,
      recipientRole,
      recipientOrg,
      type,
      title,
      message,
      relatedEntity,
      relatedEntityId,
    });
    return notification;
  } catch (error) {
    console.error("Failed to create notification:", error.message);
    return null;
  }
};

const getNotificationsForUser = async (user, { limit = 20, page = 1, unreadOnly = false }) => {
  try {
    const query = {
      $or: [
        { recipientUser: user._id },
        { recipientRole: user.role },
        { recipientRole: "ALL" },
      ],
    };

    if (user.organization) {
      query.$or.push({ recipientOrg: user.organization._id || user.organization });
    }

    if (unreadOnly === "true" || unreadOnly === true) {
      query.isRead = false;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      ...query,
      isRead: false,
    });

    return {
      notifications,
      total,
      unreadCount,
      page: Number(page),
      limit: Number(limit),
    };
  } catch (error) {
    console.error("Error fetching notifications:", error.message);
    throw error;
  }
};

const markNotificationAsRead = async (notificationId, user) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );
    return notification;
  } catch (error) {
    console.error("Error marking notification read:", error.message);
    throw error;
  }
};

const markAllNotificationsAsRead = async (user) => {
  try {
    const query = {
      $or: [
        { recipientUser: user._id },
        { recipientRole: user.role },
        { recipientRole: "ALL" },
      ],
    };
    if (user.organization) {
      query.$or.push({ recipientOrg: user.organization._id || user.organization });
    }

    const result = await Notification.updateMany(query, { isRead: true });
    return result;
  } catch (error) {
    console.error("Error marking all notifications read:", error.message);
    throw error;
  }
};

module.exports = {
  createNotification,
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
