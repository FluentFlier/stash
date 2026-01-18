import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, TextInput, Pressable, Alert } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Lock, User as UserIcon, AlertCircle } from 'lucide-react-native';
import { ButtonNew } from '../components/ui';
import { theme } from '../theme';
import { api } from '../utils/api';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        if (!name || !email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setError(null);
        setLoading(true);

        try {
            const response = await api.register(email, password, name);

            if (response.success) {
                navigation.navigate('Onboarding');
            } else {
                setError(response.error || 'Registration failed');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1, backgroundColor: theme.bg }}>
                <SafeAreaView style={{ flex: 1 }}>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                            <Pressable onPress={() => navigation.goBack()} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 6 }}>
                                <ArrowLeft size={20} color={theme.text} />
                                <Text style={{ color: theme.text, fontSize: 14 }}>Back</Text>
                            </Pressable>
                            <View style={{ flex: 1, paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 }}>
                                <Text style={{ fontSize: 28, fontWeight: '700', color: theme.text, marginBottom: 8 }}>Create Account</Text>
                                <Text style={{ fontSize: 15, color: theme.textMuted, marginBottom: 32 }}>Join Stash today</Text>
                                <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: theme.border, gap: 16 }}>
                                    {/* Name Input */}
                                    <View style={{ gap: 6 }}>
                                        <Text style={{ fontSize: 13, color: theme.textMuted, fontWeight: '500' }}>Full Name</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.bgTertiary, borderRadius: 8, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12 }}>
                                            <UserIcon size={18} color={theme.textSubtle} />
                                            <TextInput style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, color: theme.text }} placeholder="John Doe" placeholderTextColor={theme.textSubtle} value={name} onChangeText={setName} autoCapitalize="words" />
                                        </View>
                                    </View>

                                    {/* Email Input */}
                                    <View style={{ gap: 6 }}>
                                        <Text style={{ fontSize: 13, color: theme.textMuted, fontWeight: '500' }}>Email</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.bgTertiary, borderRadius: 8, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12 }}>
                                            <Mail size={18} color={theme.textSubtle} />
                                            <TextInput style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, color: theme.text }} placeholder="your@email.com" placeholderTextColor={theme.textSubtle} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
                                        </View>
                                    </View>
                                    <View style={{ gap: 6 }}>
                                        <Text style={{ fontSize: 13, color: theme.textMuted, fontWeight: '500' }}>Password</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.bgTertiary, borderRadius: 8, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12 }}>
                                            <Lock size={18} color={theme.textSubtle} />
                                            <TextInput style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, color: theme.text }} placeholder="••••••••" placeholderTextColor={theme.textSubtle} value={password} onChangeText={setPassword} secureTextEntry />
                                        </View>
                                    </View>
                                    <View style={{ gap: 6 }}>
                                        <Text style={{ fontSize: 13, color: theme.textMuted, fontWeight: '500' }}>Confirm Password</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.bgTertiary, borderRadius: 8, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12 }}>
                                            <Lock size={18} color={theme.textSubtle} />
                                            <TextInput style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, color: theme.text }} placeholder="••••••••" placeholderTextColor={theme.textSubtle} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
                                        </View>
                                    </View>

                                    {/* Error Message */}
                                    {error && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: theme.errorMuted, padding: 12, borderRadius: 8 }}>
                                            <AlertCircle size={16} color={theme.error} />
                                            <Text style={{ fontSize: 13, color: theme.error }}>{error}</Text>
                                        </View>
                                    )}

                                    <ButtonNew size="lg" loading={loading} onPress={handleSignUp}>Create Account</ButtonNew>
                                </View>
                                <Pressable onPress={() => navigation.navigate('Login')} style={{ marginTop: 24, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 14, color: theme.textMuted }}>Already have an account? <Text style={{ color: theme.primary, fontWeight: '500' }}>Sign In</Text></Text>
                                </Pressable>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </View>
        </TouchableWithoutFeedback>
    );
};