import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Switch, Modal, Alert, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    Edit2,
    Calendar,
    Bell,
    LogOut,
    User,
    TrendingUp,
    Package,
    MessageCircle,
    Settings,
    ChevronRight,
    X,
} from 'lucide-react-native';
import { ButtonNew } from '../components/ui';
import { theme } from '../theme';
import { api, authStorage } from '../utils/api';
import type { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface UserProfile {
    id: string;
    email: string;
    name: string | null;
    role: string | null;
    age: number | null;
    notifications_enabled: boolean;
    google_calendar_connected: boolean;
}

export const ProfileScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editField, setEditField] = useState<'name' | 'role' | 'age' | null>(null);
    const [editValue, setEditValue] = useState('');

    // Load profile on mount
    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const response = await api.getMe();
            if (response.success && response.data) {
                setProfile(response.data);
                setNotificationsEnabled(response.data.notifications_enabled || false);
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: async () => {
                        await api.logout();
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'Landing' }],
                        });
                    },
                },
            ]
        );
    };

    const handleEdit = (field: 'name' | 'role' | 'age') => {
        setEditField(field);
        if (profile) {
            if (field === 'name') setEditValue(profile.name || '');
            else if (field === 'role') setEditValue(profile.role || '');
            else if (field === 'age') setEditValue(profile.age?.toString() || '');
        }
        setEditModalVisible(true);
    };

    const handleSave = async () => {
        if (!editField) return;

        setSaving(true);
        try {
            const updateData: any = {};
            if (editField === 'name') updateData.name = editValue;
            if (editField === 'role') updateData.role = editValue;
            if (editField === 'age') updateData.age = parseInt(editValue) || null;

            const response = await api.updateOnboarding(updateData);

            if (response.success) {
                // Update local state
                setProfile(prev => prev ? { ...prev, ...updateData } : prev);
                setEditModalVisible(false);
            } else {
                Alert.alert('Error', response.error || 'Failed to save');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const handleNotificationToggle = async (value: boolean) => {
        setNotificationsEnabled(value);
        try {
            await api.updateOnboarding({ notificationsEnabled: value });
            setProfile(prev => prev ? { ...prev, notifications_enabled: value } : prev);
        } catch (error) {
            // Revert on failure
            setNotificationsEnabled(!value);
        }
    };

    const getInitials = (name: string | null, email: string) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        return email.slice(0, 2).toUpperCase();
    };

    if (loading) {
        return (
            <View style={{ flex: 1, backgroundColor: theme.bg, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 16, gap: 16 }}
                >
                    {/* Profile Header */}
                    <View style={{
                        backgroundColor: theme.bgSecondary,
                        borderRadius: 12,
                        borderWidth: 1,
                        borderColor: theme.borderLight,
                        padding: 16,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 14,
                    }}>
                        <View style={{
                            width: 56,
                            height: 56,
                            backgroundColor: theme.primary,
                            borderRadius: 14,
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <Text style={{ fontSize: 20, fontWeight: '600', color: theme.white }}>
                                {getInitials(profile?.name || null, profile?.email || '')}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text }}>
                                {profile?.name || 'User'}
                            </Text>
                            <Text style={{ fontSize: 14, color: theme.textMuted, marginTop: 2 }}>
                                {profile?.email || ''}
                            </Text>
                        </View>
                        <Pressable onPress={() => handleEdit('name')}>
                            <Edit2 size={18} color={theme.primary} />
                        </Pressable>
                    </View>

                    {/* Stats Cards */}
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={{
                            flex: 1,
                            backgroundColor: theme.bgSecondary,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: theme.borderLight,
                            padding: 14,
                            alignItems: 'center',
                            gap: 6,
                        }}>
                            <Package size={20} color={theme.primary} />
                            <Text style={{ fontSize: 22, fontWeight: '700', color: theme.text }}>
                                --
                            </Text>
                            <Text style={{ fontSize: 11, color: theme.textSubtle }}>
                                Items
                            </Text>
                        </View>

                        <View style={{
                            flex: 1,
                            backgroundColor: theme.bgSecondary,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: theme.borderLight,
                            padding: 14,
                            alignItems: 'center',
                            gap: 6,
                        }}>
                            <MessageCircle size={20} color={theme.accent} />
                            <Text style={{ fontSize: 22, fontWeight: '700', color: theme.text }}>
                                --
                            </Text>
                            <Text style={{ fontSize: 11, color: theme.textSubtle }}>
                                Chats
                            </Text>
                        </View>

                        <View style={{
                            flex: 1,
                            backgroundColor: theme.bgSecondary,
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: theme.borderLight,
                            padding: 14,
                            alignItems: 'center',
                            gap: 6,
                        }}>
                            <TrendingUp size={20} color={theme.success} />
                            <Text style={{ fontSize: 22, fontWeight: '700', color: theme.text }}>
                                --
                            </Text>
                            <Text style={{ fontSize: 11, color: theme.textSubtle }}>
                                Growth
                            </Text>
                        </View>
                    </View>

                    {/* Personal Information */}
                    <View style={{
                        backgroundColor: theme.bgSecondary,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: theme.borderLight,
                        padding: 14,
                    }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 12 }}>
                            Personal Information
                        </Text>

                        <Pressable
                            onPress={() => handleEdit('name')}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 12,
                                gap: 12,
                                borderBottomWidth: 1,
                                borderBottomColor: theme.borderLight,
                            }}
                        >
                            <User size={18} color={theme.textSubtle} />
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 13, color: theme.textSubtle }}>Name</Text>
                                <Text style={{ fontSize: 14, color: theme.text, marginTop: 2 }}>{profile?.name || 'Not set'}</Text>
                            </View>
                            <ChevronRight size={16} color={theme.textSubtle} />
                        </Pressable>

                        <Pressable
                            onPress={() => handleEdit('role')}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 12,
                                gap: 12,
                                borderBottomWidth: 1,
                                borderBottomColor: theme.borderLight,
                            }}
                        >
                            <Settings size={18} color={theme.textSubtle} />
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 13, color: theme.textSubtle }}>Role</Text>
                                <Text style={{ fontSize: 14, color: theme.text, marginTop: 2 }}>{profile?.role || 'Not set'}</Text>
                            </View>
                            <ChevronRight size={16} color={theme.textSubtle} />
                        </Pressable>

                        <Pressable
                            onPress={() => handleEdit('age')}
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                paddingVertical: 12,
                                gap: 12,
                            }}
                        >
                            <User size={18} color={theme.textSubtle} />
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 13, color: theme.textSubtle }}>Age</Text>
                                <Text style={{ fontSize: 14, color: theme.text, marginTop: 2 }}>{profile?.age || 'Not set'}</Text>
                            </View>
                            <ChevronRight size={16} color={theme.textSubtle} />
                        </Pressable>
                    </View>

                    {/* Integrations */}
                    <View style={{
                        backgroundColor: theme.bgSecondary,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: theme.borderLight,
                        padding: 14,
                    }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 12 }}>
                            Integrations
                        </Text>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 12,
                        }}>
                            <Calendar size={18} color={theme.primary} />
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, color: theme.text }}>Google Calendar</Text>
                                <Text style={{ fontSize: 12, fontWeight: '500', color: profile?.google_calendar_connected ? theme.success : theme.textSubtle }}>
                                    {profile?.google_calendar_connected ? 'Connected' : 'Not connected'}
                                </Text>
                            </View>
                            <ButtonNew variant="outline" size="sm">
                                {profile?.google_calendar_connected ? 'Manage' : 'Connect'}
                            </ButtonNew>
                        </View>
                    </View>

                    {/* Settings */}
                    <View style={{
                        backgroundColor: theme.bgSecondary,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: theme.borderLight,
                        padding: 14,
                    }}>
                        <Text style={{ fontSize: 13, fontWeight: '600', color: theme.text, marginBottom: 12 }}>
                            Settings
                        </Text>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 12,
                        }}>
                            <Bell size={18} color={theme.textSubtle} />
                            <View style={{ flex: 1 }}>
                                <Text style={{ fontSize: 14, color: theme.text }}>Push Notifications</Text>
                                <Text style={{ fontSize: 12, color: theme.textSubtle }}>Get reminders and updates</Text>
                            </View>
                            <Switch
                                value={notificationsEnabled}
                                onValueChange={handleNotificationToggle}
                                trackColor={{
                                    false: theme.bgTertiary,
                                    true: theme.primary,
                                }}
                                thumbColor={theme.white}
                            />
                        </View>
                    </View>

                    {/* Sign Out Button */}
                    <ButtonNew
                        variant="destructive"
                        size="lg"
                        leftIcon={<LogOut size={16} color={theme.white} />}
                        onPress={handleSignOut}
                    >
                        Sign Out
                    </ButtonNew>
                </ScrollView>

                {/* Edit Modal */}
                <Modal
                    visible={editModalVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setEditModalVisible(false)}
                >
                    <View style={{
                        flex: 1,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: 24,
                    }}>
                        <View style={{
                            backgroundColor: theme.bgSecondary,
                            borderRadius: 12,
                            padding: 20,
                            width: '100%',
                            maxWidth: 360,
                            gap: 16,
                        }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text style={{ fontSize: 18, fontWeight: '600', color: theme.text }}>
                                    Edit {editField ? editField.charAt(0).toUpperCase() + editField.slice(1) : ''}
                                </Text>
                                <Pressable onPress={() => setEditModalVisible(false)}>
                                    <X size={20} color={theme.textSubtle} />
                                </Pressable>
                            </View>

                            <TextInput
                                style={{
                                    backgroundColor: theme.bgTertiary,
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    borderColor: theme.border,
                                    paddingHorizontal: 14,
                                    paddingVertical: 12,
                                    fontSize: 14,
                                    color: theme.text,
                                }}
                                placeholder={`Enter your ${editField}`}
                                placeholderTextColor={theme.textSubtle}
                                value={editValue}
                                onChangeText={setEditValue}
                                keyboardType={editField === 'age' ? 'number-pad' : 'default'}
                                autoFocus
                            />

                            <View style={{ flexDirection: 'row', gap: 10 }}>
                                <ButtonNew
                                    variant="outline"
                                    onPress={() => setEditModalVisible(false)}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </ButtonNew>
                                <ButtonNew
                                    variant="primary"
                                    onPress={handleSave}
                                    loading={saving}
                                    style={{ flex: 1 }}
                                >
                                    Save
                                </ButtonNew>
                            </View>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
};
