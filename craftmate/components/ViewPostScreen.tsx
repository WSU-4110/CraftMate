import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import { Colors } from "../constants/Colors";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../constants/firebaseConfig";
import { useNavigation, useRoute } from "@react-navigation/native";
import styles from "./ViewPostScreen.styles"; // Import styles

interface Post {
  username: string;
  postTitle: string;
  postBody: string;
  timestamp: string;
  likes: number;
  profileImage: string;
  comments: number;
  images?: string[];
  tags?: string[];
}

export default function ViewPostScreen() {
  const theme: "light" | "dark" = useColorScheme() || "light";
  const navigation = useNavigation();
  const route = useRoute();
  const { postId } = route.params as { postId: string };

  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postDoc = doc(db, "posts", postId);
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

    fetchPost();
  }, [postId]);

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

  // Format timestamp or return a default value
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) return "No date";
    
    try {
      // Try to parse the timestamp
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
          {post.timestamp
            ? new Date(post.timestamp).toLocaleDateString() // Display date like in HomeScreen
            : "No date"}
        </Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {post.tags && post.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {post.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={[styles.tagText, { color: Colors[theme].text }]}>
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
          <ScrollView horizontal style={styles.imageContainer}>
            {post.images.map((imageData, index) => (
              <Image
                key={index}
                source={getImageSource(imageData)}
                style={styles.postImage}
              />
            ))}
          </ScrollView>
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
          <Text
            style={[
              styles.postBody,
              { color: Colors[theme].postText, fontWeight: "bold" },
            ]}
          >
            {post.postBody}
          </Text>

          <View style={styles.postFooter}>
            <View style={styles.postActions}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.ovalContainer,
                  { backgroundColor: Colors[theme].tint },
                ]}
                onPress={() => Alert.alert("Like functionality not implemented")}
              >
                <Ionicons
                  name="thumbs-up-outline"
                  size={16}
                  color={Colors[theme].text}
                />
                <Text style={[styles.ovalText, { color: Colors[theme].text }]}>
                  {post.likes}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.ovalContainer,
                  { backgroundColor: Colors[theme].tint },
                ]}
                onPress={() => Alert.alert("Comment functionality not implemented")}
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
        </View>
      </ScrollView>
    </View>
  );
}