import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView } from "react-native";
import { useColorScheme } from "react-native";
import { auth, db } from "../constants/firebaseConfig";
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { Colors } from "../constants/Colors";
import styles from "./EditProfile.styles";
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
  const [usernameText, setUsernameText] = useState("");
  const [firstNameText, setFirstNameText] = useState("");
  const [lastNameText, setLastNameText] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const theme = useColorScheme() || "light";
  const router = useRouter();
  const textColor = theme === "dark" ? "#fff" : "#000";
  const usernameTimer = React.useRef<NodeJS.Timeout | null>(null);

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
        setUsernameText(data.username || "");
        setFirstNameText(data.firstName || "");
        setLastNameText(data.lastName || "");
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
    setIsModalVisible(true);
  };

  const validateFields = () => {
    if (!usernameText.trim()) {
      Toast.show({ 
        type: "error", 
        text1: "Username is required",
        text2: "Please enter a username"
      });
      return false;
    }
    
    if (!firstNameText.trim()) {
      Toast.show({ 
        type: "error", 
        text1: "First Name is required",
        text2: "Please enter your first name"
      });
      return false;
    }
    
    if (!lastNameText.trim()) {
      Toast.show({ 
        type: "error", 
        text1: "Last Name is required",
        text2: "Please enter your last name"
      });
      return false;
    }
    
    return true;
  };

  const isUsernameUnique = async (username: string): Promise<boolean> => {
    // If username hasn't changed, no need to check
    if (username.toLowerCase() === profile.username.toLowerCase()) {
      return true;
    }
    
    try {
      const usersRef = collection(db, "users");
      // Convert to lowercase for case-insensitive comparison
      const lowercaseUsername = username.toLowerCase();
      
      // First, check for exact match
      const exactQuery = query(usersRef, where("username", "==", username));
      const exactSnapshot = await getDocs(exactQuery);
      
      if (!exactSnapshot.empty) {
        return false;
      }
      
      // Then check for case-insensitive matches
      const allUsersQuery = query(usersRef);
      const allUsersSnapshot = await getDocs(allUsersQuery);
      
      // Check if any username matches case-insensitively
      const caseInsensitiveMatch = allUsersSnapshot.docs.some(
        doc => doc.data().username && 
        doc.data().username.toLowerCase() === lowercaseUsername
      );
      
      return !caseInsensitiveMatch;
    } catch (error) {
      console.error("Error checking username uniqueness:", error);
      return false;
    }
  };

  const checkUsernameAvailability = async (username: string) => {
    if (!username.trim()) {
      setUsernameError("");
      return;
    }
    
    const isUnique = await isUsernameUnique(username);
    if (!isUnique) {
      setUsernameError("Username already taken");
    } else {
      setUsernameError("");
    }
  };

  const handleUsernameChange = (text: string) => {
    setUsernameText(text);
    // Debounce the check to avoid too many Firestore queries
    clearTimeout(usernameTimer.current);
    usernameTimer.current = setTimeout(() => checkUsernameAvailability(text), 500);
  };

  useEffect(() => {
    return () => {
      if (usernameTimer.current) {
        clearTimeout(usernameTimer.current);
      }
    };
  }, []);

  const saveAndGoBack = async () => {
    if (!validateFields()) {
      return;
    }
    
    // Check username uniqueness
    const usernameUnique = await isUsernameUnique(usernameText.trim());
    if (!usernameUnique) {
      Toast.show({
        type: "error",
        text1: "Username already exists",
        text2: "Usernames are case-insensitive. Please choose a different username."
      });
      return;
    }
    
    try {
      // Ensure all fields are updated
      await updateProfile({ 
        bio: bioText,
        username: usernameText.trim(),
        firstName: firstNameText.trim(),
        lastName: lastNameText.trim()
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

  // Check if save button should be enabled
  const isFormValid = usernameText.trim() && firstNameText.trim() && lastNameText.trim();

  return (
    <View style={{ flex: 1, backgroundColor: Colors[theme].background }}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors[theme].text} />
          </TouchableOpacity>
          <Text style={[styles.header, { color: Colors[theme].text }]}>
            Edit Profile
          </Text>
        </View>
        
        {/* Username Field */}
        <Text style={[styles.labelText, { color: Colors[theme].text }]}>Username: *</Text>
        <TextInput
          style={[
            styles.input, 
            { 
              color: Colors[theme].text,
              backgroundColor: Colors[theme].inputBackground,
              borderColor: usernameError ? "#ff6b6b" : !usernameText.trim() ? "#ff6b6b" : Colors[theme].border 
            }
          ]}
          value={usernameText}
          onChangeText={handleUsernameChange}
          placeholder="Enter username"
          placeholderTextColor={Colors[theme].icon}
          autoCapitalize="none"
        />
        {usernameError ? (
          <Text style={{ color: "#ff6b6b", marginTop: 5, marginBottom: 10 }}>
            {usernameError}
          </Text>
        ) : null}
        
        {/* First Name Field */}
        <Text style={[styles.labelText, { color: Colors[theme].text }]}>First Name: *</Text>
        <TextInput
          style={[
            styles.input, 
            { 
              color: Colors[theme].text,
              backgroundColor: Colors[theme].inputBackground,
              borderColor: !firstNameText.trim() ? "#ff6b6b" : Colors[theme].border 
            }
          ]}
          value={firstNameText}
          onChangeText={setFirstNameText}
          placeholder="Enter first name"
          placeholderTextColor={Colors[theme].icon}
        />
        
        {/* Last Name Field */}
        <Text style={[styles.labelText, { color: Colors[theme].text }]}>Last Name: *</Text>
        <TextInput
          style={[
            styles.input, 
            { 
              color: Colors[theme].text,
              backgroundColor: Colors[theme].inputBackground,
              borderColor: !lastNameText.trim() ? "#ff6b6b" : Colors[theme].border 
            }
          ]}
          value={lastNameText}
          onChangeText={setLastNameText}
          placeholder="Enter last name"
          placeholderTextColor={Colors[theme].icon}
        />

        {/* Bio Editing */}
        <Text style={[styles.labelText, { color: Colors[theme].text }]}>Bio:</Text>
        <TextInput
          style={[
            styles.input, 
            { 
              color: Colors[theme].text,
              backgroundColor: Colors[theme].inputBackground,
              borderColor: Colors[theme].border,
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
        <Text style={[styles.labelText, { color: Colors[theme].text }]}>Tags:</Text>
        <View style={styles.tagContainer}>
          {[
            ...new Set([...PRESET_TAGS, ...profile.tags.filter(t => !PRESET_TAGS.includes(t))]),
            "+"
          ].map((tag) => (
            <TouchableOpacity
              key={tag}
              onPress={() => (tag === "+" ? addCustomTag() : toggleTag(tag))}
              style={[
                styles.tagButton,
                tag === "+" ? styles.addTagButton : null,
                {
                  backgroundColor: 
                    tag === "+" 
                      ? Colors[theme].inputBackground 
                      : profile.tags.includes(tag) 
                        ? "#E89600" 
                        : Colors[theme].inputBackground,
                  borderWidth: tag === "+" ? 1 : 0,
                  borderColor: tag === "+" ? "#aaa" : "transparent"
                }
              ]}
            >
              <Text style={[
                styles.tagButtonText,
                tag === "+" ? styles.addTagButtonText : null,
                {
                  color: 
                    tag === "+" 
                      ? "#aaa" 
                      : profile.tags.includes(tag) 
                        ? "#fff" 
                        : textColor
                }
              ]}>
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[
            styles.submitButton, 
            { 
              marginTop: 40,
              opacity: isFormValid ? 1 : 0.6 
            }
          ]} 
          onPress={saveAndGoBack}
          disabled={!isFormValid}
        >
          <Text style={styles.submitButtonText}>Save Profile</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
