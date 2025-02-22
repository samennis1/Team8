import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const ITEM_PADDING = 16;
const IMAGE_WIDTH = width - (ITEM_PADDING * 2);

const items = [
  {
    id: '1',
    title: 'Macbook Pro 2021',
    images: [
      'https://images.unsplash.com/photo-1573164574230-59b78dbb7d6e',
      'https://images.unsplash.com/photo-1580910051072-19a7be1d3b2b'
    ],
    description: 'High-performance Macbook Pro in pristine condition.',
    price: '$1200',
    seller: 'John Doe',
  },
  {
    id: '2',
    title: 'Antique Lamp',
    images: [
      'https://stillorgandecor.ie/wp-content/uploads/2021/12/la3742284-q_ls1.jpg.webp',
      'https://cdn.lampenlicht.nl/m/catalog/product/1/0/9740_103200_0.jpg?profile=product_page_image_large'
    ],
    description: 'A vintage lamp that adds character to any room.',
    price: '$80',
    seller: 'Jane Smith',
  },
  {
    id: '3',
    title: 'Used Bike',
    images: [
      'https://usedbikes.ie/upload/bikes/263x162/bb698a30fc0587e7e8bac2bb4a97e58a.jpeg',
      'https://usedbikes.ie/upload/bikes/560x370/a825c5c34f68c3323c3bf4439de33b37.jpg'
    ],
    description: 'A reliable used bike perfect for daily commuting.',
    price: '$250',
    seller: 'Mike Johnson',
  }
];

const ProductImages = ({ images }) => (
  <ScrollView
    horizontal
    pagingEnabled
    showsHorizontalScrollIndicator={false}
    style={styles.imageScrollContainer}
    contentContainerStyle={styles.imageScrollContent}>
    {images.map((img, index) => (
      <Image
        key={index}
        source={{ uri: img }}
        style={styles.image}
        resizeMode="cover"
      />
    ))}
  </ScrollView>
);

const HomePage = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.header}>
        <Text style={styles.title}>Second Hand Items</Text>
      </SafeAreaView>
      
      <ScrollView 
        style={styles.mainScroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {items.map((item) => (
          <Animated.View
            key={item.id}
            entering={FadeIn.duration(500)}
            exiting={FadeOut.duration(500)}
            style={styles.itemContainer}>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Product', { item })}
              style={styles.itemTouchable}>
              <ProductImages images={item.images} />
              <View style={styles.infoContainer}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.price}>{item.price}</Text>
                <View style={styles.sellerContainer}>
                  <View style={styles.reliabilityCircle}>
                    <Text style={styles.reliabilityText}>85</Text>
                  </View>
                  <Text style={styles.sellerName}>{item.seller}</Text>
                </View>
                <Text style={styles.description}>{item.description}</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    backgroundColor: 'white',
  },
  title: {
    marginVertical: 16,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    padding: ITEM_PADDING,
    paddingBottom: ITEM_PADDING * 2, // Extra padding at bottom
  },
  itemContainer: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemTouchable: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  imageScrollContainer: {
    height: 240,
  },
  imageScrollContent: {
    height: 240,
  },
  image: {
    width: IMAGE_WIDTH,
    height: 240,
  },
  infoContainer: {
    padding: 16,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginBottom: 8,
  },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reliabilityCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  reliabilityText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
  sellerName: {
    fontSize: 14,
    color: '#666',
  },
  description: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
});

export default HomePage;