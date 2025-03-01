import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    Modal
} from "react-native";
import { signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { auth, db } from "../constants/firebaseConfig";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";
import { useColorScheme } from "react-native";
import { Colors } from "../constants/Colors";
import styles from "./LoginScreen.styles";

export default function LoginScreen() {
    // state variables for user authentication and UI management
    const [email, setEmail] = useState(""); // stores user email input
    const [password, setPassword] = useState(""); // stores user password input
    const [user, setUser] = useState<User | null>(null); // stores authenticated user
    const [profilePicture, setProfilePicture] = useState("https://via.placeholder.com/150"); // stores profile picture URL
    const [username, setUsername] = useState(""); // stores username
    const [bio, setBio] = useState(""); // stores user bio
    const [modalVisible, setModalVisible] = useState(false); // controls profile edit modal visibility
    
    // get the color theme (light or dark mode)
    const theme = useColorScheme() || "light";
    const themeColors = Colors[theme] || Colors["light"];

    // effect hook to listen for authentication state changes
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                setUser(user);
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                if (userSnap.exists()) {
                    setUsername(userSnap.data().username || "");
                    setProfilePicture(userSnap.data().profilePicture || "https://via.placeholder.com/150");
                    setBio(userSnap.data().bio || "");
                }
            } else {
                setUser(null);
            }
        });
        return unsubscribe;
    }, []);

    // Function to handle login
    const handleLogin = async () => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            setUser(userCredential.user);
            Toast.show({ type: "success", text1: "Welcome", text2: "Logged in successfully." });
        } catch (error) {
            Toast.show({ type: "error", text1: "Login Failed", text2: error.message });
        }
    };

    // Function to pick an image for profile picture
    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 4],
            quality: 1,
        });

        if (!result.canceled && user) {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { profilePicture: result.uri });
            setProfilePicture(result.uri);
        }
    };

    return (
        <>
            {user ? (
                // User is logged in: Show profile screen
                <ScrollView contentContainerStyle={styles.scrollContainer}>
                    <View style={styles.profileContainer}>
                        <View style={styles.profileCard}>
                            <Image source={{ uri: profilePicture || "https://via.placeholder.com/150" }} style={styles.profileImageLarge} />
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
                // User is not logged in: Show login screen
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
                        <Text style={[styles.buttonText, { color: themeColors.background, fontSize: 18, fontWeight: 'bold' }]}>Log In</Text>
                    </TouchableOpacity>
                </View>
            )}
            
            {/* Modal for editing profile */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Image source={{ uri: profilePicture || "https://via.placeholder.com/150" }} style={styles.modalProfileImage} />
                        <Text style={styles.modalTitle}>Edit Profile</Text>
                        <TextInput
                            style={styles.input}
                            value={username}
                            onChangeText={setUsername}
                            placeholder="Enter new username"
                        />
                        <TextInput
                            style={styles.input}
                            value={bio}
                            onChangeText={setBio}
                            placeholder="Enter your bio"
                        />
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