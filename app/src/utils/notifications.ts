import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';

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
    try {
        const projectId = Constants.expoConfig?.extra?.eas?.projectId;
        if (!projectId) {
            console.warn('No project ID found for push notifications');
            return null;
        }

        const { data } = await Notifications.getExpoPushTokenAsync({
            projectId,
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
    seconds: number = 5
): Promise<string | null> {
    try {
        const id = await Notifications.scheduleNotificationAsync({
            content: { title, body },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds },
        });
        return id;
    } catch (error) {
        console.error('Error scheduling notification:', error);
        return null;
    }
}
