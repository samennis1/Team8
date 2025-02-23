import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StripeProvider } from '@stripe/stripe-react-native';
import React from 'react';

import AppTabs from './components/AppTabs';
import LoginPage from './components/LoginPage';
import ChatPage from './components/screens/ChatPage';
import DisplayQRPage from './components/screens/DisplayQRPage';
import ProductPage from './components/screens/ProductPage';
import ScanQRPage from './components/screens/ScanQR';
import { AuthProvider, AuthContext } from './context/AuthContext';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { user } = React.useContext(AuthContext);
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
          <Stack.Screen
            name="DisplayQRPage"
            component={DisplayQRPage}
            options={{ title: 'Display QR' }}
          />
          <Stack.Screen name="ScanQRPage" component={ScanQRPage} options={{ title: 'Scan QR' }} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  const stripePublishableKey = process.env.EXPO_PUBLIC_STRIPE;
  return (
    <StripeProvider publishableKey={stripePublishableKey}>
      <AuthProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </StripeProvider>
  );
}
