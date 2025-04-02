import React, { useState, useEffect } from "react";
<<<<<<< HEAD
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from "react-native";
=======
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView, Alert } from "react-native";
>>>>>>> 1794846ad1a0491620fc7bf4005b116095b4d203
import { signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { auth, db } from "../constants/firebaseConfig";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { useColorScheme } from "react-native";
import { Colors } from "../constants/Colors";
import { Link } from "expo-router";
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

const PRESET_TAGS = ["Cars", "Building", "Electricity", "Plumbing", "Painting", "Tools"];

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
<<<<<<< HEAD
  const [profile, setProfile] = useState<any>({
    name: "",
    bio: "",
    profileImage: "",
    tags: [],
  });
  const [newBio, setNewBio] = useState("");
  const [customTag, setCustomTag] = useState("");
  const theme = useColorScheme() || "light";
  const textColor = theme === "dark" ? "#fff" : "#000";

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserProfile(currentUser.uid);
      } else {
        setUser(null);
        setProfile({ name: "", bio: "", profileImage: "", tags: [] });
=======
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    profileImage: "",
    tags: [] as string[],
    isActive: false, // Add isActive to the local state
  });
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");

  const theme = useColorScheme() || "light";

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        await fetchUserProfile(user.uid);
        // Update isActive status when user logs in
        await updateIsActiveStatus(user.uid, true);
      } else {
        setUser(null);
>>>>>>> 1794846ad1a0491620fc7bf4005b116095b4d203
      }
    });
    return unsubscribe;
  }, []);

  const fetchUserProfile = async (uid: string) => {
<<<<<<< HEAD
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      setProfile(userSnap.data());
    }
  };

  const updateProfile = async (updates: Partial<typeof profile>) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, updates);
    setProfile((prev: any) => ({ ...prev, ...updates }));
    Toast.show({ type: "success", text1: "Profile Updated" });
