import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { signInWithEmailAndPassword, signOut, signInWithCredential, GoogleAuthProvider, User } from "firebase/auth";
import { auth, googleConfig } from "../constants/firebaseConfig";
import * as Google from "expo-auth-session/providers/google";
import Toast from "react-native-toast-message";
import { Link, useRouter } from "expo-router";
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import styles from "./LoginScreen.styles";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [user, setUser] = useState<User | null>(null);
    const theme = useColorScheme() || 'light';
    const router = useRouter();

    // Google Sign-In Hook
    const [request, response, promptAsync] = Google.useAuthRequest({
        androidClientId: googleConfig.androidClientId,
        iosClientId: googleConfig.iosClientId,
        webClientId: googleConfig.webClientId,
    });

    // Handle Google Sign-In Response
    useEffect(() => {
        if (response?.type === "success") {
            const { id_token } = response.params;
            const credential = GoogleAuthProvider.credential(id_token);
            signInWithCredential(auth, credential)
                .then((userCredential) => {
                    const user = userCredential.user;
                    Toast.show({
                        type: "success",
                        text1: "Google Sign-In Successful",
                        text2: `Welcome ${user.displayName || user.email}`,
                    });
                    setUser(user);
                })
                .catch((error) => {
                    Toast.show({
                        type: "error",
                        text1: "Google Sign-In Failed",
                        text2: error.message,
                    });
                });
        }
    }, [response]);

    // Handle Email/Password Login
    const handleLogin = async () => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            Toast.show({
                type: "success",
                text1: "Welcome",
                text2: `Logged in as ${user.email}`,
            });
            setUser(user);
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Login Failed",
                text2: error.message,
            });
        }
    };

    // Handle Sign Out
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setUser(null);
            Toast.show({
                type: "success",
                text1: "Signed Out",
                text2: "You have been signed out successfully.",
            });
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Sign Out Failed",
                text2: error.message,
            });
        }
    };

    // User Profile (If Logged In)
    if (user) {
        return (
            <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
                <Text style={[styles.title, { color: Colors[theme].text }]}>Profile</Text>
                <Text style={[styles.text, { color: Colors[theme].text }]}>Email: {user.email}</Text>
                <TouchableOpacity style={[styles.button, { backgroundColor: Colors[theme].tint }]} onPress={handleSignOut}>
                    <Text style={[styles.buttonText, { color: Colors[theme].background }]}>Sign Out</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Login Form
    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <Text style={[styles.title]}>Log In</Text>
            <TextInput
                style={[styles.input, { backgroundColor: Colors[theme].inputBackground, color: Colors[theme].text }]}
                placeholder="Email"
                placeholderTextColor={Colors[theme].icon}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />
            <TextInput
                style={[styles.input, { backgroundColor: Colors[theme].inputBackground, color: Colors[theme].text }]}
                placeholder="Password"
                placeholderTextColor={Colors[theme].icon}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={[styles.buttonText, { color: Colors[theme].background }]}>Log In</Text>
            </TouchableOpacity>

            {/* Google Sign-In Button */}
            <TouchableOpacity style={styles.googleButton} onPress={() => promptAsync()}>
                <Text style={styles.buttonText}>Sign in with Google</Text>
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: Colors[theme].text }]}>
                    Don't have an account?{" "}
                    <Link href="../auth/signup" style={styles.footerLink}>
                        Sign Up
                    </Link>
                </Text>
            </View>
        </View>
    );
}
