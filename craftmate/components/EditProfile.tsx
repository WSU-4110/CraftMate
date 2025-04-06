import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useColorScheme } from "react-native";
import { auth, db } from "../constants/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Colors } from "../constants/Colors";
import styles from "./LoginScreen.styles";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const PRESET_TAGS = [
  "Cars",
  "Building",
  "Electricity",
  "Plumbing",
  "Painting",
  "Tools",
];

export default function EditProfileScreen() {
  const [profile, setProfile] = useState({
    bio: "",
    tags: [] as string[],
    username: "",
    firstName: "",
    lastName: "",
  });
  const [bioText, setBioText] = useState("");
  const theme = useColorScheme() || "light";
  const router = useRouter();
  const textColor = theme === "dark" ? "#fff" : "#000";

  useEffect(() => {
    const loadProfile = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        await fetchUserProfile(currentUser.uid);
      } else {
        // Redirect to login if not authenticated
        router.replace("/");
      }
    };

    loadProfile();
  }, []);

  const fetchUserProfile = async (uid: string) => {
    try {
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data() as any;
        setProfile({
          bio: data.bio || "",
          tags: data.tags || [],
          username: data.username || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
        });
        setBioText(data.bio || "");
      } else {
        console.log("No user profile document exists yet");
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      Toast.show({ type: "error", text1: "Failed to load profile" });
    }
  };

  const updateProfile = async (updates: Partial<typeof profile>) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    try {
      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, updates);
      setProfile((prev) => ({ ...prev, ...updates }));
      Toast.show({ type: "success", text1: "Profile Updated" });
    } catch (error) {
      console.error("Error updating profile:", error);
      Toast.show({ type: "error", text1: "Failed to update profile" });
    }
  };

  const handleBioSubmit = async () => {
    await updateProfile({ bio: bioText });
  };

  const toggleTag = async (tag: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
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

  const saveAndGoBack = async () => {
    try {
      // Ensure bio and other fields are updated
      await updateProfile({ 
        bio: bioText,
        // Include all fields that might have changed
        username: profile.username,
        firstName: profile.firstName,
        lastName: profile.lastName
      });
      
      Toast.show({ 
        type: "success", 
        text1: "Profile Updated",
        text2: "Your changes have been saved"
      });
      
      // Navigate back after successful update
      router.back();
    } catch (error) {
      console.error("Error saving profile:", error);
      Toast.show({ 
        type: "error", 
        text1: "Update Failed",
        text2: "Please try again"
      });
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors[theme].background }}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={{ position: "absolute", left: 10, top: 10 }}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors[theme].text} />
        </TouchableOpacity>
        <Text style={[styles.headerText, { color: Colors[theme].text }]}>
          Edit Profile
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* Bio Editing */}
        <Text style={[styles.radioText, { color: Colors[theme].text, marginBottom: 8 }]}>Bio:</Text>
        <TextInput
          style={[
            styles.input, 
            { 
              color: Colors[theme].text,
              height: 100,
              textAlignVertical: 'top',
              paddingTop: 10
            }
          ]}
          value={bioText}
          onChangeText={setBioText}
          multiline
          placeholder="Edit your bio"
          placeholderTextColor={Colors[theme].icon}
        />

        {/* Tags UI */}
        <Text style={[styles.radioText, { marginTop: 20, color: Colors[theme].text }]}>Tags:</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
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

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.button, { marginTop: 40 }]} 
          onPress={saveAndGoBack}
        >
          <Text style={styles.buttonText}>Save Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
