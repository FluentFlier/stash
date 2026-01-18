import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { api } from '../utils/api';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    TrendingUp,
    Calendar,
    Zap,
    Clock,
    Target,
    Flame,
    Brain,
    ChevronRight,
    Sparkles,
    Bell,
    Link as LinkIcon,
    FileText,
    Tag,
    ArrowUpRight,
    RefreshCw,
    AlertCircle,
} from 'lucide-react-native';
import { theme } from '../theme';
import type { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Mocks removed - using real stats


export const DashboardScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    const [weeklyProgress, setWeeklyProgress] = useState(
        Array(7).fill({ day: 'Day', value: 0 }).map((_, i) => ({ day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i], value: 0 }))
    );

    useFocusEffect(
        React.useCallback(() => {
            const loadStats = async () => {
                setLoading(true);
                try {
                    const response = await api.getDashboardStats();
                    if (response.success && response.data) {
                        setStats(response.data);
                        // Future: Backend should provide weeklyProgress
                    }
                } catch (e) {
                    console.error("Dashboard Fetch Error", e);
                } finally {
                    setLoading(false);
                }
            };
            loadStats();
        }, [])
    );

    const maxValue = Math.max(...weeklyProgress.map(d => d.value)) || 1;

    const todayStats = stats?.todayStats || {
        itemsSaved: 0,
        aiQueries: 0,
        eventsDetected: 0,
        timeSpent: '0m'
    };

    const upcomingActions = (stats?.upcomingReminders || []).map((r: any) => ({
        id: r.id,
        title: r.message,
        time: new Date(r.scheduledAt).toLocaleString(),
        type: 'reminder',
        source: 'AI reminder'
    }));

    const recentTopics = stats?.recentCaptures?.map((c: any) => ({
        id: c.id,
        name: c.title || c.type,
        count: 1,
        trend: '+1'
    })) || [];

    const aiDigest = stats?.aiDigest || null;
    const pendingApprovals: any[] = [];


    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                {/* Header */}
                <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View>
                            <Text style={{ fontSize: 24, fontWeight: '700', color: theme.text }}>
                                Good evening
                            </Text>
                            <Text style={{ fontSize: 14, color: theme.textMuted, marginTop: 4 }}>
                                Friday, Jan 17
                            </Text>
                        </View>
                        <Pressable
                            style={{
                                width: 40,
                                height: 40,
                                backgroundColor: theme.bgSecondary,
                                borderRadius: 10,
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderWidth: 1,
                                borderColor: theme.borderLight,
                            }}
                            onPress={() => navigation.navigate('Notifications' as any)} // Cast until types updated
                        >
                            <Bell size={20} color={theme.textMuted} />
                            {/* Unread indicator (mock for now, should come from context) */}
                            <View style={{
                                position: 'absolute', top: 10, right: 10,
                                width: 8, height: 8, borderRadius: 4,
                                backgroundColor: theme.primary,
                                borderWidth: 1, borderColor: theme.bgSecondary
                            }} />
                        </Pressable>
                    </View>
                </View>

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 16 }}
                >
                    {/* AI Digest Card */}
                    {aiDigest && (
                        <View style={{
                            backgroundColor: theme.primary,
                            borderRadius: 14,
                            padding: 16,
                            gap: 12,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                <View style={{
                                    width: 36,
                                    height: 36,
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    borderRadius: 10,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Sparkles size={18} color={theme.white} />
                                </View>
                                <Text style={{ fontSize: 16, fontWeight: '600', color: theme.white }}>
                                    AI Daily Digest
                                </Text>
                            </View>
                            <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.9)', lineHeight: 20 }}>
                                {aiDigest.summary}
                            </Text>
                            {aiDigest.highlights && aiDigest.highlights.length > 0 && (
                                <View style={{ gap: 6 }}>
                                    {aiDigest.highlights.map((item: string, i: number) => (
                                        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                            <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.white }} />
                                            <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{item}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </View>
                    )}

                    {/* Pending Approvals */}
                    {pendingApprovals.length > 0 && (
                        <View style={{
                            backgroundColor: theme.warningMuted,
                            borderWidth: 1,
                            borderColor: theme.warning,
                            borderRadius: 12,
                            padding: 14,
                            gap: 10,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <AlertCircle size={16} color={theme.warning} />
                                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.text }}>
                                    Needs Your Approval
                                </Text>
                            </View>
                            {pendingApprovals.map((item) => (
                                <View key={item.id} style={{
                                    backgroundColor: theme.bgSecondary,
                                    borderRadius: 10,
                                    padding: 12,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 10,
                                }}>
                                    <View style={{
                                        width: 36,
                                        height: 36,
                                        backgroundColor: theme.primaryMuted,
                                        borderRadius: 8,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <item.icon size={16} color={theme.primary} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 12, color: theme.textMuted }}>{item.action}</Text>
                                        <Text style={{ fontSize: 13, color: theme.text, fontWeight: '500' }}>{item.title}</Text>
                                    </View>
                                    <Pressable style={{
                                        backgroundColor: theme.primary,
                                        paddingHorizontal: 12,
                                        paddingVertical: 6,
                                        borderRadius: 6,
                                    }}>
                                        <Text style={{ fontSize: 12, color: theme.white, fontWeight: '500' }}>Approve</Text>
                                    </Pressable>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Stats Grid */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                        {[
                            { label: 'Saved Today', value: todayStats.itemsSaved, icon: Target, color: theme.primary },
                            { label: 'AI Queries', value: todayStats.aiQueries, icon: Brain, color: theme.accent },
                            { label: 'Events Found', value: todayStats.eventsDetected, icon: Calendar, color: theme.success },
                            { label: 'Time Saved', value: todayStats.timeSpent, icon: Clock, color: theme.warning },
                        ].map((stat, i) => (
                            <View key={i} style={{
                                width: '47%',
                                backgroundColor: theme.bgSecondary,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: theme.borderLight,
                                padding: 14,
                            }}>
                                <View style={{
                                    width: 32,
                                    height: 32,
                                    backgroundColor: `${stat.color}20`,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 8,
                                }}>
                                    <stat.icon size={16} color={stat.color} />
                                </View>
                                <Text style={{ fontSize: 22, fontWeight: '700', color: theme.text }}>
                                    {stat.value}
                                </Text>
                                <Text style={{ fontSize: 11, color: theme.textMuted, marginTop: 2 }}>
                                    {stat.label}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Topics You're Following */}
                    <View style={{
                        backgroundColor: theme.bgSecondary,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: theme.borderLight,
                        padding: 16,
                    }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Tag size={16} color={theme.primary} />
                                <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>
                                    Trending Topics
                                </Text>
                            </View>
                        </View>
                        <View style={{ gap: 10 }}>
                            {recentTopics.map((topic: any) => (
                                <View key={topic.id} style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                        <View style={{
                                            backgroundColor: theme.bgTertiary,
                                            paddingHorizontal: 10,
                                            paddingVertical: 5,
                                            borderRadius: 6,
                                        }}>
                                            <Text style={{ fontSize: 13, color: theme.text }}>{topic.name}</Text>
                                        </View>
                                    </View>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                        <Text style={{ fontSize: 13, color: theme.textMuted }}>{topic.count} items</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <ArrowUpRight size={12} color={theme.success} />
                                            <Text style={{ fontSize: 11, color: theme.success }}>{topic.trend}</Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Weekly Activity */}
                    <View style={{
                        backgroundColor: theme.bgSecondary,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: theme.borderLight,
                        padding: 16,
                    }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                            <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>
                                Weekly Activity
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <TrendingUp size={14} color={theme.success} />
                                <Text style={{ fontSize: 12, color: theme.success, fontWeight: '500' }}>+24%</Text>
                            </View>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 80 }}>
                            {weeklyProgress.map((day, i) => (
                                <View key={i} style={{ alignItems: 'center', gap: 6 }}>
                                    <View style={{
                                        width: 28,
                                        height: (day.value / maxValue) * 60 + 10,
                                        backgroundColor: i === 6 ? theme.primary : theme.bgTertiary,
                                        borderRadius: 6,
                                    }} />
                                    <Text style={{ fontSize: 10, color: theme.textSubtle }}>
                                        {day.day}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Upcoming Actions */}
                    <View style={{
                        backgroundColor: theme.bgSecondary,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: theme.borderLight,
                        padding: 16,
                    }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <Bell size={16} color={theme.warning} />
                                <Text style={{ fontSize: 15, fontWeight: '600', color: theme.text }}>
                                    Upcoming
                                </Text>
                            </View>
                            <Pressable>
                                <Text style={{ fontSize: 12, color: theme.primary }}>View all</Text>
                            </Pressable>
                        </View>
                        <View style={{ gap: 10 }}>
                            {upcomingActions.map((action: any) => (
                                <Pressable key={action.id} style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: theme.bgTertiary,
                                    borderRadius: 10,
                                    padding: 12,
                                    gap: 12,
                                }}>
                                    <View style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: 4,
                                        backgroundColor: action.type === 'deadline' ? theme.error :
                                            action.type === 'event' ? theme.primary : theme.success,
                                    }} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 14, color: theme.text, fontWeight: '500' }}>
                                            {action.title}
                                        </Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                            <Text style={{ fontSize: 12, color: theme.textSubtle }}>
                                                {action.time}
                                            </Text>
                                            <Text style={{ fontSize: 10, color: theme.textMuted }}>•</Text>
                                            <Text style={{ fontSize: 11, color: theme.primary }}>
                                                {action.source}
                                            </Text>
                                        </View>
                                    </View>
                                    <ChevronRight size={16} color={theme.textSubtle} />
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};
