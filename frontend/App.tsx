import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigator from './navigation/StackNavigator';
import { StatusBar } from 'expo-status-bar';
import './global.css';

export default function App() {
  return (
    <NavigationContainer>
      <StackNavigator />
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
