import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';

const posts = [
  {
    id: '1',
    title: 'I am the best at ai prompts',
    content: 'This is the content of the first post.',
    profileImage: require('../../assets/images/darick.jpeg'),
  },
  {
    id: '2',
    title: 'Second Post',
    content: 'This is the content of the second post.',
    profileImage: 'https://via.placeholder.com/50', // Placeholder image URL
  },
  {
    id: '3',
    title: 'Third Post',
    content: 'This is the content of the second post.',
    profileImage: 'https://via.placeholder.com/50', // Placeholder image URL
  },
  {
    id: '4',
    title: 'Fourth Post',
    content: 'This is the content of the second post.',
    profileImage: 'https://via.placeholder.com/50', // Placeholder image URL
  },
  {
    id: '5',
    title: 'Fifth Post',
    content: 'This is the content of the second post.',
    profileImage: 'https://via.placeholder.com/50', // Placeholder image URL
  },
  {
    id: '6',
    title: 'Sixth Post',
    content: 'This is the content of the second post.',
    profileImage: 'https://via.placeholder.com/50', // Placeholder image URL
  },
  {
    id: '7',
    title: 'Seventh Post',
    content: 'This is the content of the second post.',
    profileImage: 'https://via.placeholder.com/50', // Placeholder image URL
  },
  // Add more posts as needed
];

const PostItem = ({ title, content, profileImage }) => (
  <View style={styles.postContainer}>
    <Image source={profileImage} style={styles.profileImage} />
    <View style={styles.postContentContainer}>
      <Text style={styles.postTitle}>{title}</Text>
      <Text style={styles.postContent}>{content}</Text>
    </View>
  </View>
);

const App = () => {
  const renderItem = ({ item }) => (
    <TouchableOpacity>
      <PostItem title={item.title} content={item.content} profileImage={item.profileImage} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/images/craftmate-logo.png')} style={styles.logo} />
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 10,
    alignItems: 'center', // Center the logo horizontally
  },
  logo: {
    width: 260, // Adjust the width as needed
    height: 100, // Adjust the height as needed
    paddingTop: 50, // Add some space below the logo
    marginBottom: 20, // Add some space below the logo
  },
  listContent: {
    paddingBottom: 20, // Add some padding at the bottom of the list
    width: Dimensions.get('window').width - 20, // Ensure the list content takes the full width minus padding
  },
  postContainer: {
    flexDirection: 'row', // Arrange profile image and content side by side
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    width: '100%', // Make sure the posts take the full width
  },
  profileImage: {
    width: 50, // Adjust the width as needed
    height: 50, // Adjust the height as needed
    borderRadius: 25, // Make the image circular
    marginRight: 15, // Add some space between the image and the content
  },
  postContentContainer: {
    flex: 1, // Take up the remaining space
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  postContent: {
    fontSize: 14,
    color: '#333',
  },
});

export default App;