import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Mail, Lock } from 'lucide-react-native';
import { ButtonNew, InputNew, CardNew } from '../components/ui';
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