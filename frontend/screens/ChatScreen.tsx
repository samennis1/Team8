import { collection, addDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import React, { useState, useEffect } from 'react';
import { View, FlatList, TextInput, TouchableOpacity, Text } from 'react-native';

import Message from '../components/Message';
import { db } from '../firebaseConfig';

const ChatScreen = ({ route }: { route: any }) => {
  const { productId } = route.params;
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'chats', productId, 'messages'), orderBy('createdAt'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(msgs);
    });
    return unsubscribe;
  }, [productId]);

  const sendMessage = async () => {
    if (input.trim() === '') return;
    await addDoc(collection(db, 'chats', productId, 'messages'), {
      text: input,
      createdAt: new Date(),
    });
    setInput('');
  };

  return (
    <View className="flex-1 bg-gray-100 p-4">
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <Message message={item} />}
        showsVerticalScrollIndicator={false}
      />
      <View className="mt-4 flex-row items-center">
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type your message..."
          className="flex-1 rounded-l-lg border border-gray-300 p-3"
        />
        <TouchableOpacity onPress={sendMessage} className="rounded-r-lg bg-blue-500 p-3">
          <Text className="font-semibold text-white">Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ChatScreen;
