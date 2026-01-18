import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

// Mock data for demo
const todayStats = {
    itemsSaved: 8,
    aiQueries: 12,
    eventsDetected: 3,
    timeSpent: '45m',
};

const weeklyProgress = [
    { day: 'Mon', value: 5 },
    { day: 'Tue', value: 8 },
    { day: 'Wed', value: 3 },
    { day: 'Thu', value: 12 },
    { day: 'Fri', value: 7 },
    { day: 'Sat', value: 4 },
    { day: 'Sun', value: 8 },
];

const upcomingActions = [
    { id: '1', title: 'Team meeting', time: 'Today, 3:00 PM', type: 'event', source: 'Detected from email' },
    { id: '2', title: 'Review saved articles', time: 'Tomorrow, 9:00 AM', type: 'reminder', source: 'AI suggestion' },
    { id: '3', title: 'Project deadline', time: 'Fri, Jan 24', type: 'deadline', source: 'From calendar' },
];

const recentTopics = [
    { id: '1', name: 'React Native', count: 12, trend: '+3' },
    { id: '2', name: 'AI/ML', count: 8, trend: '+5' },
    { id: '3', name: 'Product Design', count: 6, trend: '+1' },
];

const pendingApprovals = [
    { id: '1', action: 'Create calendar event', title: '"Team standup" on Jan 20, 10am', icon: Calendar },
    { id: '2', action: 'Set reminder', title: 'Follow up on article in 1 week', icon: Bell },
];

const aiDigest = {
    summary: "This week you've focused heavily on React Native development and AI integration. 3 deadlines detected from your saved content.",
    highlights: [
        'Saved 40% more links than last week',
        'Most active between 2-4 PM',
        '3 potential follow-ups identified',
    ],
};

export const DashboardScreen: React.FC = () => {
    const maxValue = Math.max(...weeklyProgress.map(d => d.value));

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
                        <Pressable style={{
                            width: 40,
                            height: 40,
                            backgroundColor: theme.bgSecondary,
                            borderRadius: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderWidth: 1,
                            borderColor: theme.borderLight,
                        }}>
                            <RefreshCw size={18} color={theme.textMuted} />
                        </Pressable>
                    </View>
                </View>

                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 16 }}
                >
                    {/* AI Digest Card */}
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
                        <View style={{ gap: 6 }}>
                            {aiDigest.highlights.map((item, i) => (
                                <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: theme.white }} />
                                    <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)' }}>{item}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

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
                            {recentTopics.map((topic) => (
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
                            {upcomingActions.map((action) => (
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
