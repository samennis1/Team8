import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';

import { RootStackParamList } from '../navigation/StackNavigator';

type Listing = {
  id: string;
  title: string;
  image: string;
  description: string;
  price: string;
};

const listings: Listing[] = [
  {
    id: '1',
    title: 'Vintage Camera',
    image: 'https://source.unsplash.com/random/400x300?camera',
    description: 'A classic vintage camera in great condition',
    price: '$120',
  },
  {
    id: '2',
    title: 'Handcrafted Watch',
    image: 'https://source.unsplash.com/random/400x300?watch',
    description: 'A stylish handcrafted watch',
    price: '$250',
  },
  {
    id: '3',
    title: 'Retro Bicycle',
    image: 'https://source.unsplash.com/random/400x300?bicycle',
    description: 'A retro bike for urban adventures',
    price: '$300',
  },
];

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  const renderItem = ({ item }: { item: Listing }) => (
    <TouchableOpacity
      onPress={() => navigation.navigate('Product', { product: item })}
      className="mb-4 rounded-lg bg-white p-4 shadow">
      <Image source={{ uri: item.image }} className="mb-2 h-40 w-full rounded-lg" />
      <Text className="text-xl font-semibold">{item.title}</Text>
      <Text className="text-gray-500">{item.price}</Text>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-100 p-4">
      <Text className="mb-4 text-2xl font-bold">Listings</Text>
      <FlatList
        data={listings}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

export default HomeScreen;
