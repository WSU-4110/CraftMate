import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../constants/firebaseConfig";
import { useLocalSearchParams } from "expo-router";
import { useColorScheme } from "react-native";
import { Colors } from "../../constants/Colors";
import { useNavigation } from '@react-navigation/native'; // Import useNavigation

interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    text: string;
    timestamp: any;
}

export default function MessagesScreen() {
    const { receiverId } = useLocalSearchParams(); // Get receiver ID from navigation
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [receiverUsername, setReceiverUsername] = useState(""); // Store receiver's username
    const theme = useColorScheme() || "light"; // Detect system theme
    const navigation = useNavigation(); // Use the navigation hook

    const chatId = [auth.currentUser?.uid, receiverId].sort().join("_"); // Unique chat ID

    useEffect(() => {
        if (!receiverId) return;

        // Fetch the receiver's username from Firestore
        const fetchReceiverUsername = async () => {
            const userDoc = await getDoc(doc(db, "users", receiverId as string));
            if (userDoc.exists()) {
                setReceiverUsername(userDoc.data().username || "Unknown");
            }
        };
        fetchReceiverUsername();

        // Listen for real-time messages
        const messagesRef = collection(db, "chats", chatId, "messages");
        const q = query(messagesRef, orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
        });

        return unsubscribe;
    }, [receiverId]);

    const handleSendMessage = async () => {
        if (newMessage.trim().length === 0) return;
        const messagesRef = collection(db, "chats", chatId, "messages");

        await addDoc(messagesRef, {
            text: newMessage,
            senderId: auth.currentUser?.uid,
            receiverId,
            timestamp: serverTimestamp(),
        });

        setNewMessage("");
    };

    return (
        <KeyboardAvoidingView 
            style={{ flex: 1 }} 
            behavior={Platform.OS === "ios" ? "padding" : "height"} 
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
            <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
                {/* **Receiver's Username Header** */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={[styles.backButtonText, { color: Colors[theme].text }]}>←</Text>
                    </TouchableOpacity>
                    <Text style={[styles.headerText, { color: Colors[theme].text }]}>
                        {receiverUsername}
                    </Text>
                </View>

                {/* **Messages List** */}
                <FlatList
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <Text 
                            style={[
                                styles.message,
                                item.senderId === auth.currentUser?.uid ? styles.myMessage : styles.otherMessage,
                                { 
                                    backgroundColor: item.senderId === auth.currentUser?.uid 
                                        ? "#E89600" // Always Orange for Sent Messages
                                        : (theme === "light" ? "#eee" : "#333"), // Light Gray in Light Mode, Dark Gray in Dark Mode
                                    color: item.senderId === auth.currentUser?.uid 
                                        ? "#fff" // White Text for Sent Messages
                                        : Colors[theme].text,
                                }
                            ]}
                        >
                            {item.text}
                        </Text>
                    )}
                    style={[styles.list, { marginTop: 40 }]} // Increased top margin
                />

                {/* **Input & Send Button** */}
                <View style={[styles.inputContainer, { backgroundColor: Colors[theme].background, borderColor: Colors[theme].text }]}>
                    <TextInput
                        placeholderTextColor={Colors[theme].icon}
                        style={[styles.input, { borderColor: Colors[theme].text, color: Colors[theme].text }]} // Add color property here
                        value={newMessage}
                        onChangeText={setNewMessage}
                        placeholder="Type a message..."
                    />
                    <TouchableOpacity
                        style={[styles.sendButton]}
                        onPress={handleSendMessage}
                    >
                        <Text style={[styles.sendButtonText, { color: Colors[theme].background }]}>Send</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        paddingVertical: 10, // Reduced padding for a thinner header
        alignItems: "center",
        justifyContent: "space-between",
        borderRadius: 8,
        marginBottom: 10,
        marginTop: 30
    },
    
    backButton: {
        paddingHorizontal: 10, // Sufficient padding for touch area
        paddingVertical: 10
    },
    backButtonText: {
        fontSize: 25,
    },
    headerText: {
        position: 'absolute', // Position text absolutely
        width: '100%', // Ensure it spans the full width
        textAlign: 'center', // Center text horizontally
        fontSize: 20,
        fontWeight: "bold"
    },
    list: {
        flex: 1,
        marginBottom: 10,
        marginTop: 40, // Increased from 20 to 40
    },
    message: {
        fontSize: 18,
        padding: 10,
        marginVertical: 5,
        borderRadius: 10,
        maxWidth: "70%",
    },
    myMessage: {
        alignSelf: "flex-end",
    },
    otherMessage: {
        alignSelf: "flex-start",
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        width: '100%', // Ensure the container takes the full width
    },
    input: {
        flex: 1,
        padding: 10,
        borderRadius: 5,
    },
    sendButton: {
        backgroundColor: '#E89600',
        paddingHorizontal: 30,
        paddingVertical: 10,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sendButtonText: {
        fontWeight: 'bold',
    },
});
