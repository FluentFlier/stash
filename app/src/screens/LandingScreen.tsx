import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, Brain, Shield } from 'lucide-react-native';
import { ButtonNew } from '../components/ui';
import { theme } from '../theme';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

export const LandingScreen: React.FC<Props> = ({ navigation }) => {
    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: 'center' }}>
                    {/* Hero Icon */}
                    <View style={{ alignItems: 'center', marginBottom: 32 }}>
                        <View style={{
                            width: 80,
                            height: 80,
                            backgroundColor: theme.primary,
                            borderRadius: 20,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 24,
                        }}>
                            <Brain size={40} color="#ffffff" strokeWidth={1.5} />
                        </View>
                        <Text style={{
                            fontSize: 42,
                            fontWeight: '700',
                            color: theme.text,
                            marginBottom: 8,
                            textAlign: 'center'
                        }}>
                            Stash
                        </Text>
                        <Text style={{
                            fontSize: 17,
                            color: theme.textMuted,
                            textAlign: 'center'
                        }}>
                            Your AI Memory Assistant
                        </Text>
                    </View>

                    {/* Feature Pills */}
                    <View style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        gap: 10,
                        marginBottom: 48
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: theme.primaryMuted,
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 20,
                            gap: 6,
                        }}>
                            <Sparkles size={14} color={theme.primary} />
                            <Text style={{ fontSize: 13, color: theme.primary, fontWeight: '500' }}>
                                AI-powered
                            </Text>
                        </View>
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            backgroundColor: theme.successMuted,
                            paddingHorizontal: 14,
                            paddingVertical: 8,
                            borderRadius: 20,
                            gap: 6,
                        }}>
                            <Shield size={14} color={theme.success} />
                            <Text style={{ fontSize: 13, color: theme.success, fontWeight: '500' }}>
                                Private & Secure
                            </Text>
                        </View>
                    </View>

                    {/* CTA Buttons */}
                    <View style={{ gap: 12 }}>
                        <ButtonNew
                            size="lg"
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
                    </View>
                </View>

                {/* Footer */}
                <View style={{ paddingHorizontal: 24, paddingBottom: 24 }}>
                    <Text style={{
                        fontSize: 12,
                        color: theme.textSubtle,
                        textAlign: 'center'
                    }}>
                        By continuing, you agree to our Terms of Service
                    </Text>
                </View>
            </SafeAreaView>
        </View>
    );
};
