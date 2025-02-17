import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, Image, ScrollView } from "react-native";
import { signInWithEmailAndPassword, signOut, User } from "firebase/auth";
import { auth, db } from "../constants/firebaseConfig";
import { collection, addDoc, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import Toast from "react-native-toast-message";
import { useColorScheme } from "react-native";
import { Colors } from "../constants/Colors";
import styles from "./LoginScreen.styles";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [user, setUser] = useState<User | null>(null);
    const [idea, setIdea] = useState("");
    const [ideas, setIdeas] = useState([]);
    const [bio, setBio] = useState("");
    const [profilePicture, setProfilePicture] = useState("https://via.placeholder.com/150");
    const theme = useColorScheme() || "light";

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setUser(user);
                fetchIdeas();
            } else {
                setUser(null);
            }
        });
        return unsubscribe;
    }, []);

    const fetchIdeas = async () => {
        if (!user) return;
        const ideasQuery = query(collection(db, "ideas"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(ideasQuery);
        const ideasList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setIdeas(ideasList);
    };

    const handleLogin = async () => {
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            setUser(userCredential.user);
            Toast.show({ type: "success", text1: "Welcome", text2: "Logged in successfully." });
        } catch (error) {
            Toast.show({ type: "error", text1: "Login Failed", text2: error.message });
        }
    };

    const handleEditProfile = async () => {
        if (!user) return;
        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, { bio, profilePicture });
            Toast.show({ type: "success", text1: "Profile Updated" });
        } catch (error) {
            Toast.show({ type: "error", text1: "Update Failed" });
        }
    };

    if (user) {
        return (
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <View style={styles.profileContainer}>
                    <Image source={{ uri: profilePicture }} style={styles.profileImage} />
                    <Text style={[styles.title, { color: Colors[theme].text, marginTop: 60 }]}>Welcome, {user.email}</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: Colors[theme].inputBackground, color: Colors[theme].text }]}
                        placeholder="Edit Bio"
                        placeholderTextColor={Colors[theme].icon}
                        value={bio}
                        onChangeText={setBio}
                    />
                    <TouchableOpacity style={[styles.button, { backgroundColor: Colors[theme].tint }]} onPress={handleEditProfile}>
                        <Text style={[styles.buttonText, { color: Colors[theme].background }]}>Update Profile</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.ideaContainer}>
                    <Text style={[styles.subtitle, { color: Colors[theme].text }]}>Share Your DIY Idea</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: Colors[theme].inputBackground, color: Colors[theme].text }]}
                        placeholder="Write your idea..."
                        placeholderTextColor={Colors[theme].icon}
                        value={idea}
                        onChangeText={setIdea}
                    />
                    <TouchableOpacity style={[styles.button, { backgroundColor: Colors[theme].tint }]}>
                        <Text style={[styles.buttonText, { color: Colors[theme].background }]}>Post Idea</Text>
                    </TouchableOpacity>
                    <FlatList
                        data={ideas}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <View style={styles.ideaItem}>
                                <Text style={[styles.text, { color: Colors[theme].text }]}>{item.text}</Text>
                                <Text style={[styles.smallText, { color: Colors[theme].icon }]}>By: {item.createdBy}</Text>
                            </View>
                        )}
                    />
                </View>
                <TouchableOpacity style={[styles.button, { backgroundColor: Colors[theme].tint }]} onPress={() => signOut(auth)}>
                    <Text style={[styles.buttonText, { color: Colors[theme].background }]}>Sign Out</Text>
                </TouchableOpacity>
            </ScrollView>
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
        </View>
    );
}
