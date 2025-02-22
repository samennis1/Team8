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

const ChatPage = ({ route }: { route: any }) => {
  const { item } = route.params;
  const [messages, setMessages] = useState<{ id: string; text: string }[]>([]);
  const [input, setInput] = useState('');

  const sendMessage = () => {
    if (input.trim()) {
      setMessages((prev) => [...prev, { id: Date.now().toString(), text: input }]);
      setInput('');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Text style={styles.title}>Chat about {item.title}</Text>
      <FlatList
        data={messages}
        keyExtractor={(msg) => msg.id}
        renderItem={({ item }) => (
          <View style={styles.messageContainer}>
            <Text>{item.text}</Text>
          </View>
        )}
        style={styles.messageList}
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
    marginTop: 0,
    marginBottom: 50,
  },
  title: {
    marginBottom: 16,
    fontSize: 24,
    fontWeight: 'bold',
  },
  messageList: {
    flex: 1,
    marginBottom: 16,
  },
  messageContainer: {
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'gray',
    padding: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'gray',
    padding: 12,
  },
  sendButton: {
    marginLeft: 8,
    borderRadius: 8,
    backgroundColor: 'blue',
    padding: 12,
  },
  sendButtonText: {
    fontWeight: 'bold',
    color: 'white',
  },
});

export default ChatPage;
