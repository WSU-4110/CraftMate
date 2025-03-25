import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Modal } from "react-native";
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
    const [newBio, setNewBio] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
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
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            setProfile(userSnap.data() as any);
        }
    };

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setProfile({ name: "", bio: "", profileImage: "" });
            Toast.show({ type: "success", text1: "Signed Out" });
        } catch (error) {
            Toast.show({ type: "error", text1: "Sign Out Failed", text2: error.message });
        }
    };

    const handleLogin = async () => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            setUser(userCredential.user);
            await fetchUserProfile(userCredential.user.uid);
            Toast.show({ type: "success", text1: "Welcome", text2: "Logged in successfully" });
        } catch (error) {
            Toast.show({ type: "error", text1: "Login Failed", text2: error.message });
        }
    };

    const handleUpdateProfile = async (updates: Partial<{ bio: string; profileImage: string }>) => {
        if (!user) return;
        const userRef = doc(db, "users", user.uid);
        await updateDoc(userRef, updates);
        setProfile((prev) => ({ ...prev, ...updates }));
        setModalVisible(false);
        Toast.show({ type: "success", text1: "Profile Updated" });
    };

    const handlePickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });
        if (!result.canceled) {
            await handleUpdateProfile({ profileImage: result.assets[0].uri });
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}> 
            {user ? (
                <>
                    <Text style={[styles.title, { color: Colors[theme].text }]}>Profile</Text>
                    <View style={styles.profileSection}>
                        <Image source={{ uri: profile.profileImage || "https://via.placeholder.com/150" }} style={styles.profileImage} />
                        <Text style={[styles.profileName, { color: Colors[theme].text }]}>{profile.name}</Text>
                        <TouchableOpacity style={styles.button} onPress={handlePickImage}>
                            <Text style={styles.buttonText}>Change Picture</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.bioSection}>
                        <Text style={[styles.bioText, { color: Colors[theme].text }]}>Bio:</Text>
                        <Text style={[styles.bioContent, { color: Colors[theme].text }]}>{profile.bio || "No bio available."}</Text>
                        <TouchableOpacity style={styles.button} onPress={() => setModalVisible(true)}>
                            <Text style={styles.buttonText}>Edit Profile</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity style={styles.button} onPress={handleSignOut}>
                        <Text style={styles.buttonText}>Sign Out</Text>
                    </TouchableOpacity>
                    {/* Edit Profile Modal */}
                    <Modal
                        animationType="slide"
                        transparent={true}
                        visible={modalVisible}
                        onRequestClose={() => setModalVisible(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Edit Bio</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Update Bio"
                                    value={newBio}
                                    onChangeText={setNewBio}
                                />
                                <TouchableOpacity style={styles.button} onPress={() => handleUpdateProfile({ bio: newBio })}>
                                    <Text style={styles.buttonText}>Save Changes</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                                    <Text style={styles.button}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>
                </>
            ) : (
                <>
                    <Text style={styles.title}>Log In</Text>
                    <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} />
                    <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry />
                    <TouchableOpacity style={styles.button} onPress={handleLogin}>
                        <Text style={styles.buttonText}>Log In</Text>
                    </TouchableOpacity>
                    <View style={styles.footer}>
                        <Text style={[styles.footerText, { color: Colors[theme].text }]}>Don't have an account? 
                            <Link href="../auth/signup" style={styles.footerLink}> Sign Up </Link>
                        </Text>
                    </View>
                </>
            )}
        </View>
    );
}
