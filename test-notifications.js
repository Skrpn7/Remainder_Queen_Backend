const NotificationService = require("./services/notificationService");

// Test script for push notifications
async function testPushNotifications() {
  console.log("🧪 Testing Push Notification Service...\n");

  // Test 1: Send a simple push notification
  console.log("Test 1: Sending simple push notification");
  const testToken = "ExponentPushToken[n78jBGAJLFXVFHS_xTPIks]";
  // Replace with actual token

  try {
    const result = await NotificationService.sendPushNotification(
      testToken,
      "Test Notification",
      "This is a test notification from Remainder Queen!",
      { type: "test", timestamp: new Date().toISOString() }
    );

    console.log("✅ Simple notification result:", result);
  } catch (error) {
    console.log("❌ Simple notification error:", error.message);
  }

  // Test 2: Send task assignment notification
  console.log("\nTest 2: Sending task assignment notification");
  try {
    const result = await NotificationService.sendTaskAssignmentNotification(
      testToken,
      "John Doe",
      "Complete project documentation",
      123
    );

    console.log("✅ Task assignment notification result:", result);
  } catch (error) {
    console.log("❌ Task assignment notification error:", error.message);
  }

  // Test 3: Send task completion notification
  console.log("\nTest 3: Sending task completion notification");
  try {
    const result = await NotificationService.sendTaskCompletionNotification(
      testToken,
      "Jane Smith",
      "Review code changes",
      124
    );

    console.log("✅ Task completion notification result:", result);
  } catch (error) {
    console.log("❌ Task completion notification error:", error.message);
  }

  console.log("\n🎉 Push notification tests completed!");
  console.log(
    "\n📝 Note: Replace the test token with an actual Expo push token to test with a real device."
  );
}

// Run tests if this file is executed directly
if (require.main === module) {
  testPushNotifications().catch(console.error);
}

module.exports = { testPushNotifications };
