import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from 'react';

import { auth } from '../firebaseConfig';
import ChatScreen from '../screens/ChatScreen';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import ProductScreen from '../screens/ProductScreen';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Product: { product: any };
  Chat: { productId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const StackNavigator = () => {
  const [user, setUser] = useState<any>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      if (initializing) setInitializing(false);
    });
    return unsubscribe;
  }, [initializing]);

  if (initializing) return null;

  return (
    <Stack.Navigator>
      {user ? (
        <>
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Listings' }} />
          <Stack.Screen
            name="Product"
            component={ProductScreen}
            options={{ title: 'Product Details' }}
          />
          <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
};

export default StackNavigator;
