import React, { useEffect } from 'react';
import { NavigationContainer, useNavigationContainerRef, DarkTheme } from '@react-navigation/native';
import { useShareIntent } from 'expo-share-intent';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Pressable, View, Text, GestureResponderEvent } from 'react-native';
import { MessageCircle, Plus, User, LayoutDashboard, Brain } from 'lucide-react-native';
import type { RootStackParamList, MainTabParamList } from '../types';
import { theme } from '../theme';

// Import screens
import { LandingScreen } from '../screens/LandingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { AddContextScreen } from '../screens/AddContextScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { MemoryScreen } from '../screens/MemoryScreen';

// Custom theme using shared colors
const CustomTheme = {
    ...DarkTheme,
    dark: false, // Light theme
    colors: {
        ...DarkTheme.colors,
        primary: theme.primary,
        background: theme.bg,
        card: theme.bgSecondary,
        text: theme.text,
        border: theme.borderLight,
        notification: theme.primary,
    },
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Custom tab button component with full touch area
const CustomTabButton = ({
    children,
    onPress,
    accessibilityState,
    style,
}: BottomTabBarButtonProps) => {
    const focused = accessibilityState?.selected || false;

    return (
        <Pressable
            onPress={onPress}
            style={[
                {
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingVertical: 6,
                    backgroundColor: focused ? theme.primaryMuted : 'transparent',
                    borderRadius: 8,
                    marginHorizontal: 4,
                },
            ]}
        >
            {children}
        </Pressable>
    );
};

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.bg,
                    borderTopColor: theme.borderLight,
                    borderTopWidth: 1,
                    paddingBottom: 24,
                    paddingTop: 8,
                    paddingHorizontal: 8,
                    height: 80,
                    elevation: 0,
                    shadowOpacity: 0,
                },
                tabBarActiveTintColor: theme.primary,
                tabBarInactiveTintColor: theme.textSubtle,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '500',
                    marginTop: 2,
                },
                tabBarButton: (props) => <CustomTabButton {...props} />,
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ color, size }) => (
                        <LayoutDashboard size={size - 2} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Memory"
                component={MemoryScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Brain size={size - 2} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="AddContext"
                component={AddContextScreen}
                options={{
                    tabBarLabel: 'Add',
                    tabBarIcon: ({ color, size }) => (
                        <Plus size={size - 2} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Chat"
                component={ChatScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MessageCircle size={size - 2} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <User size={size - 2} color={color} />
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
        <NavigationContainer ref={navigationRef} theme={CustomTheme}>
            <Stack.Navigator
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: theme.bg },
                    animation: 'fade',
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
                        gestureEnabled: false,
                    }}
                />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
