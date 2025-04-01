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

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: Colors[theme].background },
      ]}
    >
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors[theme].text} />
        </TouchableOpacity>
        <Text style={[styles.header, { color: Colors[theme].text }]}>
          {post.postTitle}
        </Text>
      </View>

      <View style={styles.postContainer}>
        <View style={styles.userInfo}>
          <Image
            source={{ uri: post.profileImage }}
            style={styles.profileImage}
          />
          <Text style={[styles.username, { color: Colors[theme].text }]}>
            {post.username}
          </Text>
        </View>

        <Text style={[styles.postBody, { color: Colors[theme].text }]}>
          {post.postBody}
        </Text>

        {post.images && post.images.length > 0 && (
          <ScrollView horizontal style={styles.imageContainer}>
            {post.images.map((uri, index) => (
              <Image key={index} source={{ uri }} style={styles.postImage} />
            ))}
          </ScrollView>
        )}

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

        <Text style={[styles.timestamp, { color: Colors[theme].icon }]}>
          {new Date(post.timestamp).toLocaleString()}
        </Text>
      </View>
    </ScrollView>
  );
}
