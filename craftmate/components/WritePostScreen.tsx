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
import { ThemeContext, useNavigation } from "@react-navigation/native";

// Define the Post interface
interface Post {
  id: string;
  username: string;
  postTitle: string; // Updated from content to postTitle
  postBody: string; // Added textbody field
  timestamp: string;
  likes: number;
  profileImage: string;
  comments: number;
  images?: string[];
  likedBy?: string[];
  tags?: string[]; // Added tags field
}

export default function WritePost() {
  const theme: "light" | "dark" = useColorScheme() || "light";
  const navigation = useNavigation(); // Access navigation
  const [postTitle, setPostTitle] = useState(""); // New state for title
  const [postContent, setPostContent] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<string[]>([]); // State to store multiple media
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userDetails, setUserDetails] = useState<{ username: string; profileImage: string } | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]); // State for selected tags
  const [isTagMenuVisible, setIsTagMenuVisible] = useState(false); // State to toggle tag menu
  const TAG_OPTIONS = ["Cars", "Building", "Electricity", "Plumbing", "Painting", "Tools"]; // Predefined tags

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

  const handlePickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Restrict to images only
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const resizedImages = await Promise.all(
          result.assets.map(async (asset) => {
            const manipulatedImage = await ImageManipulator.manipulateAsync(
              asset.uri,
              [{ resize: { width: 800 } }], // Resize to 800px width
              { base64: true, compress: 0.7 } // Compress the image
            );
            return `data:image/jpeg;base64,${manipulatedImage.base64}`; // Prefix with MIME type
          })
        );
        setSelectedMedia((prevMedia) => [...prevMedia, ...resizedImages]); // Add resized images to the list
      }
    } catch (error) {
      console.error("Error picking media:", error);
      Alert.alert("Error", "Failed to pick media.");
    }
  };

  const handleRemoveMedia = (uri: string) => {
    setSelectedMedia((prevMedia) => prevMedia.filter((media) => media !== uri));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tag) ? prevTags.filter((t) => t !== tag) : [...prevTags, tag]
    );
  };

  const toggleTagMenu = () => {
    setIsTagMenuVisible((prev) => !prev);
  };

  const addCustomTag = () => {
    Alert.prompt("New Tag", "Enter custom tag", (tag) => {
      if (!tag) return;
      const trimmed = tag.trim();
      if (!trimmed || selectedTags.includes(trimmed)) return;
      setSelectedTags((prevTags) => [...prevTags, trimmed]);
    });
  };

  const handleSubmitPost = async () => {
    if (!postTitle.trim()) {
      Alert.alert("Error", "Post title is required.");
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
        postTitle: postTitle.trim(), // Save title
        postBody: postContent.trim(), // Optional body
        timestamp: serverTimestamp(),
        likes: 0,
        profileImage: userDetails.profileImage || "https://via.placeholder.com/150",
        comments: 0,
        images: selectedMedia, // Save base64 images
        likedBy: [],
        tags: selectedTags, // Include selected tags
      };

      // Add the post to Firestore
      await addDoc(collection(db, "posts"), postData);

      Alert.alert("Success", "Your post has been submitted!");
      setPostTitle(""); // Clear title
      setPostContent(""); // Clear content
      setSelectedMedia([]); // Clear media
      setSelectedTags([]); // Clear tags

      // Navigate back to the previous screen
      navigation.goBack();
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
      <View style={styles.topPadding}>
        <View style={[styles.headerContainer]}>
          {/* Back Arrow */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors[theme].text} />
          </TouchableOpacity>

          {/* Header */}
          <Text style={[styles.header, { color: Colors[theme].text }]}>
            Create Post
          </Text>
        </View>

        {/* Post Title Input */}
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: Colors[theme].inputBackground,
              color: Colors[theme].text,
            },
          ]}
          placeholder="Enter title..."
          placeholderTextColor={Colors[theme].icon}
          value={postTitle}
          onChangeText={setPostTitle}
        />

        {/* Add Tags Button */}
        <TouchableOpacity
          style={[
            styles.addTagsButton,
            { backgroundColor: Colors[theme].tint }, // Dynamic background color
          ]}
          onPress={toggleTagMenu}
        >
          <Text style={[styles.addTagsButtonText, { color: Colors[theme].text }]}>
            Add Tags
          </Text>
        </TouchableOpacity>

        {/* Tag Dropdown Menu */}
        {isTagMenuVisible && (
          <View style={[styles.tagMenu, { backgroundColor: Colors[theme].background }]}>
            {[
              ...new Set([...TAG_OPTIONS, ...selectedTags.filter((t) => !TAG_OPTIONS.includes(t))]),
              "+",
            ].map((tag) => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagButton,
                  {
                    backgroundColor:
                      tag === "+"
                        ? Colors[theme].inputBackground
                        : selectedTags.includes(tag)
                        ? "#E89600"
                        : Colors[theme].tint,
                  },
                ]}
                onPress={() => (tag === "+" ? addCustomTag() : toggleTag(tag))}
              >
                <Text
                  style={{
                    color:
                      tag === "+"
                        ? "#aaa"
                        : selectedTags.includes(tag)
                        ? Colors[theme].background
                        : Colors[theme].text,
                  }}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Post Body Input */}
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: Colors[theme].inputBackground,
              color: Colors[theme].text,
              height: 100, // Adjust height for multiline input
            },
          ]}
          placeholder="Write something..."
          placeholderTextColor={Colors[theme].icon}
          value={postContent}
          onChangeText={setPostContent}
          multiline
        />

        {/* Media Previews */}
        {selectedMedia.length > 0 && (
          <ScrollView horizontal style={styles.mediaPreviewContainer}>
            {selectedMedia.map((uri, index) => (
              <View key={index} style={styles.mediaPreviewWrapper}>
                <Image source={{ uri }} style={styles.mediaPreview} />
                <TouchableOpacity
                  style={styles.removeMediaButton}
                  onPress={() => handleRemoveMedia(uri)}
                >
                  <Ionicons name="close-circle" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Add Media Button */}
        <TouchableOpacity
          style={[
            styles.imageButton,
            { backgroundColor: Colors[theme].tint },
          ]}
          onPress={handlePickMedia}
        >
          <Ionicons name="image-outline" size={24} color={Colors[theme].text} />
          <Text style={[styles.imageButtonText, { color: Colors[theme].text }]}>
            Add Media
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
          <Text
            style={[
              styles.submitButtonText,
              { color: Colors[theme].background }, // Dynamic text color based on theme
            ]}
          >
            {isSubmitting ? "Posting..." : "Post"}
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
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    marginBottom: 20,
    borderColor: "#ddd",
  },
  mediaPreviewContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  mediaPreviewWrapper: {
    position: "relative",
    marginRight: 10,
  },
  mediaPreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeMediaButton: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
    padding: 2,
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
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    marginTop: 30,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 0,
    paddingVertical: 10,
    zIndex: 1,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  topPadding: {
    paddingTop: 25,
  },
  addTagsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20, // Makes the button oval-shaped
    marginBottom: 20,
    alignSelf: "flex-start", // Ensures the button doesn't stretch
  },
  addTagsButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#000", // Text color
    marginRight: 8, // Space between text and icon
  },
  tagMenu: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  tagButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20, // Makes the button oval-shaped
    marginRight: 8,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  tagText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  selectedTagButton: {
    backgroundColor: "#E89600", // Highlight selected tags
  },
  selectedTagText: {
    color: "#fff", // White text for selected tags
  },
  customTagButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginTop: 10,
    alignSelf: "flex-start",
  },
  customTagButtonText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  radioText: {
    fontSize: 16,
    fontWeight: "bold",
  },
});