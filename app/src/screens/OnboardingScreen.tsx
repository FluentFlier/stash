import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ScrollView, TextInput } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, User, ChevronRight, Sparkles, Check } from 'lucide-react-native';
import { ButtonNew } from '../components/ui';
import { theme } from '../theme';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [age, setAge] = useState('');

    const handleNext = () => {
        if (step < 4) setStep(step + 1);
        else navigation.navigate('Main');
    };

    const handleSkip = () => navigation.navigate('Main');

    const renderInput = (icon: React.ReactNode, label: string, value: string, setValue: (v: string) => void, placeholder: string, keyboardType?: 'default' | 'number-pad') => (
        <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 12, borderWidth: 1, borderColor: theme.borderLight, padding: 16, width: '100%', marginTop: 12 }}>
            <Text style={{ fontSize: 13, color: theme.textMuted, marginBottom: 8, fontWeight: '500' }}>{label}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: theme.bgTertiary, borderRadius: 8, borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12 }}>
                {icon}
                <TextInput style={{ flex: 1, paddingVertical: 12, paddingHorizontal: 10, fontSize: 15, color: theme.text }} placeholder={placeholder} placeholderTextColor={theme.textSubtle} value={value} onChangeText={setValue} keyboardType={keyboardType || 'default'} />
            </View>
        </View>
    );

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={{ paddingHorizontal: 24, paddingVertical: 16, gap: 8 }}>
                    <View style={{ height: 4, backgroundColor: theme.bgTertiary, borderRadius: 2, overflow: 'hidden' }}>
                        <View style={{ height: '100%', backgroundColor: theme.primary, borderRadius: 2, width: `${(step / 4) * 100}%` }} />
                    </View>
                    <Text style={{ fontSize: 12, color: theme.textSubtle, textAlign: 'right' }}>Step {step} of 4</Text>
                </View>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                            {step === 1 && (
                                <View style={{ flex: 1, gap: 20, alignItems: 'center', justifyContent: 'center' }}>
                                    <View style={{ width: 64, height: 64, backgroundColor: theme.primaryMuted, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={28} color={theme.primary} />
                                    </View>
                                    <Text style={{ fontSize: 26, fontWeight: '700', color: theme.text, textAlign: 'center' }}>What's your name?</Text>
                                    <Text style={{ fontSize: 15, color: theme.textMuted, textAlign: 'center', maxWidth: '80%' }}>This helps us personalize your experience.</Text>
                                    {renderInput(<User size={18} color={theme.textSubtle} />, 'Name', name, setName, 'Enter your name')}
                                </View>
                            )}
                            {step === 2 && (
                                <View style={{ flex: 1, gap: 20, alignItems: 'center', justifyContent: 'center' }}>
                                    <View style={{ width: 64, height: 64, backgroundColor: theme.accentMuted, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                                        <Sparkles size={28} color={theme.accent} />
                                    </View>
                                    <Text style={{ fontSize: 26, fontWeight: '700', color: theme.text, textAlign: 'center' }}>What do you do?</Text>
                                    <Text style={{ fontSize: 15, color: theme.textMuted, textAlign: 'center', maxWidth: '80%' }}>We'll tailor Stash to fit your workflow.</Text>
                                    {renderInput(<Sparkles size={18} color={theme.textSubtle} />, 'Role', role, setRole, 'e.g., Student, Professional')}
                                </View>
                            )}
                            {step === 3 && (
                                <View style={{ flex: 1, gap: 20, alignItems: 'center', justifyContent: 'center' }}>
                                    <View style={{ width: 64, height: 64, backgroundColor: theme.successMuted, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                                        <Calendar size={28} color={theme.success} />
                                    </View>
                                    <Text style={{ fontSize: 26, fontWeight: '700', color: theme.text, textAlign: 'center' }}>How old are you?</Text>
                                    <Text style={{ fontSize: 15, color: theme.textMuted, textAlign: 'center', maxWidth: '80%' }}>Helping us provide age-appropriate content.</Text>
                                    {renderInput(<Calendar size={18} color={theme.textSubtle} />, 'Age', age, setAge, 'Enter your age', 'number-pad')}
                                </View>
                            )}
                            {step === 4 && (
                                <View style={{ flex: 1, gap: 20, alignItems: 'center', justifyContent: 'center' }}>
                                    <View style={{ width: 80, height: 80, backgroundColor: theme.primary, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
                                        <Calendar size={36} color="#ffffff" />
                                    </View>
                                    <Text style={{ fontSize: 26, fontWeight: '700', color: theme.text, textAlign: 'center' }}>Connect Calendar</Text>
                                    <Text style={{ fontSize: 15, color: theme.textMuted, textAlign: 'center', maxWidth: '85%' }}>Automatically create events from saved content.</Text>
                                    <View style={{ backgroundColor: theme.bgSecondary, borderRadius: 12, borderWidth: 1, borderColor: theme.borderLight, padding: 16, width: '100%', gap: 12 }}>
                                        {['Auto-detect events', 'Smart reminders', 'Sync devices'].map((item, i) => (
                                            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                                <View style={{ width: 20, height: 20, backgroundColor: theme.successMuted, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
                                                    <Check size={12} color={theme.success} />
                                                </View>
                                                <Text style={{ fontSize: 14, color: theme.textMuted }}>{item}</Text>
                                            </View>
                                        ))}
                                    </View>
                                    <ButtonNew size="lg" onPress={handleNext} style={{ width: '100%' }}>Connect Calendar</ButtonNew>
                                </View>
                            )}
                        </ScrollView>
                    </TouchableWithoutFeedback>
                    <View style={{ paddingHorizontal: 24, paddingBottom: 24, gap: 12 }}>
                        {step < 4 && <ButtonNew size="lg" onPress={handleNext} rightIcon={<ChevronRight size={18} color="#ffffff" />}>Continue</ButtonNew>}
                        {step === 4 && <ButtonNew variant="ghost" onPress={handleSkip}>Skip for now</ButtonNew>}
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
};
