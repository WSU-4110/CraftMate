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
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db } from '../constants/firebaseConfig';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import styles from './HomeScreen.styles'; // Import styles

interface Post {
  id: string;
  username: string;
  content: string;
  timestamp: string;
  likes: number;
  profileImage: string;
  comments: number;
  images?: string[]; // Array of base64 encoded images
  likedBy?: string[];
}

const HomeScreen = () => {
  const theme: 'light' | 'dark' = useColorScheme() || 'light';
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<string[]>([]); // State to store base64 encoded images
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const dropdownAnimation = useRef(new Animated.Value(0)).current; // Animated value for dropdown height
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

  // Function to convert image URI to base64
  const uriToBase64 = async (uri: string): Promise<string> => {
    try {
      // Read the file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Get file extension from the URI
      const fileExtension = uri.split('.').pop()?.toLowerCase() || 'jpg';
      
      // Create proper base64 string with MIME type
      const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      return '';
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio
      quality: 0.5, // Reduce quality to keep base64 strings smaller
    });

    if (!result.canceled) {
      // Convert each selected image to base64 and add to state
      const base64PromiseArray = result.assets.map(asset => uriToBase64(asset.uri));
      const base64Images = await Promise.all(base64PromiseArray);
      
      // Filter out any failed conversions
      const validBase64Images = base64Images.filter(base64 => base64 !== '');
      
      setSelectedImages(prevImages => [...prevImages, ...validBase64Images]);
    }
  };

  const handleRemoveImage = (base64: string) => {
    setSelectedImages(prevImages => prevImages.filter(image => image !== base64));
  };

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

    if (newPostContent.trim() || selectedImages.length > 0) {
      await addDoc(collection(db, "posts"), {
        username,
        content: newPostContent,
        timestamp: new Date().toISOString(),
        likes: 0,
        comments: 0,
        profileImage: userData?.profileImage || "https://via.placeholder.com/150",
        userId: user.uid,
        images: selectedImages, // Save the array of base64 encoded images
      });
      setNewPostContent("");
      setSelectedImages([]); // Clear the selected images
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

  const handleSearchPress = () => {
    if (isDropdownVisible) {
      // Hide dropdown
      Animated.timing(dropdownAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setIsDropdownVisible(false));
    } else {
      // Show dropdown
      setIsDropdownVisible(true);
      Animated.timing(dropdownAnimation, {
        toValue: 100, // Adjust height as needed
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const filteredPosts = searchQuery ? 
    posts.filter((post) =>
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.username.toLowerCase().includes(searchQuery.toLowerCase())
    ) : 
    posts;

  const renderItem = ({ item }: { item: Post }) => {
    const auth = getAuth();
    const user = auth.currentUser;
  
    // Check if the current user has already liked the post
    const hasLiked = item.likedBy?.includes(user?.uid);
  
    return (
      <TouchableOpacity onPress={() => router.push(`/post/${item.id}`)}>
        <View style={[styles.postContainer, { backgroundColor: Colors[theme].background, borderColor: Colors[theme].text }]}>
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
            <Text style={[styles.postTimestamp, { color: Colors[theme].text }]}>
              {new Date(item.timestamp).toLocaleDateString()}
            </Text>
          </View>
          <Text style={[styles.postContent, { color: Colors[theme].postText }]}>
            {item.content}
          </Text>
          {/* Display the first image from the images array */}
          {item.images && item.images.length > 0 && (
            <Image
              source={{ uri: item.images[0] }}
              style={styles.postImage}
            />
          )}
          <View style={styles.postFooter}>
            <View style={styles.postActions}>
              {/* Like Button */}
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.ovalContainer,
                  { backgroundColor: hasLiked ? '#E89600' : Colors[theme].tint }, // Change color if liked
                ]}
                onPress={() => handleLikePost(item.id)}
              >
                <Ionicons
                  name="thumbs-up-outline"
                  size={16}
                  color={hasLiked ? '#FFF' : Colors[theme].icon} // Change icon color if liked
                />
                <Text style={[styles.ovalText, { color: hasLiked ? '#FFF' : Colors[theme].icon }]}>
                  {item.likes}
                </Text>
              </TouchableOpacity>
              {/* Comment Button */}
              <TouchableOpacity
                style={[styles.actionButton, styles.ovalContainer, { backgroundColor: Colors[theme].tint }]}
                onPress={() => router.push(`/post/${item.id}`)}
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
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
        {/* Custom Header with centered logo and search icon */}
        <View style={styles.headerContainer}>
          <View style={styles.leftPlaceholder} />
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

        {/* Animated Dropdown */}
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

        {/* Posts List */}
        <FlatList
          data={filteredPosts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          horizontal={false}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: Colors[theme].tint }]} />} // Add separator
          showsVerticalScrollIndicator={false} // Hide vertical scroll bar
        />

        {/* Display Selected Images */}
        {selectedImages.length > 0 && (
          <View style={styles.selectedImagesContainer}>
            <FlatList
              data={selectedImages}
              horizontal
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => (
                <View style={styles.imagePreviewContainer}>
                  <Image source={{ uri: item }} style={styles.imagePreview} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => handleRemoveImage(item)}
                  >
                    <Ionicons name="close-circle" size={24} color={Colors[theme].text} />
                  </TouchableOpacity>
                </View>
              )}
            />
          </View>
        )}

        {/* Post Input Area */}
        <View style={[
          styles.inputContainer, 
          { 
            backgroundColor: Colors[theme].background, 
            borderColor: Colors[theme].text 
          }
        ]}>
          <View style={styles.inputRow}>
            <TextInput
              placeholderTextColor={Colors[theme].icon}
              style={[
                styles.input, 
                { 
                  borderColor: Colors[theme].text, 
                  color: Colors[theme].text 
                }
              ]}
              value={newPostContent}
              onChangeText={setNewPostContent}
              placeholder="Write a new post..."
              multiline
            />
            <TouchableOpacity 
              style={styles.imageButton} 
              onPress={pickImage}
            >
              <Ionicons name="image" size={24} color={Colors[theme].text} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.postButton} 
              onPress={handleAddPost}
            >
              <Text style={[styles.postButtonText, { color: Colors[theme].background }]}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default HomeScreen;