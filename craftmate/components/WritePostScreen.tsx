import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColorScheme } from "react-native";
import { Colors } from "../constants/Colors";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../constants/firebaseConfig";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { useNavigation } from "@react-navigation/native";

// Define the Post interface
interface Post {
  id: string;
  username: string;
  content: string;
  timestamp: string;
  likes: number;
  profileImage: string;
  comments: number;
  images?: string[];
  likedBy?: string[];
}

export default function WritePost() {
  const theme: "light" | "dark" = useColorScheme() || "light";
  const navigation = useNavigation(); // Access navigation
  const [postContent, setPostContent] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userDetails, setUserDetails] = useState<{ username: string; profileImage: string } | null>(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          Alert.alert("Error", "You must be logged in to create a post.");
          return;
        }

        const userDoc = doc(db, "users", user.uid); // Fetch user details from Firestore
        const userSnapshot = await getDoc(userDoc);

        if (userSnapshot.exists()) {
          setUserDetails(userSnapshot.data() as { username: string; profileImage: string });
        } else {
          console.log("No user details found in Firestore.");
        }
      } catch (error) {
        console.error("Error fetching user details:", error);
        Alert.alert("Error", "Failed to fetch user details.");
      }
    };

    fetchUserDetails();
  }, []);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: [ImagePicker.MediaType.IMAGE],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const resizedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 800 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        setSelectedImage(resizedImage.uri);
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick an image.");
    }
  };

  const handleSubmitPost = async () => {
    if (!postContent.trim() && !selectedImage) {
      Alert.alert("Error", "Post content or an image is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      const user = auth.currentUser;
      if (!user || !userDetails) {
        Alert.alert("Error", "You must be logged in to submit a post.");
        return;
      }

      // Create a new post object
      const postData: Omit<Post, "id"> = {
        username: userDetails.username || "Anonymous",
        content: postContent.trim(),
        timestamp: serverTimestamp() as unknown as string,
        likes: 0,
        profileImage: userDetails.profileImage || "https://via.placeholder.com/150",
        comments: 0,
        images: selectedImage ? [selectedImage] : [],
        likedBy: [],
      };

      // Add the post to Firestore
      await addDoc(collection(db, "posts"), postData);

      Alert.alert("Success", "Your post has been submitted!");
      setPostContent("");
      setSelectedImage(null);
    } catch (error) {
      console.error("Error submitting post:", error);
      Alert.alert("Error", "Failed to submit your post.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { backgroundColor: Colors[theme].background },
      ]}
    >
      <View style={styles.topPadding}> {/* Added wrapper for padding */}
        {/* Back Arrow */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()} // Navigate back to the previous screen
        >
          <Ionicons name="arrow-back" size={24} color={Colors[theme].text} />
        </TouchableOpacity>

        {/* Post Input */}
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: Colors[theme].inputBackground,
              color: Colors[theme].text,
            },
          ]}
          placeholder="Write something..."
          placeholderTextColor={Colors[theme].icon}
          value={postContent}
          onChangeText={setPostContent}
          multiline
        />

        {/* Image Preview */}
        {selectedImage && (
          <Image
            source={{ uri: selectedImage }}
            style={styles.imagePreview}
          />
        )}

        {/* Add Image Button */}
        <TouchableOpacity
          style={[
            styles.imageButton,
            { backgroundColor: Colors[theme].tint },
          ]}
          onPress={handlePickImage}
        >
          <Ionicons name="image-outline" size={24} color={Colors[theme].text} />
          <Text style={[styles.imageButtonText, { color: Colors[theme].text }]}>
            Add Image
          </Text>
        </TouchableOpacity>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: isSubmitting ? "#ccc" : "#E89600" },
          ]}
          onPress={handleSubmitPost}
          disabled={isSubmitting}
        >
          <Text style={styles.submitButtonText}>
            {isSubmitting ? "Submitting..." : "Submit Post"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
    borderColor: "#ddd",
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 20,
  },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  imageButtonText: {
    marginLeft: 10,
    fontSize: 16,
    fontWeight: "bold",
  },
  submitButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  backButton: {
    marginBottom: 20,
    alignSelf: "flex-start",
  },
  topPadding: {
    paddingTop: 60, // Adjust padding as needed
  },
});