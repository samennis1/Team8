import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';

import { auth } from '../firebaseConfig';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = () => {
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: '340174307421-9dlq3nfok7t3r0bmteib69ce5ni3rq8h.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    webClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params || {};
      if (id_token) {
        const credential = GoogleAuthProvider.credential(id_token);
        signInWithCredential(auth, credential).catch((error) => {
          Alert.alert('Google Sign-In Error', error.message);
        });
      }
    }
  }, [response]);

  return (
    <View className="flex-1 items-center justify-center bg-gray-100 p-4">
      <Text className="mb-6 text-3xl font-bold">TradeSure</Text>
      <TouchableOpacity
        onPress={() => promptAsync()}
        disabled={!request}
        className="rounded bg-blue-500 px-6 py-3">
        <Text className="text-center font-semibold text-white">Login with Google</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;
