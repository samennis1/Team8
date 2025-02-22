import React, { useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const items = [
  {
    id: '1',
    title: 'Macbook Pro 2021',
    image:
      'https://media.donedeal.ie/eyJidWNrZXQiOiJkb25lZGVhbC5pZS1waG90b3MiLCJlZGl0cyI6eyJ0b0Zvcm1hdCI6IndlYnAiLCJyZXNpemUiOnsiZml0IjoiaW5zaWRlIiwid2lkdGgiOjEyMDAsImhlaWdodCI6MTIwMH19LCJrZXkiOiJwaG90b18zMzYwNjU2NzEifQ==?signature=1f9a02c1ba3f29c95f6d3bff52a409f32232178f70d8b30d299e6f2cab636d68',
    description: 'High-performance Macbook Pro in pristine condition.',
    price: '€1,200',
    location: 'Cork, County Cork',
  },
  {
    id: '2',
    title: 'iPhone 15 Pro Max',
    image:
      'https://images.pexels.com/photos/18525574/pexels-photo-18525574/free-photo-of-unboxing-iphone-15-pro-max-box-in-natural-titanium-color-mention-zana_qaradaghy-on-instagram-while-use-this-photo-follow-on-instagram-zana_qaradaghy.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    description: 'Quite well worn with a damaged screen.',
    price: '€999',
    location: 'Rathmines, Dublin, Co. Dublin',
  },
  {
    id: '3',
    title: 'Samsung Note 20 Ultra',
    image:
      'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fcdn.mos.cms.futurecdn.net%2Feb5AQgQnapgFNMk5Fe5EJ9.jpg&f=1&nofb=1&ipt=1a061fa817ba1c6d8c7998a14f18466565b4ad90ad7ad01261aa54b1dcabae23&ipo=images',
    description: 'A great phone I only used a few times.',
    price: '€700',
    location: 'Galway, Co. Galway',
  },
];

export default function HomePage({ navigation }: { navigation: any }) {
  const [query, setQuery] = useState('');

  const filteredItems = items.filter((item) =>
    item.title.toLowerCase().includes(query.toLowerCase())
  );

  const renderItem = ({ item }: { item: (typeof items)[0] }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => navigation.navigate('Product', { item })}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.textContainer}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.price}>{item.price}</Text>
        <Text style={styles.location}>{item.location}</Text>
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
        keyExtractor={(item) => item.id}
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
