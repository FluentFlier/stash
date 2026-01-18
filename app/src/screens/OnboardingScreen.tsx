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
            if (step < 4) {
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
                        <Text style={styles.title}>What's your name?</Text>
                        <Text style={styles.description}>
                            This helps us personalize your experience.
                        </Text>
                        <Card variant="glass" style={styles.stepCard}>
                            <Card.Content>
                                <Input
                                    label="Name"
                                    placeholder="Enter your name"
                                    value={name}
                                    onChangeText={setName}
                                    leftIcon={<User size={20} color={theme.colors.text.tertiary} />}
                                />
                            </Card.Content>
                        </Card>
                    </View>
                );

            case 2:
                const roles = ['Student', 'Professional', 'Creative', 'Other'];
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.title}>What do you do?</Text>
                        <Text style={styles.description}>
                            We'll tailor Stash to fit your workflow.
                        </Text>
                        <Card variant="glass" style={styles.stepCard}>
                            <Card.Content>
                                <View style={styles.roleGrid}>
                                    {roles.map((r) => (
                                        <Button
                                            key={r}
                                            variant={role === r ? 'primary' : 'outline'}
                                            onPress={() => setRole(r)}
                                            style={styles.roleButton}
                                        >
                                            {r}
                                        </Button>
                                    ))}
                                </View>
                            </Card.Content>
                        </Card>
                    </View>
                );

            case 3:
                return (
                    <View style={styles.stepContent}>
                        <Text style={styles.title}>How old are you?</Text>
                        <Text style={styles.description}>
                            Helping us provide age-appropriate content.
                        </Text>
                        <Card variant="glass" style={styles.stepCard}>
                            <Card.Content>
                                <Input
                                    label="Age"
                                    placeholder="Enter your age"
                                    value={age}
                                    onChangeText={setAge}
                                    keyboardType="number-pad"
                                    leftIcon={<Calendar size={20} color={theme.colors.text.tertiary} />}
                                />
                            </Card.Content>
                        </Card>
                    </View>
                );

            case 4:
                return (
                    <View style={styles.stepContent}>
                        <View style={styles.iconContainer}>
                            <LinearGradient
                                colors={theme.colors.gradients.accent as any}
                                style={styles.iconGradient}
                            >
                                <Calendar size={64} color={theme.colors.text.inverse} strokeWidth={1.5} />
                            </LinearGradient>
                        </View>
                        <Text style={styles.title}>Connect Google Calendar</Text>
                        <Text style={styles.description}>
                            Automatically create events from your saved content.
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
                        <Button size="lg" onPress={handleNext} style={{ width: '100%', marginTop: theme.spacing[4] }}>
                            Connect Calendar
                        </Button>
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
                    <View style={styles.progressBar}>
                        <Animated.View
                            style={[
                                styles.progressFill,
                                { width: `${(step / 4) * 100}%` }
                            ]}
                        />
                    </View>
                    <Text style={styles.stepText}>Step {step} of 4</Text>
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
                    {step < 4 && (
                        <Button
                            size="lg"
                            onPress={handleNext}
                            rightIcon={<ChevronRight size={20} color={theme.colors.text.inverse} />}
                        >
                            Continue
                        </Button>
                    )}
                    {step === 4 && (
                        <Button variant="ghost" onPress={handleSkip}>
                            Skip for now
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
        paddingHorizontal: theme.spacing[6],
        paddingVertical: theme.spacing[4],
        gap: theme.spacing[2],
    },
    progressBar: {
        height: 6,
        backgroundColor: theme.colors.surfaceElevated,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: theme.colors.primary[500],
        borderRadius: 3,
    },
    stepText: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.tertiary,
        textAlign: 'right',
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
    stepCard: {
        width: '100%',
        marginTop: theme.spacing[4],
    },
    roleGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing[3],
    },
    roleButton: {
        flexGrow: 1,
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
