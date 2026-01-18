import React from 'react';
import { View, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, Zap, Brain, Shield } from 'lucide-react-native';
import { ButtonNew } from '../components/ui';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

// Unified color constants - softer dark theme
const colors = {
    bg: '#121218',           // soft dark slate
    bgSecondary: '#1c1c24',  // elevated surface
    primary: '#6366f1',
    primaryMuted: 'rgba(99, 102, 241, 0.15)',
    text: '#f4f4f5',
    textMuted: '#a1a1aa',
    textSubtle: '#71717a',
    border: '#2d2d38',
    success: '#22c55e',
    accent: '#3b82f6',
};

export const LandingScreen: React.FC<Props> = ({ navigation }) => {
    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={{ flex: 1, justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 32 }}>
                    {/* Hero Section */}
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        {/* Logo */}
                        <View style={{
                            width: 80,
                            height: 80,
                            backgroundColor: colors.primary,
                            borderRadius: 20,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 24,
                        }}>
                            <Sparkles size={40} color="#ffffff" strokeWidth={2} />
                        </View>

                        <Text style={{
                            fontSize: 42,
                            fontWeight: '700',
                            color: colors.text,
                            marginBottom: 8,
                            textAlign: 'center',
                        }}>
                            Stash
                        </Text>
                        <Text style={{
                            fontSize: 17,
                            color: colors.textMuted,
                            marginBottom: 40,
                            textAlign: 'center',
                        }}>
                            Your AI Memory Assistant
                        </Text>

                        {/* Feature Pills */}
                        <View style={{ gap: 12, width: '100%' }}>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 12,
                                backgroundColor: colors.bgSecondary,
                                paddingHorizontal: 16,
                                paddingVertical: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: colors.border,
                            }}>
                                <View style={{
                                    width: 32,
                                    height: 32,
                                    backgroundColor: colors.primaryMuted,
                                    borderRadius: 8,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Brain size={16} color={colors.primary} />
                                </View>
                                <Text style={{ fontSize: 14, color: colors.textMuted }}>
                                    AI-Powered Context Extraction
                                </Text>
                            </View>

                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 12,
                                backgroundColor: colors.bgSecondary,
                                paddingHorizontal: 16,
                                paddingVertical: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: colors.border,
                            }}>
                                <View style={{
                                    width: 32,
                                    height: 32,
                                    backgroundColor: 'rgba(59, 130, 246, 0.15)',
                                    borderRadius: 8,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Zap size={16} color={colors.accent} />
                                </View>
                                <Text style={{ fontSize: 14, color: colors.textMuted }}>
                                    Instant Capture from Any App
                                </Text>
                            </View>

                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 12,
                                backgroundColor: colors.bgSecondary,
                                paddingHorizontal: 16,
                                paddingVertical: 12,
                                borderRadius: 12,
                                borderWidth: 1,
                                borderColor: colors.border,
                            }}>
                                <View style={{
                                    width: 32,
                                    height: 32,
                                    backgroundColor: 'rgba(34, 197, 94, 0.15)',
                                    borderRadius: 8,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Shield size={16} color={colors.success} />
                                </View>
                                <Text style={{ fontSize: 14, color: colors.textMuted }}>
                                    Private & Secure Storage
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* CTA Section */}
                    <View style={{ gap: 12 }}>
                        <ButtonNew
                            size="lg"
                            variant="primary"
                            onPress={() => navigation.navigate('SignUp')}
                        >
                            Get Started Free
                        </ButtonNew>
                        <ButtonNew
                            variant="outline"
                            size="lg"
                            onPress={() => navigation.navigate('Login')}
                        >
                            Sign In
                        </ButtonNew>

                        <Text style={{
                            fontSize: 12,
                            color: colors.textSubtle,
                            textAlign: 'center',
                            marginTop: 8,
                        }}>
                            Capture anything. Remember everything. Chat with your memory.
                        </Text>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};
