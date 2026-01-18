import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Mail, Lock, Chrome, AlertCircle } from 'lucide-react-native';
import { Button, Input, Card } from '../components/ui';
import { theme } from '../theme';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        setError(null);
        setLoading(true);
        // TODO: Implement Supabase auth
        setTimeout(() => {
            setLoading(false);
            if (email.includes('error')) {
                setError('Invalid email or password');
            } else {
                navigation.navigate('Main');
            }
        }, 1500);
    };

    const handleGoogleLogin = () => {
        // TODO: Implement Google Auth
        console.log('Google login');
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[
                    theme.colors.dark.background,
                    theme.colors.primary[900],
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
                            <Text style={styles.title}>Welcome Back</Text>
                            <Text style={styles.subtitle}>Sign in to continue</Text>

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

                                        {error && (
                                            <View style={styles.errorContainer}>
                                                <AlertCircle size={16} color={theme.colors.error[500]} />
                                                <Text style={styles.errorText}>{error}</Text>
                                            </View>
                                        )}

                                        <Button
                                            size="lg"
                                            loading={loading}
                                            onPress={handleLogin}
                                        >
                                            Sign In
                                        </Button>

                                        <View style={styles.divider}>
                                            <View style={styles.dividerLine} />
                                            <Text style={styles.dividerText}>OR</Text>
                                            <View style={styles.dividerLine} />
                                        </View>

                                        <Button
                                            variant="outline"
                                            size="lg"
                                            leftIcon={<Chrome size={20} color={theme.colors.text.primary} />}
                                            onPress={handleGoogleLogin}
                                        >
                                            Continue with Google
                                        </Button>
                                    </View>
                                </Card.Content>
                            </Card>

                            <Button
                                variant="ghost"
                                onPress={() => navigation.navigate('SignUp')}
                            >
                                Don't have an account? Sign Up
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
    errorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[2],
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        padding: theme.spacing[3],
        borderRadius: theme.radius.md,
        borderWidth: 1,
        borderColor: 'rgba(244, 63, 94, 0.2)',
    },
    errorText: {
        ...theme.typography.styles.caption,
        color: theme.colors.error[500],
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[4],
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: theme.colors.borderLight,
    },
    dividerText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.tertiary,
    },
});
