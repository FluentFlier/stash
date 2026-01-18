import React, { useState } from 'react';
import {
    View,
    Text,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableWithoutFeedback,
    Keyboard,
    TextInput,
    Pressable,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Lock, Chrome, AlertCircle } from 'lucide-react-native';
import { ButtonNew } from '../components/ui';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

// Unified color constants - softer dark theme
const colors = {
    bg: '#121218',           // soft dark slate
    bgSecondary: '#1c1c24',  // elevated surface
    bgTertiary: '#252530',   // input backgrounds
    primary: '#6366f1',
    text: '#f4f4f5',
    textMuted: '#a1a1aa',
    textSubtle: '#71717a',
    border: '#3a3a48',
    error: '#ef4444',
    errorBg: 'rgba(239, 68, 68, 0.1)',
};

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
        console.log('Google login');
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <ScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={{ flexGrow: 1 }}
                            keyboardShouldPersistTaps="handled"
                        >
                            {/* Back Button */}
                            <Pressable
                                onPress={() => navigation.goBack()}
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    paddingHorizontal: 16,
                                    paddingVertical: 12,
                                    gap: 6,
                                }}
                            >
                                <ArrowLeft size={20} color={colors.text} />
                                <Text style={{ color: colors.text, fontSize: 14 }}>Back</Text>
                            </Pressable>

                            <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 }}>
                                <Text style={{
                                    fontSize: 28,
                                    fontWeight: '700',
                                    color: colors.text,
                                    marginBottom: 8,
                                }}>
                                    Welcome Back
                                </Text>
                                <Text style={{
                                    fontSize: 15,
                                    color: colors.textMuted,
                                    marginBottom: 32,
                                }}>
                                    Sign in to continue
                                </Text>

                                {/* Form Card */}
                                <View style={{
                                    backgroundColor: colors.bgSecondary,
                                    borderRadius: 12,
                                    padding: 20,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    gap: 16,
                                }}>
                                    {/* Email Input */}
                                    <View style={{ gap: 6 }}>
                                        <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: '500' }}>
                                            Email
                                        </Text>
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            backgroundColor: colors.bgTertiary,
                                            borderRadius: 8,
                                            borderWidth: 1,
                                            borderColor: colors.border,
                                            paddingHorizontal: 12,
                                        }}>
                                            <Mail size={18} color={colors.textSubtle} />
                                            <TextInput
                                                style={{
                                                    flex: 1,
                                                    paddingVertical: 12,
                                                    paddingHorizontal: 10,
                                                    fontSize: 15,
                                                    color: colors.text,
                                                }}
                                                placeholder="your@email.com"
                                                placeholderTextColor={colors.textSubtle}
                                                value={email}
                                                onChangeText={setEmail}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                            />
                                        </View>
                                    </View>

                                    {/* Password Input */}
                                    <View style={{ gap: 6 }}>
                                        <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: '500' }}>
                                            Password
                                        </Text>
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            backgroundColor: colors.bgTertiary,
                                            borderRadius: 8,
                                            borderWidth: 1,
                                            borderColor: colors.border,
                                            paddingHorizontal: 12,
                                        }}>
                                            <Lock size={18} color={colors.textSubtle} />
                                            <TextInput
                                                style={{
                                                    flex: 1,
                                                    paddingVertical: 12,
                                                    paddingHorizontal: 10,
                                                    fontSize: 15,
                                                    color: colors.text,
                                                }}
                                                placeholder="••••••••"
                                                placeholderTextColor={colors.textSubtle}
                                                value={password}
                                                onChangeText={setPassword}
                                                secureTextEntry
                                            />
                                        </View>
                                    </View>

                                    {/* Error Message */}
                                    {error && (
                                        <View style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            gap: 8,
                                            backgroundColor: colors.errorBg,
                                            padding: 12,
                                            borderRadius: 8,
                                        }}>
                                            <AlertCircle size={16} color={colors.error} />
                                            <Text style={{ fontSize: 13, color: colors.error }}>
                                                {error}
                                            </Text>
                                        </View>
                                    )}

                                    {/* Sign In Button */}
                                    <ButtonNew
                                        size="lg"
                                        loading={loading}
                                        onPress={handleLogin}
                                    >
                                        Sign In
                                    </ButtonNew>

                                    {/* Divider */}
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                                        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                                        <Text style={{ fontSize: 12, color: colors.textSubtle }}>OR</Text>
                                        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
                                    </View>

                                    {/* Google Button */}
                                    <ButtonNew
                                        variant="outline"
                                        size="lg"
                                        leftIcon={<Chrome size={18} color={colors.text} />}
                                        onPress={handleGoogleLogin}
                                    >
                                        Continue with Google
                                    </ButtonNew>
                                </View>

                                {/* Sign Up Link */}
                                <Pressable
                                    onPress={() => navigation.navigate('SignUp')}
                                    style={{ marginTop: 24, alignItems: 'center' }}
                                >
                                    <Text style={{ fontSize: 14, color: colors.textMuted }}>
                                        Don't have an account?{' '}
                                        <Text style={{ color: colors.primary, fontWeight: '500' }}>Sign Up</Text>
                                    </Text>
                                </Pressable>
                            </View>
                        </ScrollView>
                    </TouchableWithoutFeedback>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};
