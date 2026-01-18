import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform, Alert } from 'react-native';

// Configure how notifications are handled when app is foregrounded
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

/**
 * Request permission for push notifications
 * Returns true if permission was granted, false otherwise
 */
export async function requestNotificationPermissions(): Promise<boolean> {
    // On simulator/emulator, we can't get push tokens
    if (!Device.isDevice) {
        Alert.alert(
            'Simulator Detected',
            'Push notifications require a physical device to work properly.',
            [{ text: 'OK' }]
        );
        return false;
    }

    try {
        // First check current permissions
        const { status: existingStatus } = await Notifications.getPermissionsAsync();

        if (existingStatus === 'granted') {
            return true;
        }

        // Request permission if not already granted
        const { status } = await Notifications.requestPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert(
                'Notifications Disabled',
                'You can enable notifications later in Settings to receive reminders for your saved content.',
                [{ text: 'OK' }]
            );
            return false;
        }

        // Set up Android notification channel
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#06b6d4', // cyan primary
            });
        }

        return true;
    } catch (error) {
        console.error('Error requesting notification permissions:', error);
        return false;
    }
}

/**
 * Get push token for remote notifications
 */
export async function getPushToken(): Promise<string | null> {
    if (!Device.isDevice) {
        return null;
    }

    try {
        const { data } = await Notifications.getExpoPushTokenAsync({
            projectId: 'your-project-id', // Replace with your Expo project ID
        });
        return data;
    } catch (error) {
        console.error('Error getting push token:', error);
        return null;
    }
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput = { seconds: 5 }
): Promise<string | null> {
    try {
        const id = await Notifications.scheduleNotificationAsync({
            content: { title, body },
            trigger,
        });
        return id;
    } catch (error) {
        console.error('Error scheduling notification:', error);
        return null;
    }
}
