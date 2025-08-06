import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export class NotificationService {
  
  /**
   * Initialize notification service
   */
  static async initialize(): Promise<void> {
    try {
      // Request permissions
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
        return;
      }

      console.log('Notification permissions granted');

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('dharmasaathi-notifications', {
          name: 'DharmaSaathi Notifications',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#e91e63',
          sound: 'default',
        });
      }

      // Get push token for future use
      const pushToken = await this.getPushToken();
      if (pushToken) {
        console.log('Push token obtained:', pushToken);
        // TODO: Send this token to your backend server
      }

    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  /**
   * Get push notification token
   */
  static async getPushToken(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-expo-project-id', // Replace with your actual project ID
      });
      return token.data;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  /**
   * Schedule a local notification
   */
  static async scheduleLocalNotification(
    title: string, 
    body: string, 
    data: any = {},
    triggerSeconds: number = 1
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
          sound: 'default',
          badge: 1,
        },
        trigger: { seconds: triggerSeconds } as Notifications.TimeIntervalTriggerInput,
      });
      
      console.log('Local notification scheduled');
    } catch (error) {
      console.error('Failed to schedule notification:', error);
    }
  }

  /**
   * Handle notification received while app is in foreground
   */
  static setupNotificationHandlers(): void {
    // Handle notification received while app is running
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // You can show in-app notification here
    });

    // Handle notification tap
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response);
      
      const data = response.notification.request.content.data;
      
      // Handle different notification types
      if (data.type === 'message') {
        // Navigate to messages
        console.log('Navigate to messages');
      } else if (data.type === 'match') {
        // Navigate to matches
        console.log('Navigate to matches');
      } else if (data.type === 'profile_view') {
        // Navigate to profile views
        console.log('Navigate to profile views');
      }
    });
  }

  /**
   * Clear all notifications
   */
  static async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
      console.log('All notifications cleared');
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }

  /**
   * Set badge count
   */
  static async setBadgeCount(count: number): Promise<void> {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Failed to set badge count:', error);
    }
  }

  /**
   * Cancel all scheduled notifications
   */
  static async cancelAllScheduledNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('All scheduled notifications cancelled');
    } catch (error) {
      console.error('Failed to cancel scheduled notifications:', error);
    }
  }
}
