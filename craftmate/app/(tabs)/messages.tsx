import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../constants/firebaseConfig";
import { useLocalSearchParams } from "expo-router";
import { useColorScheme } from "react-native";
import { Colors } from "../../constants/Colors";

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
                <View style={[styles.header, { backgroundColor: "#E89600", marginTop: 40 }]}>
                    <Text style={[styles.headerText, { color: theme === "light" ? "#fff" : "#000" }]}>
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
                    style={[styles.list, { marginTop: 20 }]} // **⬅ Top Margin Added Here**
                />

                {/* **Input & Send Button** */}
                <View style={styles.inputContainer}>
                    <TextInput
                        style={[styles.input, { backgroundColor: Colors[theme].inputBackground, color: Colors[theme].text }]}
                        placeholder="Type a message..."
                        placeholderTextColor={theme === "light" ? "#000" : "#fff"} // Black in Light Mode, White in Dark Mode
                        value={newMessage}
                        onChangeText={setNewMessage}
                    />
                    <TouchableOpacity 
                        style={[
                            styles.sendButton,
                            { backgroundColor: "#E89600", borderWidth: 2, borderColor: "#E89600" } // Always Orange with Border Padding
                        ]} 
                        onPress={handleSendMessage}
                    >
                        <Text style={{ color: "#fff", fontWeight: "bold" }}>Send</Text>
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
        paddingVertical: 15,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        marginBottom: 10,
    },
    headerText: {
        fontSize: 20,
        fontWeight: "bold",
    },
    list: {
        flex: 1,
        marginBottom: 10,
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
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 8,
        marginVertical: 10,
        paddingHorizontal: 10,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 8,
        padding: 10,
        marginRight: 10,
    },
    sendButton: {
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 8,
        alignItems: "center",
        justifyContent: "center",
    },
});
