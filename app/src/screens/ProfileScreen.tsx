import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Modal, Alert, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
import { Avatar, Card, Button, Input } from '../components/ui';
import { theme } from '../theme';

export const ProfileScreen: React.FC = () => {
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
                    onPress: () => console.log('Signed out'),
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
        <View style={styles.container}>
            <LinearGradient
                colors={[
                    theme.colors.dark.background,
                    theme.colors.primary[900],
                    theme.colors.dark.background,
                ]}
                locations={[0, 0.2, 1]}
                style={styles.gradient}
            />
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.content}>
                    {/* Profile Header */}
                    <Card variant="glass">
                        <Card.Content>
                            <View style={styles.header}>
                                <Avatar size="lg" fallback="JS" />
                                <View style={styles.headerInfo}>
                                    <Text style={styles.name}>{name}</Text>
                                    <Text style={styles.email}>john@example.com</Text>
                                </View>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onPress={() => handleEdit('name')}
                                >
                                    <Edit2 size={20} color={theme.colors.primary[400]} />
                                </Button>
                            </View>
                        </Card.Content>
                    </Card>

                    {/* Stats Cards */}
                    <View style={styles.statsGrid}>
                        <Card variant="elevated" style={styles.statCard}>
                            <Card.Content>
                                <View style={styles.statContent}>
                                    <Package size={24} color={theme.colors.primary[400]} />
                                    <Text style={styles.statValue}>127</Text>
                                    <Text style={styles.statLabel}>Items Saved</Text>
                                </View>
                            </Card.Content>
                        </Card>

                        <Card variant="elevated" style={styles.statCard}>
                            <Card.Content>
                                <View style={styles.statContent}>
                                    <MessageCircle size={24} color={theme.colors.accent[400]} />
                                    <Text style={styles.statValue}>43</Text>
                                    <Text style={styles.statLabel}>Conversations</Text>
                                </View>
                            </Card.Content>
                        </Card>

                        <Card variant="elevated" style={styles.statCard}>
                            <Card.Content>
                                <View style={styles.statContent}>
                                    <TrendingUp size={24} color={theme.colors.success[400]} />
                                    <Text style={styles.statValue}>+24%</Text>
                                    <Text style={styles.statLabel}>This Week</Text>
                                </View>
                            </Card.Content>
                        </Card>
                    </View>

                    {/* Personal Information */}
                    <Card variant="glass">
                        <Card.Content>
                            <Text style={styles.sectionTitle}>Personal Information</Text>

                            <Pressable style={styles.infoRow} onPress={() => handleEdit('name')}>
                                <User size={20} color={theme.colors.text.tertiary} />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Name</Text>
                                    <Text style={styles.infoValue}>{name}</Text>
                                </View>
                                <ChevronRight size={20} color={theme.colors.text.tertiary} />
                            </Pressable>

                            <Pressable style={styles.infoRow} onPress={() => handleEdit('role')}>
                                <Settings size={20} color={theme.colors.text.tertiary} />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Role</Text>
                                    <Text style={styles.infoValue}>{role}</Text>
                                </View>
                                <ChevronRight size={20} color={theme.colors.text.tertiary} />
                            </Pressable>

                            <Pressable style={styles.infoRow} onPress={() => handleEdit('age')}>
                                <User size={20} color={theme.colors.text.tertiary} />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Age</Text>
                                    <Text style={styles.infoValue}>{age}</Text>
                                </View>
                                <ChevronRight size={20} color={theme.colors.text.tertiary} />
                            </Pressable>
                        </Card.Content>
                    </Card>

                    {/* Integrations */}
                    <Card variant="glass">
                        <Card.Content>
                            <Text style={styles.sectionTitle}>Integrations</Text>
                            <View style={styles.infoRow}>
                                <Calendar size={20} color={theme.colors.primary[400]} />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Google Calendar</Text>
                                    <Text style={styles.connectedText}>Connected</Text>
                                </View>
                                <Button variant="outline" size="sm">
                                    Manage
                                </Button>
                            </View>
                        </Card.Content>
                    </Card>

                    {/* Settings */}
                    <Card variant="glass">
                        <Card.Content>
                            <Text style={styles.sectionTitle}>Settings</Text>
                            <View style={styles.infoRow}>
                                <Bell size={20} color={theme.colors.text.tertiary} />
                                <View style={styles.infoContent}>
                                    <Text style={styles.infoLabel}>Push Notifications</Text>
                                    <Text style={styles.infoSubtext}>Get reminders and updates</Text>
                                </View>
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={setNotificationsEnabled}
                                    trackColor={{
                                        false: theme.colors.gray[700],
                                        true: theme.colors.primary[600],
                                    }}
                                    thumbColor={theme.colors.text.inverse}
                                />
                            </View>
                        </Card.Content>
                    </Card>

                    {/* Sign Out Button */}
                    <Button
                        variant="destructive"
                        size="lg"
                        leftIcon={<LogOut size={20} color={theme.colors.text.inverse} />}
                        onPress={handleSignOut}
                    >
                        Sign Out
                    </Button>
                </ScrollView>

                {/* Edit Modal */}
                <Modal
                    visible={editModalVisible}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setEditModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <Text style={styles.modalTitle}>
                                Edit {editField ? editField.charAt(0).toUpperCase() + editField.slice(1) : ''}
                            </Text>
                            {editField === 'name' && (
                                <Input
                                    label="Name"
                                    value={name}
                                    onChangeText={setName}
                                    placeholder="Enter your name"
                                />
                            )}
                            {editField === 'role' && (
                                <Input
                                    label="Role"
                                    value={role}
                                    onChangeText={setRole}
                                    placeholder="Enter your role"
                                />
                            )}
                            {editField === 'age' && (
                                <Input
                                    label="Age"
                                    value={age}
                                    onChangeText={setAge}
                                    placeholder="Enter your age"
                                    keyboardType="number-pad"
                                />
                            )}
                            <View style={styles.modalButtons}>
                                <Button
                                    variant="outline"
                                    onPress={() => setEditModalVisible(false)}
                                    style={{ flex: 1 }}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="primary"
                                    onPress={handleSave}
                                    style={{ flex: 1 }}
                                >
                                    Save
                                </Button>
                            </View>
                        </View>
                    </View>
                </Modal>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        padding: theme.spacing[6],
        gap: theme.spacing[4],
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[4],
    },
    headerInfo: {
        flex: 1,
        gap: theme.spacing[1],
    },
    name: {
        ...theme.typography.styles.h3,
        color: theme.colors.text.primary,
    },
    email: {
        ...theme.typography.styles.body,
        color: theme.colors.text.secondary,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: theme.spacing[3],
    },
    statCard: {
        flex: 1,
    },
    statContent: {
        alignItems: 'center',
        gap: theme.spacing[2],
    },
    statValue: {
        ...theme.typography.styles.h3,
        color: theme.colors.text.primary,
    },
    statLabel: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.tertiary,
        textAlign: 'center',
    },
    sectionTitle: {
        ...theme.typography.styles.labelLarge,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing[3],
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing[3],
        gap: theme.spacing[3],
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.borderLight,
    },
    infoContent: {
        flex: 1,
        gap: theme.spacing[1],
    },
    infoLabel: {
        ...theme.typography.styles.bodyMedium,
        color: theme.colors.text.primary,
    },
    infoValue: {
        ...theme.typography.styles.body,
        color: theme.colors.text.secondary,
    },
    infoSubtext: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.tertiary,
    },
    connectedText: {
        ...theme.typography.styles.caption,
        color: theme.colors.success[400],
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: theme.colors.overlay,
        justifyContent: 'center',
        alignItems: 'center',
        padding: theme.spacing[6],
    },
    modalContent: {
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: theme.radius['2xl'],
        padding: theme.spacing[6],
        width: '100%',
        maxWidth: 400,
        gap: theme.spacing[4],
    },
    modalTitle: {
        ...theme.typography.styles.h3,
        color: theme.colors.text.primary,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: theme.spacing[3],
    },
});
