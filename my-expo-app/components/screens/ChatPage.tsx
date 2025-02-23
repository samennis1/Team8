import { useStripe } from '@stripe/stripe-react-native';
import React, { useState } from 'react';
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

type Message = { id: string; text: string; type: 'sent' | 'received' | 'ai' };

const ChatPage = ({ route }: { route: any }) => {
  const { item } = route.params;
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hi there! Is the item still available?', type: 'received' },
    { id: '2', text: 'Yes, it is available. I can answer any questions.', type: 'sent' },
    {
      id: '3',
      text: 'AI Assistant: Please provide additional details about your query.',
      type: 'ai',
    },
  ]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (input.trim()) {
      setMessages((prev) => [...prev, { id: Date.now().toString(), text: input, type: 'sent' }]);
      setInput('');
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

  const fetchPaymentIntent = async () => {
    console.log(
      JSON.stringify({
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: { name: item.title },
              unit_amount: 1000, // assuming item.price is in Euros
              quantity: 1,
            },
          },
        ],
        // Optionally, you can pass a return_url for next actions if needed.
        return_url: 'https://trade-backend.kobos.studio',
      })
    );
    try {
      const payload = {
        line_items: [
          {
            price_data: {
              currency: 'eur',
              product_data: { name: item.title },
              unit_amount: 10000, // Ensure item.price is defined and numeric
            },
            quantity: 1, // Move quantity here
          },
        ],
        return_url: 'https://trade-backend.kobos.studio',
      };

      console.log(JSON.stringify(payload));
      const response = await fetch('https://trade-backend.kobos.studio/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
      }
    } catch (error) {
      console.error('Error fetching payment intent:', error);
    }
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
      <TouchableOpacity style={styles.checkoutButton} onPress={fetchPaymentIntent}>
        <Text style={styles.checkoutButtonText}>Checkout</Text>
      </TouchableOpacity>
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
});

export default ChatPage;
