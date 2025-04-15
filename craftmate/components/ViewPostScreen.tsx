import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Button,
  Modal,
  Image,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList, // Add FlatList import
  Dimensions, // Add Dimensions import
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import { Colors } from "../constants/Colors";
import { doc, deleteDoc, getDoc, updateDoc, increment, collection, serverTimestamp, addDoc, query, orderBy, onSnapshot} from "firebase/firestore";
import { Timestamp } from 'firebase/firestore'; 
import { QuerySnapshot } from 'firebase/firestore';
import { db } from "../constants/firebaseConfig";
import { useNavigation, useRoute } from "@react-navigation/native";
import { getAuth, User } from "firebase/auth";
import RepliesComponent from "./RepliesComponent"
import styles from "./ViewPostScreen.styles"; // Import styles
interface Post {
  username: string;
  postTitle: string;
  postBody: string;
  timestamp: string | Timestamp;
  likes: number;
  profileImage: string;
  comments: number;
  images?: string[];
  tags?: string[];
  likedBy?: string[];
}
interface Reply {
  id: string;
  content: string;
  timestamp: Date;
  authorId: string;
  authorName?: string;
}

const formatReplyDate = (timestamp: Date): string => {
  const month = String(timestamp.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
  const day = String(timestamp.getDate()).padStart(2, '0');
  const year = timestamp.getFullYear();
  return `${month}/${day}/${year}`;
};



export default function ViewPostScreen() {
  const theme: "light" | "dark" = useColorScheme() || "light";
  const navigation = useNavigation();
  const route = useRoute();
  const { postId } = route.params as { postId: string | undefined };
if (!postId) {
  throw new Error("Post ID is missing in route params");
}
const safePostId = postId as string;



  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [replies, setReplies] = useState<Reply[]>([]);




  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0); // Track the active image index
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postDoc = doc(db, "posts", safePostId);
        const postSnapshot = await getDoc(postDoc);

        if (postSnapshot.exists()) {
          setPost(postSnapshot.data() as Post);
        } else {
          Alert.alert("Error", "Post not found.");
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error fetching post:", error);
        Alert.alert("Error", "Failed to load the post.");
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };

  
    

    const fetchCurrentUser = () => {
      const auth = getAuth();
      setCurrentUser(auth.currentUser); // Retrieve and set the current user
    };

    fetchPost();
    fetchCurrentUser(); // Fetch the current user
  }, [postId]);

  useEffect(() => {
    const repliesRef = collection(db, 'posts', safePostId, 'replies');
    const q = query(repliesRef, orderBy('timestamp', 'asc'));
  
    const unsubscribe = onSnapshot(q, async (querySnapshot: QuerySnapshot) => {
      const repliesData: Reply[] = [];
  
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        const authorId = data.authorId || '';
        let authorName = 'Unknown';
  
        try {
          const userDoc = await getDoc(doc(db, 'users', authorId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            authorName = userData.username || 'Unknown';
          }
        } catch (error) {
          console.error('Error fetching user:', error);
        }
  
        repliesData.push({
          id: docSnap.id,
          content: data.content || '',
          timestamp: data.timestamp?.toDate?.() ?? new Date(),
          authorId,
          authorName,
        });
      }
  
      setReplies(repliesData);
    });
  
    return () => unsubscribe();
  }, [postId]);
  
  

  const handleLikePost = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser; // Retrieve the current user

      if (!user) {
        Alert.alert("Error", "You must be logged in to perform this action."); // Handle user not logged in
        return;
      }

      if (!post) return;

      const postRef = doc(db, "posts", safePostId as string);
      const postDoc = await getDoc(postRef);

      if (!postDoc.exists()) {
        console.error("Post does not exist.");
        return;
      }

      const postData = postDoc.data();
      const likedBy = postData?.likedBy || [];

      // Optimistically update the UI
      if (likedBy.includes(user.uid)) {
        setPost({
          ...post,
          likes: post.likes - 1,
          likedBy: post.likedBy?.filter((uid) => uid !== user.uid),
        });
        await updateDoc(postRef, {
          likes: increment(-1),
          likedBy: likedBy.filter((uid: string) => uid !== user.uid),
        });
      } else {
        setPost({
          ...post,
          likes: post.likes + 1,
          likedBy: [...(post.likedBy || []), user.uid],
        });
        await updateDoc(postRef, {
          likes: increment(1),
          likedBy: [...likedBy, user.uid],
        });
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleCommentPress = () => {
    setIsReplying(true);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
        <Text style={[styles.loadingText, { color: Colors[theme].text }]}>Loading...</Text>
      </View>
    );
  }

  if (!post) {
    return null;
  }

  // Helper function to format base64 image source properly
  const getImageSource = (imageString: string) => {
    if (!imageString) return undefined;
    
    // Check if it's already a complete data URI
    if (imageString.startsWith('data:image')) {
      return { uri: imageString };
    }
    // If it's just the base64 string without the prefix
    else if (imageString.match(/^[A-Za-z0-9+/=]+$/)) {
      return { uri: `data:image/jpeg;base64,${imageString}` };
    }
    // If it's a URL
    else {
      return { uri: imageString };
    }
  };

  const handleAddReply = async (replyText: string) => {
    if (!replyText.trim()) {
      Alert.alert("Cannot send", "Your reply cannot be empty.");
      return;
    }
  
    try {
      const repliesRef = collection(db, 'posts', safePostId as string, 'replies');
      if (!currentUser?.uid) {
  Alert.alert("Error", "User not found. Please log in again.");
  return;
}

await addDoc(repliesRef, {
  content: replyText,
  authorId: currentUser.uid,
  timestamp: serverTimestamp(),
});

  
      // Increment the comment count on the post
      const postRef = doc(db, "posts", safePostId as string);
      await updateDoc(postRef, {
        comments: increment(1),
      });
  
      setReplyText('');
      setIsReplying(false);
      Alert.alert("Success", "Reply posted successfully.");
    } catch (error) {
      console.error('Error adding reply:', error);
      Alert.alert("Error", "Failed to post reply.");
    }
  };
  

  // Format timestamp or return a default value
  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "No date";
    
    // Check if the timestamp is a Firestore Timestamp object
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toLocaleDateString();
    }

    try {
        // Try to parse the timestamp if it's a string
        const date = new Date(timestamp);
        
        // Check if the date is valid
        if (isNaN(date.getTime())) {
            return "No date";
        }
        
        // Return formatted date
        return date.toLocaleDateString();
    } catch (e) {
        return "No date";
    }
};



  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors[theme].text} />
        </TouchableOpacity>
        
        {/* Centered profile container */}
        <View style={styles.headerContent}>
          <View style={styles.profileContainer}>
            <Image
              source={getImageSource(post.profileImage)}
              style={styles.profileImage}
            />
            <Text style={[styles.username, { color: Colors[theme].text }]}>
              {post.username}
            </Text>
          </View>
        </View>
        
        {/* Timestamp positioned absolutely to the right */}
        <Text style={[styles.timestamp, { color: Colors[theme].text }]}>
          {(() => {
            let date;
            if (typeof post.timestamp === 'string') {
              date = new Date(post.timestamp);
            } else if ('toDate' in post.timestamp) {
              date = post.timestamp.toDate();
            } else {
              date = new Date();
            }
            return date.toLocaleDateString();
  })()}
