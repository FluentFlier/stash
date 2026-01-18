import React from 'react';
import { View, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles, Zap, Brain, Shield } from 'lucide-react-native';
import { ButtonNew } from '../components/ui';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

export const LandingScreen: React.FC<Props> = ({ navigation }) => {
    return (
        <View className="flex-1 bg-neutral-950">
            {/* Gradient Background */}
            <View className="absolute inset-0">
                <View className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-primary-900/30 to-neutral-950" />
            </View>
            
            <SafeAreaView className="flex-1">
                <View className="flex-1 justify-between px-6 py-8">
                    {/* Hero Section */}
                    <View className="flex-1 justify-center items-center">
                        {/* Logo with glow effect */}
                        <View className="mb-8 relative">
                            <View className="absolute inset-0 bg-primary-500/30 rounded-full blur-2xl" />
                            <View className="w-24 h-24 bg-gradient-to-br from-primary-600 to-accent-500 rounded-3xl items-center justify-center shadow-2xl">
                                <Sparkles
                                    size={48}
                                    color="#ffffff"
                                    strokeWidth={2}
                                />
                            </View>
                        </View>

                        <Text className="text-5xl font-extrabold text-neutral-50 mb-3 text-center">
                            Stash
                        </Text>
                        <Text className="text-xl text-primary-400 font-semibold mb-8 text-center">
                            Your AI Memory Assistant
                        </Text>

                        {/* Feature Pills */}
                        <View className="gap-3 mb-12">
                            <View className="flex-row items-center gap-3 bg-neutral-900/60 backdrop-blur-xl px-5 py-3 rounded-full border border-neutral-800">
                                <View className="w-8 h-8 bg-primary-500/20 rounded-full items-center justify-center">
                                    <Brain size={16} color="#7c6ff0" />
                                </View>
                                <Text className="text-sm text-neutral-300 font-medium">
                                    AI-Powered Context Extraction
                                </Text>
                            </View>
                            
                            <View className="flex-row items-center gap-3 bg-neutral-900/60 backdrop-blur-xl px-5 py-3 rounded-full border border-neutral-800">
                                <View className="w-8 h-8 bg-accent-500/20 rounded-full items-center justify-center">
                                    <Zap size={16} color="#22d3ee" />
                                </View>
                                <Text className="text-sm text-neutral-300 font-medium">
                                    Instant Capture from Any App
                                </Text>
                            </View>
                            
                            <View className="flex-row items-center gap-3 bg-neutral-900/60 backdrop-blur-xl px-5 py-3 rounded-full border border-neutral-800">
                                <View className="w-8 h-8 bg-success/20 rounded-full items-center justify-center">
                                    <Shield size={16} color="#10b981" />
                                </View>
                                <Text className="text-sm text-neutral-300 font-medium">
                                    Private & Secure Storage
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* CTA Section */}
                    <View className="gap-4">
                        <ButtonNew
                            size="lg"
                            variant="primary"
                            onPress={() => navigation.navigate('SignUp')}
                        >
                            Get Started Free
                        </ButtonNew>
                        <ButtonNew
                            variant="secondary"
                            size="lg"
                            onPress={() => navigation.navigate('Login')}
                        >
                            Sign In
                        </ButtonNew>
                        
                        <Text className="text-xs text-neutral-500 text-center mt-2">
                            Capture anything. Remember everything. Chat with your memory.
                        </Text>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
};
