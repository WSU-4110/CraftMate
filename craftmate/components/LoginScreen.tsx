import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image } from "react-native";
import { signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { auth, db } from "../constants/firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import { Link } from "expo-router";
import styles from "./LoginScreen.styles";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState({ name: "", bio: "", profileImage: "" });
    const [profilePicture, setProfilePicture] = useState("");
    const [newBio, setNewBio] = useState("");
    const theme = useColorScheme() || 'light';

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                setUser(user);
                await fetchUserProfile(user.uid);
            } else {
                setUser(null);
            }
        });
        return unsubscribe;
    }, []);

    const fetchUserProfile = async (uid: string) => {
        const userRef = doc(db, "users", uid, "profile", "profileData"); // Adjust based on your subcollection structure
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            setProfile(userSnap.data() as any);
        }
    };
    
    

    const handleLogin = async () => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            Toast.show({ type: "success", text1: "Welcome", text2: `Logged in as ${user.email}` });
            setUser(user);
            await fetchUserProfile(user.uid);
        } catch (error: any) {
            Toast.show({ type: "error", text1: "Login Failed", text2: error.message });
        }
    };

    const handleSignOut = async () => {
        await signOut(auth);
        setUser(null);
        setProfile({ name: "", bio: "", profileImage: "" });
        Toast.show({ type: "success", text1: "Signed Out" });
    };

    const handlePickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });
        if (!result.canceled) {
            await updateProfile({ profileImage: result.assets[0].uri });
        }
    };
    

    const handleUpdateBio = async () => {
        await updateProfile({ bio: newBio });
    };

    const updateProfile = async (updates: Partial<{ profileImage: string; bio: string }>) => {
        if (!user) return;
        const userRef = doc(db, "users", user.uid, "profile", "profileData"); // Adjust path
        await updateDoc(userRef, updates);
        setProfile((prev) => ({ ...prev, ...updates }));
        Toast.show({ type: "success", text1: "Profile Updated" });
    };
    

    if (user) {
        return (

            <View style={[styles.container, { backgroundColor: Colors[theme].background }]}> 
            
                <Text style={[styles.title, { color: Colors[theme].text }]}>Profile</Text>
                <Image source={{ uri: profile.profileImage || "https://via.placeholder.com/150" }} style={styles.profileImage} />
                <TouchableOpacity style={styles.button} onPress={handlePickImage}>
                    <Text style={styles.buttonText}>Select Profile Picture</Text>
                </TouchableOpacity>
                <Text style={[styles.text, { color: Colors[theme].text }]}>Name: {profile.name}</Text>
                <Text style={[styles.text, { color: Colors[theme].text }]}>Email: {user.email}</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: Colors[theme].inputBackground }]} 
                    placeholder="Update Bio"
                    value={newBio}
                    onChangeText={setNewBio}
                />
                <TouchableOpacity style={styles.button} onPress={handleUpdateBio}>
                    <Text style={styles.buttonText}>Update Bio</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.button} onPress={handleSignOut}>
                    <Text style={styles.buttonText}>Sign Out</Text>
                </TouchableOpacity>
                <Image 
    source={{ uri: profile.profileImage || "https://via.placeholder.com/150" }} 
    style={styles.profileImage} 
/>

            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}> 
            <Text style={[styles.title]}>Log In</Text>
            <TextInput style={[styles.input]} placeholder="Email" value={email} onChangeText={setEmail} />
            <TextInput style={[styles.input]} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
            <TouchableOpacity style={styles.button} onPress={handleLogin}>
                <Text style={styles.buttonText}>Log In</Text>
            </TouchableOpacity>
            <View style={styles.footer}>
                <Text style={[styles.footerText, { color: Colors[theme].text }]}>Don't have an account? 
                    <Link href="../auth/signup" style={styles.footerLink}> Sign Up </Link>
                </Text>
            </View>
        </View>
    );
}
