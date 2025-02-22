import React from 'react';
import { View, Text } from 'react-native';

const Message = ({ message }: { message: any }) => {
  const timestamp = message.createdAt?.seconds
    ? new Date(message.createdAt.seconds * 1000).toLocaleTimeString()
    : new Date(message.createdAt).toLocaleTimeString();

  return (
    <View className="mb-2 rounded-lg bg-white p-3 shadow">
      <Text>{message.text}</Text>
      <Text className="mt-1 text-xs text-gray-500">{timestamp}</Text>
    </View>
  );
};

export default Message;
