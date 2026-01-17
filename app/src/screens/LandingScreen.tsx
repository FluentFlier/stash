import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';
import { Button } from '../components/ui';
import { theme } from '../theme';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

export const LandingScreen: React.FC<Props> = ({ navigation }) => {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(30)).current;
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Fade in and slide up animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();

        // Floating animation loop
        Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: -10,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

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
                <Animated.View
                    style={[
                        styles.content,
                        {
                            opacity: fadeAnim,
                            transform: [{ translateY: slideAnim }],
                        },
                    ]}
                >
                    <Animated.View
                        style={[
                            styles.logoContainer,
                            { transform: [{ translateY: floatAnim }] },
                        ]}
                    >
                        <View style={styles.iconWrapper}>
                            <Sparkles
                                size={64}
                                color={theme.colors.primary[400]}
                                strokeWidth={1.5}
                            />
                        </View>
                        <Text style={styles.logo}>Stash</Text>
                        <Text style={styles.tagline}>Your AI Memory Assistant</Text>
                    </Animated.View>

                    <View style={styles.actions}>
                        <Button
                            size="lg"
                            variant="primary"
                            onPress={() => navigation.navigate('SignUp')}
                        >
                            Get Started
                        </Button>
                        <Button
                            variant="glass"
                            size="lg"
                            onPress={() => navigation.navigate('Login')}
                        >
                            Sign In
                        </Button>
                    </View>

                    <Text style={styles.footer}>
                        Capture, organize, and chat with everything you save
                    </Text>
                </Animated.View>
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
    content: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: theme.spacing[6],
        paddingVertical: theme.spacing[12],
    },
    logoContainer: {
        alignItems: 'center',
        marginTop: theme.spacing[20],
    },
    iconWrapper: {
        marginBottom: theme.spacing[4],
    },
    logo: {
        ...theme.typography.styles.h1,
        color: theme.colors.text.primary,
        marginBottom: theme.spacing[2],
        fontWeight: '800',
    },
    tagline: {
        ...theme.typography.styles.bodyLarge,
        color: theme.colors.text.secondary,
        textAlign: 'center',
    },
    actions: {
        width: '100%',
        gap: theme.spacing[3],
    },
    footer: {
        ...theme.typography.styles.caption,
        color: theme.colors.text.tertiary,
        textAlign: 'center',
        maxWidth: '80%',
    },
});
