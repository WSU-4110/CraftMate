import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
} from "react-native";
import { signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { auth, db } from "../constants/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { useColorScheme } from "react-native";
import { Colors } from "../constants/Colors";
import { Link } from "expo-router";
import styles from "./LoginScreen.styles";

const PRESET_TAGS = [
  "Cars",
  "Building",
  "Electricity",
  "Plumbing",
  "Painting",
  "Tools",
];

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    profileImage: "",
    tags: [] as string[],
  });
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState("");
  const theme = useColorScheme() || "light";

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        await fetchUserProfile(user.uid);
      } else {
        setUser(null);
      }
    });
    return unsubscribe;
  }, []);

  const fetchUserProfile = async (uid: string) => {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data() as any;
      setProfile({
        ...data,
        tags: data.tags || [], // Ensure tags is always an array
      });
      setBioText(data.bio || "");
    }
  };

  const updateProfile = async (
    updates: Partial<{
      profileImage: string;
      bio: string;
      tags: string[];
    }>
  ) => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, updates);
    setProfile((prev) => ({ ...prev, ...updates }));
    Toast.show({ type: "success", text1: "Profile Updated" });
  };

  const handleLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { isActive: true });
      Toast.show({
        type: "success",
        text1: "Welcome",
        text2: `Logged in as ${user.email}`,
      });
      setUser(user);
      await fetchUserProfile(user.uid);
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Login Failed", text2: error.message });
    }
  };

  const handleSignOut = async () => {
    if (!user) return;
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { isActive: false });
    await signOut(auth);
    setUser(null);
    setProfile({ name: "", bio: "", profileImage: "", tags: [] });
    Toast.show({ type: "success", text1: "Signed Out" });
  };

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
        base64: true, // ✅ Required to get base64 string
      });
  
      if (result.canceled || !result.assets || result.assets.length === 0) {
        Toast.show({ type: "info", text1: "No image selected" });
        return;
      }
  
      const base64String = result.assets[0].base64;
      if (!base64String) {
        throw new Error("Failed to get base64 from selected image.");
      }
  
      const base64ImageUri = `data:image/jpeg;base64,${base64String}`;
      await updateProfile({ profileImage: base64ImageUri });
  
      Toast.show({ type: "success", text1: "Profile image updated!" });
    } catch (error: any) {
      console.error("Image update failed:", error);
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
    const tags = (profile.tags || []).includes(tag)
      ? (profile.tags || []).filter((t) => t !== tag)
      : [...(profile.tags || []), tag];
    await updateProfile({ tags });
  };

  const addCustomTag = () => {
    Alert.prompt("New Tag", "Enter custom tag", async (tag) => {
      if (!tag) return;
      const trimmed = tag.trim();
      if (!trimmed || (profile.tags || []).includes(trimmed)) return;
      await updateProfile({ tags: [...(profile.tags || []), trimmed] });
    });
  };

  const textColor = theme === "dark" ? "#fff" : "#000";

  if (user) {
    return (
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { backgroundColor: Colors[theme].background },
        ]}
      >
        <Text style={[styles.title, { color: Colors[theme].text }]}>
          Profile
        </Text>

        <TouchableOpacity onPress={handlePickImage}>
          <Image
            source={{
              uri: profile.profileImage || "https://via.placeholder.com/150",
            }}
            style={{
              width: 120,
              height: 120,
              borderRadius: 60,
              alignSelf: "center",
              marginBottom: 15,
              borderWidth: 2,
              borderColor: "#E89600",
            }}
          />
        </TouchableOpacity>

        <Text style={[styles.text, { color: Colors[theme].text }]}>
          Name: {profile.name}
        </Text>
        <Text style={[styles.text, { color: Colors[theme].text }]}>
          Email: {user.email}
        </Text>

        <View style={{ marginVertical: 10 }}>
          {editingBio ? (
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: Colors[theme].inputBackground,
                  color: Colors[theme].text,
                },
              ]}
              value={bioText}
              onChangeText={setBioText}
              onSubmitEditing={handleBioSubmit}
              onBlur={handleBioSubmit}
              autoFocus
            />
          ) : (
            <TouchableOpacity onPress={() => setEditingBio(true)}>
              <Text
                style={[
                  styles.text,
                  {
                    paddingVertical: 10,
                    paddingHorizontal: 15,
                    borderRadius: 6,
                    borderColor: Colors[theme].icon,
                    borderWidth: 1,
                    color: Colors[theme].text,
                  },
                ]}
              >
                {profile.bio || "Tap to add a bio"}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[styles.radioText, { marginTop: 20, color: Colors[theme].text }]}>
  Tags:
</Text>
<View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
  {[
    ...new Set([
      ...PRESET_TAGS,
      ...(profile.tags || []).filter((t) => !PRESET_TAGS.includes(t)),
    ]),
    "+",
  ].map((tag) => (
    <TouchableOpacity
      key={tag}
      onPress={() => (tag === "+" ? addCustomTag() : toggleTag(tag))}
      style={{
        backgroundColor:
          tag === "+"
            ? Colors[theme].inputBackground
            : (profile.tags || []).includes(tag)
            ? "#E89600"
            : Colors[theme].inputBackground,
        paddingVertical: 8,
        paddingHorizontal: tag === "+" ? 12 : 14,
        borderRadius: 20,
        marginVertical: 4,
        borderWidth: 1,
        borderColor: tag === "+" ? "#aaa" : "transparent",
      }}
    >
      <Text
        style={{
          color:
            tag === "+"
              ? "#aaa"
              : (profile.tags || []).includes(tag)
              ? "#fff"
              : textColor,
        }}
      >
        {tag}
      </Text>
    </TouchableOpacity>
  ))}
</View>


        <Text style={[styles.radioText, { marginTop: 20, color: Colors[theme].text }]}>Selected Tags:</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {profile.tags.map((tag, i) => (
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
        <Text style={[styles.footerText, { color: Colors[theme].text }]}>
          Don't have an account?
          <Link href="../auth/signup" style={styles.footerLink}>
            {" "}
            Sign Up
          </Link>
        </Text>
      </View>
    </View>
  );
}
