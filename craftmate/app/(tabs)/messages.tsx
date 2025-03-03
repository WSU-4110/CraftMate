import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Button, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../../constants/firebaseConfig";
import { useLocalSearchParams } from "expo-router";

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

    const chatId = [auth.currentUser?.uid, receiverId].sort().join("_"); // Unique chat ID

    useEffect(() => {
        if (!receiverId) return;

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
            <View style={styles.container}>
                <FlatList
                    data={messages}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <Text style={[styles.message, item.senderId === auth.currentUser?.uid ? styles.myMessage : styles.otherMessage]}>
                            {item.text}
                        </Text>
                    )}
                    style={styles.list}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Type a message..."
                    value={newMessage}
                    onChangeText={setNewMessage}
                />
                <Button title="Send" onPress={handleSendMessage} />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: "#fff" },
    list: { flex: 1, marginBottom: 10 },
    message: { fontSize: 18, padding: 10, marginVertical: 5, borderRadius: 10, maxWidth: "70%" },
    myMessage: { alignSelf: "flex-end", backgroundColor: "#dcf8c6" },
    otherMessage: { alignSelf: "flex-start", backgroundColor: "#eee" },
    input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 10 },
});
