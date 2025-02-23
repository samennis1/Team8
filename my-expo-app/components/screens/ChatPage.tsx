import { useStripe } from '@stripe/stripe-react-native';
import * as Location from 'expo-location';
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

import { AuthContext } from '../../context/AuthContext';
import ApiService from '../../services/ApiService';

type Message = {
  id: string;
  text: string;
  sender: string; // e.g. buyerEmail or sellerEmail
};

type Props = {
  route: any;
  navigation: any;
};

const AIPurchaseScreen = ({ route, navigation }: Props) => {
  const { user } = useContext(AuthContext);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const { item } = route.params; // e.g., { title, desc, price, chat_id, sellerEmail, etc. }

  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [aiPriceEvaluation, setAiPriceEvaluation] = useState<any>(null);

  // Price negotiation
  const [agreedPrice, setAgreedPrice] = useState<number | null>(null);
  const [showCustomPriceField, setShowCustomPriceField] = useState(false);
  const [priceInput, setPriceInput] = useState('');

  // Location
  const [locationSuggestion, setLocationSuggestion] = useState<any>(null);

  // Payment
  const [isPaid, setIsPaid] = useState(false);

  // OTP
  const [otp, setOtp] = useState('');

  // Fade in animation for the “Price Confirmed!” banner
  const bannerOpacity = useRef(new Animated.Value(0)).current;

  // -------------- EFFECTS ---------------

  // On mount, fetch initial chat messages + AI suggestion + user location permission
  useEffect(() => {
    fetchMessages(); // get last messages
    fetchAIprice();
    const intervalId = setInterval(fetchMessages, 5000); // poll for new messages every 5s
    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMessages = async () => {
    if (!item.chat_id) return;
    try {
      const data = await ApiService.getChatMessages(item.chat_id);
      // data: { messages, meetup, otp }
      const { messages = [], meetup, otp: chatOtp } = data;

      // Limit to last 5
      const lastFive = messages.slice(-5);
      setMessages(lastFive);

      // If a price was already accepted
      if (meetup?.price) {
        setAgreedPrice(meetup.price);
      }
      // If location is already set
      if (meetup?.agreed && meetup?.location) {
        setLocationSuggestion(meetup.location);
      }
      // If there is an OTP
      if (chatOtp?.token) {
        setOtp(chatOtp.token);
      }
      // If the item is paid
      // (some workflows store a stage, or simply check if OTP exists)
      // In your original code, you also might mark item as paid in the doc:
      // e.g. if (meetup.stage === 'paid') setIsPaid(true)
      // For simplicity, checking the otp might suffice:
      if (chatOtp?.token) {
        // optional: check if payment is done
        setIsPaid(true);
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

  // Only SELLER can accept the last price (found in a message or AI suggestion)
  // We'll parse the last found price in messages if it matches "€NNN"
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
      // If there's a custom typed price, use that. Otherwise parse from last message or AI suggestion
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

      // Update Firestore doc
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
      // fetch again to show new message
      fetchMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      Alert.alert('Error', 'Cannot send message, please try again.');
    } finally {
      setLoading(false);
    }
  };

  // -------------- LOCATION SUGGESTION ---------------
  const handleLocationSuggestion = async () => {
    try {
      setLoading(true);
      // Retrieve buyer location
      await Location.requestForegroundPermissionsAsync();
      const location = await Location.getCurrentPositionAsync({});
      const buyerLat = location.coords.latitude;
      const buyerLon = location.coords.longitude;

      // For the example, we have a static seller location in code
      const sellerLat = 53.337902;
      const sellerLon = -6.257732;

      const payload = {
        lat1: buyerLat,
        lon1: buyerLon,
        lat2: sellerLat,
        lon2: sellerLon,
      };
      const result = await ApiService.generateLocationSuggestions(payload);

      // Maybe take just the first suggestion
      if (result?.data?.length) {
        setLocationSuggestion(result.data[0]);
      }
      // Mark “meetup.agreed” in the chat doc. This also auto-generates OTP on your back end
      if (item.chat_id) {
        await ApiService.updateChat(item.chat_id, {
          'meetup.agreed': true,
          'meetup.location': result?.data?.[0],
        });
        // The new OTP might be generated
        const chatInfo = await ApiService.getChatMessages(item.chat_id);
        if (chatInfo?.otp?.token) {
          setOtp(chatInfo.otp.token);
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Could not generate location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
      const response = await fetch('http://localhost:8000/api/create-payment-intent', {
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
        // Payment success
        Alert.alert('Success', 'Payment complete!');
        setIsPaid(true);
        // Re-fetch chat doc to get OTP if newly generated
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        <Text style={styles.header}>{item.title}</Text>
        <Text style={styles.subHeader}>{item.desc || 'A great item waiting to be yours.'}</Text>
        {/* AI-suggested Price Banner */}
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
        {/* Price Confirmed banner */}
        <Animated.View style={[styles.confirmedBanner, { opacity: bannerOpacity }]}>
          <Text style={styles.confirmedBannerText}>Price Confirmed!</Text>
        </Animated.View>
        {/* If price accepted, show it */}
        {agreedPrice ? (
          <View style={styles.priceConfirmedBox}>
            <Text style={styles.priceConfirmedText}>Agreed Price: €{agreedPrice}</Text>
          </View>
        ) : (
          // If not accepted, show a small “Seller accept price” area if user isSeller
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
        {/* If we have an agreed price, user can get location next (or if location is not set yet) */}
        {agreedPrice && !locationSuggestion && (
          <TouchableOpacity style={styles.locationButton} onPress={handleLocationSuggestion}>
            <Text style={styles.locationButtonText}>Get AI-Recommended Meetup</Text>
          </TouchableOpacity>
        )}
        {/* Show location suggestion once we have it */}
        {locationSuggestion && (
          <View style={styles.locationBox}>
            <Text style={styles.locationTitle}>Meetup Location:</Text>
            <Text style={styles.locationText}>{locationSuggestion.SuitableLocationName}</Text>
          </View>
        )}
        {/* Once location is suggested, let buyer pay if not already paid */}
        {locationSuggestion && !isPaid && !user?.isSeller && (
          <TouchableOpacity style={styles.payButton} onPress={handleCheckout}>
            <Text style={styles.payButtonText}>Complete Payment</Text>
          </TouchableOpacity>
        )}
        // Inside your render method (or return block)
        {/* If payment is complete, show next step: display or scan QR */}
        {isPaid && user?.isSeller && (
          <TouchableOpacity style={styles.qrButton} onPress={handleShowQR}>
            <Text style={styles.qrButtonText}>Display QR for Buyer</Text>
          </TouchableOpacity>
        )}
        {isPaid && !user?.isSeller && (
          <TouchableOpacity style={styles.qrButton} onPress={handleScanQR}>
            <Text style={styles.qrButtonText}>Scan Seller’s QR</Text>
          </TouchableOpacity>
        )}
        {/* Minimal Chat - last 5 messages */}
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
        {/* Input row for new messages */}
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

export default AIPurchaseScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDFDFD',
    paddingTop: 60,
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
    maxHeight: 200, // limit the space used by chat
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
