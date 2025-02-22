import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useContext } from 'react';

import LoginPage from './components/LoginPage';
import ChatPage from './components/screens/ChatPage';
import HomePage from './components/screens/HomePage';
import ProductPage from './components/screens/ProductPage';
import { AuthProvider, AuthContext } from './context/AuthContext';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user } = useContext(AuthContext);
  return (
    <Stack.Navigator>
      {!user ? (
        <Stack.Screen name="Login" component={LoginPage} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Home" component={HomePage} options={{ headerShown: false }} />
          <Stack.Screen name="Product" component={ProductPage} options={{ headerShown: false }} />
          <Stack.Screen name="Chat" component={ChatPage} options={{ headerShown: false }} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}
