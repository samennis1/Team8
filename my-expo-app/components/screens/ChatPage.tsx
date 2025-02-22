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

  // Pre-populate with three different message types
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Text style={styles.header}>Chat about {item.title}</Text>

      {/* Static product description */}
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
});

export default ChatPage;
