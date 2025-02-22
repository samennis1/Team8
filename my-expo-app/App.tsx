import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useContext } from 'react';

import AppTabs from './components/AppTabs';
import LoginPage from './components/LoginPage';
import ChatPage from './components/screens/ChatPage';
import ProductPage from './components/screens/ProductPage';
import { AuthProvider, AuthContext } from './context/AuthContext';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user } = useContext(AuthContext);
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#1E90FF' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}>
      {!user ? (
        <Stack.Screen name="Login" component={LoginPage} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Main" component={AppTabs} options={{ headerShown: false }} />
          <Stack.Screen
            name="Product"
            component={ProductPage}
            options={{ title: 'Product Details' }}
          />
          <Stack.Screen name="Chat" component={ChatPage} options={{ title: 'Chat' }} />
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
