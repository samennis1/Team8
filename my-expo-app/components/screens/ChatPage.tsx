import { useStripe } from '@stripe/stripe-react-native';
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
} from 'react-native';

import { AuthContext } from '../../context/AuthContext';
import ApiService from '../../services/ApiService';

// static seller due to time constraints
const sellerLongLat = [53.337902, -6.257732];

type Message = { id: string; text: string; type: 'sent' | 'received' | 'ai' };

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

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const data = await ApiService.getChatMessages(item.id);
        if (data.messages) {
          setMessages(data.messages);

          data.messages.forEach((message: Message) => {
            if (message.text.includes('Negotiation Agreed')) {
              setNegotiationAgreed(true);
            }
            if (message.text.includes('Suggested Locations')) {
              setLocationProcessed(true);
            }
            if (!negotiationAgreed && message.text.includes('€')) {
              evaluatePrice(message.text);
            }
          });
        } else {
          console.error('No messages found in response:', data);
        }
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };

    fetchMessages();
  }, []);

  const evaluatePrice = async (messageText: string) => {
    const priceMatch = messageText.match(/€(\d+)/);
    if (priceMatch) {
      const price = parseInt(priceMatch[1], 10);
      const payload = {
        desc: item.description,
        price,
        seller: item.sellerName,
        image_urls: item.imageUrls,
      };

      try {
        const result = await ApiService.evaluatePrice(payload);
        console.log('Price evaluation result:', result);
      } catch (error) {
        console.error('Error evaluating price:', error);
      }
    }
  };

  const generateLocationSuggestions = async () => {
    const payload = {
      lat1: item.buyerLat,
      lon1: item.buyerLon,
      lat2: sellerLongLat[1],
      lon2: sellerLongLat[0],
    };

    try {
      const result = await ApiService.generateLocationSuggestions(payload);
      console.log('Location suggestions:', result);

      const locationMessage: Message = {
        id: Date.now().toString(),
        text: `Suggested Locations: ${JSON.stringify(result.data)}`,
        type: 'ai',
      };
      setMessages((prev) => [...prev, locationMessage]);
      setLocationProcessed(true);
    } catch (error) {
      console.error('Error generating location suggestions:', error);
    }
  };

  const sendMessage = async () => {
    if (input.trim()) {
      const newMessage: Message = { id: Date.now().toString(), text: input, type: 'sent' };
      setMessages((prev) => [...prev, newMessage]);
      setInput('');

      try {
        await ApiService.sendMessage(item.id, { sender: 'user', text: input });
        console.log('Message sent');
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
          await ApiService.updateItem(item.id, { agreedPrice: price });
          console.log('Agreed price updated');
        } catch (error) {
          console.error('Error updating agreed price:', error);
        }
      }
    }
  };

  const fetchPaymentIntent = async () => {
    try {
      const payload = {
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: { name: item.title },
              unit_amount: agreedPrice! * 100,
            },
            quantity: 1,
          },
        ],
        return_url: 'https://trade-backend.kobos.studio',
      };

      const { id } = await ApiService.createCheckoutSession(payload);
      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: id,
        merchantDisplayName: 'Trade Sure',
      });
      if (error) {
        console.error(error);
        return;
      }
      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        console.error(presentError);
      } else {
        alert('Payment complete!');
        setIsPaid(true);

        try {
          await ApiService.updateItem(item.id, { isPaid: true });
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
        {item.description ||
          'This item is in excellent condition and available for immediate sale.'}
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
        <TouchableOpacity style={styles.locationButton} onPress={generateLocationSuggestions}>
          <Text style={styles.locationButtonText}>Generate Locations</Text>
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
        <TouchableOpacity style={styles.qrButton} onPress={() => navigation.navigate('ScanQR')}>
          <Text style={styles.qrButtonText}>Scan QR</Text>
        </TouchableOpacity>
      )}
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
});

export default ChatPage;
