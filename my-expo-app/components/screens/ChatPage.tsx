import { useStripe } from '@stripe/stripe-react-native';
import * as Location from 'expo-location';
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';

import { AuthContext } from '../../context/AuthContext';
import ApiService from '../../services/ApiService';

// static seller due to time constraints
const sellerLongLat = [53.337902, -6.257732];

type Message = { id: string; text: string; type: 'sent' | 'received' | 'ai'; sender: string };

const ChatPage = ({ route, navigation }: { route: any; navigation: any }) => {
  const { item } = route.params;
  const { user } = useContext(AuthContext);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  console.log(user);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [negotiationAgreed, setNegotiationAgreed] = useState(false);
  const [locationProcessed, setLocationProcessed] = useState(false);
  const [agreedPrice, setAgreedPrice] = useState<number | null>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any>(null);
  const [buyerLocation, setBuyerLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await ApiService.getChatMessages(item.chat_id);
        const { messages, meetup, otp } = data;
        const formattedMessages = messages.map((msg: any) => ({
          ...msg,
          type: msg.sender === user!.email ? 'sent' : 'received',
        }));
        setMessages(formattedMessages);

        if (meetup.price) {
          setAgreedPrice(meetup.price);
          setNegotiationAgreed(true);
        }
        if (meetup.agreed) {
          setLocationProcessed(true);
        }
        if (otp.token) {
          setIsPaid(true);
        }
        if (!negotiationAgreed && meetup.price) {
          evaluatePrice(meetup.price);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    const fetchLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission to access location was denied');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setBuyerLocation({
          lat: location.coords.latitude,
          lon: location.coords.longitude,
        });
      } catch (error) {
        console.error('Error fetching location:', error);
      }
    };

    fetchMessages();
    fetchLocation();
  }, []);

  const evaluatePrice = async (priceText: string) => {
    const priceMatch = priceText.match(/€(\d+)/);
    if (priceMatch) {
      const price = parseInt(priceMatch[1], 10);
      const payload = {
        desc: item.desc,
        price,
      };

      try {
        console.log('Evaluating price', payload);
        const result = await ApiService.evaluatePrice({
          desc: item.desc,
          price,
          seller: item.seller,
          image_urls: item.image_urls,
        });
        setEvaluationResult(result);
        setModalVisible(true);
        console.log('Price evaluation result:', result);
      } catch (error) {
        console.error('Error evaluating price:', error);
      }
    }
  };

  const generateLocationSuggestions = async () => {
    if (!buyerLocation) {
      Alert.alert('Unable to fetch buyer location');
      return;
    }

    setLoadingLocations(true);

    const payload = {
      lat1: buyerLocation.lat,
      lon1: buyerLocation.lon,
      lat2: sellerLongLat[0],
      lon2: sellerLongLat[1],
    };
    console.log(payload);
    try {
      const result = await ApiService.generateLocationSuggestions(payload);
      console.log('Location suggestions:', result);

      const topLocations = result.data.slice(0, 3);
      setLocationSuggestions(topLocations);

      const locationMessage: Message = {
        id: Date.now().toString(),
        text: `Suggested Locations:\n\n${topLocations.map((location: any) => location.SuitableLocationName).join('\n')}`,
        type: 'ai',
        sender: 'system',
      };
      setMessages((prev) => [...prev, locationMessage]);
      setLocationProcessed(true);

      // Mark meetup as agreed and generate OTP
      await ApiService.updateChat(item.chat_id, { 'meetup.agreed': true });
      console.log('Meetup agreed and OTP generated');
    } catch (error) {
      console.error('Error generating location suggestions:', error);
    } finally {
      setLoadingLocations(false);
    }
  };

  const sendMessage = async () => {
    if (input.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: input,
        type: 'sent',
        sender: user!.email,
      };
      setMessages((prev) => [...prev, newMessage]);
      setInput('');

      try {
        await ApiService.sendMessage(item.chat_id, { sender: user!.email, text: input });
        console.log('Message sent');

        // Check if the message contains a price
        if (input.match(/€\d+/)) {
          console.log('Doing it!');
          evaluatePrice(input);
        }
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  const agreePrice = async () => {
    const priceMessages = messages.filter((message) => message.text.includes('€'));
    if (priceMessages.length > 0) {
      const lastPriceMessage = priceMessages[priceMessages.length - 1];
      const priceMatch = lastPriceMessage.text.match(/€(\d+)/);
      if (priceMatch) {
        const price = parseInt(priceMatch[1], 10);
        setAgreedPrice(price);
        setNegotiationAgreed(true);

        try {
          await ApiService.updateChat(item.chat_id, { 'meetup.price': price });
          console.log('Agreed price updated');
        } catch (error) {
          console.error('Error updating agreed price:', error);
        }
      }
    }
  };

  const fetchPaymentIntent = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          line_items: [
            {
              price_data: {
                currency: 'eur',
                product_data: { name: item.title },
                unit_amount: agreedPrice! * 100, // assuming item.price is in Euros
              },
              quantity: 1,
            },
          ],
          // Optionally, you can pass a return_url for next actions if needed.
          return_url: 'http://172.16.16.75:8000/success',
        }),
      });
      const { clientSecret, error } = await response.json();
      if (error) {
        console.error('Error from backend:', error);
        return;
      }
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Trade Sure',
      });
      if (initError) {
        console.error(initError);
        return;
      }
      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        console.error(presentError);
      } else {
        alert('Payment complete!');
        setIsPaid(true);

        try {
          await ApiService.updateChat(item.chat_id, { 'meetup.agreed': true });
          const getChat = await ApiService.getChatMessages(item.chat_id);
          const otpData = getChat.otp ?? '1234';
          navigation.navigate('DisplayQRPage', { value: otpData.token ?? '12345' });
          console.log('Item marked as paid');
        } catch (error) {
          console.error('Error marking item as paid:', error);
        }
      }
    } catch (error) {
      console.error('Error fetching payment intent:', error);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => {
    let containerStyle: any = styles.messageReceived;
    let textStyle = styles.messageTextReceived;
    if (item.type === 'sent') {
      containerStyle = styles.messageSent;
      textStyle = styles.messageTextSent;
    } else if (item.type === 'ai') {
      containerStyle = styles.messageAI;
      textStyle = styles.messageTextAI;
    }
    return (
      <View style={[styles.messageContainer, containerStyle]}>
        <Text style={textStyle}>{item.text}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Text style={styles.header}>Chat about {item.title}</Text>
      <Text style={styles.itemDescription}>
        {item.desc || 'This item is in excellent condition and available for immediate sale.'}
      </Text>
      <FlatList
        data={messages}
        keyExtractor={(msg) => msg.id}
        renderItem={renderMessage}
        style={styles.messageList}
        contentContainerStyle={{ paddingVertical: 8 }}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
      {!negotiationAgreed && (
        <TouchableOpacity style={styles.agreeButton} onPress={agreePrice}>
          <Text style={styles.agreeButtonText}>Agree Price</Text>
        </TouchableOpacity>
      )}
      {negotiationAgreed && !locationProcessed && (
        <TouchableOpacity
          style={styles.locationButton}
          onPress={generateLocationSuggestions}
          disabled={loadingLocations}>
          {loadingLocations ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.locationButtonText}>Generate Locations</Text>
          )}
        </TouchableOpacity>
      )}
      {negotiationAgreed && locationProcessed && !isPaid && (
        <TouchableOpacity style={styles.checkoutButton} onPress={fetchPaymentIntent}>
          <Text style={styles.checkoutButtonText}>Checkout</Text>
        </TouchableOpacity>
      )}
      {isPaid && user?.isSeller && (
        <TouchableOpacity style={styles.qrButton} onPress={() => navigation.navigate('DisplayQR')}>
          <Text style={styles.qrButtonText}>Display QR</Text>
        </TouchableOpacity>
      )}
      {isPaid && !user?.isSeller && (
        <TouchableOpacity
          style={styles.qrButton}
          onPress={() => navigation.navigate('ScanQRPage', { chatId: item.chat_id })}>
          <Text style={styles.qrButtonText}>Scan QR</Text>
        </TouchableOpacity>
      )}

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(!modalVisible);
        }}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Price Evaluation</Text>
          {evaluationResult && (
            <>
              <Text>Fair Market Value: €{evaluationResult.fairMarketValue}</Text>
              <Text>Good Deal: {evaluationResult.goodDeal ? 'Yes' : 'No'}</Text>
              <Text>Suggestion: {evaluationResult.suggestion}</Text>
            </>
          )}
          <TouchableOpacity
            style={[styles.button, styles.buttonClose]}
            onPress={() => setModalVisible(!modalVisible)}>
            <Text style={styles.textStyle}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      <Modal
        animationType="slide"
        transparent
        visible={locationSuggestions.length > 0}
        onRequestClose={() => {
          setLocationSuggestions([]);
        }}>
        <View style={styles.modalView}>
          <Text style={styles.modalText}>Suggested Locations</Text>
          {locationSuggestions.map((location, index) => (
            <View key={index} style={styles.suggestionContainer}>
              <Text style={styles.suggestionText}>{location.SuitableLocationName}</Text>
              <Text
                style={[styles.suggestionLink, { color: 'blue', textDecorationLine: 'underline' }]}
                onPress={() => Linking.openURL(location.SuitableLocationGoogleMapsLink)}>
                {location.SuitableLocationGoogleMapsLink}
              </Text>
            </View>
          ))}
          <TouchableOpacity
            style={[styles.button, styles.buttonClose]}
            onPress={() => setLocationSuggestions([])}>
            <Text style={styles.textStyle}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
  },
  header: {
    marginBottom: 4,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E90FF',
  },
  itemDescription: {
    marginBottom: 16,
    fontSize: 14,
    color: 'gray',
  },
  messageList: {
    flex: 1,
    marginBottom: 16,
  },
  messageContainer: {
    marginVertical: 4,
    padding: 10,
    borderRadius: 12,
    maxWidth: '75%',
  },
  messageSent: {
    alignSelf: 'flex-end',
    backgroundColor: '#DCF8C6',
  },
  messageTextSent: {
    color: '#000',
    fontSize: 16,
  },
  messageReceived: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F0F0',
  },
  messageTextReceived: {
    color: '#000',
    fontSize: 16,
  },
  messageAI: {
    alignSelf: 'center',
    backgroundColor: '#EDE7F6',
    borderWidth: 1,
    borderColor: '#B39DDB',
  },
  messageTextAI: {
    color: '#4A148C',
    fontStyle: 'italic',
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'gray',
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 16,
  },
  sendButton: {
    marginLeft: 8,
    borderRadius: 20,
    backgroundColor: '#1E90FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  sendButtonText: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 16,
  },
  agreeButton: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: '#32CD32',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  agreeButtonText: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  locationButton: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: '#FFA500',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  locationButtonText: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  checkoutButton: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: '#1E90FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  checkoutButtonText: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  qrButton: {
    marginTop: 16,
    borderRadius: 20,
    backgroundColor: '#1E90FF',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  qrButtonText: {
    fontWeight: 'bold',
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  button: {
    borderRadius: 20,
    padding: 10,
    elevation: 2,
    marginVertical: 5,
  },
  buttonClose: {
    backgroundColor: '#2196F3',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  suggestionContainer: {
    marginVertical: 10,
  },
  suggestionText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  suggestionLink: {
    fontSize: 14,
  },
});

export default ChatPage;
