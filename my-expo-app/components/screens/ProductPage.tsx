import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

const ProductPage = ({ route, navigation }: { route?: any; navigation?: any }) => {
  const item = route?.params?.item;
  
  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Error: Product details not available.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.price}>{item.price}</Text>
      <Text style={styles.location}>📍 {item.location}</Text>
      
      <View style={styles.detailsCard}>
        {Object.entries({
          "Date of Purchase": item.dateOfPurchase,
          "RAM Size": item.ramSize,
          "Storage": item.storage,
          "Appearance Condition": item.condition,
          "Battery Condition": item.battery,
          "Warranty": item.warranty || '12 months'
        }).map(([key, value]) => (
          <View style={styles.detailContainer} key={key}>
            <Text style={styles.label}>{key}:</Text>
            <Text style={styles.value}>{value || 'Not specified'}</Text>
          </View>
        ))}
      </View>
      
      <TouchableOpacity style={styles.button} onPress={() => navigation?.navigate('Chat', { item })}>
        <Text style={styles.buttonText}>Chat Now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  image: {
    height: 256,
    width: '100%',
    borderRadius: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1E90FF',
    textAlign: 'center',
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF5733',
    textAlign: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    color: 'gray',
    textAlign: 'center',
    marginBottom: 12,
  },
  detailsCard: {
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginVertical: 12,
  },
  detailContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  value: {
    fontSize: 16,
    color: 'gray',
  },
  button: {
    borderRadius: 8,
    backgroundColor: 'green',
    padding: 12,
    marginTop: 16,
  },
  buttonText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: 'white',
    fontSize: 16,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default ProductPage;
