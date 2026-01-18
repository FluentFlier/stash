import React, { useEffect } from 'react';
import { NavigationContainer, useNavigationContainerRef, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { useShareIntent } from 'expo-share-intent';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MessageCircle, Plus, User } from 'lucide-react-native';
import type { RootStackParamList, MainTabParamList } from '../types';

// Import screens
import { LandingScreen } from '../screens/LandingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { AddContextScreen } from '../screens/AddContextScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

// Custom dark theme - softer dark palette
const CustomDarkTheme = {
    ...DarkTheme,
    colors: {
        ...DarkTheme.colors,
        primary: '#6366f1', // indigo-500
        background: '#121218', // soft dark slate
        card: '#1c1c24', // elevated surface
        text: '#f4f4f5',
        border: '#2d2d38',
        notification: '#6366f1',
    },
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#121218', // soft dark slate
                    borderTopColor: '#2d2d38',
                    borderTopWidth: 1,
                    paddingBottom: 28,
                    paddingTop: 10,
                    height: 85,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarActiveTintColor: '#6366f1', // indigo-500
                tabBarInactiveTintColor: '#71717a', // zinc-500
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '500' as '500',
                    marginTop: 4,
                },
                tabBarIconStyle: {
                    marginTop: 4,
                },
            }}
        >
            <Tab.Screen
                name="Chat"
                component={ChatScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MessageCircle color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="AddContext"
                component={AddContextScreen}
                options={{
                    tabBarLabel: 'Add',
                    tabBarIcon: ({ color, size }) => (
                        <Plus color={color} size={size} />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <User color={color} size={size} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

export function Navigation() {
    const navigationRef = useNavigationContainerRef<RootStackParamList>();
    const { hasShareIntent } = useShareIntent();

    useEffect(() => {
        if (hasShareIntent && navigationRef.isReady()) {
            // Use setTimeout to avoid state update during render
            setTimeout(() => {
                if (navigationRef.current) {
                    navigationRef.navigate('Main', {
                        screen: 'AddContext',
                    } as any);
                }
            }, 0);
        }
    }, [hasShareIntent, navigationRef]);

    return (
        <NavigationContainer ref={navigationRef} theme={CustomDarkTheme}>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: '#0a0a0a' }, // neutral-950
                    animation: 'fade', // Use fade animation to reduce flash
                }}
            >
                <Stack.Screen name="Landing" component={LandingScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="SignUp" component={SignUpScreen} />
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen
                    name="Main"
                    component={MainTabs}
                    options={{
                        gestureEnabled: false, // Disable swipe back
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
