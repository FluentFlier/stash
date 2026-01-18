import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Navigation } from './src/navigation';
import './global.css';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Navigation />
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
