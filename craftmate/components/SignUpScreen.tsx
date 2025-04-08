import React, { useState, useEffect, useRef } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc, collection, query, where, getDocs } from "firebase/firestore";
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
  const [isActive, setIsActive] = useState(true); // Set default to true when signing up
  const [usernameError, setUsernameError] = useState("");
  const theme = useColorScheme() || 'light'; // fallback to light theme
  const router = useRouter(); // used to navigate
  const usernameTimer = useRef<NodeJS.Timeout | null>(null);

  // Check if username is already taken
  const isUsernameUnique = async (username: string): Promise<boolean> => {
    if (!username.trim()) return true;
    
    try {
      const usersRef = collection(db, "users");
      const lowercaseUsername = username.toLowerCase();
      
      // First check for exact match
      const exactQuery = query(usersRef, where("username", "==", username));
      const exactSnapshot = await getDocs(exactQuery);
      
      if (!exactSnapshot.empty) {
        return false;
      }
      
      // Then check for case-insensitive matches
      const allUsersQuery = query(usersRef);
      const allUsersSnapshot = await getDocs(allUsersQuery);
      
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

  // Check username availability while typing
  const checkUsernameAvailability = async (username: string) => {
    if (!username.trim()) {
      setUsernameError("");
      return;
    }
    
    if (username.length < 3) {
      setUsernameError("Username must be at least 3 characters long.");
      return;
    }
    
    const isUnique = await isUsernameUnique(username);
    if (!isUnique) {
      setUsernameError("Username already taken");
    } else {
      setUsernameError("");
    }
  };

  // Handle username change with debounce
  const handleUsernameChange = (text: string) => {
    setUsername(text);
    // Debounce the check to avoid too many Firestore queries
    if (usernameTimer.current) {
      clearTimeout(usernameTimer.current);
    }
    if (text.length >= 3) {
      usernameTimer.current = setTimeout(() => checkUsernameAvailability(text), 500);
    } else if (text.length > 0) {
      setUsernameError("Username must be at least 3 characters long.");
    } else {
      setUsernameError("");
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (usernameTimer.current) {
        clearTimeout(usernameTimer.current);
      }
    };
  }, []);

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
    
    // Check if username is available
    const isUnique = await isUsernameUnique(username);
    if (!isUnique) {
      Alert.alert("Error", "Username already taken. Please choose a different username.");
      return;
    }

    try {
      // create new user with firebase auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Send email verification
      await sendEmailVerification(user);

      // add user's info to firestore with isActive set to true
      const userRef = doc(db, 'users', user.uid);
      
      const userData = {
        email: user.email,
        uid: user.uid,
        username,
        firstName,
        lastName,
        bio: "", // Add empty bio string
        profileImage: "https://via.placeholder.com/150", // default for now
        createdAt: new Date().toISOString(),
        followers: [], // Initialize as empty array
        following: [], // Initialize as empty array
        posts: [], // Initialize as empty array
        postCount: 0, // Initialize post count
        isProfessional,
        isActive: true, // Set to true when creating the account
        tags: [], // Initialize as empty array
      };
      
      try {
        // Create the user document and wait for it to complete
        await setDoc(userRef, userData);
        
        // Verify the document was created successfully
        console.log("User document created successfully:", user.uid);

        Alert.alert("Success", `Welcome, ${username}! Verification email sent.`);

        // go back to main screen after signup
        router.replace("/(tabs)");
      } catch (docError: any) {
        console.error("Error creating user document:", docError);
        // If document creation fails, we should delete the auth user to keep things consistent
        try {
          await user.delete();
          Alert.alert("Error", "Failed to create user profile. Please try again.");
        } catch (deleteError) {
          console.error("Error deleting auth user after failed document creation:", deleteError);
        }
      }
    } catch (error: any) {
      console.error("Sign Up Error:", error);
      Alert.alert("Sign Up Failed", error.message);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <Text style={styles.title}>Create an Account</Text>

      {/* username field */}
      <TextInput
        style={[
          styles.input, 
          { 
            color: Colors[theme].text,
            borderColor: usernameError ? "#ff6b6b" : undefined 
          }
        ]}
        placeholder="Username"
        placeholderTextColor={Colors[theme].icon}
        value={username}
        onChangeText={handleUsernameChange}
        autoCapitalize="none"
      />
      {usernameError ? (
        <Text style={{ color: "#ff6b6b", marginTop: -5, marginBottom: 10, paddingLeft: 10 }}>
          {usernameError}
        </Text>
      ) : null}

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
      <TouchableOpacity 
        style={[
          styles.button, 
          { opacity: usernameError ? 0.6 : 1 }
        ]} 
        onPress={handleSignUp}
        disabled={!!usernameError}
      >
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
