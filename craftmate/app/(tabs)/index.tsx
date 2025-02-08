import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';

const posts = [
  {
    id: '1',
    title: 'First Post',
    content: 'This is the content of the first post.',
  },
  {
    id: '2',
    title: 'Second Post',
    content: 'This is the content of the second post.',
  },
  // Add more posts as needed
];

const PostItem = ({ title, content }) => (
  <View style={styles.postContainer}>
    <Text style={styles.postTitle}>{title}</Text>
    <Text style={styles.postContent}>{content}</Text>
  </View>
);

const App = () => {
  const renderItem = ({ item }) => (
    <TouchableOpacity>
      <PostItem title={item.title} content={item.content} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#808080',
    padding: 10,
  },
  postContainer: {
    backgroundColor: '#f9f9f9',
    padding: 15,
    marginVertical: 8,
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
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