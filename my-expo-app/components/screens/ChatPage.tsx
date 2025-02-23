import React, { useState, useEffect, useContext, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Animated,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  FlatList,
} from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import * as Location from 'expo-location';
import { AuthContext } from '../../context/AuthContext';
import ApiService from '../../services/ApiService';

type Message = {
  id: string;
  text: string;
  sender: string;
};

type Props = {
  route: any;
  navigation: any;
};

const AIPurchaseScreen = ({ route, navigation }: Props) => {
  const { user } = useContext(AuthContext);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const { item } = route.params;

  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [aiPriceEvaluation, setAiPriceEvaluation] = useState<any>(null);
  const [agreedPrice, setAgreedPrice] = useState<number | null>(null);
  const [showCustomPriceField, setShowCustomPriceField] = useState(false);
  const [priceInput, setPriceInput] = useState('');
  const [locationSuggestion, setLocationSuggestion] = useState<any>(null);
  const [isPaid, setIsPaid] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpConfirmed, setOtpConfirmed] = useState(false);
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  // Payment sheet setup
  const [paymentSheetReady, setPaymentSheetReady] = useState(false);

  useEffect(() => {
    fetchMessages();
    fetchAIprice();
    const intervalId = setInterval(fetchMessages, 5000);
    return () => clearInterval(intervalId);
  }, []);

  const initializePaymentSheet = async (price: number) => {
    try {
      const response = await fetch('https://trade-backend.kobos.studio/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: price * 100, // Convert to cents
          currency: 'eur',
        }),
      });

      const { paymentIntent, ephemeralKey, customer } = await response.json();

      const { error } = await initPaymentSheet({
        merchantDisplayName: "TradeSure",
        paymentIntentClientSecret: paymentIntent,
        defaultBillingDetails: {
          name: user?.email || '',
        },
      });

      if (error) {
        console.error('Payment sheet init error:', error);
        return false;
      }

      setPaymentSheetReady(true);
      return true;
    } catch (error) {
      console.error('Failed to initialize payment sheet:', error);
      return false;
    }
  };

  const handlePayment = async () => {
    if (!agreedPrice) {
      Alert.alert('Error', 'Please wait for the seller to accept a price first.');
      return;
    }

    try {
      setLoading(true);
      
      // Initialize payment sheet
      const initialized = await initializePaymentSheet(agreedPrice);
      if (!initialized) {
        Alert.alert('Error', 'Could not initialize payment. Please try again.');
        return;
      }

      // Present payment sheet
      const { error: presentError } = await presentPaymentSheet();
      
      if (presentError) {
        Alert.alert('Error', presentError.message);
        return;
      }

      // Payment successful
      setIsPaid(true);
      Alert.alert('Success', 'Payment completed successfully!');

      // Update chat with payment status and proceed with location
      if (item.chat_id) {
        await ApiService.updateChat(item.chat_id, {
          'payment.status': 'completed',
          'payment.amount': agreedPrice,
          'payment.date': new Date().toISOString(),
        });
        
        // Now proceed with location suggestion
        await handleLocationSuggestion();
      }

    } catch (error) {
      console.error('Payment error:', error);
      Alert.alert('Error', 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Existing methods with payment integration
  const handleLocationSuggestion = async () => {
    if (!user?.isSeller && !isPaid) {
      Alert.alert('Payment Required', 'Please complete the payment first.');
      return;
    }

    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      
      const payload = {
        lat1: location.coords.latitude,
        lon1: location.coords.longitude,
        lat2: 53.337902, // Example seller coordinates
        lon2: -6.257732,
      };

      const result = await ApiService.generateLocationSuggestions(payload);

      if (result?.data?.length) {
        setLocationSuggestion(result.data[0]);
        
        if (item.chat_id) {
          await ApiService.updateChat(item.chat_id, {
            'meetup.agreed': true,
            'meetup.location': result.data[0],
          });
        }
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Could not generate location suggestion.');
    } finally {
      setLoading(false);
    }
  };

  // -------------- EFFECTS ---------------

  useEffect(() => {
    fetchMessages();
    fetchAIprice();
    const intervalId = setInterval(fetchMessages, 5000);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMessages = async () => {
    if (!item.chat_id) return;
    try {
      const data = await ApiService.getChatMessages(item.chat_id);
      const { messages = [], meetup, otp: chatOtp } = data;

      const lastFive = messages.slice(-5);
      setMessages(lastFive);

      if (meetup?.price) {
        setAgreedPrice(meetup.price);
      }
      if (meetup?.agreed && meetup?.location) {
        setLocationSuggestion(meetup.location);
      }
      if (chatOtp?.token) {
        setOtp(chatOtp.token);
      }
      if (chatOtp?.token) {
        setIsPaid(true);
      }
      // Add check for OTP confirmation
      if (chatOtp?.confirmed) {
        setOtpConfirmed(true);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchAIprice = async () => {
    if (!item.price) return;
    try {
      setLoading(true);
      const payload = {
        desc: item.desc,
        price: parseInt(item.price, 10) || 0,
        seller: item.sellerEmail || 'Unknown seller',
        image_urls: item.image_urls || [],
      };
      const result = await ApiService.evaluatePrice(payload);
      setAiPriceEvaluation(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // -------------- PRICE NEGOTIATION ---------------

  const fadeInBanner = () => {
    Animated.timing(bannerOpacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(bannerOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 2000);
    });
  };

  const parseLastProposedPrice = (): number | null => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const match = msg.text.match(/€(\d+)/);
      if (match) {
        return parseInt(match[1], 10);
      }
    }
    return null;
  };

  const handleSellerAcceptPrice = async () => {
    if (!item.chat_id) return;
    try {
      setLoading(true);
      let finalPrice = 0;
      if (priceInput) {
        finalPrice = parseInt(priceInput, 10);
      } else {
        const parsed = parseLastProposedPrice();
        if (parsed) {
          finalPrice = parsed;
        } else if (aiPriceEvaluation?.fairMarketValue) {
          finalPrice = aiPriceEvaluation.fairMarketValue;
        } else {
          finalPrice = parseInt(item.price, 10) || 0;
        }
      }
      setAgreedPrice(finalPrice);

      await ApiService.updateChat(item.chat_id, {
        'meetup.price': finalPrice,
      });

      fadeInBanner();
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not accept price.');
    } finally {
      setLoading(false);
    }
  };

  // -------------- CHAT & MESSAGING ---------------
  const handleSendMessage = async () => {
    if (!input.trim() || !item.chat_id) return;
    try {
      setLoading(true);
      await ApiService.sendMessage(item.chat_id, {
        sender: user!.email,
        text: input.trim(),
      });
      setInput('');
      fetchMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      Alert.alert('Error', 'Cannot send message, please try again.');
    } finally {
      setLoading(false);
    }
  };

  // -------------- LOCATION SUGGESTION ---------------

  // -------------- PAYMENT ---------------
  const handleCheckout = async () => {
    if (!agreedPrice) {
      Alert.alert('Error', 'We do not have a final price yet.');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: { name: item.title },
              unit_amount: agreedPrice * 100,
            },
            quantity: 1,
          },
        ],
        return_url: 'http://your-server-url.com/success',
      };
      const response = await fetch('https://trade-backend.kobos.studio/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const { clientSecret, error } = await response.json();
      if (error) throw new Error(error);

      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Trade Sure',
      });
      if (initError) throw new Error(initError.message);

      const { error: presentError } = await presentPaymentSheet();
      if (presentError) {
        console.error('Payment canceled or error:', presentError);
      } else {
        Alert.alert('Success', 'Payment complete!');
        setIsPaid(true);
        if (item.chat_id) {
          const chatInfo = await ApiService.getChatMessages(item.chat_id);
          const otpData = chatInfo.otp || { token: '12345' };
          setOtp(otpData.token);
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // -------------- QR ---------------
  const handleShowQR = () => {
    if (!otp) {
      Alert.alert('Missing OTP', 'No OTP found. Please confirm payment first.');
      return;
    }
    navigation.navigate('DisplayQRPage', { value: otp });
  };

  const handleScanQR = () => {
    navigation.navigate('ScanQRPage', { chatId: item.chat_id });
  };

  // -------------- RENDER ---------------
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#666" />
        <Text style={styles.loadingText}>Processing…</Text>
      </View>
    );
  }

  if (otpConfirmed) {
    return (
      <View style={styles.completionContainer}>
        <Text style={styles.completionText}>
          Transaction completed, funds will now be released to the seller's bank account via Stripe Connect
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Main')}>
          <Text style={styles.backButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Text style={styles.header}>{item.title}</Text>
        <Text style={styles.subHeader}>{item.desc || 'A great item waiting to be yours.'}</Text>
        {agreedPrice && !locationSuggestion && !user?.isSeller && !isPaid && (
          <TouchableOpacity 
            style={styles.payButton} 
            onPress={handlePayment}
            disabled={loading}>
            <Text style={styles.payButtonText}>
              {loading ? 'Processing...' : `Pay €${agreedPrice}`}
            </Text>
          </TouchableOpacity>
        )}
        {agreedPrice && !locationSuggestion && (user?.isSeller || isPaid) && (
          <TouchableOpacity 
            style={styles.locationButton} 
            onPress={handleLocationSuggestion}>
            <Text style={styles.locationButtonText}>Get AI-Recommended Meetup</Text>
          </TouchableOpacity>
        )}
        {aiPriceEvaluation && (
          <View style={styles.aiBanner}>
            <Text style={styles.aiBannerText}>
              AI-suggested Fair Value: €{aiPriceEvaluation?.fairMarketValue || item.price}
            </Text>
            <Text style={styles.aiBannerSubText}>
              {aiPriceEvaluation?.suggestion || 'Looks like a decent deal overall.'}
            </Text>
          </View>
        )}
        <Animated.View style={[styles.confirmedBanner, { opacity: bannerOpacity }]}>
          <Text style={styles.confirmedBannerText}>Price Confirmed!</Text>
        </Animated.View>
        {agreedPrice ? (
          <View style={styles.priceConfirmedBox}>
            <Text style={styles.priceConfirmedText}>Agreed Price: €{agreedPrice}</Text>
          </View>
        ) : (
          <>
            {user?.isSeller ? (
              <>
                {showCustomPriceField ? (
                  <>
                    <TextInput
                      style={styles.priceInput}
                      keyboardType="number-pad"
                      placeholder="Enter your final price"
                      placeholderTextColor="#aaa"
                      onChangeText={setPriceInput}
                      value={priceInput}
                    />
                    <TouchableOpacity
                      style={styles.confirmButton}
                      onPress={handleSellerAcceptPrice}>
                      <Text style={styles.confirmButtonText}>Accept as Final</Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <>
                    <TouchableOpacity style={styles.acceptButton} onPress={handleSellerAcceptPrice}>
                      <Text style={styles.acceptButtonText}>
                        Accept Last Proposed (or AI) Price
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.altButton, { marginTop: 10 }]}
                      onPress={() => setShowCustomPriceField(true)}>
                      <Text style={styles.altButtonText}>Set a Different Price</Text>
                    </TouchableOpacity>
                  </>
                )}
              </>
            ) : (
              <Text style={styles.waitingText}>Waiting for the seller to accept a price...</Text>
            )}
          </>
        )}
        {agreedPrice && !locationSuggestion && (
          <TouchableOpacity style={styles.locationButton} onPress={handleLocationSuggestion}>
            <Text style={styles.locationButtonText}>Get AI-Recommended Meetup</Text>
          </TouchableOpacity>
        )}
        {locationSuggestion && (
          <View style={styles.locationBox}>
            <Text style={styles.locationTitle}>Meetup Location:</Text>
            <Text style={styles.locationText}>{locationSuggestion.SuitableLocationName}</Text>
          </View>
        )}
        {locationSuggestion && !isPaid && !user?.isSeller && (
          <TouchableOpacity style={styles.payButton} onPress={handleCheckout}>
            <Text style={styles.payButtonText}>Complete Payment</Text>
          </TouchableOpacity>
        )}
        {isPaid && user?.isSeller && (
          <TouchableOpacity style={styles.qrButton} onPress={handleShowQR}>
            <Text style={styles.qrButtonText}>Display QR for Buyer</Text></TouchableOpacity>
        )}
        {isPaid && !user?.isSeller && (
          <TouchableOpacity style={styles.qrButton} onPress={handleScanQR}>
            <Text style={styles.qrButtonText}>Scan Seller's QR</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.chatHeader}>Chat (last 5 messages):</Text>
        <FlatList
          data={messages}
          keyExtractor={(msg) => msg.id}
          renderItem={({ item: msg }) => {
            const isOwn = msg.sender === user?.email;
            return (
              <View
                style={[styles.chatBubble, isOwn ? styles.chatBubbleRight : styles.chatBubbleLeft]}>
                <Text style={styles.chatBubbleText}>{msg.text}</Text>
              </View>
            );
          }}
          style={styles.chatList}
          contentContainerStyle={{ paddingVertical: 10 }}
        />
        <View style={styles.chatInputContainer}>
          <TextInput
            style={styles.chatInput}
            placeholder="Type a message or propose price (e.g. '€450')"
            placeholderTextColor="#888"
            value={input}
            onChangeText={setInput}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSendMessage}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
    paddingTop: 60,
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDFDFD',
    padding: 20,
  },
  completionText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1C1C1E',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#888',
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    textAlign: 'center',
  },
  subHeader: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  aiBanner: {
    backgroundColor: '#E7F7FF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  aiBannerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  aiBannerSubText: {
    fontSize: 14,
    color: '#007AFF',
    marginTop: 4,
  },
  confirmedBanner: {
    backgroundColor: '#4CD964',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    alignSelf: 'center',
  },
  confirmedBannerText: {
    color: '#fff',
    fontWeight: '600',
  },
  priceConfirmedBox: {
    alignSelf: 'center',
    marginVertical: 8,
  },
  priceConfirmedText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
  },
  acceptButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  acceptButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
  altButton: {
    backgroundColor: '#D1D1D6',
    paddingVertical: 12,
    borderRadius: 12,
  },
  altButtonText: {
    color: '#111',
    textAlign: 'center',
    fontWeight: '500',
    fontSize: 15,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#C7C7CC',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginVertical: 10,
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#34C759',
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
  waitingText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginVertical: 8,
  },
  locationButton: {
    backgroundColor: '#FF9500',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 16,
  },
  locationButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
  locationBox: {
    backgroundColor: '#EFEFEF',
    padding: 14,
    borderRadius: 12,
    marginVertical: 12,
  },
  locationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 16,
    color: '#333',
  },
  payButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  payButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 16,
  },
  qrButton: {
    backgroundColor: '#8E8E93',
    borderRadius: 12,
    paddingVertical: 14,
    marginTop: 8,
  },
  qrButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  chatHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 4,
  },
  chatList: {
    maxHeight: 200,
    marginBottom: 8,
  },
  chatBubble: {
    padding: 10,
    borderRadius: 8,
    marginVertical: 4,
    maxWidth: '75%',
  },
  chatBubbleLeft: {
    backgroundColor: '#E5E5EA',
    alignSelf: 'flex-start',
  },
  chatBubbleRight: {
    backgroundColor: '#007AFF',
    alignSelf: 'flex-end',
  },
  chatBubbleText: {
    color: '#fff',
  },
  chatInputContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  chatInput: {
    flex: 1,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default AIPurchaseScreen;