import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const items = [
  { id: '1', title: 'Vintage Chair', image: 'https://source.unsplash.com/random/200x200?chair' },
  { id: '2', title: 'Antique Lamp', image: 'https://source.unsplash.com/random/200x200?lamp' },
  { id: '3', title: 'Used Bike', image: 'https://source.unsplash.com/random/200x200?bike' },
  // Add more items as needed
];

const HomePage = ({ navigation }: { navigation: any }) => {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Second Hand Items</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {items.map((item) => (
          <Animated.View
            key={item.id}
            entering={FadeIn.duration(500)}
            exiting={FadeOut.duration(500)}
            style={styles.itemContainer}>
            <TouchableOpacity onPress={() => navigation.navigate('Product', { item })}>
              <Image source={{ uri: item.image }} style={styles.image} />
              <Text style={styles.itemTitle}>{item.title}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    marginTop: 60,
  },
  title: {
    marginBottom: 16,
    fontSize: 24,
    fontWeight: 'bold',
  },
  itemContainer: {
    marginRight: 16,
  },
  image: {
    height: 160,
    width: 160,
    borderRadius: 8,
  },
  itemTitle: {
    marginTop: 8,
    textAlign: 'center',
  },
});

export default HomePage;
