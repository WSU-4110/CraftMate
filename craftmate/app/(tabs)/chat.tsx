import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { collection, query, onSnapshot, orderBy, limit, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { db, auth } from "../../constants/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth"; // Import onAuthStateChanged
import { useRouter } from "expo-router";
import { useColorScheme } from "react-native";
import { Colors } from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons"; // Import Ionicons

interface User {
  uid: string;
  username: string;
  firstName: string;
  lastName: string;
  profileImage: string;
}

interface Message {
  id?: string;
  text: string;
  senderId: string;
  receiverId?: string;
  timestamp: any;
}

export default function ChatListScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [recentMessages, setRecentMessages] = useState<{ [key: string]: string }>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login state
  const [showMessages, setShowMessages] = useState(false); // Toggle between chat list and messages
  const [selectedUser, setSelectedUser] = useState<User | null>(null); // Selected user for chat
  const [messages, setMessages] = useState<Message[]>([]); // Messages with selected user
  const [newMessage, setNewMessage] = useState(""); // New message text
  const router = useRouter();
  const theme = useColorScheme() || "light"; // Detect system theme

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user); // Set login state based on user presence
    });

    return () => unsubscribe();
  }, []);

  // Load users when logged in
  useEffect(() => {
    if (!auth.currentUser) return; // Exit if no user is logged in

    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersList: User[] = snapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            uid: doc.id,
            username: data.username || "Unknown",
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            profileImage: data.profileImage || "https://via.placeholder.com/150",
          };
        })
        .filter((user) => user.uid !== auth.currentUser?.uid); // Exclude the current user

      setUsers(usersList);
    });

    return () => unsubscribe();
  }, [isLoggedIn]); // Re-run when login state changes

  // Subscribe to recent messages with each user
  useEffect(() => {
    if (!auth.currentUser) return; // Exit if no user is logged in

    const unsubscribes: (() => void)[] = [];

    users.forEach((user) => {
      const chatId = [auth.currentUser?.uid, user.uid].sort().join("_");
      const messagesRef = collection(db, "chats", chatId, "messages");
      const q = query(messagesRef, orderBy("timestamp", "desc"), limit(1));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const message = snapshot.docs[0].data() as Message;
          setRecentMessages((prev) => ({ ...prev, [user.uid]: message.text }));
        }
      });

      unsubscribes.push(unsubscribe);
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [users]);

  // Load messages when a user is selected
  useEffect(() => {
    if (!selectedUser || !auth.currentUser) return;
    
    const chatId = [auth.currentUser.uid, selectedUser.uid].sort().join("_");
    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as Message)));
    });

    return () => unsubscribe();
  }, [selectedUser]);

  const openChat = (user: User) => {
    setSelectedUser(user);
    setShowMessages(true);
  };

  const handleSendMessage = async () => {
    if (!selectedUser || !auth.currentUser || newMessage.trim().length === 0) return;
    
    const chatId = [auth.currentUser.uid, selectedUser.uid].sort().join("_");
    const messagesRef = collection(db, "chats", chatId, "messages");

    await addDoc(messagesRef, {
      text: newMessage,
      senderId: auth.currentUser.uid,
      receiverId: selectedUser.uid,
      timestamp: serverTimestamp(),
    });

    setNewMessage("");
  };

  const goBackToList = () => {
    setShowMessages(false);
    setSelectedUser(null);
  };

  if (!isLoggedIn) {
    // If no user is logged in, show a message or render nothing
    return (
      <View style={[styles.container, { backgroundColor: Colors[theme].background, justifyContent: "center", alignItems: "center" }]}>
        <Text style={[styles.header, { color: Colors[theme].text, textAlign: "center", marginBottom: 20 }]}>
          Log in to view your messages.
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: theme === "light" ? "#E89600" : "#E89600", // Orange in both modes
            padding: 10,
            borderRadius: 8,
          }}
          onPress={() => router.push("/login")} // Navigate to the login page
        >
          <Text style={{ color: "#fff", fontWeight: "bold", textAlign: "center" }}>
            Go to Login
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Show messages with selected user
  if (showMessages && selectedUser) {
    return (
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
          {/* Header with user name and back button */}
          <View style={[styles.header, { marginBottom: -20 }]}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={goBackToList}
            >
              <Ionicons name="arrow-back" size={24} color={Colors[theme].text} />
            </TouchableOpacity>
            <Text style={[styles.headerText, { color: Colors[theme].text }]}>
              {selectedUser.username}
            </Text>
          </View>

          {/* Messages List */}
          <FlatList
            data={messages}
            keyExtractor={item => item.id || Math.random().toString()}
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

          {/* Input & Send Button */}
          <View style={[styles.inputContainer, { backgroundColor: Colors[theme].background, borderColor: Colors[theme].text }]}>
            <TextInput
              placeholderTextColor={Colors[theme].icon}
              style={[styles.input, { borderColor: Colors[theme].text, color: Colors[theme].text }]}
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

  // Show the chat list (default view)
  return (
    <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
      <Text style={[styles.header, { color: Colors[theme].text }]}>Messages</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.userItem,
              { 
                backgroundColor: theme === "light" ? "#E89600" : "#E89600", // Orange in both modes
              }
            ]}
            onPress={() => openChat(item)}
          >
            <View style={styles.userInfo}>
              <Image
                source={{ uri: item.profileImage }}
                style={styles.profileImage}
              />
              <View>
                <Text
                  style={[
                    styles.username,
                    { 
                      color: theme === "light" ? "#fff" : "#000", // White text in light mode, black in dark mode
                      textAlign: "left",
                    }
                  ]}
                >
                  {item.username || `${item.firstName} ${item.lastName}`}
                </Text>
                <Text
                  style={[
                    styles.recentMessage,
                    { 
                      color: theme === "light" ? "#fff" : "#000", // White text in light mode, black in dark mode
                      textAlign: "left",
                    }
                  ]}
                >
                  {recentMessages[item.uid] || "No recent messages"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    marginTop: 38, // Added top margin to prevent clipping
    textAlign: "center",
    flexDirection: 'row',
    alignItems: "center",
    justifyContent: "center", // Center the username text
    position: "relative", // Ensure proper positioning for the back button
  },
  backButton: {
    position: "absolute", // Position the back button absolutely
    left: 0, // Align it as far left as possible
    paddingVertical: 10, // Keep vertical padding for touch area
    zIndex: 1, // Ensure it is above other elements
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  userItem: {
    flexDirection: "row", // Align profile image and text horizontally
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    alignItems: "center", // Center items vertically
  },
  userInfo: {
    flexDirection: "row", // Align profile image and text horizontally
    alignItems: "center",
  },
  profileImage: {
    width: 50, // Set the width of the profile image
    height: 50, // Set the height of the profile image
    borderRadius: 25, // Make the image circular
    marginRight: 15, // Add spacing between the image and the text
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
  },
  recentMessage: {
    fontSize: 14,
    marginTop: 5,
  },
  // Styles from MessagesScreen
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
