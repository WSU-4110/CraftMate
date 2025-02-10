import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Dimensions, TextInput, Button } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { collection, addDoc, query, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../../constants/firebaseConfig';
import { getAuth } from 'firebase/auth';

interface Post {
  id: string;
  username: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: string[];
  profileImage: any; // You can replace 'any' with the appropriate type if known
}

const PostItem: React.FC<Post> = ({ username, content, timestamp, likes, comments, profileImage, theme }) => (
  <View style={[styles.postContainer, { backgroundColor: Colors[theme].postBackground, shadowColor: Colors[theme].shadowColor }]}>
    <Image source={{ uri: profileImage }} style={styles.profileImage} />
    <View style={styles.postContentContainer}>
      <Text style={[styles.postTitle, { color: Colors[theme].text }]}>{username}</Text>
      <Text style={[styles.postContent, { color: Colors[theme].postText }]}>{content}</Text>
      <Text style={[styles.postTimestamp, { color: Colors[theme].postText }]}>{new Date(timestamp).toLocaleString()}</Text>
    </View>
  </View>
);

const App = () => {
  const theme = useColorScheme() || 'light'; // Provide a default theme
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];
      setPosts(posts);
    });

    return () => unsubscribe();
  }, []);

  const handleAddPost = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert('You must be logged in to post.');
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      alert('User document does not exist.');
      return;
    }

    const userData = userDoc.data();
    const username = userData?.username || 'Anonymous';

    if (newPostContent.trim()) {
      await addDoc(collection(db, 'posts'), {
        username, // Use the username from the Firestore user document
        content: newPostContent,
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: [],
        profileImage: user.photoURL || 'https://via.placeholder.com/50', // Use user's profile image or a placeholder
        userId: user.uid, // Store the user ID to link the post to the user
      });
      setNewPostContent('');
    }
  };

  const renderItem = ({ item }: { item: Post }) => (
    <TouchableOpacity>
      <PostItem {...item} theme={theme} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <Image source={require('../../assets/images/craftmate-logo.png')} style={styles.logo} />
      <FlatList
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newPostContent}
          onChangeText={setNewPostContent}
          placeholder="Write a new post..."
        />
        <Button title="Post" onPress={handleAddPost} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    alignItems: 'center', // Center the logo horizontally
  },
  logo: {
    width: 200, // Adjust the width as needed
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
    padding: 15,
    marginVertical: 8,
    borderRadius: 20,
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
  },
  postTimestamp: {
    fontSize: 12,
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginRight: 10,
  },
});

export default App;