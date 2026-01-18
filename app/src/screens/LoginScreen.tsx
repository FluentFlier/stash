import React, { useState } from 'react';
import {
    View,
    Text,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Lock, Chrome, AlertCircle } from 'lucide-react-native';
import { ButtonNew, InputNew, CardNew } from '../components/ui';
import type { RootStackParamList } from '../types';
import { login } from '../lib/api';
import { useAuthStore } from '../store/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const setAuth = useAuthStore((state) => state.setAuth);

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Please enter both email and password');
            return;
        }

        try {
            setError(null);
            setLoading(true);
            const result = await login(email, password);
            await setAuth(result.user, result.token);
            navigation.navigate('Main');
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = () => {
        // TODO: Implement Google Auth
        console.log('Google login');
    };

    return (
        <View className="flex-1 bg-neutral-950">
            {/* Gradient Background */}
            <View className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-primary-900/30 to-neutral-950" />
            
            <SafeAreaView className="flex-1">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <ScrollView
                            className="flex-1"
                            contentContainerClassName="flex-grow"
                            keyboardShouldPersistTaps="handled"
                        >
                            <View className="px-4 py-2">
                                <ButtonNew
                                    variant="ghost"
                                    size="sm"
                                    leftIcon={<ArrowLeft size={20} color="#fafafa" />}
                                    onPress={() => navigation.goBack()}
                                >
                                    Back
                                </ButtonNew>
                            </View>

                            <View className="flex-1 px-6 pt-8 pb-6">
                                <Text className="text-3xl font-bold text-neutral-50 mb-2">
                                    Welcome Back
                                </Text>
                                <Text className="text-base text-neutral-400 mb-8">
                                    Sign in to continue
                                </Text>

                                <CardNew variant="glass" className="mb-6">
                                    <CardNew.Content>
                                        <View className="gap-4">
                                            <InputNew
                                                label="Email"
                                                placeholder="your@email.com"
                                                value={email}
                                                onChangeText={setEmail}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                leftIcon={<Mail size={20} color="#a3a3a3" />}
                                            />
                                            <InputNew
                                                label="Password"
                                                placeholder="••••••••"
                                                value={password}
                                                onChangeText={setPassword}
                                                secureTextEntry
                                                leftIcon={<Lock size={20} color="#a3a3a3" />}
                                            />

                                            {error && (
                                                <View className="flex-row items-center gap-2 bg-error/10 p-3 rounded-md border border-error/20">
                                                    <AlertCircle size={16} color="#ef4444" />
                                                    <Text className="text-sm text-error">
                                                        {error}
                                                    </Text>
                                                </View>
                                            )}

                                            <ButtonNew
                                                size="lg"
                                                loading={loading}
                                                onPress={handleLogin}
                                            >
                                                Sign In
                                            </ButtonNew>

                                            <View className="flex-row items-center gap-4">
                                                <View className="flex-1 h-px bg-neutral-700" />
                                                <Text className="text-sm text-neutral-400">OR</Text>
                                                <View className="flex-1 h-px bg-neutral-700" />
                                            </View>

                                            <ButtonNew
                                                variant="outline"
                                                size="lg"
                                                leftIcon={<Chrome size={20} color="#fafafa" />}
                                                onPress={handleGoogleLogin}
                                            >
                                                Continue with Google
                                            </ButtonNew>
                                        </View>
                                    </CardNew.Content>
                                </CardNew>

                                <ButtonNew
                                    variant="ghost"
                                    onPress={() => navigation.navigate('SignUp')}
                                >
                                    Don't have an account? Sign Up
                                </ButtonNew>
                            </View>
                        </ScrollView>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};
