import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, Dimensions, KeyboardAvoidingView, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../../constants/Colors';
import { collection, query, orderBy, onSnapshot, addDoc, doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../../constants/firebaseConfig';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'expo-router'; // Import useRouter
import * as ImagePicker from 'expo-image-picker'; // Import ImagePicker

interface Post {
  id: string;
  username: string;
  content: string;
  timestamp: string;
  likes: number;
  profileImage: string;
  comments: number; 
  image?: string; // Add image property to Post interface
}

const HomeScreen = () => {
  const theme: 'light' | 'dark' = useColorScheme() || 'light';
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // State to store the selected image
  const [selectedImages, setSelectedImages] = useState<string[]>([]); // State to store multiple selected images
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

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true, // Allow multiple image selection
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio
      quality: 1,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri); // Extract URIs from selected images
      setSelectedImages((prevImages) => [...prevImages, ...newImages]); // Append new images to the existing array
    }
  };

  const handleRemoveImage = (uri: string) => {
    setSelectedImages((prevImages) => prevImages.filter((image) => image !== uri));
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
        profileImage: userData?.profileImage || "https://via.placeholder.com/150", // Use user's profile image or a placeholder
        userId: user.uid,
        images: selectedImages, // Save the array of selected images
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
            {new Date(item.timestamp).toLocaleDateString()}
          </Text>
        </View>
        <Text style={[styles.postContent, { color: Colors[theme].postText }]}>
          {item.content}
        </Text>
        {/* Display the first image from the images array */}
        {item.images && item.images.length > 0 && (
          <Image
            source={{ uri: item.images[0] }} // Display the first image
            style={styles.postImage} // Style for the post image
          />
        )}
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

        {/* Display Selected Image */}
        {selectedImage && (
          <View style={[styles.previewContainer, { borderColor: Colors[theme].text, backgroundColor: Colors[theme].background }]}>
            <Image source={{ uri: selectedImage }} style={styles.imagePreview} />
            <TouchableOpacity 
              style={styles.removeImageButton}
              onPress={() => setSelectedImage(null)} // Clear the selected image
            >
              <Ionicons name="close-circle" size={24} color={Colors[theme].text} />
            </TouchableOpacity>
          </View>
        )}

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

        <View style={[styles.inputContainer, { backgroundColor: Colors[theme].background, borderColor: Colors[theme].text }]}>
          <View style={styles.inputRow}>
            <TextInput
              placeholderTextColor={Colors[theme].icon}
              style={[styles.input, { borderColor: Colors[theme].text, color: Colors[theme].text }]}
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
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
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
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginTop: 10,
  },
  imagePickerButton: {
    backgroundColor: '#E89600',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10, // Add spacing between the input and the button
  },
  selectedImageContainer: {
    marginBottom: 10, // Add spacing below the image
    alignItems: 'center', // Center the image horizontally
  },
  selectedImage: {
    width: Dimensions.get('window').width - 40, // Match the width of the input container
    height: 200, // Fixed height for the image
    borderRadius: 10, // Rounded corners
    resizeMode: 'cover', // Ensure the image covers the container
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10, // Space below the preview container
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 10,
    marginRight: 10, // Space between the image and the remove button
  },
  removeImageButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  imageButton: {
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedImagesContainer: {
    flexDirection: 'row',
    marginBottom: 10, // Space below the image container
  },
  imagePreviewContainer: {
    marginRight: 10, // Space between images
    alignItems: 'center',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  removeImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 2,
  },
});

export default HomeScreen;
