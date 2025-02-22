import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

const ProductPage = ({ route, navigation }: { route: any; navigation: any }) => {
  const { item } = route.params;

  return (
    <View style={styles.container}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>
        {item.description ||
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla ac eros eu nunc consequat auctor.'}
      </Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Chat', { item })}>
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
  },
  description: {
    fontSize: 16,
    color: 'gray',
    marginBottom: 16,
  },
  button: {
    borderRadius: 8,
    backgroundColor: 'green',
    padding: 12,
  },
  buttonText: {
    textAlign: 'center',
    fontWeight: 'bold',
    color: 'white',
    fontSize: 16,
  },
});

export default ProductPage;
