import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Dimensions, TextInput } from 'react-native';
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
  profileImage: string; // Use string type for profileImage
}

const PostItem: React.FC<Post> = ({ username, content, timestamp, likes, comments, profileImage, theme }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <View style={[styles.postContainer, { backgroundColor: Colors[theme].postBackground }]}>
      <Image
        source={imageError ? require('../../assets/images/blank-profile.jpeg') : { uri: profileImage }}
        style={styles.profileImage}
        onError={() => setImageError(true)}
      />
      <View style={styles.postContentContainer}>
        <Text style={[styles.postTitle, { color: Colors[theme].text }]}>{username}</Text>
        <Text style={[styles.postContent, { color: Colors[theme].postText }]}>{content}</Text>
        <Text style={[styles.postTimestamp, { color: Colors[theme].postText }]}>{new Date(timestamp).toLocaleString()}</Text>
      </View>
    </View>
  );
};

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
        profileImage: user.photoURL || require('../../assets/images/blank-profile.jpeg'), // Use user's profile image or a placeholder
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
      <View style={[styles.inputContainer, { backgroundColor: Colors[theme].background, borderColor: Colors[theme].text }]}>
        <TextInput
          placeholderTextColor={Colors[theme].text}
          style={[styles.input, { borderColor: Colors[theme].text, color: Colors[theme].text }]} // Add color property here
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

export default App;