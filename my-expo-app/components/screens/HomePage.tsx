import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import ApiService from '../../services/ApiService';

type Item = {
  appearance_cond: string;
  battery_cond: string;
  chat_id: string;
  date_of_purchase: string;
  image_urls: string[];
  price: string;
  product_id: string;
  ram_size: string;
  seller: string;
  storage: string;
  title: string;
  warranty: string;
};

export default function HomePage({ navigation }: { navigation: any }) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data: Item[] = await ApiService.getProducts();
        setItems(data);
      } catch (error) {
        console.error('Error fetching products:', error);
        Alert.alert('Error', 'Unable to fetch products. Please try again later.');
      }
    };

    fetchProducts();
  }, []);

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  const renderItem = ({ item }: { item: Item }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => navigation.navigate('Product', { item })}>
      <Image source={{ uri: item.image_urls[0] }} style={styles.image} />
      <View style={styles.textContainer}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.price}>€{item.price}</Text>
        {/* <Text style={styles.location}>{item.location}</Text> */}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.headerTitle}>Second Hand Items</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="Search items..."
        value={query}
        onChangeText={setQuery}
      />
      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.product_id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
  },
  headerTitle: {
    marginBottom: 8,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E90FF',
    textAlign: 'center',
  },
  searchInput: {
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  itemContainer: {
    marginBottom: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  image: {
    height: 200,
    width: '100%',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  textContainer: {
    padding: 12,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1E90FF',
    marginBottom: 4,
    textAlign: 'center',
  },
  location: {
    fontSize: 14,
    color: 'gray',
    textAlign: 'center',
  },
});
