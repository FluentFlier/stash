import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../utils/api';
import { NavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../types';

const POLL_INTERVAL = 15000; // 15 seconds

export const useNotificationSystem = (navigationRef: any) => {
    const lastNotificationResponse = Notifications.useLastNotificationResponse();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // 1. Setup Polling
    useEffect(() => {
        const checkNotifications = async () => {
            try {
                // Get last seen timestamp
                const lastSeen = await AsyncStorage.getItem('last_notification_time');

                // Fetch latest
                const response = await api.getNotifications();

                if (response.success && response.data?.data) {
                    const insights = response.data.data;
                    if (insights.length === 0) return;

                    // Most recent first usually
                    const newestTime = insights[0].createdAt;

                    // Filter for NEW items (created > lastSeen) AND not read
                    // If no lastSeen, maybe don't flood? Or just newest? 
                    // Let's assume on first run we only show if really new (e.g. within last minute) or just mark as seen.
                    // For now: Notify all unread if > lastSeen.

                    const newItems = insights.filter(item => {
                        const isNew = !lastSeen || new Date(item.createdAt) > new Date(lastSeen);
                        const isUnread = !item.isRead;
                        return isNew && isUnread;
                    });

                    // Schedule
                    for (const item of newItems) {
                        await Notifications.scheduleNotificationAsync({
                            content: {
                                title: item.title,
                                body: item.content,
                                data: {
                                    captureId: item.metadata?.data?.captureId,
                                    action: item.metadata?.action
                                }
                            },
                            trigger: null, // Immediate
                        });
                    }

                    // Update last seen if we found newer stuff
                    if (newItems.length > 0) {
                        await AsyncStorage.setItem('last_notification_time', newestTime);
                    } else if (!lastSeen) {
                        // First run, set benchmark so we don't notify old stuff next time
                        await AsyncStorage.setItem('last_notification_time', newestTime);
                    }
                }
            } catch (e) {
                console.error("Notification Poll Error:", e);
            }
        };

        // Start polling
        checkNotifications();
        intervalRef.current = setInterval(checkNotifications, POLL_INTERVAL);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, []);

    // 2. Handle Tap Response
    useEffect(() => {
        if (
            lastNotificationResponse &&
            lastNotificationResponse.notification.request.content.data?.captureId &&
            lastNotificationResponse.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER
        ) {
            const { captureId } = lastNotificationResponse.notification.request.content.data;
            // Navigate
            if (navigationRef.current && navigationRef.current.isReady()) {
                // Navigate to Chat with Capture
                navigationRef.current.navigate('Main', {
                    screen: 'Chat',
                    params: { captureId }
                } as any);
            }
        }
    }, [lastNotificationResponse, navigationRef]);
};
