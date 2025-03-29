// Define interfaces for the Observer pattern
interface Observer {
    update(data: any): void;
  }
  
  interface Subject {
    attach(observer: Observer): void;
    detach(observer: Observer): void;
    notify(): void;
  }
  
  // PostSubject that will notify observers when post data changes
  class PostSubject implements Subject {
    private observers: Observer[] = [];
    private post: any = null;
  
    attach(observer: Observer): void {
      const isExist = this.observers.includes(observer);
      if (!isExist) {
        this.observers.push(observer);
      }
    }
  
    detach(observer: Observer): void {
      const observerIndex = this.observers.indexOf(observer);
      if (observerIndex !== -1) {
        this.observers.splice(observerIndex, 1);
      }
    }
  
    notify(): void {
      for (const observer of this.observers) {
        observer.update(this.post);
      }
    }
  
    // Set post data and notify observers
    setPost(post: any): void {
      this.post = post;
      this.notify();
    }
  
    // Get post data
    getPost(): any {
      return this.post;
    }
  }
  
  // CommentsSubject that will notify observers when comments data changes
  class CommentsSubject implements Subject {
    private observers: Observer[] = [];
    private comments: any[] = [];
  
    attach(observer: Observer): void {
      const isExist = this.observers.includes(observer);
      if (!isExist) {
        this.observers.push(observer);
      }
    }
  
    detach(observer: Observer): void {
      const observerIndex = this.observers.indexOf(observer);
      if (observerIndex !== -1) {
        this.observers.splice(observerIndex, 1);
      }
    }
  
    notify(): void {
      for (const observer of this.observers) {
        observer.update(this.comments);
      }
    }
  
    // Set comments data and notify observers
    setComments(comments: any[]): void {
      this.comments = comments;
      this.notify();
    }
  
    // Get comments data
    getComments(): any[] {
      return this.comments;
    }
  }
  
  // FirebaseDataService to handle Firebase operations
  class FirebaseDataService {
    private postSubject: PostSubject;
    private commentsSubject: CommentsSubject;
    private db: any;
    private unsubscribePost: (() => void) | null = null;
    private unsubscribeComments: (() => void) | null = null;
  
    constructor(db: any, postSubject: PostSubject, commentsSubject: CommentsSubject) {
      this.db = db;
      this.postSubject = postSubject;
      this.commentsSubject = commentsSubject;
    }
  
    // Start listening to Firebase updates
    startListening(postId: string): void {
      const postRef = doc(this.db, 'posts', postId);
      this.unsubscribePost = onSnapshot(postRef, (doc) => {
        if (doc.exists()) {
          this.postSubject.setPost({ id: doc.id, ...doc.data() });
        }
      });
  
      const q = query(
        collection(this.db, 'posts', postId, 'comments'),
        orderBy('timestamp', 'desc')
      );
      
      this.unsubscribeComments = onSnapshot(q, (snapshot) => {
        const comments = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        this.commentsSubject.setComments(comments);
      });
    }
  
    // Stop listening to Firebase updates
    stopListening(): void {
      if (this.unsubscribePost) {
        this.unsubscribePost();
      }
      if (this.unsubscribeComments) {
        this.unsubscribeComments();
      }
    }
  
    // Add a comment
    async addComment(postId: string, commentData: any): Promise<void> {
      await addDoc(
        collection(this.db, 'posts', postId, 'comments'), 
        commentData
      );
    }
  
    // Get user data
    async getUserData(userId: string): Promise<any> {
      const userDocRef = doc(this.db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      return userDoc.exists() ? userDoc.data() : null;
    }
  }
  
  // Main component file with all imports and Text components properly used
  import React, { useState, useEffect } from 'react';
  import { View, Text, FlatList, TouchableOpacity, Image, TextInput } from 'react-native';
  import { useColorScheme } from 'react-native';
  import { Colors } from '../../constants/Colors';
  import { collection, query, orderBy, onSnapshot, addDoc, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
  import { db } from '../../constants/firebaseConfig';
  import { getAuth } from 'firebase/auth';
  import { useLocalSearchParams } from 'expo-router';
  import styles from './PostDetailScreen.styles';
  
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
  
  // Component that acts as an observer
  const PostDetailScreen = () => {
    const theme = useColorScheme() || 'light';
    const { id } = useLocalSearchParams();
    const [post, setPost] = useState<Post | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    
    // Create subject and observer instances
    const postSubject = React.useMemo(() => new PostSubject(), []);
    const commentsSubject = React.useMemo(() => new CommentsSubject(), []);
    
    // Create Firebase service
    const firebaseService = React.useMemo(
      () => new FirebaseDataService(db, postSubject, commentsSubject),
      [postSubject, commentsSubject]
    );
  
    // Post observer
    const postObserver: Observer = React.useMemo(
      () => ({
        update(data: Post | null) {
          setPost(data);
        },
      }),
      []
    );
  
    // Comments observer
    const commentsObserver: Observer = React.useMemo(
      () => ({
        update(data: Comment[]) {
          setComments(data);
        },
      }),
      []
    );
  
    // Set up observers and start listening to Firebase
    useEffect(() => {
      // Attach observers
      postSubject.attach(postObserver);
      commentsSubject.attach(commentsObserver);
      
      // Start listening to Firebase updates
      firebaseService.startListening(id as string);
      
      // Clean up
      return () => {
        postSubject.detach(postObserver);
        commentsSubject.detach(commentsObserver);
        firebaseService.stopListening();
      };
    }, [id, postSubject, commentsSubject, postObserver, commentsObserver, firebaseService]);
  
    const handleAddComment = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
  
      if (!user) {
        alert('You must be logged in to comment.');
        return;
      }
  
      const userData = await firebaseService.getUserData(user.uid);
      if (!userData) {
        alert('User document does not exist.');
        return;
      }
  
      const username = userData?.username || 'Anonymous';
  
      if (newComment.trim()) {
        try {
          // Add the comment to the "comments" subcollection
          await firebaseService.addComment(id as string, {
            username,
            content: newComment,
            timestamp: new Date().toISOString(),
            profileImage: user.photoURL || require('../../assets/images/blank-profile.jpeg'),
          });
    
          // Increment the comments count in the parent post document
          const postRef = doc(db, 'posts', id as string);
          await updateDoc(postRef, {
            comments: increment(1), // Increment the comments field by 1
          });
    
          console.log('Comment added successfully!');
          setNewComment(''); // Clear the input field
        } catch (error) {
          console.error('Error adding comment:', error);
        }
      }
    };
  
    // Loading screen with proper Text component
    if (!post) {
      return (
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      );
    }
  
    // Create a component for rendering comment items to ensure proper Text usage
    const CommentItem = ({ item }: { item: Comment }) => (
      <View style={[styles.commentContainer, { backgroundColor: Colors[theme].tint }]}>
        <Image source={{ uri: item.profileImage }} style={styles.commentProfileImage} />
        <View style={styles.commentContentContainer}>
          <Text style={[styles.commentUsername, { color: Colors[theme].text }]}>{item.username}</Text>
          <Text style={[styles.commentContent, { color: Colors[theme].postText }]}>{item.content}</Text>
          <Text style={[styles.commentTimestamp, { color: Colors[theme].postText }]}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        </View>
      </View>
    );
  
    return (
      <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
        <View style={[styles.postContainer, { backgroundColor: Colors[theme].tint }]}>
          <Image source={{ uri: post.profileImage }} style={styles.profileImage} />
          <View style={styles.postContentContainer}>
            <Text style={[styles.postTitle, { color: Colors[theme].text }]}>{post.username}</Text>
            <Text style={[styles.postContent, { color: Colors[theme].postText }]}>{post.content}</Text>
            <Text style={[styles.postTimestamp, { color: Colors[theme].postText }]}>
              {new Date(post.timestamp).toLocaleString()}
            </Text>
          </View>
        </View>
        <FlatList
          data={comments}
          renderItem={({ item }) => <CommentItem item={item} />}
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
            style={[styles.postButton]}
            onPress={handleAddComment}
          >
            <Text style={[styles.commentButtonText, { color: Colors[theme].background }]}>Post</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };
  
  export default PostDetailScreen;