=======
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data() as any;
        setProfile({
          ...data,
          tags: data.tags || [],
          isActive: data.isActive || false, // Ensure isActive is included in profile state
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
>>>>>>> 1794846ad1a0491620fc7bf4005b116095b4d203
  };

  const handleLogin = async () => {
    try {
<<<<<<< HEAD
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedInUser = userCredential.user;
      setUser(loggedInUser);
      Toast.show({ type: "success", text1: "Welcome", text2: `Logged in as ${loggedInUser.email}` });
      await fetchUserProfile(loggedInUser.uid);
=======
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
>>>>>>> 1794846ad1a0491620fc7bf4005b116095b4d203
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Login Failed", text2: error.message });
    }
  };

  const handleSignOut = async () => {
<<<<<<< HEAD
    await signOut(auth);
    setUser(null);
    Toast.show({ type: "success", text1: "Signed Out" });
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      await updateProfile({ profileImage: result.assets[0].uri });
    }
  };

  const handleUpdateBio = async () => {
    await updateProfile({ bio: newBio });
=======
    if (user) {
      // Set isActive to false before signing out
      await updateIsActiveStatus(user.uid, false);
      await signOut(auth);
      setUser(null);
      setProfile({ name: "", bio: "", profileImage: "", tags: [], isActive: false });
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
>>>>>>> 1794846ad1a0491620fc7bf4005b116095b4d203
  };

  const toggleTag = async (tag: string) => {
    if (!user) return;
<<<<<<< HEAD
    const currentTags = profile.tags || [];
    const updatedTags = currentTags.includes(tag)
      ? currentTags.filter((t: string) => t !== tag)
      : [...currentTags, tag];
    await updateProfile({ tags: updatedTags });
  };

  const addCustomTag = async () => {
    const trimmed = customTag.trim();
    if (!trimmed || profile.tags.includes(trimmed)) return;
    await updateProfile({ tags: [...profile.tags, trimmed] });
    setCustomTag("");
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
        <Text style={styles.title}>Log In</Text>
        <TextInput
          style={[styles.input, { color: Colors[theme].text }]}
          placeholder="Email"
          placeholderTextColor={Colors[theme].icon}
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={[styles.input, { color: Colors[theme].text }]}
          placeholder="Password"
          placeholderTextColor={Colors[theme].icon}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Log In</Text>
        </TouchableOpacity>
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: Colors[theme].text }]}>
            Don't have an account?
            <Link href="../auth/signup" style={styles.footerLink}> Sign Up</Link>
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <Text style={[styles.title, { color: Colors[theme].text }]}>Profile</Text>

      <Image
        source={{ uri: profile.profileImage || "https://via.placeholder.com/150" }}
        style={styles.profileImage}
      />
      <TouchableOpacity style={styles.button} onPress={handlePickImage}>
        <Text style={styles.buttonText}>Select Profile Picture</Text>
      </TouchableOpacity>

      <Text style={[styles.text, { color: Colors[theme].text }]}>Email: {user.email}</Text>

      <TextInput
        style={[styles.input, { backgroundColor: Colors[theme].inputBackground, color: Colors[theme].text }]}
        placeholder="Update Bio"
        value={newBio}
        onChangeText={setNewBio}
        placeholderTextColor={Colors[theme].icon}
      />
      <TouchableOpacity style={styles.button} onPress={handleUpdateBio}>
        <Text style={styles.buttonText}>Update Bio</Text>
      </TouchableOpacity>

      <Text style={[styles.radioText, { marginTop: 20, color: Colors[theme].text }]}>Tags:</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {PRESET_TAGS.map((tag) => (
          <TouchableOpacity
            key={tag}
            onPress={() => toggleTag(tag)}
            style={{
              backgroundColor: profile.tags?.includes(tag) ? "#E89600" : Colors[theme].inputBackground,
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 20,
              marginVertical: 4,
              borderWidth: 1,
              borderColor: "#ccc",
            }}
          >
            <Text style={{ color: profile.tags?.includes(tag) ? "#fff" : textColor }}>{tag}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        placeholder="Add custom tag"
        value={customTag}
        onChangeText={setCustomTag}
        style={[
          styles.input,
          {
            marginTop: 10,
            backgroundColor: Colors[theme].inputBackground,
            color: Colors[theme].text,
          },
        ]}
        placeholderTextColor={Colors[theme].icon}
      />
      <TouchableOpacity style={styles.button} onPress={addCustomTag}>
        <Text style={styles.buttonText}>Add Tag</Text>
      </TouchableOpacity>

      <Text style={[styles.radioText, { marginTop: 20, color: Colors[theme].text }]}>Selected Tags:</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {profile.tags?.map((tag, i) => (
          <View
            key={i}
            style={{
              backgroundColor: "#E89600",
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 15,
              marginTop: 4,
            }}
          >
            <Text style={{ color: "#fff" }}>{tag}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSignOut}>
        <Text style={styles.buttonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
=======
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
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: Colors[theme].background }]}
      >
        <Text style={[styles.title, { color: Colors[theme].text }]}>Profile</Text>

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
              marginBottom: 15,
              borderWidth: 2,
              borderColor: "#E89600",
            }}
          />
        </TouchableOpacity>

        <Text style={[styles.text, { color: Colors[theme].text }]}>Name: {profile.name}</Text>
        <Text style={[styles.text, { color: Colors[theme].text }]}>Email: {user.email}</Text>
        <Text style={[styles.text, { color: Colors[theme].text }]}>Status: {profile.isActive ? 'Active' : 'Inactive'}</Text>

        {/* Bio Editing */}
        <View style={styles.bioContainer}>
          {editingBio ? (
            <>
              <TextInput
                style={[styles.input, { color: Colors[theme].text }]}
                value={bioText}
                onChangeText={setBioText}
                multiline
                placeholder="Edit your bio"
                placeholderTextColor={Colors[theme].icon}
              />
              <TouchableOpacity style={styles.button} onPress={handleBioSubmit}>
                <Text style={styles.buttonText}>Save Bio</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.text, { color: Colors[theme].text }]}>
                Bio: {profile.bio || "No bio available."}
              </Text>
              <TouchableOpacity style={styles.button} onPress={() => setEditingBio(true)}>
                <Text style={styles.buttonText}>Edit Bio</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Tags UI */}
        <Text style={[styles.radioText, { marginTop: 20, color: Colors[theme].text }]}>Tags:</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {[...new Set([...PRESET_TAGS, ...profile.tags.filter(t => !PRESET_TAGS.includes(t))]), "+"].map((tag) => (
            <TouchableOpacity
              key={tag}
              onPress={() => (tag === "+" ? addCustomTag() : toggleTag(tag))}
              style={{
                backgroundColor: tag === "+" ? Colors[theme].inputBackground : profile.tags.includes(tag) ? "#E89600" : Colors[theme].inputBackground,
                paddingVertical: 8,
                paddingHorizontal: tag === "+" ? 12 : 14,
                borderRadius: 20,
                marginVertical: 4,
                borderWidth: 1,
                borderColor: tag === "+" ? "#aaa" : "transparent",
              }}
            >
              <Text style={{
                color: tag === "+" ? "#aaa" : profile.tags.includes(tag) ? "#fff" : textColor,
              }}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={[styles.button, { position: "absolute", bottom: 20, left: 20, right: 20 }]} onPress={handleSignOut}>
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Render UI when the user is not logged in
  return (
    <View
      style={[styles.container, { backgroundColor: Colors[theme].background }]}
    >
      <Text style={styles.title}>Log In</Text>
      <TextInput
        style={[styles.input, { color: Colors[theme].text }]}
        placeholder="Email"
        placeholderTextColor={Colors[theme].icon}
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={[styles.input, { color: Colors[theme].text }]}
        placeholder="Password"
        placeholderTextColor={Colors[theme].icon}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin}>
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
>>>>>>> 1794846ad1a0491620fc7bf4005b116095b4d203
