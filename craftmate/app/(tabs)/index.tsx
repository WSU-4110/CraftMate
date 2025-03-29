import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Dimensions, KeyboardAvoidingView, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { collection, query, orderBy, onSnapshot, addDoc, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
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
  comments: number; 
}

const HomeScreen = () => {
  const theme: 'light' | 'dark' = useColorScheme() || 'light';
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
      alert("You must be logged in to post.");
      return;
    }

    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      alert("User document does not exist.");
      return;
    }

    const userData = userDoc.data();
    const username = userData?.username || "Anonymous";

    if (newPostContent.trim()) {
      await addDoc(collection(db, "posts"), {
        username,
        content: newPostContent,
        timestamp: new Date().toISOString(),
        likes: 0,
        profileImage: userData?.profileImage || "https://via.placeholder.com/150", // Use user's profile image or a placeholder
        userId: user.uid,
      });
      setNewPostContent("");
    }
  };

  const handleLikePost = async (postId: string) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        alert("You must be logged in to like a post.");
        return;
      }

      const postRef = doc(db, "posts", postId);
      const postDoc = await getDoc(postRef);

      if (!postDoc.exists()) {
        console.error("Post does not exist.");
        return;
      }

      const postData = postDoc.data();
      const likedBy = postData?.likedBy || [];

      // Check if the user has already liked the post
      if (likedBy.includes(user.uid)) {
        // User has already liked the post, so decrement the like count
        await updateDoc(postRef, {
          likes: increment(-1), // Decrement the likes field by 1
          likedBy: likedBy.filter((uid: string) => uid !== user.uid), // Remove the user's ID from the likedBy array
        });
        console.log("Like removed successfully!");
      } else {
        // User has not liked the post, so increment the like count
        await updateDoc(postRef, {
          likes: increment(1), // Increment the likes field by 1
          likedBy: [...likedBy, user.uid], // Add the user's ID to the likedBy array
        });
        console.log("Post liked successfully!");
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const renderItem = ({ item }: { item: Post }) => (
    <TouchableOpacity onPress={() => router.push(`/post/${item.id}`)}>
      <View style={[styles.postContainer, { backgroundColor: Colors[theme].card }]}>
        <View style={styles.postHeader}>
          <View style={styles.postHeaderLeft}>
            <Image
              source={{ uri: item.profileImage || "https://via.placeholder.com/150" }}
              style={styles.profileImage}
            />
            <Text style={[styles.postUsername, { color: Colors[theme].text }]}>
              {item.username}
            </Text>
          </View>
          <Text style={[styles.postTimestamp, { color: Colors[theme].subtext }]}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        </View>
        <Text style={[styles.postContent, { color: Colors[theme].postText }]}>
          {item.content}
        </Text>
        <View style={styles.postFooter}>
          <View style={styles.postActions}>
            {/* Like Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.ovalContainer, { backgroundColor: Colors[theme].background }]}
              onPress={() => handleLikePost(item.id)}
            >
              <Ionicons name="thumbs-up-outline" size={16} color={Colors[theme].icon} />
              <Text style={[styles.ovalText, { color: Colors[theme].icon }]}>
                {item.likes}
              </Text>
            </TouchableOpacity>
            {/* Comment Button */}
            <TouchableOpacity
              style={[styles.actionButton, styles.ovalContainer, { backgroundColor: Colors[theme].background }]}
              onPress={() => router.push(`/post/${item.id}`)} // Navigate to the post page
            >
              <Ionicons name="chatbubble-outline" size={16} color={Colors[theme].icon} />
              <Text style={[styles.ovalText, { color: Colors[theme].icon }]}>
                {item.comments || 0}
              </Text>
            </TouchableOpacity>
          </View>
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
            post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            post.username.toLowerCase().includes(searchQuery.toLowerCase())
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
    padding: 20, // 20 padding on both sides
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
    width: '100%', // Ensure the list content fits the parent container
  },
  postContainer: {
    width: Dimensions.get('window').width - 40, // Subtract the 20 padding on both sides
    padding: 15,
    marginVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    alignSelf: 'center', // Center the container horizontally
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  postHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  postUsername: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  postContent: {
    fontSize: 16,
    marginBottom: 10,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  postTimestamp: {
    fontSize: 12,
    color: '#888',
  },
  postActions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginLeft: 10,
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
  ovalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12, // Horizontal padding for the oval shape
    paddingVertical: 6, // Vertical padding for the oval shape
    borderRadius: 20, // Makes the container oval
    marginLeft: 10, // Space between buttons
  },
  ovalText: {
    marginLeft: 5, // Space between the icon and text
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
