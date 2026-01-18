import React, { useState } from 'react';
import {
    View,
    Text,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    ScrollView,
    TextInput,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, User, ChevronRight, Sparkles, Check } from 'lucide-react-native';
import { ButtonNew } from '../components/ui';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

// Unified color constants - softer dark theme
const colors = {
    bg: '#121218',           // soft dark slate
    bgSecondary: '#1c1c24',  // elevated surface
    bgTertiary: '#252530',   // input backgrounds
    primary: '#6366f1',
    primaryMuted: 'rgba(99, 102, 241, 0.12)',
    text: '#f4f4f5',
    textMuted: '#a1a1aa',
    textSubtle: '#71717a',
    border: '#3a3a48',
    borderLight: '#2d2d38',
    success: '#22c55e',
    accent: '#3b82f6',
};

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [age, setAge] = useState('');

    const handleNext = () => {
        if (step < 4) {
            setStep(step + 1);
        } else {
            navigation.navigate('Main');
        }
    };

    const handleSkip = () => {
        navigation.navigate('Main');
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <View style={{ flex: 1, gap: 20, alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{
                            width: 64,
                            height: 64,
                            backgroundColor: colors.primaryMuted,
                            borderRadius: 16,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 8,
                        }}>
                            <User size={28} color={colors.primary} />
                        </View>
                        <Text style={{ fontSize: 26, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
                            What's your name?
                        </Text>
                        <Text style={{ fontSize: 15, color: colors.textMuted, textAlign: 'center', maxWidth: '80%' }}>
                            This helps us personalize your experience.
                        </Text>
                        <View style={{
                            backgroundColor: colors.bgSecondary,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: colors.borderLight,
                            padding: 16,
                            width: '100%',
                            marginTop: 12,
                        }}>
                            <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8, fontWeight: '500' }}>
                                Name
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
                                <User size={18} color={colors.textSubtle} />
                                <TextInput
                                    style={{
                                        flex: 1,
                                        paddingVertical: 12,
                                        paddingHorizontal: 10,
                                        fontSize: 15,
                                        color: colors.text,
                                    }}
                                    placeholder="Enter your name"
                                    placeholderTextColor={colors.textSubtle}
                                    value={name}
                                    onChangeText={setName}
                                />
                            </View>
                        </View>
                    </View>
                );

            case 2:
                return (
                    <View style={{ flex: 1, gap: 20, alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{
                            width: 64,
                            height: 64,
                            backgroundColor: 'rgba(59, 130, 246, 0.12)',
                            borderRadius: 16,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 8,
                        }}>
                            <Sparkles size={28} color={colors.accent} />
                        </View>
                        <Text style={{ fontSize: 26, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
                            What do you do?
                        </Text>
                        <Text style={{ fontSize: 15, color: colors.textMuted, textAlign: 'center', maxWidth: '80%' }}>
                            We'll tailor Stash to fit your workflow.
                        </Text>
                        <View style={{
                            backgroundColor: colors.bgSecondary,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: colors.borderLight,
                            padding: 16,
                            width: '100%',
                            marginTop: 12,
                        }}>
                            <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8, fontWeight: '500' }}>
                                Role
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
                                <Sparkles size={18} color={colors.textSubtle} />
                                <TextInput
                                    style={{
                                        flex: 1,
                                        paddingVertical: 12,
                                        paddingHorizontal: 10,
                                        fontSize: 15,
                                        color: colors.text,
                                    }}
                                    placeholder="e.g., Student, Professional, Creative"
                                    placeholderTextColor={colors.textSubtle}
                                    value={role}
                                    onChangeText={setRole}
                                />
                            </View>
                        </View>
                    </View>
                );

            case 3:
                return (
                    <View style={{ flex: 1, gap: 20, alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{
                            width: 64,
                            height: 64,
                            backgroundColor: 'rgba(34, 197, 94, 0.12)',
                            borderRadius: 16,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 8,
                        }}>
                            <Calendar size={28} color={colors.success} />
                        </View>
                        <Text style={{ fontSize: 26, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
                            How old are you?
                        </Text>
                        <Text style={{ fontSize: 15, color: colors.textMuted, textAlign: 'center', maxWidth: '80%' }}>
                            Helping us provide age-appropriate content.
                        </Text>
                        <View style={{
                            backgroundColor: colors.bgSecondary,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: colors.borderLight,
                            padding: 16,
                            width: '100%',
                            marginTop: 12,
                        }}>
                            <Text style={{ fontSize: 13, color: colors.textMuted, marginBottom: 8, fontWeight: '500' }}>
                                Age
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
                                <Calendar size={18} color={colors.textSubtle} />
                                <TextInput
                                    style={{
                                        flex: 1,
                                        paddingVertical: 12,
                                        paddingHorizontal: 10,
                                        fontSize: 15,
                                        color: colors.text,
                                    }}
                                    placeholder="Enter your age"
                                    placeholderTextColor={colors.textSubtle}
                                    value={age}
                                    onChangeText={setAge}
                                    keyboardType="number-pad"
                                />
                            </View>
                        </View>
                    </View>
                );

            case 4:
                return (
                    <View style={{ flex: 1, gap: 20, alignItems: 'center', justifyContent: 'center' }}>
                        <View style={{
                            width: 80,
                            height: 80,
                            backgroundColor: colors.primary,
                            borderRadius: 20,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 8,
                        }}>
                            <Calendar size={36} color="#ffffff" strokeWidth={1.5} />
                        </View>
                        <Text style={{ fontSize: 26, fontWeight: '700', color: colors.text, textAlign: 'center' }}>
                            Connect Google Calendar
                        </Text>
                        <Text style={{ fontSize: 15, color: colors.textMuted, textAlign: 'center', maxWidth: '85%' }}>
                            Automatically create events from your saved content.
                        </Text>

                        <View style={{
                            backgroundColor: colors.bgSecondary,
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: colors.borderLight,
                            padding: 16,
                            width: '100%',
                            marginTop: 12,
                            gap: 12,
                        }}>
                            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text }}>
                                What you'll get:
                            </Text>
                            {['Auto-detect dates and events', 'Smart reminders', 'Sync across devices'].map((item, index) => (
                                <View key={index} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                    <View style={{
                                        width: 20,
                                        height: 20,
                                        backgroundColor: 'rgba(34, 197, 94, 0.12)',
                                        borderRadius: 10,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}>
                                        <Check size={12} color={colors.success} />
                                    </View>
                                    <Text style={{ fontSize: 14, color: colors.textMuted }}>{item}</Text>
                                </View>
                            ))}
                        </View>

                        <ButtonNew size="lg" onPress={handleNext} className="w-full" style={{ marginTop: 8 }}>
                            Connect Calendar
                        </ButtonNew>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <SafeAreaView style={{ flex: 1 }}>
                {/* Progress Indicator */}
                <View style={{ paddingHorizontal: 24, paddingVertical: 16, gap: 8 }}>
                    <View style={{
                        height: 4,
                        backgroundColor: colors.bgTertiary,
                        borderRadius: 2,
                        overflow: 'hidden',
                    }}>
                        <View
                            style={{
                                height: '100%',
                                backgroundColor: colors.primary,
                                borderRadius: 2,
                                width: `${(step / 4) * 100}%`,
                            }}
                        />
                    </View>
                    <Text style={{ fontSize: 12, color: colors.textSubtle, textAlign: 'right' }}>
                        Step {step} of 4
                    </Text>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <ScrollView
                            style={{ flex: 1 }}
                            contentContainerStyle={{ paddingHorizontal: 24, flexGrow: 1 }}
                            keyboardShouldPersistTaps="handled"
                        >
                            {renderStepContent()}
                        </ScrollView>
                    </TouchableWithoutFeedback>

                    {/* Bottom Actions */}
                    <View style={{ paddingHorizontal: 24, paddingBottom: 24, gap: 12 }}>
                        {step < 4 && (
                            <ButtonNew
                                size="lg"
                                onPress={handleNext}
                                rightIcon={<ChevronRight size={18} color="#ffffff" />}
                            >
                                Continue
                            </ButtonNew>
                        )}
                        {step === 4 && (
                            <ButtonNew variant="ghost" onPress={handleSkip}>
                                Skip for now
                            </ButtonNew>
                        )}
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};
