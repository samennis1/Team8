import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

const ProductPage = ({ route, navigation }: { route: any; navigation: any }) => {
  const { item } = route.params;

  return (
    <View style={styles.container}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla ac eros eu nunc consequat
        auctor.
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
    marginTop: 50,
    marginBottom: 50,
  },
  image: {
    marginBottom: 16,
    height: 256,
    width: '100%',
    borderRadius: 8,
  },
  title: {
    marginBottom: 8,
    fontSize: 24,
    fontWeight: 'bold',
  },
  description: {
    marginBottom: 16,
    color: 'gray',
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
  },
});

export default ProductPage;
