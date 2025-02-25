// app/post/[id].tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, TextInput } from 'react-native';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { collection, query, orderBy, onSnapshot, addDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../constants/firebaseConfig';
import { getAuth } from 'firebase/auth';
import { useLocalSearchParams } from 'expo-router'; // Use useLocalSearchParams for dynamic routes
import styles from './PostDetailScreen.styles'; // Import styles from a separate file

interface Post {
  id: string;
  username: string;
  content: string;
  timestamp: string;
  likes: number;
  profileImage: string;
}

interface Comment {
  id: string;
  username: string;
  content: string;
  timestamp: string;
  profileImage: string;
}

const PostDetailScreen = () => {
  const theme = useColorScheme() || 'light';
  const { id } = useLocalSearchParams(); // Get the postId from the URL
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    const postRef = doc(db, 'posts', id as string);
    const unsubscribePost = onSnapshot(postRef, (doc) => {
      if (doc.exists()) {
        setPost({ id: doc.id, ...doc.data() } as Post);
      }
    });

    const q = query(collection(db, 'posts', id as string, 'comments'), orderBy('timestamp', 'desc'));
    const unsubscribeComments = onSnapshot(q, (snapshot) => {
      const comments = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Comment[];
      setComments(comments);
    });

    return () => {
      unsubscribePost();
      unsubscribeComments();
    };
  }, [id]);

  const handleAddComment = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      alert('You must be logged in to comment.');
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

    if (newComment.trim()) {
      await addDoc(collection(db, 'posts', id as string, 'comments'), {
        username,
        content: newComment,
        timestamp: new Date().toISOString(),
        profileImage: user.photoURL || require('../../assets/images/blank-profile.jpeg'),
      });
      setNewComment('');
    }
  };

  if (!post) {
    return <Text>Loading...</Text>;
  }

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <View style={[styles.postContainer, { backgroundColor: Colors[theme].postBackground }]}>
        <Image source={{ uri: post.profileImage }} style={styles.profileImage} />
        <View style={styles.postContentContainer}>
          <Text style={[styles.postTitle, { color: Colors[theme].text }]}>{post.username}</Text>
          <Text style={[styles.postContent, { color: Colors[theme].postText }]}>{post.content}</Text>
          <Text style={[styles.postTimestamp, { color: Colors[theme].postText }]}>{new Date(post.timestamp).toLocaleString()}</Text>
        </View>
      </View>
      <FlatList
        data={comments}
        renderItem={({ item }) => (
          <View style={styles.commentContainer}>
            <Image source={{ uri: item.profileImage }} style={styles.commentProfileImage} />
            <View style={styles.commentContentContainer}>
              <Text style={[styles.commentUsername, { color: Colors[theme].text }]}>{item.username}</Text>
              <Text style={[styles.commentContent, { color: Colors[theme].postText }]}>{item.content}</Text>
              <Text style={[styles.commentTimestamp, { color: Colors[theme].postText }]}>{new Date(item.timestamp).toLocaleString()}</Text>
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
      <View style={[styles.commentInputContainer, { borderColor: Colors[theme].text }]}>
        <TextInput
          placeholderTextColor={Colors[theme].icon}
          style={[styles.commentInput, { borderColor: Colors[theme].text, color: Colors[theme].text }]}
          value={newComment}
          onChangeText={setNewComment}
          placeholder="Write a comment..."
        />
        <TouchableOpacity
          style={[styles.commentButton, { backgroundColor: Colors[theme].primary }]}
          onPress={handleAddComment}
        >
          <Text style={[styles.commentButtonText, { color: Colors[theme].background }]}>Post</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PostDetailScreen;