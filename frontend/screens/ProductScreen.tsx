import { useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { ScrollView, View, Text, Image, TouchableOpacity } from 'react-native';

import { RootStackParamList } from '../navigation/StackNavigator';

const ProductScreen = () => {
  const route = useRoute();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { product } = route.params as { product: any };

  return (
    <ScrollView className="flex-1 bg-gray-100 p-4">
      <Image source={{ uri: product.image }} className="mb-4 h-60 w-full rounded-lg" />
      <Text className="mb-2 text-3xl font-bold">{product.title}</Text>
      <Text className="mb-2 text-xl text-gray-600">{product.price}</Text>
      <Text className="mb-4">{product.description}</Text>
      <TouchableOpacity
        onPress={() => navigation.navigate('Chat', { productId: product.id })}
        className="rounded bg-blue-500 px-6 py-3">
        <Text className="text-center font-semibold text-white">Chat with Seller</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default ProductScreen;
