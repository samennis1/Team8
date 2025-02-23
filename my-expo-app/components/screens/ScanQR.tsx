import { CameraView, CameraType, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { useState } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Animated } from 'react-native';

export default function ScanQRPage({ route, navigation }: { route: any; navigation: any }) {
  const { chatId } = route.params;
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [showNotification, setShowNotification] = useState(false);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current === 'back' ? 'front' : 'back'));
  }

  const barcodeScanned = async (result: BarcodeScanningResult) => {
    const otp = result.data;
    console.log(otp);

    try {
      const response = await fetch(`https://trade-backend.kobos.studio/api/chats/${chatId}/confirm-otp`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });
      const data = await response.json();
      if (data.error) {
        console.error('Error confirming OTP:', data.error);
      } else {
        console.log('OTP confirmed:', data.message);
        setShowNotification(true);
        setTimeout(() => {
          setShowNotification(false);
          navigation.goBack();
        }, 2000);
      }
    } catch (error) {
      console.error('Error confirming OTP:', error);
    }
  };

  return (
    <View style={styles.container}>
      {showNotification && (
        <View style={styles.notification}>
          <Text style={styles.notificationText}>QR code successfully scanned!</Text>
        </View>
      )}
      <CameraView style={styles.camera} facing={facing} onBarcodeScanned={barcodeScanned}>
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={toggleCameraFacing}>
            <Text style={styles.text}>Flip Camera</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  notification: {
    position: 'absolute',
    top: 40,
    left: 20,
    right: 20,
    backgroundColor: '#4CD964',
    padding: 15,
    borderRadius: 8,
    zIndex: 999,
    alignItems: 'center',
  },
  notificationText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});