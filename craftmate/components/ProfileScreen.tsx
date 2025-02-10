import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { auth } from "../constants/firebaseConfig";
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import styles from "./ProfileScreen.styles";
import { signOut } from "firebase/auth";
import { useRouter } from "expo-router";

export default function ProfileScreen() {
    const [user, setUser] = useState(null);
    const theme = useColorScheme() || 'light'; // Provide a default theme
    const router = useRouter();

    useEffect(() => {
        const currentUser = auth.currentUser;
        if (currentUser) {
            setUser(currentUser);
        } else {
            router.push("/login");
        }
    }, []);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            router.push("/login");
        } catch (error: any) {
            console.error("Sign Out Error", error.message);
        }
    };

    if (!user) {
        return (
            <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
                <Text style={[styles.title, { color: Colors[theme].text }]}>Loading...</Text>
            </View>
        );
    }

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