import React, { useState, useContext, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location';
import { AuthContext } from '../context/AuthContext';

const LoginPage = ({ navigation }: { navigation: any }) => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Request location permission & fetch user location
  useEffect(() => {
    const fetchLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to proceed.');
        return;
      }
      let userLocation = await Location.getCurrentPositionAsync({});
    const locationData = {
      latitude: userLocation.coords.latitude,
      longitude: userLocation.coords.longitude,
    };
    
    setLocation(locationData);
    console.log("User Location:", locationData); // ✅ Log the location
  };
  fetchLocation();
}, []);

  // Handle user login & send data to backend
  const handleLogin = async () => {
    if (!location) {
      Alert.alert('Location Required', 'Please allow location access before logging in.');
      return;
    }
  
    const userData = {
      email,
      password,
      location,
    };
  
    try {
      const response = await fetch('http://172.16.16.211:5000/login', { // Replace with your local IP
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(userData),
      });
  
      const textResponse = await response.text(); // Read response as text
      let result;
      try {
        result = JSON.parse(textResponse); // Try parsing as JSON
      } catch (error) {
        console.error('Invalid JSON response:', textResponse);
        throw new Error('Invalid server response');
      }
  
      if (response.ok) {
        await login(email, password); // Proceed with login
        navigation.replace('Home');
      } else {
        Alert.alert('Login Failed', result.message || 'Please check your credentials.');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Network Error', 'Unable to connect to the server.');
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  title: {
    marginBottom: 8,
    fontSize: 24,
    fontWeight: 'bold',
  },
  input: {
    marginBottom: 16,
    width: 256,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'gray',
    padding: 12,
  },
  button: {
    width: 256,
    borderRadius: 4,
    backgroundColor: 'blue',
    padding: 12,
  },
  buttonText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: 'white',
  },
});

export default LoginPage;
