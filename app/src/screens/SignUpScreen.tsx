import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Mail, Lock, AlertCircle } from 'lucide-react-native';
import { ButtonNew, InputNew, CardNew } from '../components/ui';
import type { RootStackParamList } from '../types';
import { register } from '../lib/api';
import { useAuthStore } from '../store/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const setAuth = useAuthStore((state) => state.setAuth);

    const handleSignUp = async () => {
        if (!email || !password) {
            setError('Please enter email and password');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            setError(null);
            setLoading(true);
            const result = await register(email, password);
            await setAuth(result.user, result.token);
            navigation.navigate('Onboarding');
        } catch (err: any) {
            setError(err.message || 'Sign up failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 bg-neutral-950">
                {/* Gradient Background */}
                <View className="absolute inset-0">
                    <LinearGradient
                        colors={['#0a0a0a', '#2e1065', '#0a0a0a']}
                        locations={[0, 0.3, 1]}
                        style={{ flex: 1 }}
                    />
                </View>
                
                <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        className="flex-1"
                        keyboardVerticalOffset={0}
                    >
                        <ScrollView
                            className="flex-1"
                            contentContainerClassName="flex-grow"
                            keyboardShouldPersistTaps="handled"
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Header */}
                            <View className="px-4 py-2">
                                <ButtonNew
                                    variant="ghost"
                                    size="sm"
                                    leftIcon={<ArrowLeft size={20} color="#f5f5f5" />}
                                    onPress={() => navigation.goBack()}
                                >
                                    Back
                                </ButtonNew>
                            </View>

                            {/* Content */}
                            <View className="flex-1 px-6 pt-8 pb-6 gap-6">
                                <View className="gap-2">
                                    <Text className="text-4xl font-bold text-neutral-50">
                                        Create Account
                                    </Text>
                                    <Text className="text-lg text-neutral-400">
                                        Join Stash today
                                    </Text>
                                </View>

                                <CardNew variant="glass">
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
                                            <InputNew
                                                label="Confirm Password"
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChangeText={setConfirmPassword}
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
                                                onPress={handleSignUp}
                                            >
                                                Create Account
                                            </ButtonNew>
                                        </View>
                                    </CardNew.Content>
                                </CardNew>

                                <ButtonNew
                                    variant="ghost"
                                    onPress={() => navigation.navigate('Login')}
                                >
                                    Already have an account? Sign In
                                </ButtonNew>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </View>
        </TouchableWithoutFeedback>
    );
};
