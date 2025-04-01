import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  TextInput,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  increment,
  arrayUnion,
  arrayRemove,
  getDoc,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { onAuthStateChanged, User, getAuth } from 'firebase/auth';
import { db, auth } from '../constants/firebaseConfig';
import { useRouter, Link } from 'expo-router';
import styles from './HomeScreen.styles';
interface Post {
  id: string;
  username: string;
  postTitle: string;
  postBody: string; // Added textbody field
  timestamp: string;
  likes: number;
  profileImage: string;
  comments: number;
  images?: string[];
  likedBy?: string[];
}

const HomeScreen = () => {
  const theme: 'light' | 'dark' = useColorScheme() || 'light';
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const dropdownAnimation = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

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

  const handleSearchPress = () => {
    if (isDropdownVisible) {
      Animated.timing(dropdownAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setIsDropdownVisible(false));
    } else {
      setIsDropdownVisible(true);
      Animated.timing(dropdownAnimation, {
        toValue: 100,
        duration: 300,
        useNativeDriver: false,
      }).start();
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
          likes: increment(-1),
          likedBy: likedBy.filter((uid: string) => uid !== user.uid),
        });
        console.log("Like removed successfully!");
      } else {
        // User has not liked the post, so increment the like count
        await updateDoc(postRef, {
          likes: increment(1),
          likedBy: [...likedBy, user.uid],
        });
        console.log("Post liked successfully!");
      }
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleChat = (postId: string) => {
    router.push(`../pages/viewpost?postId=${postId}`);
  };

  const navigateToPost = (postId: string) => {
    router.push(`../pages/viewpost?postId=${postId}`);
  };

  const filteredPosts = searchQuery
    ? posts.filter((post) =>
        (post.postTitle?.toLowerCase().includes(searchQuery.toLowerCase()) || // Check postTitle
        post.postBody?.toLowerCase().includes(searchQuery.toLowerCase()) || // Check postBody
        post.username?.toLowerCase().includes(searchQuery.toLowerCase())) // Check username
      )
    : posts;

  const renderItem = ({ item }: { item: Post }) => {
    const postDate =
      item.timestamp instanceof Date
        ? item.timestamp
        : item.timestamp?.toDate?.() || new Date(item.timestamp);

    return (
      <View
        style={[
          styles.postContainer,
          {
            backgroundColor: Colors[theme].background,
            borderColor: Colors[theme].text,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigateToPost(item.id)}>
          <View style={styles.postHeader}>
            <View style={styles.postHeaderLeft}>
              <Image
                source={
                  item.profileImage
                    ? { uri: item.profileImage }
                    : require('../assets/images/PortraitPlaceholder.png')
                }
                style={styles.profileImage}
              />
              <Text
                style={[styles.postUsername, { color: Colors[theme].text }]}
              >
                {item.username}
              </Text>
            </View>
            <Text
              style={[styles.postTimestamp, { color: Colors[theme].text }]}
            >
              {postDate.toLocaleDateString()}
            </Text>
          </View>
          <Text
            style={[
              styles.postContent,
              { color: Colors[theme].postText, fontWeight: 'bold' },
            ]}
          >
            {item.postTitle}
          </Text>
          {item.images && item.images.length > 0 && (
            <Image source={{ uri: item.images[0] }} style={styles.postImage} />
          )}
        </TouchableOpacity>
        <View style={styles.postFooter}>
          <View style={styles.postActions}>
            {/* Like Button */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.ovalContainer,
                {
                  backgroundColor: item.likedBy?.includes(user?.uid)
                    ? "#E89600" // Highlighted color for liked state
                    : Colors[theme].tint, // Default color
                },
              ]}
              onPress={() => handleLikePost(item.id)}
            >
              <Ionicons
                name={
                  item.likedBy?.includes(user?.uid)
                    ? "thumbs-up"
                    : "thumbs-up-outline"
                }
                size={16}
                color={
                  item.likedBy?.includes(user?.uid)
                    ? Colors[theme].background // Icon color for liked state
                    : Colors[theme].text // Default icon color
                }
              />
              <Text
                style={[
                  styles.ovalText,
                  {
                    color: item.likedBy?.includes(user?.uid)
                      ? Colors[theme].background // Text color for liked state
                      : Colors[theme].text, // Default text color
                  },
                ]}
              >
                {item.likes}
              </Text>
            </TouchableOpacity>

            {/* Comment Button */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.ovalContainer,
                { 
                  backgroundColor: Colors[theme].tint,
                  marginLeft: 10, // Added marginLeft for comment oval
                },
              ]}
              onPress={() => handleChat(item.id)}
            >
              <Ionicons
                name="chatbubble-outline"
                size={16}
                color={Colors[theme].text}
              />
              <Text
                style={[styles.ovalText, { color: Colors[theme].text }]}
              >
                {item.comments || 0}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
        <View style={styles.headerContainer}>
          {user ? (
            <Link href="../pages/writepost" style={styles.leftIconContainer}>
              <Ionicons name="add" size={26} color={Colors[theme].text} />
            </Link>
          ) : (
            <Link href="/login" style={styles.leftIconContainer}>
              <Ionicons name="add" size={26} color={Colors[theme].text} />
            </Link>
          )}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/images/craftmate-logo.png')} 
              style={styles.logo} 
            />
          </View>
          <TouchableOpacity 
            style={styles.searchIconContainer}
            onPress={handleSearchPress}
          >
            <Ionicons name="search" size={26} color={Colors[theme].text} />
          </TouchableOpacity>
        </View>
        {isDropdownVisible && (
          <Animated.View
            style={[
              styles.dropdownContainer,
              { height: dropdownAnimation, backgroundColor: Colors[theme].background },
            ]}
          >
            <View style={styles.dropdownContent}>
              <TextInput
                placeholder="Search posts..."
                placeholderTextColor={Colors[theme].icon}
                style={[
                  styles.searchInput,
                  { borderColor: Colors[theme].text, color: Colors[theme].text },
                ]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              <TouchableOpacity onPress={handleSearchPress}>
                <Ionicons name="close" size={26} color={Colors[theme].text} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
        <FlatList
          data={filteredPosts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          horizontal={false}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: Colors[theme].tint }]} />}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default HomeScreen;