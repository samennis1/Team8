import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export default function DisplayQRPage({ route, navigation }: { route: any; navigation: any }) {
  const { value } = route.params || { value: 'No value provided' };
  console.log(value);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Generated QR</Text>
      <Animated.View
        entering={FadeIn.duration(500)}
        exiting={FadeOut.duration(500)}
        style={styles.qrContainer}>
        <QRCode value={value} size={200} />
      </Animated.View>
      <Text style={styles.valueText}>{value}</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
        <Text style={styles.buttonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    padding: 16,
  },
  title: {
    marginBottom: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E90FF',
  },
  qrContainer: {
    marginBottom: 32,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#F0F8FF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  valueText: {
    marginBottom: 32,
    textAlign: 'center',
    fontSize: 16,
    color: '#696969',
  },
  button: {
    width: 256,
    borderRadius: 8,
    backgroundColor: '#1E90FF',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  buttonText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: 'white',
  },
});
