const { Expo } = require("expo-server-sdk");
const logger = require("../logger");

// Create a new Expo SDK client
const expo = new Expo();

class NotificationService {
  /**
   * Send push notification to a single device
   * @param {string} pushToken - Expo push token
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {object} data - Additional data to send with notification
   */
  static async sendPushNotification(pushToken, title, body, data = {}) {
    try {
      // Check that all your push tokens appear to be valid Expo push tokens
      if (!Expo.isExpoPushToken(pushToken)) {
        logger.error(`Push token ${pushToken} is not a valid Expo push token`);
        return { success: false, error: "Invalid push token" };
      }

      // Construct the message
      const message = {
        to: pushToken,
        sound: "default",
        title: title,
        body: body,
        data: data,
        priority: "high",
        channelId: "default",
      };

      // Send the notification
      const chunks = expo.chunkPushNotifications([message]);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          logger.error("Error sending push notification chunk:", error);
        }
      }

      logger.info(`Push notification sent successfully to ${pushToken}`);
      return { success: true, tickets };
    } catch (error) {
      logger.error("Error sending push notification:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send push notification to multiple devices
   * @param {Array} pushTokens - Array of Expo push tokens
   * @param {string} title - Notification title
   * @param {string} body - Notification body
   * @param {object} data - Additional data to send with notification
   */
  static async sendBulkPushNotifications(pushTokens, title, body, data = {}) {
    try {
      // Filter out invalid tokens
      const validTokens = pushTokens.filter((token) =>
        Expo.isExpoPushToken(token)
      );

      if (validTokens.length === 0) {
        logger.error("No valid push tokens provided");
        return { success: false, error: "No valid push tokens" };
      }

      // Construct messages
      const messages = validTokens.map((token) => ({
        to: token,
        sound: "default",
        title: title,
        body: body,
        data: data,
        priority: "high",
        channelId: "default",
      }));

      // Send notifications in chunks
      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];

      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          logger.error("Error sending push notification chunk:", error);
        }
      }

      logger.info(
        `Bulk push notifications sent successfully to ${validTokens.length} devices`
      );
      return { success: true, tickets, sentCount: validTokens.length };
    } catch (error) {
      logger.error("Error sending bulk push notifications:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send task assignment notification
   * @param {string} assigneeToken - Push token of the person assigned the task
   * @param {string} assignerName - Name of the person who assigned the task
   * @param {string} taskTitle - Title of the assigned task
   * @param {number} taskId - ID of the task
   */
  static async sendTaskAssignmentNotification(
    assigneeToken,
    assignerName,
    taskTitle,
    taskId
  ) {
    const title = "New Task Assigned";
    const body = `${assignerName} assigned you a new task: "${taskTitle}"`;
    const data = {
      type: "task_assigned",
      taskId: taskId,
      assignerName: assignerName,
      taskTitle: taskTitle,
    };

    return await this.sendPushNotification(assigneeToken, title, body, data);
  }

  /**
   * Send task status update notification
   * @param {string} assignerToken - Push token of the person who created the task
   * @param {string} assigneeName - Name of the person who updated the task
   * @param {string} taskTitle - Title of the task
   * @param {string} newStatus - New status of the task
   * @param {number} taskId - ID of the task
   */
  static async sendTaskStatusUpdateNotification(
    assignerToken,
    assigneeName,
    taskTitle,
    newStatus,
    taskId
  ) {
    const title = "Task Status Updated";
    const body = `${assigneeName} updated task "${taskTitle}" to ${newStatus}`;
    const data = {
      type: "task_status_updated",
      taskId: taskId,
      assigneeName: assigneeName,
      taskTitle: taskTitle,
      newStatus: newStatus,
    };

    return await this.sendPushNotification(assignerToken, title, body, data);
  }

  /**
   * Send task completion notification
   * @param {string} assignerToken - Push token of the person who created the task
   * @param {string} assigneeName - Name of the person who completed the task
   * @param {string} taskTitle - Title of the completed task
   * @param {number} taskId - ID of the task
   */
  static async sendTaskCompletionNotification(
    assignerToken,
    assigneeName,
    taskTitle,
    taskId
  ) {
    const title = "Task Completed";
    const body = `${assigneeName} completed the task: "${taskTitle}"`;
    const data = {
      type: "task_completed",
      taskId: taskId,
      assigneeName: assigneeName,
      taskTitle: taskTitle,
    };

    return await this.sendPushNotification(assignerToken, title, body, data);
  }

  /**
   * Send task rejection notification
   * @param {string} assignerToken - Push token of the person who created the task
   * @param {string} assigneeName - Name of the person who rejected the task
   * @param {string} taskTitle - Title of the rejected task
   * @param {number} taskId - ID of the task
   */
  static async sendTaskRejectionNotification(
    assignerToken,
    assigneeName,
    taskTitle,
    taskId
  ) {
    const title = "Task Rejected";
    const body = `${assigneeName} rejected the task: "${taskTitle}"`;
    const data = {
      type: "task_rejected",
      taskId: taskId,
      assigneeName: assigneeName,
      taskTitle: taskTitle,
    };

    return await this.sendPushNotification(assignerToken, title, body, data);
  }
}

module.exports = NotificationService;
