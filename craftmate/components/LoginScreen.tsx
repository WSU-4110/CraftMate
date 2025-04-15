import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert, FlatList } from "react-native";
import { signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { auth, db } from "../constants/firebaseConfig";
import { doc, getDoc, updateDoc, setDoc, collection, query, where, getDocs, deleteDoc, increment, arrayRemove } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { useColorScheme } from "react-native";
import { Colors } from "../constants/Colors";
import { Link, useRouter, useFocusEffect } from "expo-router";
import styles from "./LoginScreen.styles";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from 'expo-file-system';
import { Ionicons } from '@expo/vector-icons';

const PRESET_TAGS = [
  "Cars",
  "Building",
  "Electricity",
  "Plumbing",
  "Painting",
  "Tools",
];

const uriToBase64 = async (uri: string): Promise<string> => {
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const fileExtension = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    return '';
  }
};

interface UserPost {
  id: string;
  username: string;
  userId: string;
  postTitle: string;
  postBody: string;
  timestamp: string | any;
  likes: number;
  profileImage: string;
  comments: number;
  images?: string[];
  likedBy?: string[];
}

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    profileImage: "",
    tags: [] as string[],
    isActive: false, // Add isActive to the local state
    username: "", // Add username to the local state
    followers: [] as string[],
    following: [] as string[],
    posts: [] as string[],
  });
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);

  const theme = useColorScheme() || "light";
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        await fetchUserProfile(user.uid);
        // Update isActive status when user logs in
        await updateIsActiveStatus(user.uid, true);
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

  const fetchUserProfile = async (uid: string) => {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data() as any;
        setProfile({
          ...data,
          name: `${data.firstName || ""} ${data.lastName || ""}`.trim(), // Use firstName and lastName for "Name:"
          username: data.username || "", // Fetch username for the header
          tags: data.tags || [],
          isActive: data.isActive || false,
          followers: data.followers || [],
          following: data.following || [],
          posts: data.posts || [],
        });
        setBioText(data.bio || "");

        // Fetch user's posts
        const postsQuery = query(collection(db, "posts"), where("userId", "==", uid));
        const postsSnapshot = await getDocs(postsQuery);
        const posts = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UserPost[];
        
        // Sort posts by timestamp (newest first)
        posts.sort((a, b) => {
          const dateA = a.timestamp instanceof Date ? a.timestamp : a.timestamp?.toDate?.() || new Date(a.timestamp);
          const dateB = b.timestamp instanceof Date ? b.timestamp : b.timestamp?.toDate?.() || new Date(b.timestamp);
          return dateB.getTime() - dateA.getTime();
        });
        
        setUserPosts(posts);
      } else {
        // Handle case where user doc doesn't exist yet
        console.log("No user profile document exists yet");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      Toast.show({ type: "error", text1: "Failed to load profile" });
    }
  };

  const updateProfile = async (
    updates: Partial<{
      profileImage: string;
      bio: string;
      tags: string[];
      isActive: boolean;
    }>
  ) => {
    if (!user) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, updates);
      setProfile((prev) => ({ ...prev, ...updates }));
      Toast.show({ type: "success", text1: "Profile Updated" });
    } catch (error) {
      console.error("Error updating profile:", error);
      Toast.show({ type: "error", text1: "Failed to update profile" });
    }
  };

  const updateIsActiveStatus = async (uid: string, status: boolean) => {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        // Document exists, update it
        await updateDoc(userRef, { isActive: status });
      } else {
        // Document doesn't exist, create it with isActive field
        await setDoc(userRef, { isActive: status });
      }
      
      // Update local state
      setProfile(prev => ({ ...prev, isActive: status }));
    } catch (error) {
      console.error("Error updating active status:", error);
    }
  };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      Toast.show({
        type: "success",
        text1: "Welcome",
        text2: `Logged in as ${user.email}`,
      });
      setUser(user);
      await fetchUserProfile(user.uid);
      // Updated: now handled in onAuthStateChanged
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Login Failed", text2: error.message });
    }
  };

  const handleSignOut = async () => {
    if (user) {
      // Set isActive to false before signing out
      await updateIsActiveStatus(user.uid, false);
      await signOut(auth);
      setUser(null);
      setProfile({ name: "", bio: "", profileImage: "", tags: [], isActive: false, username: "", followers: [], following: [], posts: [] });
      Toast.show({ type: "success", text1: "Signed Out" });
    }
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Resize and compress the image
        const resizedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 500 } }], // Resize to a width of 500px
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG } // Compress and save as JPEG
        );

        // Convert the resized image to base64
        const base64Image = await uriToBase64(resizedImage.uri);

        // Update the profile with the resized base64 image
        await updateProfile({ profileImage: base64Image });

        Toast.show({ type: "success", text1: "Profile image updated!" });
      } else {
        Toast.show({ type: "info", text1: "No image selected" });
      }
    } catch (error: any) {
      console.error("Error picking image:", error);
      Toast.show({
        type: "error",
        text1: "Upload Failed",
        text2: error.message || "Unknown error occurred",
      });
    }
  };

  const handleBioSubmit = async () => {
    await updateProfile({ bio: bioText });
    setEditingBio(false);
  };

  const toggleTag = async (tag: string) => {
    if (!user) return;
    const tags = profile.tags.includes(tag)
      ? profile.tags.filter((t) => t !== tag)
      : [...profile.tags, tag];
    await updateProfile({ tags });
  };

  const addCustomTag = () => {
    Alert.prompt("New Tag", "Enter custom tag", async (tag) => {
      if (!tag) return;
      const trimmed = tag.trim();
      if (!trimmed || profile.tags.includes(trimmed)) return;
      await updateProfile({ tags: [...profile.tags, trimmed] });
    });
  };

  const textColor = theme === "dark" ? "#fff" : "#000";
  // Add this useFocusEffect hook to refresh profile data when returning to this screen
  useFocusEffect(
    useCallback(() => {
      // This function will be called when the screen comes into focus
      const refreshProfile = async () => {
        if (user) {
          await fetchUserProfile(user.uid);
        }
      };
      
      refreshProfile();
      
      return () => {
        // This function will be called when the screen goes out of focus
        // Clean up if needed
      };
    }, [user])
  );

  const handleLikePost = async (postId: string) => {
    try {
      if (!user) {
        Alert.alert("Error", "You must be logged in to perform this action.");
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
        await updateDoc(postRef, {
          likes: increment(-1),
          likedBy: likedBy.filter((uid: string) => uid !== user.uid),
        });
      } else {
        await updateDoc(postRef, {
          likes: increment(1),
          likedBy: [...likedBy, user.uid],
        });
      }

      // Update local state to reflect changes
      const updatedPosts = userPosts.map(post => {
        if (post.id === postId) {
          const isLiked = post.likedBy?.includes(user.uid) || false;
          return {
            ...post,
            likes: isLiked ? post.likes - 1 : post.likes + 1,
            likedBy: isLiked 
              ? (post.likedBy || []).filter(id => id !== user.uid) 
              : [...(post.likedBy || []), user.uid]
          };
        }
        return post;
      });
      setUserPosts(updatedPosts);
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!user) {
      Alert.alert("Error", "You must be logged in to delete a post.");
      return;
    }
    
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this post?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "posts", postId));
              
              // Update the user's post count in Firestore
              const userRef = doc(db, "users", user.uid);
              await updateDoc(userRef, {
                postCount: increment(-1),
                posts: arrayRemove(postId)
              });
              
              // Update local state to remove the deleted post
              setUserPosts(userPosts.filter(post => post.id !== postId));
              Toast.show({ type: "success", text1: "Post deleted successfully" });
            } catch (error) {
              console.error("Error deleting post:", error);
              Toast.show({ type: "error", text1: "Failed to delete post" });
            }
          },
        },
      ]
    );
  };

  const navigateToPost = (postId: string) => {
    router.push(`../pages/viewpost?postId=${postId}`);
  };

  const renderUserPost = ({ item }: { item: UserPost }) => {
    const postDate = item.timestamp instanceof Date
      ? item.timestamp
      : item.timestamp?.toDate?.() || new Date(item.timestamp);

      return (
        <View style={[{
          width: '100%',
          marginVertical: 10,
          backgroundColor: Colors[theme].background,
          borderColor: Colors[theme].text,
        }]}>
          <TouchableOpacity
            onPress={() => navigateToPost(item.id)}
            onLongPress={() => handleDeletePost(item.id)}
          >
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 8 
            }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image
                  source={
                    item.profileImage
                      ? { uri: item.profileImage }
                      : require('../assets/images/PortraitPlaceholder.png')
                  }
                  style={{ width: 26, height: 26, borderRadius: 13, marginRight: 8 }}
                />
                <Text style={{ fontSize: 14, fontWeight: 'bold', color: Colors[theme].text }}>
                  {item.username}
                </Text>
              </View>
              <Text style={{ fontSize: 12, color: '#888' }}>
                {postDate.toLocaleDateString()}
              </Text>
            </View>
            <Text style={{ fontSize: 16, marginBottom: 10, color: Colors[theme].text, fontWeight: 'bold' }}>
              {item.postTitle}
            </Text>
            {item.images && item.images.length > 0 && (
              <Image source={{ uri: item.images[0] }} style={{ width: '100%', height: 200, borderRadius: 10, marginBottom: 4 }} />
            )}
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
            <View style={{ flexDirection: 'row' }}>
              {/* Like Button */}
              <TouchableOpacity
                style={{ 
                  marginLeft: 0, 
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: item.likedBy?.includes(user?.uid)
                    ? '#E89600' 
                    : Colors[theme].tint, 
                }}
                onPress={() => handleLikePost(item.id)}
              >
                <Ionicons
                  name={item.likedBy?.includes(user?.uid) ? 'thumbs-up' : 'thumbs-up-outline'}
                  size={16}
                  color={item.likedBy?.includes(user?.uid) ? Colors[theme].background : Colors[theme].text}
                />
                <Text style={{
                  marginLeft: 5,
                  fontSize: 14,
                  fontWeight: 'bold',
                  color: item.likedBy?.includes(user?.uid) ? Colors[theme].background : Colors[theme].text
                }}>
                  {item.likes}
                </Text>
              </TouchableOpacity>
  
              {/* Comment Button */}
              <TouchableOpacity
                style={{
                  marginLeft: 10,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: Colors[theme].tint
                }}
                onPress={() => navigateToPost(item.id)}
              >
                <Ionicons name="chatbubble-outline" size={16} color={Colors[theme].text} />
                <Text style={{ marginLeft: 5, fontSize: 14, fontWeight: 'bold', color: Colors[theme].text }}>
                  {item.comments || 0}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    };
  
    // Render UI when user is logged in
    if (user) {
      return (
        <View style={{ flex: 1, backgroundColor: Colors[theme].background }}>
          {/* Profile Header */}
          <View style={styles.headerContainer}>
            <Text style={[styles.headerText, { color: Colors[theme].text }]}>
              {profile.username || "Profile"} {/* Display username in the header */}
            </Text>
            <TouchableOpacity
              style={{
                position: "absolute",
                top: 10,
                right: 10,
                padding: 10,
                backgroundColor: Colors[theme].inputBackground,
                borderRadius: 5,
              }}
              onPress={handleSignOut}
            >
              <Text style={{ color: Colors[theme].text }}>Sign Out</Text>
            </TouchableOpacity>
          </View>
  
          <ScrollView
            contentContainerStyle={[
              styles.container,
              { alignItems: "center" } // Center content horizontally
            ]}
          >
            <TouchableOpacity onPress={handlePickImage}>
              <Image
                source={{
                  uri: profile.profileImage.startsWith('data:image/')
                    ? profile.profileImage // Base64 string
                    : profile.profileImage || "https://via.placeholder.com/150", // URI or placeholder
                }}
                style={{
                  width: 120, // Adjusted size
                  height: 120, // Adjusted size
                  borderRadius: 60, // Circular shape
                  alignSelf: "center",
                  marginBottom: 10,
                  borderWidth: 2,
                  borderColor: "#E89600",
                }}
              />
            </TouchableOpacity>
  
              <Text style={[styles.text, { color: Colors[theme].text, textAlign: "center", fontWeight: "bold", fontSize: 18 }]}>
              {profile.name}
              </Text>
            
            {/* Display tags directly under bio/name */}
            {profile.tags.length > 0 && (
              <View style={{ marginVertical: 10, width: '100%', alignItems: 'center' }}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: 'center' }}>
                  {profile.tags.map((tag) => (
                    <View
                      key={tag}
                      style={{
                        backgroundColor: "#E89600",
                        paddingVertical: 8,
                        paddingHorizontal: 14,
                        borderRadius: 20,
                        marginVertical: 4,
                      }}
                    >
                      <Text style={{ color: Colors[theme].background }}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          
          {/* Stats Row (Posts, Followers, Following) */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-around', 
            width: '100%',
          }}>
            {/* Posts Count */}
            <View style={{ 
              alignItems: 'center', 
              flex: 1,
              borderRightWidth: 1,
              borderRightColor: Colors[theme].border || '#E0E0E0'
            }}>
              <Text style={[styles.text, { color: Colors[theme].text, fontWeight: 'bold' }]}>
                {profile.posts?.length || 0}
              </Text>
              <Text style={{ color: Colors[theme].text }}>Posts</Text>
            </View>
            
            {/* Followers Count */}
            <View style={{ 
              alignItems: 'center', 
              flex: 1,
              borderRightWidth: 1,
              borderRightColor: Colors[theme].border || '#E0E0E0'
            }}>
              <Text style={[styles.text, { color: Colors[theme].text, fontWeight: 'bold' }]}>
                {profile.followers?.length || 0}
              </Text>
              <Text style={{ color: Colors[theme].text }}>Followers</Text>
            </View>
            
            {/* Following Count */}
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={[styles.text, { color: Colors[theme].text, fontWeight: 'bold' }]}>
                {profile.following?.length || 0}
              </Text>
              <Text style={{ color: Colors[theme].text }}>Following</Text>
            </View>
          </View>
          
          <View>
            <Text style={[styles.text, { color: Colors[theme].text, marginTop: 10 }]}>
              {profile.bio || "No bio available."}
            </Text>
          </View>
          
          {/* Edit Profile Button */}
            <TouchableOpacity 
            style={[styles.editButton, { marginTop: 30 }]} 
            onPress={() => router.push("pages/editprofile")}
            >
            <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          
          {/* User's Posts Section */}
          <View style={{ width: '100%', marginTop: 10 }}>
            <Text style={[styles.text, { color: Colors[theme].text, fontSize: 18, fontWeight: 'bold' }]}>
              My Posts
            </Text>
            
            {userPosts.length > 0 ? (
              <FlatList
                data={userPosts}
                renderItem={renderUserPost}
                keyExtractor={(item) => item.id}
                scrollEnabled={false} // Disable scrolling since it's inside a ScrollView
                ItemSeparatorComponent={() => (
                  <View style={{ height: 1, backgroundColor: Colors[theme].tint, width: '100%', marginVertical: 10 }} />
                )}
              />
            ) : (
              <Text style={{ color: Colors[theme].text, textAlign: 'center', marginTop: 10 }}>
                You haven't created any posts yet.
              </Text>
            )}
          </View>
        </ScrollView>
      </View>
    );
  }

  // Render UI when the user is not logged in
  return (
    <View
      style={[
        styles.container, 
        { 
          backgroundColor: Colors[theme].background,
          justifyContent: "center",
          alignItems: "center",
          flex: 1
        }
      ]}
    >
      <Text style={styles.title}>Log In</Text>
      <TextInput
        style={[styles.input, { color: Colors[theme].text, width: "100%" }]}
        placeholder="Email"
        placeholderTextColor={Colors[theme].icon}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={[styles.input, { color: Colors[theme].text, width: "100%" }]}
        placeholder="Password"
        placeholderTextColor={Colors[theme].icon}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={[styles.button, { width: "100%" }]} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: Colors[theme].text }]} >
          Don't have an account?
          <Link href="../pages/signup" style={styles.footerLink}>
            {" "}
            Sign Up
          </Link>
        </Text>
      </View>
    </View>
  );
}