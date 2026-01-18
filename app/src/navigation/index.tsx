import React, { useEffect } from 'react';
import { NavigationContainer, useNavigationContainerRef, DarkTheme } from '@react-navigation/native';
import { useShareIntent } from 'expo-share-intent';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Pressable, View, Text } from 'react-native';
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

// Custom dark theme using shared colors
const CustomDarkTheme = {
    ...DarkTheme,
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

// Custom tab button with larger hit area
interface TabButtonProps {
    icon: React.ReactNode;
    label: string;
    focused: boolean;
    onPress: () => void;
}

const TabButton: React.FC<TabButtonProps> = ({ icon, label, focused, onPress }) => (
    <Pressable
        onPress={onPress}
        style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: 8,
        }}
        android_ripple={{ color: theme.primaryMuted, borderless: true }}
    >
        <View style={{ alignItems: 'center', gap: 4 }}>
            {icon}
            <Text style={{
                fontSize: 10,
                fontWeight: '500',
                color: focused ? theme.primary : theme.textSubtle,
            }}>
                {label}
            </Text>
        </View>
    </Pressable>
);

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
                    paddingTop: 4,
                    height: 76,
                    elevation: 0,
                    shadowOpacity: 0,
                },
            }}
        >
            <Tab.Screen
                name="Dashboard"
                component={DashboardScreen}
                options={{
                    tabBarButton: (props) => (
                        <TabButton
                            icon={<LayoutDashboard size={22} color={props.accessibilityState?.selected ? theme.primary : theme.textSubtle} />}
                            label="Home"
                            focused={props.accessibilityState?.selected || false}
                            onPress={() => props.onPress?.({} as any)}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="Memory"
                component={MemoryScreen}
                options={{
                    tabBarButton: (props) => (
                        <TabButton
                            icon={<Brain size={22} color={props.accessibilityState?.selected ? theme.primary : theme.textSubtle} />}
                            label="Memory"
                            focused={props.accessibilityState?.selected || false}
                            onPress={() => props.onPress?.({} as any)}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="AddContext"
                component={AddContextScreen}
                options={{
                    tabBarButton: (props) => (
                        <TabButton
                            icon={<Plus size={22} color={props.accessibilityState?.selected ? theme.primary : theme.textSubtle} />}
                            label="Add"
                            focused={props.accessibilityState?.selected || false}
                            onPress={() => props.onPress?.({} as any)}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="Chat"
                component={ChatScreen}
                options={{
                    tabBarButton: (props) => (
                        <TabButton
                            icon={<MessageCircle size={22} color={props.accessibilityState?.selected ? theme.primary : theme.textSubtle} />}
                            label="Chat"
                            focused={props.accessibilityState?.selected || false}
                            onPress={() => props.onPress?.({} as any)}
                        />
                    ),
                }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{
                    tabBarButton: (props) => (
                        <TabButton
                            icon={<User size={22} color={props.accessibilityState?.selected ? theme.primary : theme.textSubtle} />}
                            label="Profile"
                            focused={props.accessibilityState?.selected || false}
                            onPress={() => props.onPress?.({} as any)}
                        />
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
        <NavigationContainer ref={navigationRef} theme={CustomDarkTheme}>
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
