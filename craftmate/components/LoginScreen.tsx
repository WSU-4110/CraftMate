import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert } from "react-native";
import { signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { auth, db } from "../constants/firebaseConfig";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { useColorScheme } from "react-native";
import { Colors } from "../constants/Colors";
import { Link, useRouter } from "expo-router";
import styles from "./LoginScreen.styles";
import * as ImageManipulator from "expo-image-manipulator";
import * as FileSystem from 'expo-file-system';

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
  });
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");

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
        });
        setBioText(data.bio || "");
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
      setProfile({ name: "", bio: "", profileImage: "", tags: [], isActive: false, username: "" });
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

          <Text style={[styles.text, { color: Colors[theme].text, textAlign: "center" }]}>
            {profile.name}
          </Text>
          
          <Text style={[styles.text, { color: Colors[theme].text, marginTop: 15 }]}>
            Bio: {profile.bio || "No bio available."}
          </Text>
          
          {/* Display tags as read-only */}
          {profile.tags.length > 0 && (
            <View style={{ marginTop: 20, width: '100%' }}>
              <Text style={[styles.radioText, { color: Colors[theme].text }]}>Tags:</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
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
                    <Text style={{ color: "#fff" }}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
          
          {/* Edit Profile Button */}
          <TouchableOpacity 
            style={[styles.button, { width: '80%', marginTop: 30 }]} 
            onPress={() => router.push("pages/editprofile")}
          >
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
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