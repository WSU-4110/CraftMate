// app/(tabs)/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Dimensions, TextInput } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { collection, query, orderBy, onSnapshot, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../constants/firebaseConfig';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'expo-router'; // Import useRouter

interface Post {
  id: string;
  username: string;
  content: string;
  timestamp: string;
  likes: number;
  profileImage: string;
}

const HomeScreen = () => {
  const theme = useColorScheme() || 'light';
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const router = useRouter(); // Initialize router

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
        username,
        content: newPostContent,
        timestamp: new Date().toISOString(),
        likes: 0,
        profileImage: user.photoURL || require('../../assets/images/blank-profile.jpeg'),
        userId: user.uid,
      });
      setNewPostContent('');
    }
  };

  const renderItem = ({ item }: { item: Post }) => (
    <TouchableOpacity onPress={() => router.push(`/post/${item.id}`)}> {/* Use router.push */}
      <View style={[styles.postContainer, { backgroundColor: Colors[theme].postBackground }]}>
        <Image source={{ uri: item.profileImage }} style={styles.profileImage} />
        <View style={styles.postContentContainer}>
          <Text style={[styles.postTitle, { color: Colors[theme].text }]}>{item.username}</Text>
          <Text style={[styles.postContent, { color: Colors[theme].postText }]}>{item.content}</Text>
          <Text style={[styles.postTimestamp, { color: Colors[theme].postText }]}>{new Date(item.timestamp).toLocaleString()}</Text>
        </View>
      </View>
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
      <View style={[styles.inputContainer, { backgroundColor: Colors[theme].background, borderColor: Colors[theme].text }]}>
        <TextInput
          placeholderTextColor={Colors[theme].icon}
          style={[styles.input, { borderColor: Colors[theme].text, color: Colors[theme].text }]}
          value={newPostContent}
          onChangeText={setNewPostContent}
          placeholder="Write a new post..."
        />
        <TouchableOpacity
          style={[styles.postButton]}
          onPress={handleAddPost}
        >
          <Text style={[styles.postButtonText, { color: Colors[theme].background }]}>Post</Text>
        </TouchableOpacity>
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
    padding: 0, // Reduced padding to make the container tighter
    borderRadius: 10, // Rounded corners for the container
    textDecorationLine: 'underline', // underline text
    borderWidth: 0, // Add a border to the container
    boxShadow: '0 0 2px rgba(0, 0, 0, 1)', // Add a shadow to the container
    width: '95%', // Ensure the container takes the full width
    marginBottom: 5, // Add some space below the input container
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
  },
  postButton: {
    backgroundColor: '#E89600',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postButtonText: {
    fontWeight: 'bold',
  },
});

export default HomeScreen;