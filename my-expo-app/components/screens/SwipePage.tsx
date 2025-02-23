import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import Swiper from 'react-native-deck-swiper';

const { width } = Dimensions.get('window');

const deals = [
  {
    id: '1',
    title: 'Macbook Pro 2021',
    image:
      'https://media.donedeal.ie/eyJidWNrZXQiOiJkb25lZGVhbC5pZS1waG90b3MiLCJlZGl0cyI6eyJ0b0Zvcm1hdCI6IndlYnAiLCJyZXNpemUiOnsiZml0IjoiaW5zaWRlIiwid2lkdGgiOjEyMDAsImhlaWdodCI6MTIwMH19LCJrZXkiOiJwaG90b18zMzYwNjU2NzEifQ==?signature=1f9a02c1ba3f29c95f6d3bff52a409f32232178f70d8b30d299e6f2cab636d68',
    description: 'High-performance Macbook Pro in pristine condition.',
  },
  {
    id: '2',
    title: 'iPhone 15 Pro Max',
    image:
      'https://images.pexels.com/photos/18525574/pexels-photo-18525574/free-photo-of-unboxing-iphone-15-pro-max-box-in-natural-titanium-color-mention-zana_qaradaghy-on-instagram-while-use-this-photo-follow-on-instagram-zana_qaradaghy.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
    description: 'Quite well worn with a damaged screen.',
  },
  {
    id: '3',
    title: 'Samsung Note 20 Ultra',
    image:
      'https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fcdn.mos.cms.futurecdn.net%2Feb5AQgQnapgFNMk5Fe5EJ9.jpg&f=1&nofb=1&ipt=1a061fa817ba1c6d8c7998a14f18466565b4ad90ad7ad01261aa54b1dcabae23&ipo=images',
    description: 'A great phone I only used a few times.',
  },
];

export default function SwipePage({ navigation }: { navigation: any }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Second Hand Items</Text>
      <Text style={styles.title}>Swiper</Text>
      <Swiper
        cards={deals}
        renderCard={(card) => (
          <View style={styles.card}>
            <Image source={{ uri: card.image }} style={styles.cardImage} />
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardDescription}>{card.description}</Text>
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
