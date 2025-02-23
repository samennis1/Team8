import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import ApiService from 'services/ApiService';

const { width } = Dimensions.get('window');

export default function SwipePage({ navigation }: { navigation: any }) {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const products = await ApiService.getProducts();
        setDeals(products);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1E90FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Second Hand Items</Text>
      <Text style={styles.title}>Swiper</Text>
      <Swiper
        cards={deals}
        renderCard={(card) => (
          <View style={styles.card}>
            <Image
              source={{
                uri: Array.isArray(card.image_urls) ? card.image_urls[0] : card.image_urls,
              }}
              style={styles.cardImage}
            />
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardDescription}>{card.desc}</Text>
          </View>
        )}
        onSwipedRight={(cardIndex) => navigation.navigate('Product', { item: deals[cardIndex] })}
        onSwiped={(cardIndex) => console.log('Swiped card index: ', cardIndex)}
        onSwipedAll={() => console.log('No more cards')}
        cardIndex={0}
        backgroundColor="white"
        stackSize={3}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    marginBottom: 16,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E90FF',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: 'white',
  },
  card: {
    flex: 0.75,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    backgroundColor: '#FFF',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  cardImage: {
    width: width - 80,
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1E90FF',
  },
  cardDescription: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
  },
});
