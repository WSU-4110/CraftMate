import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Dimensions, KeyboardAvoidingView, TextInput, Platform } from 'react-native';
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
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

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
    <TouchableOpacity onPress={() => router.push(`/post/${item.id}`)}>
      <View style={[styles.postContainer, { backgroundColor: Colors[theme].tint }]}>
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
        <Image source={require('../../assets/images/craftmate-logo.png')} style={styles.logo} />

        <TextInput
          placeholder="Search posts..."
          placeholderTextColor={Colors[theme].icon}
          style={[styles.searchInput, { borderColor: Colors[theme].text, color: Colors[theme].text }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        <FlatList
  data={posts.filter((post) =>
    (post?.content || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post?.username || "").toLowerCase().includes(searchQuery.toLowerCase())
  )}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          horizontal={false}
        />

        <View style={[styles.inputContainer, { backgroundColor: Colors[theme].background, borderColor: Colors[theme].text }]}>
          <TextInput
            placeholderTextColor={Colors[theme].icon}
            style={[styles.input, { borderColor: Colors[theme].text, color: Colors[theme].text }]}
            value={newPostContent}
            onChangeText={setNewPostContent}
            placeholder="Write a new post..."
          />
          <TouchableOpacity style={[styles.postButton]} onPress={handleAddPost}>
            <Text style={[styles.postButtonText, { color: Colors[theme].background }]}>Post</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  logo: {
    width: 200,
    height: 100,
    paddingTop: 50,
    marginBottom: 20,
  },
  searchInput: {
    width: '100%',
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
  },
  listContent: {
    paddingBottom: 20,
    width: Dimensions.get('window').width - 20,
  },
  postContainer: {
    flexDirection: 'row',
    padding: 15,
    marginVertical: 8,
    borderRadius: 20,
    elevation: 3,
    width: '100%',
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  postContentContainer: {
    flex: 1,
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
    borderRadius: 10,
    borderWidth: 1,
    width: '100%',
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
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postButtonText: {
    fontWeight: 'bold',
  },
});

export default HomeScreen;
