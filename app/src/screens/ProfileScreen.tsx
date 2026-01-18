import React, { useState } from 'react';
import { View, Text, ScrollView, Switch, Modal, Alert, Pressable } from 'react-native';
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
} from 'lucide-react-native';
import { AvatarNew, CardNew, ButtonNew, InputNew } from '../components/ui';
import type { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ProfileScreen: React.FC = () => {
    const navigation = useNavigation<NavigationProp>();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editField, setEditField] = useState<'name' | 'role' | 'age' | null>(null);
    const [name, setName] = useState('John Smith');
    const [role, setRole] = useState('Developer');
    const [age, setAge] = useState('25');

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Sign Out',
                    style: 'destructive',
                    onPress: () => {
                        // Navigate to Landing screen
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
        setEditModalVisible(true);
    };

    const handleSave = () => {
        setEditModalVisible(false);
        // TODO: Save to backend
    };

    return (
        <View className="flex-1 bg-neutral-950">
            {/* Gradient Background */}
            <View className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-primary-900/20 to-neutral-950" />
            
            <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
                <ScrollView className="flex-1" contentContainerClassName="p-6 gap-4">
                    {/* Profile Header */}
                    <CardNew variant="glass">
                        <CardNew.Content>
                            <View className="flex-row items-center gap-4">
                                <AvatarNew size="lg" fallback="JS" />
                                <View className="flex-1 gap-1">
                                    <Text className="text-2xl font-bold text-neutral-50">
                                        {name}
                                    </Text>
                                    <Text className="text-base text-neutral-400">
                                        john@example.com
                                    </Text>
                                </View>
                                <Pressable
                                    onPress={() => handleEdit('name')}
                                    className="w-10 h-10 items-center justify-center"
                                >
                                    <Edit2 size={20} color="#7c6ff0" />
                                </Pressable>
                            </View>
                        </CardNew.Content>
                    </CardNew>

                    {/* Stats Cards */}
                    <View className="flex-row gap-3">
                        <CardNew variant="elevated" className="flex-1">
                            <CardNew.Content>
                                <View className="items-center gap-2">
                                    <Package size={24} color="#7c6ff0" />
                                    <Text className="text-2xl font-bold text-neutral-50">
                                        127
                                    </Text>
                                    <Text className="text-xs text-neutral-400 text-center">
                                        Items Saved
                                    </Text>
                                </View>
                            </CardNew.Content>
                        </CardNew>

                        <CardNew variant="elevated" className="flex-1">
                            <CardNew.Content>
                                <View className="items-center gap-2">
                                    <MessageCircle size={24} color="#22d3ee" />
                                    <Text className="text-2xl font-bold text-neutral-50">
                                        43
                                    </Text>
                                    <Text className="text-xs text-neutral-400 text-center">
                                        Conversations
                                    </Text>
                                </View>
                            </CardNew.Content>
                        </CardNew>

                        <CardNew variant="elevated" className="flex-1">
                            <CardNew.Content>
                                <View className="items-center gap-2">
                                    <TrendingUp size={24} color="#10b981" />
                                    <Text className="text-2xl font-bold text-neutral-50">
                                        +24%
                                    </Text>
                                    <Text className="text-xs text-neutral-400 text-center">
                                        This Week
                                    </Text>
                                </View>
                            </CardNew.Content>
                        </CardNew>
                    </View>

                    {/* Personal Information */}
                    <CardNew variant="glass">
                        <CardNew.Content>
                            <Text className="text-sm font-semibold text-neutral-50 mb-3">
                                Personal Information
                            </Text>

                            <Pressable
                                onPress={() => handleEdit('name')}
                                className="flex-row items-center py-3 gap-3 border-b border-neutral-800"
                            >
                                <User size={20} color="#a3a3a3" />
                                <View className="flex-1 gap-1">
                                    <Text className="text-base font-medium text-neutral-50">
                                        Name
                                    </Text>
                                    <Text className="text-base text-neutral-400">
                                        {name}
                                    </Text>
                                </View>
                                <ChevronRight size={20} color="#a3a3a3" />
                            </Pressable>

                            <Pressable
                                onPress={() => handleEdit('role')}
                                className="flex-row items-center py-3 gap-3 border-b border-neutral-800"
                            >
                                <Settings size={20} color="#a3a3a3" />
                                <View className="flex-1 gap-1">
                                    <Text className="text-base font-medium text-neutral-50">
                                        Role
                                    </Text>
                                    <Text className="text-base text-neutral-400">
                                        {role}
                                    </Text>
                                </View>
                                <ChevronRight size={20} color="#a3a3a3" />
                            </Pressable>

                            <Pressable
                                onPress={() => handleEdit('age')}
                                className="flex-row items-center py-3 gap-3"
                            >
                                <User size={20} color="#a3a3a3" />
                                <View className="flex-1 gap-1">
                                    <Text className="text-base font-medium text-neutral-50">
                                        Age
                                    </Text>
                                    <Text className="text-base text-neutral-400">
                                        {age}
                                    </Text>
                                </View>
                                <ChevronRight size={20} color="#a3a3a3" />
                            </Pressable>
                        </CardNew.Content>
                    </CardNew>

                    {/* Integrations */}
                    <CardNew variant="glass">
                        <CardNew.Content>
                            <Text className="text-sm font-semibold text-neutral-50 mb-3">
                                Integrations
                            </Text>
                            <View className="flex-row items-center py-3 gap-3">
                                <Calendar size={20} color="#7c6ff0" />
                                <View className="flex-1 gap-1">
                                    <Text className="text-base font-medium text-neutral-50">
                                        Google Calendar
                                    </Text>
                                    <Text className="text-sm font-semibold text-success">
                                        Connected
                                    </Text>
                                </View>
                                <ButtonNew variant="outline" size="sm">
                                    Manage
                                </ButtonNew>
                            </View>
                        </CardNew.Content>
                    </CardNew>

                    {/* Settings */}
                    <CardNew variant="glass">
                        <CardNew.Content>
                            <Text className="text-sm font-semibold text-neutral-50 mb-3">
                                Settings
                            </Text>
                            <View className="flex-row items-center py-3 gap-3">
                                <Bell size={20} color="#a3a3a3" />
                                <View className="flex-1 gap-1">
                                    <Text className="text-base font-medium text-neutral-50">
                                        Push Notifications
                                    </Text>
                                    <Text className="text-sm text-neutral-400">
                                        Get reminders and updates
                                    </Text>
                                </View>
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={setNotificationsEnabled}
                                    trackColor={{
                                        false: '#404040',
                                        true: '#6d4ee3',
                                    }}
                                    thumbColor="#ffffff"
                                />
                            </View>
                        </CardNew.Content>
                    </CardNew>

                    {/* Sign Out Button */}
                    <ButtonNew
                        variant="destructive"
                        size="lg"
                        leftIcon={<LogOut size={20} color="#ffffff" />}
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
                    <View className="flex-1 bg-black/80 justify-center items-center p-6">
                        <View className="bg-neutral-800 rounded-2xl p-6 w-full max-w-[400px] gap-4">
                            <Text className="text-2xl font-bold text-neutral-50">
                                Edit {editField ? editField.charAt(0).toUpperCase() + editField.slice(1) : ''}
                            </Text>
                            {editField === 'name' && (
                                <InputNew
                                    label="Name"
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Enter your name"
                                />
                            )}
                            {editField === 'role' && (
                                <InputNew
                                    label="Role"
                                    value={role}
                                    onChangeText={setRole}
                                    placeholder="Enter your role"
                                />
                            )}
                            {editField === 'age' && (
                                <InputNew
                                    label="Age"
                                    value={age}
                                    onChangeText={setAge}
                                    placeholder="Enter your age"
                                    keyboardType="number-pad"
                                />
                            )}
                            <View className="flex-row gap-3">
                                <ButtonNew
                                    variant="outline"
                                    onPress={() => setEditModalVisible(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </ButtonNew>
                                <ButtonNew
                                    variant="primary"
                                    onPress={handleSave}
                                    className="flex-1"
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
