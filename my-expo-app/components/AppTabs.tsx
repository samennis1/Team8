import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';

import HomePage from './screens/HomePage';
import SwipePage from './screens/SwipePage';

const Tab = createBottomTabNavigator();

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#1E90FF',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          let iconName: string = '';
          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Swipe') {
            iconName = 'shuffle';
          }
          return <Ionicons name={iconName as 'home' | 'shuffle'} size={size} color={color} />;
        },
      })}>
      <Tab.Screen name="Home" component={HomePage} />
      <Tab.Screen name="Swipe" component={SwipePage} />
    </Tab.Navigator>
  );
}
