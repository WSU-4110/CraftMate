import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Link, useRouter } from "expo-router";
import { auth, db } from "../constants/firebaseConfig";
import { useColorScheme } from "react-native";
import { Colors } from "../constants/Colors";
import styles from "./SignUpScreen.styles";

export default function SignUpScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const theme = useColorScheme() || "light"; // Provide a default theme
  const router = useRouter(); // Initialize router

  const handleSignUp = async () => {
    // Validate all fields
    if (!username || !firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert("Error", "All fields are required!");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long!");
      return;
    }

    try {
      // Step 1: Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Step 2: Create a user document in Firestore
      const userRef = doc(db, "users", user.uid); // Use UID as the document ID
      await setDoc(userRef, {
        email: user.email,
        uid: user.uid,
        username,
        firstName,
        lastName,
        profileImage: "https://via.placeholder.com/150", // Default profile image
        createdAt: new Date().toISOString(),
        followers: [], // Initialize empty followers array
        following: [], // Initialize empty following array
      });

      Alert.alert("Success", `Welcome, ${username}!`);

      // Step 3: Navigate to home page after sign-up
      router.push("/(tabs)"); // Home page (tab layout)
    } catch (error: any) {
      Alert.alert("Sign Up Failed", error.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <Text style={styles.title}>Create an Account</Text>
      {/* Username */}
      <TextInput
        style={[styles.input, { color: Colors[theme].text }]}
        placeholder="Username"
        placeholderTextColor={Colors[theme].icon}
        value={username}
        onChangeText={setUsername}
      />

      {/* First Name */}
      <TextInput
        style={[styles.input, { color: Colors[theme].text }]}
        placeholder="First Name"
        placeholderTextColor={Colors[theme].icon}
        value={firstName}
        onChangeText={setFirstName}
      />

      {/* Last Name */}
      <TextInput
        style={[styles.input, { color: Colors[theme].text }]}
        placeholder="Last Name"
        placeholderTextColor={Colors[theme].icon}
        value={lastName}
        onChangeText={setLastName}
      />

      {/* Email */}
      <TextInput
        style={[styles.input, { color: Colors[theme].text }]}
        placeholder="Email"
        placeholderTextColor={Colors[theme].icon}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Password */}
      <TextInput
        style={[styles.input, { color: Colors[theme].text }]}
        placeholder="Password"
        placeholderTextColor={Colors[theme].icon}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Confirm Password */}
      <TextInput
        style={[styles.input, { color: Colors[theme].text }]}
        placeholder="Confirm Password"
        placeholderTextColor={Colors[theme].icon}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      {/* Sign Up Button */}
      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={[styles.buttonText, { color: Colors[theme].background }]}>Sign Up</Text>
      </TouchableOpacity>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: Colors[theme].text }]}>
          Already have an account?{" "}
          <Link href="../login" style={[styles.footerLink]}>
            Log In
          </Link>
        </Text>
      </View>
    </View>
  );
}