</Text>

      </View>
      
      <FlatList
  data={replies}
  keyExtractor={(item) => item.id}
  contentContainerStyle={styles.scrollViewContent}
  ListHeaderComponent={
    <>
      {post.tags && post.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {post.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={[styles.tagText, { color: Colors[theme].background }]}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Text style={[styles.postTitle, { color: Colors[theme].text }]}>
        {post.postTitle}
      </Text>

      {post.images && post.images.length > 0 && (
        <View style={styles.imageSliderContainer}>
          <FlatList
            data={post.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => index.toString()}
            onScroll={(event) => {
              const index = Math.round(
                event.nativeEvent.contentOffset.x /
                  (Dimensions.get("window").width - 40)
              );
              setActiveIndex(index);
            }}
            renderItem={({ item, index }) => (
              <Image
                source={getImageSource(item)}
                style={[
                  styles.sliderImage,
                  {
                    borderRadius: index === 0 || index === post.images!.length - 1 ? 10 : 0,
                  },
                ]}
              />
            )}
          />
        </View>
      )}

      <View
        style={[
          styles.postContainer,
          {
            backgroundColor: Colors[theme].background,
            borderColor: Colors[theme].text,
          },
        ]}
      >
        <Text style={[styles.postBody, { color: Colors[theme].postText }]}>
          {post.postBody}
        </Text>
      </View>
    </>
  }
  renderItem={({ item }) => (
    <View style={{
      backgroundColor: '#1e1e1e',
      marginHorizontal: 10,
      marginVertical: 6,
      padding: 10,
      borderRadius: 6,
      borderColor: '#ccc',
      borderWidth: 1,
    }}>
      <Text style={{ color: 'gray', fontSize: 12 }}>{item.authorName}</Text>
      <Text style={{ color: 'gray', fontSize: 12 }}>{formatReplyDate(item.timestamp)}</Text>
      <Text style={{ color: Colors[theme].text, fontSize: 14, marginVertical: 4 }}>{item.content}</Text>

      {item.authorId === currentUser?.uid && (
        <TouchableOpacity
          onPress={async () => {
            const replyRef = doc(db, "posts", safePostId, "replies", item.id);
            await deleteDoc(replyRef);
            await updateDoc(doc(db, "posts", safePostId as string), { comments: increment(-1) });
          }}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'red',
            paddingVertical: 4,
            paddingHorizontal: 8,
            borderRadius: 4,
            alignSelf: 'flex-start',
            marginTop: 4,
          }}
        >
          <Ionicons name="trash" size={16} color="white" />
          <Text style={{ color: 'white', fontSize: 12, marginLeft: 4 }}>Delete</Text>
        </TouchableOpacity>
      )}
    </View>
  )}
  ListFooterComponent={
    <View style={styles.postFooter}>
      <View style={styles.postActions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.ovalContainer,
            {
              backgroundColor: post?.likedBy?.includes(currentUser!.uid)
                ? "#E89600"
                : Colors[theme].tint,
            },
          ]}
          onPress={handleLikePost}
        >
          <Ionicons
            name={
              post?.likedBy?.includes(currentUser!.uid)
                ? "thumbs-up"
                : "thumbs-up-outline"
            }
            size={16}
            color={
              post?.likedBy?.includes(currentUser!.uid)
                ? Colors[theme].background
                : Colors[theme].text
            }
          />
          <Text
            style={[
              styles.ovalText,
              {
                color: post?.likedBy?.includes(currentUser!.uid)
                  ? Colors[theme].background
                  : Colors[theme].text,
              },
            ]}
          >
            {post.likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.ovalContainer,
            { backgroundColor: Colors[theme].tint },
          ]}
          onPress={handleCommentPress}
        >
          <Ionicons
            name="chatbubble-outline"
            size={16}
            color={Colors[theme].text}
          />
          <Text style={[styles.ovalText, { color: Colors[theme].text }]}>
            {post.comments || 0}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  }
/>

      
      {/* Modal for replying to a comment */}
      {isReplying && (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 10,
      marginTop: 12,
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: '#555',
      backgroundColor: '#1e1e1e',
    }}
  >
    <TextInput
      style={{
        flex: 1,
        color: Colors[theme].text,
        paddingVertical: 6,
        paddingHorizontal: 10,
        fontSize: 14,
      }}
      placeholder="Write something..."
      placeholderTextColor="#999"
      value={replyText}
      onChangeText={setReplyText}
    />
    <TouchableOpacity
      onPress={() => {
        handleAddReply(replyText);
        setReplyText('');
        setIsReplying(false);
      }}
      style={{ marginLeft: 10 }}
    >
      <Text style={{ color: '#4ea1f3' }}>Send</Text>
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => {
        setReplyText('');
        setIsReplying(false);
      }}
      style={{ marginLeft: 8 }}
    >
      <Text style={{ color: 'red' }}>Cancel</Text>
    </TouchableOpacity>
  </View>
)}



    </View>
);

}