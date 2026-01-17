import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Mail, Lock } from 'lucide-react-native';
import { Button, Input, Card } from '../components/ui';
import { theme } from '../theme';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        setLoading(true);
        // TODO: Implement Supabase auth
        setTimeout(() => {
            setLoading(false);
            navigation.navigate('Onboarding');
        }, 1000);
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[
                    theme.colors.dark.background,
                    theme.colors.accent[900],
                    theme.colors.dark.background,
                ]}
                locations={[0, 0.3, 1]}
                style={styles.gradient}
            />
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={styles.header}>
                            <Button
                                variant="ghost"
                                size="sm"
                                leftIcon={<ArrowLeft size={20} color={theme.colors.text.primary} />}
                                onPress={() => navigation.goBack()}
                            >
                                Back
                            </Button>
                        </View>

                        <View style={styles.content}>
                            <Text style={styles.title}>Create Account</Text>
                            <Text style={styles.subtitle}>Join Stash today</Text>

                            <Card variant="glass" style={styles.formCard}>
                                <Card.Content>
                                    <View style={styles.form}>
                                        <Input
                                            label="Email"
                                            placeholder="your@email.com"
                                            value={email}
                                            onChangeText={setEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            leftIcon={<Mail size={20} color={theme.colors.text.tertiary} />}
                                        />
                                        <Input
                                            label="Password"
                                            placeholder="••••••••"
                                            value={password}
                                            onChangeText={setPassword}
                                            secureTextEntry
                                            leftIcon={<Lock size={20} color={theme.colors.text.tertiary} />}
                                        />
                                        <Input
                                            label="Confirm Password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChangeText={setConfirmPassword}
                                            secureTextEntry
                                            leftIcon={<Lock size={20} color={theme.colors.text.tertiary} />}
                                        />

                                        <Button
                                            size="lg"
                                            loading={loading}
                                            onPress={handleSignUp}
                                        >
                                            Create Account
                                        </Button>
                                    </View>
                                </Card.Content>
                            </Card>

                            <Button
                                variant="ghost"
                                onPress={() => navigation.navigate('Login')}
                            >
                                Already have an account? Sign In
                            </Button>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
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
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    header: {
        paddingHorizontal: theme.spacing[4],
        paddingVertical: theme.spacing[2],
    },
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing[6],
        paddingTop: theme.spacing[8],
        paddingBottom: theme.spacing[6],
    },
    title: {
        ...theme.typography.styles.h2,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing[2],
    },
    subtitle: {
        ...theme.typography.styles.body,
        color: theme.colors.text.secondary,
        marginBottom: theme.spacing[8],
    },
    formCard: {
        marginBottom: theme.spacing[6],
    },
    form: {
        gap: theme.spacing[4],
    },
});
