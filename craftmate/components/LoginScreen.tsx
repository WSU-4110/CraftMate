import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { auth } from "../constants/firebaseConfig";
import Toast from "react-native-toast-message";
import { Link } from "expo-router";
import { useColorScheme } from "react-native";
import { Colors } from "../constants/Colors";
import styles from "./LoginScreen.styles";
import GoogleAuthFacade from "../components/utils/GoogleAuthFacade"; 

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [user, setUser] = useState<User | null>(null);
    const theme = useColorScheme() || "light";

    const handleGoogleSignIn = async () => {
        const authenticatedUser = await GoogleAuthFacade.getInstance().signIn();
        if (authenticatedUser) {
            Toast.show({
                type: "success",
                text1: "Google Sign-In Successful",
                text2: `Welcome ${authenticatedUser.displayName || authenticatedUser.email}`,
            });
            setUser(authenticatedUser);
        }
    };

    const handleLogin = async () => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            setUser(userCredential.user);
            Toast.show({
                type: "success",
                text1: "Welcome",
                text2: `Logged in as ${userCredential.user.email}`,
            });
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Login Failed",
                text2: error.message,
            });
        }
    };

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
            <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn}>
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
