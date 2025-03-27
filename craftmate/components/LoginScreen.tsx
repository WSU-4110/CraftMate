import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView } from "react-native";
import { signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { auth, db } from "../constants/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { useColorScheme } from "react-native";
import { Colors } from "../constants/Colors";
import { Link } from "expo-router";
import styles from "./LoginScreen.styles";

const PRESET_TAGS = ["Cars", "Building", "Electricity", "Plumbing", "Painting", "Tools"];

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
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
      }
    });
    return unsubscribe;
  }, []);

  const fetchUserProfile = async (uid: string) => {
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
  };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const loggedInUser = userCredential.user;
      setUser(loggedInUser);
      Toast.show({ type: "success", text1: "Welcome", text2: `Logged in as ${loggedInUser.email}` });
      await fetchUserProfile(loggedInUser.uid);
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Login Failed", text2: error.message });
    }
  };

  const handleSignOut = async () => {
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
  };

  const toggleTag = async (tag: string) => {
    if (!user) return;
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
