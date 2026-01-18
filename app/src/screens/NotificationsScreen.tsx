import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Bell, Check, ChevronLeft } from 'lucide-react-native';
import { theme } from '../theme';
import { api } from '../utils/api';
import type { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const NotificationsScreen = () => {
    const navigation = useNavigation<NavigationProp>();
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadNotifications = async () => {
        try {
            const response = await api.getNotifications();
            if (response.success && response.data) {
                setNotifications(response.data || []);
            }
        } catch (error) {
            console.error('Failed to load notifications:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadNotifications();
        }, [])
    );

    const handleMarkRead = async (id: string, index: number) => {
        // Optimistic update
        const updated = [...notifications];
        updated[index].isRead = true;
        setNotifications(updated);

        await api.markNotificationRead(id);
    };

    const handleMarkAllRead = async () => {
        const updated = notifications.map(n => ({ ...n, isRead: true }));
        setNotifications(updated);
        await api.markAllNotificationsRead();
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => (
        <Pressable
            style={{
                backgroundColor: item.isRead ? theme.bg : theme.bgSecondary,
                padding: 16,
                borderBottomWidth: 1,
                borderBottomColor: theme.borderLight,
                flexDirection: 'row',
                gap: 12
            }}
            onPress={() => item.metadata?.action === 'OPEN_CAPTURE' && item.metadata.data?.captureId
                ? navigation.navigate('Main', { screen: 'Chat', params: { captureId: item.metadata.data.captureId } } as any)
                : null
            }
        >
            <View style={{
                width: 40, height: 40,
                borderRadius: 20,
                backgroundColor: theme.primaryMuted,
                alignItems: 'center', justifyContent: 'center'
            }}>
                <Bell size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: item.isRead ? '400' : '600', color: theme.text }}>
                    {item.title}
                </Text>
                <Text style={{ fontSize: 14, color: theme.textSubtle, marginTop: 4 }}>
                    {item.content}
                </Text>
                <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 8 }}>
                    {new Date(item.createdAt).toLocaleDateString()} • {new Date(item.createdAt).toLocaleTimeString()}
                </Text>
            </View>
            {!item.isRead && (
                <Pressable onPress={() => handleMarkRead(item.id, index)} style={{ padding: 4 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: theme.primary }} />
                </Pressable>
            )}
        </Pressable>
    );

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top']}>
                {/* Header */}
                <View style={{
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                    padding: 16, borderBottomWidth: 1, borderBottomColor: theme.borderLight
                }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <Pressable onPress={() => navigation.goBack()}>
                            <ChevronLeft size={24} color={theme.text} />
                        </Pressable>
                        <Text style={{ fontSize: 20, fontWeight: '600', color: theme.text }}>Notifications</Text>
                    </View>
                    <Pressable onPress={handleMarkAllRead}>
                        <Text style={{ color: theme.primary, fontWeight: '500' }}>Mark all read</Text>
                    </Pressable>
                </View>

                {loading ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={notifications}
                        renderItem={renderItem}
                        keyExtractor={item => item.id}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadNotifications(); }} tintColor={theme.primary} />
                        }
                        ListEmptyComponent={
                            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 }}>
                                <Bell size={48} color={theme.textMuted} />
                                <Text style={{ marginTop: 16, color: theme.textSubtle }}>No notifications yet</Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
};
