import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Calendar, User, ChevronRight } from 'lucide-react-native';
import { Button, Input, Card } from '../components/ui';
import { theme } from '../theme';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [age, setAge] = useState('');
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Fade in animation when step changes
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start();
    }, [step]);

    const handleNext = () => {
        // Fade out before changing step
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: -20,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            if (step < 3) {
                setStep(step + 1);
            } else {
                // Complete onboarding
                navigation.navigate('Main');
            }
        });
    };

    const handleSkip = () => {
        navigation.navigate('Main');
    };

    const renderStepContent = () => {
        switch (step) {
            case 1:
                return (
                    <View style={styles.stepContent}>
                        <View style={styles.iconContainer}>
                            <LinearGradient
                                colors={theme.colors.gradients.primary}
                                style={styles.iconGradient}
                            >
                                <Sparkles size={64} color={theme.colors.text.inverse} strokeWidth={1.5} />
                            </LinearGradient>
                        </View>
                        <Text style={styles.title}>Welcome to Stash!</Text>
                        <Text style={styles.description}>
                            Your AI-powered memory assistant. Capture anything, organize everything, and chat with your personal knowledge base.
                        </Text>
                        <View style={styles.features}>
                            <View style={styles.feature}>
                                <View style={styles.featureDot} />
                                <Text style={styles.featureText}>Save images, videos, links, and notes</Text>
                            </View>
                            <View style={styles.feature}>
                                <View style={styles.featureDot} />
                                <Text style={styles.featureText}>AI-powered search and insights</Text>
                            </View>
                            <View style={styles.feature}>
                                <View style={styles.featureDot} />
                                <Text style={styles.featureText}>Chat with your saved content</Text>
                            </View>
                        </View>
                    </View>
                );

            case 2:
                return (
                    <View style={styles.stepContent}>
                        <View style={styles.iconContainer}>
                            <LinearGradient
                                colors={theme.colors.gradients.accent}
                                style={styles.iconGradient}
                            >
                                <Calendar size={64} color={theme.colors.text.inverse} strokeWidth={1.5} />
                            </LinearGradient>
                        </View>
                        <Text style={styles.title}>Connect Google Calendar</Text>
                        <Text style={styles.description}>
                            Automatically create calendar events from your saved content. Never miss an important date or deadline.
                        </Text>
                        <Card variant="glass">
                            <Card.Content>
                                <View style={styles.calendarInfo}>
                                    <Text style={styles.calendarTitle}>What you'll get:</Text>
                                    <Text style={styles.calendarItem}>• Auto-detect dates and events</Text>
                                    <Text style={styles.calendarItem}>• Smart reminders</Text>
                                    <Text style={styles.calendarItem}>• Sync across devices</Text>
                                </View>
                            </Card.Content>
                        </Card>
                        <View style={styles.buttonGroup}>
                            <Button size="lg" onPress={handleNext}>
                                Connect Calendar
                            </Button>
                            <Button variant="ghost" onPress={handleSkip}>
                                Skip for now
                            </Button>
                        </View>
                    </View>
                );

            case 3:
                return (
                    <View style={styles.stepContent}>
                        <View style={styles.iconContainer}>
                            <LinearGradient
                                colors={theme.colors.gradients.aurora}
                                style={styles.iconGradient}
                            >
                                <User size={64} color={theme.colors.text.inverse} strokeWidth={1.5} />
                            </LinearGradient>
                        </View>
                        <Text style={styles.title}>Personalize Your Experience</Text>
                        <Text style={styles.description}>
                            Help us tailor Stash to your needs
                        </Text>
                        <View style={styles.form}>
                            <Input
                                label="Name"
                                placeholder="Enter your name"
                                value={name}
                                onChangeText={setName}
                            />
                            <Input
                                label="Role"
                                placeholder="e.g., Student, Developer, Designer"
                                value={role}
                                onChangeText={setRole}
                            />
                            <Input
                                label="Age"
                                placeholder="Enter your age"
                                value={age}
                                onChangeText={setAge}
                                keyboardType="number-pad"
                            />
                        </View>
                    </View>
                );

            default:
                return null;
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={[
                    theme.colors.dark.background,
                    theme.colors.primary[900],
                    theme.colors.dark.background,
                ]}
                locations={[0, 0.5, 1]}
                style={styles.gradient}
            />
            <SafeAreaView style={styles.safeArea}>
                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                    {[1, 2, 3].map((i) => (
                        <View
                            key={i}
                            style={[
                                styles.progressDot,
                                i === step && styles.progressDotActive,
                                i < step && styles.progressDotComplete,
                            ]}
                        />
                    ))}
                </View>

                {/* Animated Content */}
                <Animated.View
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    {renderStepContent()}
                </Animated.View>

                {/* Bottom Actions */}
                <View style={styles.bottomActions}>
                    {step !== 2 && (
                        <Button
                            size="lg"
                            onPress={handleNext}
                            rightIcon={step < 3 ? <ChevronRight size={20} color={theme.colors.text.inverse} /> : undefined}
                        >
                            {step === 3 ? 'Get Started' : 'Continue'}
                        </Button>
                    )}
                    {step === 1 && (
                        <Button variant="ghost" onPress={handleSkip}>
                            Skip Onboarding
                        </Button>
                    )}
                </View>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
    },
    safeArea: {
        flex: 1,
    },
    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: theme.spacing[2],
        paddingVertical: theme.spacing[6],
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.gray[700],
    },
    progressDotActive: {
        width: 24,
        backgroundColor: theme.colors.primary[500],
    },
    progressDotComplete: {
        backgroundColor: theme.colors.primary[600],
    },
    content: {
        flex: 1,
        paddingHorizontal: theme.spacing[6],
    },
    stepContent: {
        flex: 1,
        gap: theme.spacing[6],
        alignItems: 'center',
    },
    iconContainer: {
        marginTop: theme.spacing[8],
        marginBottom: theme.spacing[4],
    },
    iconGradient: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        ...theme.shadows.xl,
    },
    title: {
        ...theme.typography.styles.h2,
        color: theme.colors.text.primary,
        textAlign: 'center',
    },
    description: {
        ...theme.typography.styles.bodyLarge,
        color: theme.colors.text.secondary,
        textAlign: 'center',
        maxWidth: width * 0.8,
    },
    features: {
        width: '100%',
        gap: theme.spacing[3],
        marginTop: theme.spacing[4],
    },
    feature: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[3],
    },
    featureDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.primary[400],
    },
    featureText: {
        ...theme.typography.styles.body,
        color: theme.colors.text.primary,
    },
    calendarInfo: {
        gap: theme.spacing[2],
    },
    calendarTitle: {
        ...theme.typography.styles.bodyMedium,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing[2],
    },
    calendarItem: {
        ...theme.typography.styles.body,
        color: theme.colors.text.secondary,
    },
    buttonGroup: {
        width: '100%',
        gap: theme.spacing[3],
    },
    form: {
        width: '100%',
        gap: theme.spacing[4],
    },
    bottomActions: {
        paddingHorizontal: theme.spacing[6],
        paddingBottom: theme.spacing[6],
        gap: theme.spacing[3],
    },
});
