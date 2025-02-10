import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Link } from "expo-router"; 
import { auth, db } from "../constants/firebaseConfig"; 
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import styles from "./SignUpScreen.styles";

export default function SignUpScreen(){
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const theme = useColorScheme() || 'light'; // Provide a default theme

  const handleSignUp = async () => {
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match!");
      return;
    }

    try {
      // Step 1: Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Step 2: Create a user document in Firestore
      const userRef = doc(db, 'users', user.uid); // Use UID as the document ID
      await setDoc(userRef, {
        email: user.email,
        uid: user.uid,
        createdAt: new Date().toISOString(),
      });

      Alert.alert("Success", `Welcome, ${user.email}!`);
    } catch (error: any) {
      Alert.alert("Sign Up Failed", error.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <Text style={styles.title}>Create an Account</Text>
      <TextInput
        style={[styles.input, { color: Colors[theme].text }]}
        placeholder="Email"
        placeholderTextColor={Colors[theme].icon}
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={[styles.input, { color: Colors[theme].text }]}
        placeholder="Password"
        placeholderTextColor={Colors[theme].icon}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TextInput
        style={[styles.input, { color: Colors[theme].text }]}
        placeholder="Confirm Password"
        placeholderTextColor={Colors[theme].icon}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      <TouchableOpacity style={ styles.button } onPress={handleSignUp}>
        <Text style={[styles.buttonText, { color: Colors[theme].background }]}>Sign Up</Text>
      </TouchableOpacity>
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: Colors[theme].text }]}>
          Already have an account?{" "}
          <Link href="../login" style={[styles.footerLink, styles.footerLink]}>
            Log In
          </Link>
        </Text>
      </View>
    </View>
  );
};


