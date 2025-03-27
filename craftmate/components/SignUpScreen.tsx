import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Link, useRouter } from "expo-router";
import { auth, db } from "../constants/firebaseConfig";
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import styles from "./SignUpScreen.styles";

export default function SignUpScreen() {
  // set up state for form inputs
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isProfessional, setIsProfessional] = useState(false); // false by default
  const theme = useColorScheme() || 'light'; // fallback to light theme
  const router = useRouter(); // used to navigate

  const handleSignUp = async () => {
    // make sure all fields are filled
    if (!username || !firstName || !lastName || !email || !password || !confirmPassword) {
      Alert.alert("Error", "All fields are required!");
      return;
    }

    // check if passwords match
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }

    // check for min password length
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long!");
      return;
    }

    try {
      // create new user with firebase auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // add user's info to firestore
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        email: user.email,
        uid: user.uid,
        username,
        firstName,
        lastName,
        profileImage: "https://via.placeholder.com/150", // default for now
        createdAt: new Date().toISOString(),
        followers: [],
        following: [],
        isProfessional,
      });

      Alert.alert("Success", `Welcome, ${username}!`);

      // go back to main screen after signup
      router.replace("/(tabs)");
    } catch (error: any) {
      Alert.alert("Sign Up Failed", error.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <Text style={styles.title}>Create an Account</Text>

      {/* username field */}
      <TextInput
        style={[styles.input, { color: Colors[theme].text }]}
        placeholder="Username"
        placeholderTextColor={Colors[theme].icon}
        value={username}
        onChangeText={setUsername}
      />

      {/* first name field */}
      <TextInput
        style={[styles.input, { color: Colors[theme].text }]}
        placeholder="First Name"
        placeholderTextColor={Colors[theme].icon}
        value={firstName}
        onChangeText={setFirstName}
      />

      {/* last name field */}
      <TextInput
        style={[styles.input, { color: Colors[theme].text }]}
        placeholder="Last Name"
        placeholderTextColor={Colors[theme].icon}
        value={lastName}
        onChangeText={setLastName}
      />

      {/* email field */}
      <TextInput
        style={[styles.input, { color: Colors[theme].text }]}
        placeholder="Email"
        placeholderTextColor={Colors[theme].icon}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* password field */}
      <TextInput
        style={[styles.input, { color: Colors[theme].text }]}
        placeholder="Password"
        placeholderTextColor={Colors[theme].icon}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* confirm password field */}
      <TextInput
        style={[styles.input, { color: Colors[theme].text }]}
        placeholder="Confirm Password"
        placeholderTextColor={Colors[theme].icon}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      {/* toggle between user types */}
      <View style={styles.radioContainer}>
        <Text style={[styles.radioText, { color: Colors[theme].text }]}>Select your role:</Text>
        <View style={styles.radioButtons}>
          <TouchableOpacity
            style={[
              styles.radioOption,
              isProfessional ? { backgroundColor: "#E89600" } : {}
            ]}
            onPress={() => setIsProfessional(true)}
          >
            <Text style={{ color: isProfessional ? "#fff" : Colors[theme].text }}>Professional</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.radioOption,
              !isProfessional ? { backgroundColor: "#E89600" } : {}
            ]}
            onPress={() => setIsProfessional(false)}
          >
            <Text style={{ color: !isProfessional ? "#fff" : Colors[theme].text }}>Enthusiast</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* submit button */}
      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={[styles.buttonText, { color: Colors[theme].background }]}>Sign Up</Text>
      </TouchableOpacity>

      {/* login link */}
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
