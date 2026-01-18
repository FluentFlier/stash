import React, { useState } from 'react';
import {
    View,
    Text,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
    ScrollView,
    Pressable,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, User, ChevronRight } from 'lucide-react-native';
import { ButtonNew, InputNew, CardNew } from '../components/ui';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

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
                    <View className="flex-1 gap-6 items-center">
                        <Text className="text-3xl font-bold text-neutral-50 text-center">
                            What's your name?
                        </Text>
                        <Text className="text-lg text-neutral-400 text-center max-w-[80%]">
                            This helps us personalize your experience.
                        </Text>
                        <CardNew variant="glass" className="w-full mt-4">
                            <CardNew.Content>
                                <InputNew
                                    label="Name"
                                    placeholder="Enter your name"
                                    value={name}
                                    onChangeText={setName}
                                    leftIcon={<User size={20} color="#a3a3a3" />}
                                />
                            </CardNew.Content>
                        </CardNew>
                    </View>
                );

            case 2:
                const roles = ['Student', 'Professional', 'Creative', 'Other'];
                return (
                    <View className="flex-1 gap-6 items-center">
                        <Text className="text-3xl font-bold text-neutral-50 text-center">
                            What do you do?
                        </Text>
                        <Text className="text-lg text-neutral-400 text-center max-w-[80%]">
                            We'll tailor Stash to fit your workflow.
                        </Text>
                        <CardNew variant="glass" className="w-full mt-4">
                            <CardNew.Content>
                                <View className="flex-row flex-wrap gap-3">
                                    {roles.map((r) => (
                                        <Pressable
                                            key={r}
                                            onPress={() => setRole(r)}
                                            className={`flex-grow items-center justify-center px-6 py-3 min-h-[48px] ${
                                                role === r
                                                    ? 'bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500'
                                                    : 'bg-transparent border-2 border-primary-500'
                                            }`}
                                            style={{ borderRadius: 20 }}
                                        >
                                            <Text
                                                className={`font-semibold text-base ${
                                                    role === r ? 'text-white' : 'text-primary-500'
                                                }`}
                                            >
                                                {r}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </CardNew.Content>
                        </CardNew>
                    </View>
                );

            case 3:
                return (
                    <View className="flex-1 gap-6 items-center">
                        <Text className="text-3xl font-bold text-neutral-50 text-center">
                            How old are you?
                        </Text>
                        <Text className="text-lg text-neutral-400 text-center max-w-[80%]">
                            Helping us provide age-appropriate content.
                        </Text>
                        <CardNew variant="glass" className="w-full mt-4">
                            <CardNew.Content>
                                <InputNew
                                    label="Age"
                                    placeholder="Enter your age"
                                    value={age}
                                    onChangeText={setAge}
                                    keyboardType="number-pad"
                                    leftIcon={<Calendar size={20} color="#a3a3a3" />}
                                />
                            </CardNew.Content>
                        </CardNew>
                    </View>
                );

            case 4:
                return (
                    <View className="flex-1 gap-6 items-center">
                        <View className="mt-8 mb-4">
                            <View className="w-30 h-30 rounded-full bg-gradient-to-br from-accent-600 to-accent-500 items-center justify-center shadow-xl">
                                <Calendar size={64} color="#ffffff" strokeWidth={1.5} />
                            </View>
                        </View>
                        <Text className="text-3xl font-bold text-neutral-50 text-center">
                            Connect Google Calendar
                        </Text>
                        <Text className="text-lg text-neutral-400 text-center max-w-[80%]">
                            Automatically create events from your saved content.
                        </Text>
                        <CardNew variant="glass">
                            <CardNew.Content>
                                <View className="gap-2">
                                    <Text className="text-base font-medium text-neutral-50 mb-2">
                                        What you'll get:
                                    </Text>
                                    <Text className="text-base text-neutral-400">
                                        • Auto-detect dates and events
                                    </Text>
                                    <Text className="text-base text-neutral-400">
                                        • Smart reminders
                                    </Text>
                                    <Text className="text-base text-neutral-400">
                                        • Sync across devices
                                    </Text>
                                </View>
                            </CardNew.Content>
                        </CardNew>
                        <ButtonNew size="lg" onPress={handleNext} className="w-full mt-4">
                            Connect Calendar
                        </ButtonNew>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <View className="flex-1 bg-neutral-950">
            {/* Gradient Background */}
            <View className="absolute inset-0 bg-gradient-to-b from-neutral-950 via-primary-900/50 to-neutral-950" />
            
            <SafeAreaView className="flex-1">
                {/* Progress Indicator */}
                <View className="px-6 py-4 gap-2">
                    <View className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                        <View 
                            className="h-full bg-primary-500 rounded-full"
                            style={{ width: `${(step / 4) * 100}%` }}
                        />
                    </View>
                    <Text className="text-sm text-neutral-400 text-right">
                        Step {step} of 4
                    </Text>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    className="flex-1"
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
                >
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <ScrollView 
                            className="flex-1"
                            contentContainerClassName="px-6 flex-grow"
                            keyboardShouldPersistTaps="handled"
                        >
                            {renderStepContent()}
                        </ScrollView>
                    </TouchableWithoutFeedback>

                    {/* Bottom Actions */}
                    <View className="px-6 pb-6 gap-3">
                        {step < 4 && (
                            <ButtonNew
                                size="lg"
                                onPress={handleNext}
                                rightIcon={<ChevronRight size={20} color="#ffffff" />}
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
