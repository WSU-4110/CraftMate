import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../constants/firebaseConfig";
import Toast from "react-native-toast-message";
import { Link } from "expo-router";
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import styles from "./LoginScreen.styles";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const theme = useColorScheme() || 'light'; // Provide a default theme

    const handleLogin = async () => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            Toast.show({
                type: "success",
                text1: "Welcome",
                text2: `Logged in as ${user.email}`,
            });
            console.log("Toast Triggered");
        } catch (error: any) {
            Toast.show({
                type: "error",
                text1: "Login Failed",
                text2: error.message,
            });
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
            <Text style={[styles.title]}>Log In</Text>
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
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={[styles.buttonText, { color: Colors[theme].background }]}>Log In</Text>
            </TouchableOpacity>
            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: Colors[theme].text }]}>
                    Don't have an account?{" "}
                    <Link href="../auth/signup" style={[styles.footerLink]}>
                        Sign Up
                    </Link>
                </Text>
            </View>
        </View>
    );
}
