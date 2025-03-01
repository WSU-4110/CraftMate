import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    Modal,
    ActivityIndicator
} from "react-native";
import { signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { auth, db } from "../constants/firebaseConfig";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { useColorScheme } from "react-native";
import { Colors } from "../constants/Colors";
import styles from "./LoginScreen.styles";
import { getDownloadURL, ref, uploadBytesResumable, getStorage } from "firebase/storage";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [user, setUser] = useState<User | null>(null);
    const [profilePicture, setProfilePicture] = useState("");
    const [username, setUsername] = useState("");
    const [bio, setBio] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);

    const theme = useColorScheme() || "light";
    const themeColors = Colors[theme] || Colors["light"];
    const storage = getStorage();

    // Fetch user data when authentication state changes
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                setUser(user);
                await fetchUserData(user.uid);
            } else {
                setUser(null);
                setProfilePicture(""); // Clear profile picture on logout
            }
        });
        return unsubscribe;
    }, []);

    // Function to fetch user data
    const fetchUserData = async (uid: string) => {
        try {
            const userRef = doc(db, "users", uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                setUsername(userSnap.data().username || "");
                setBio(userSnap.data().bio || "");
                setProfilePicture(userSnap.data().profilePicture || "https://via.placeholder.com/150");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    // Function to handle login
    const handleLogin = async () => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            setUser(userCredential.user);
            await fetchUserData(userCredential.user.uid);
            Toast.show({ type: "success", text1: "Welcome", text2: "Logged in successfully." });
        } catch (error) {
            Toast.show({ type: "error", text1: "Login Failed", text2: error.message });
        }
    };

    // Function to pick an image and upload to Firebase Storage
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 4],
            quality: 1,
        });

        if (!result.canceled && user) {
            setLoading(true);
            const uri = result.assets[0].uri;
            const imageUrl = await uploadImageToStorage(uri, user.uid);
            await updateProfilePicture(imageUrl);
            setProfilePicture(imageUrl);
            setLoading(false);
        }
    };

    // Function to upload image to Firebase Storage
    const uploadImageToStorage = async (uri: string, userId: string) => {
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const storageRef = ref(storage, `profilePictures/${userId}`);
            const uploadTask = uploadBytesResumable(storageRef, blob);

            return new Promise<string>((resolve, reject) => {
                uploadTask.on(
                    "state_changed",
                    null,
                    (error) => reject(error),
                    async () => {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve(downloadURL);
                    }
                );
            });
        } catch (error) {
            console.error("Error uploading image:", error);
            return "";
        }
    };

    // Function to update Firestore with new profile picture
    const updateProfilePicture = async (url: string) => {
        if (user) {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { profilePicture: url });
        }
    };

    return (
        <>
            {user ? (
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.profileContainer}>
                        <View style={styles.profileCard}>
                            {loading ? (
                                <ActivityIndicator size="large" color={themeColors.tint} />
                            ) : (
                                <Image source={{ uri: profilePicture || "https://via.placeholder.com/150" }} style={styles.profileImageLarge} />
                            )}
                            <Text style={[styles.welcomeText, { color: themeColors.text }]}>{username}</Text>
                            <Text style={styles.bioText}>{bio}</Text>
                        </View>
                        <TouchableOpacity style={[styles.button, styles.editButton, styles.editButtonBorder]} onPress={() => setModalVisible(true)}>
                            <Text style={styles.buttonText}>Edit Profile</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.button, styles.signOutButton]} onPress={() => signOut(auth)}>
                            <Text style={styles.buttonText}>Sign Out</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            ) : (
                <View style={[styles.container, { backgroundColor: themeColors.background }]}>
                    <Text style={[styles.title]}>Log In</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: themeColors.inputBackground, color: themeColors.text }]}
                        placeholder="Email"
                        placeholderTextColor={themeColors.icon}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={[styles.input, { backgroundColor: themeColors.inputBackground, color: themeColors.text }]}
                        placeholder="Password"
                        placeholderTextColor={themeColors.icon}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                    <TouchableOpacity style={[styles.button, { backgroundColor: themeColors.tint, padding: 15, marginTop: 20 }]} onPress={handleLogin}>
                        <Text style={[styles.buttonText, { color: themeColors.background, fontSize: 18, fontWeight: "bold" }]}>Log In</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Modal for editing profile */}
            <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Image source={{ uri: profilePicture || "https://via.placeholder.com/150" }} style={styles.modalProfileImage} />
                        <Text style={styles.modalTitle}>Edit Profile</Text>
                        <TextInput style={styles.input} value={username} onChangeText={setUsername} placeholder="Enter new username" />
                        <TextInput style={styles.input} value={bio} onChangeText={setBio} placeholder="Enter your bio" />
                        <TouchableOpacity style={[styles.modalButton, styles.changePicButton]} onPress={pickImage}>
                            <Text style={styles.modalButtonText}>Change Profile Picture</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.modalButton, styles.closeButton]} onPress={() => setModalVisible(false)}>
                            <Text style={styles.modalButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </>
    );
}
