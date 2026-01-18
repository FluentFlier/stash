import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, TextInput, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, Lock } from 'lucide-react-native';
import { ButtonNew } from '../components/ui';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'SignUp'>;

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
};

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSignUp = async () => {
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            navigation.navigate('Onboarding');
        }, 1000);
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={{ flex: 1, backgroundColor: colors.bg }}>
                <SafeAreaView style={{ flex: 1 }}>
                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={{ flex: 1 }}
                    >
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
                                    Create Account
                                </Text>
                                <Text style={{
                                    fontSize: 15,
                                    color: colors.textMuted,
                                    marginBottom: 32,
                                }}>
                                    Join Stash today
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
                                    {/* Email */}
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

                                    {/* Password */}
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

                                    {/* Confirm Password */}
                                    <View style={{ gap: 6 }}>
                                        <Text style={{ fontSize: 13, color: colors.textMuted, fontWeight: '500' }}>
                                            Confirm Password
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
                                                value={confirmPassword}
                                                onChangeText={setConfirmPassword}
                                                secureTextEntry
                                            />
                                        </View>
                                    </View>

                                    <ButtonNew
                                        size="lg"
                                        loading={loading}
                                        onPress={handleSignUp}
                                    >
                                        Create Account
                                    </ButtonNew>
                                </View>

                                {/* Sign In Link */}
                                <Pressable
                                    onPress={() => navigation.navigate('Login')}
                                    style={{ marginTop: 24, alignItems: 'center' }}
                                >
                                    <Text style={{ fontSize: 14, color: colors.textMuted }}>
                                        Already have an account?{' '}
                                        <Text style={{ color: colors.primary, fontWeight: '500' }}>Sign In</Text>
                                    </Text>
                                </Pressable>
                            </View>
                        </ScrollView>
                    </KeyboardAvoidingView>
                </SafeAreaView>
            </View>
        </TouchableWithoutFeedback>
    );
};