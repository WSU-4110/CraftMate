import React, { useState, useEffect, useMemo, useRef } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Image, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { collection, query, onSnapshot, orderBy, limit, addDoc, serverTimestamp, getDoc, doc, updateDoc, where, getDocs } from "firebase/firestore";
import { db, auth } from "../../constants/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter, usePathname } from "expo-router";
import { useColorScheme } from "react-native";
import { Colors } from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";

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
  read: boolean; // Added read field
}

export default function ChatListScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [recentMessages, setRecentMessages] = useState<{ [key: string]: Message }>({});
  const [unreadCounts, setUnreadCounts] = useState<{ [key: string]: number }>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const router = useRouter();
  const pathname = usePathname();
  const theme = useColorScheme() || "light";
  const messagesEndRef = useRef<FlatList>(null);

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user);
    });

    return () => unsubscribe();
  }, []);

  // Load users when logged in
  useEffect(() => {
    if (!auth.currentUser) return;

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
        .filter((user) => user.uid !== auth.currentUser?.uid);

      setUsers(usersList);
    });

    return () => unsubscribe();
  }, [isLoggedIn]);

  // Track path changes to reset view when the tab is clicked again
  useEffect(() => {
    if (pathname === '/chat' && showMessages) {
      setShowMessages(false);
      setSelectedUser(null);
    }
  }, [pathname]);

  // Subscribe to recent messages and unread counts with each user
  useEffect(() => {
    if (!auth.currentUser) return;

    const unsubscribes: (() => void)[] = [];

    users.forEach((user) => {
      const chatId = [auth.currentUser?.uid, user.uid].sort().join("_");
      const messagesRef = collection(db, "chats", chatId, "messages");
      
      // Get most recent message
      const recentQuery = query(messagesRef, orderBy("timestamp", "desc"), limit(1));
      const recentUnsubscribe = onSnapshot(recentQuery, (snapshot) => {
        if (!snapshot.empty) {
          const message = snapshot.docs[0].data() as Message;
          setRecentMessages((prev) => ({ ...prev, [user.uid]: message }));
        }
      });
      
      // Get unread count
      const unreadQuery = query(
        messagesRef,
        where("receiverId", "==", auth.currentUser?.uid),
        where("read", "==", false)
      );
      
      const unreadUnsubscribe = onSnapshot(unreadQuery, (snapshot) => {
        setUnreadCounts((prev) => ({ ...prev, [user.uid]: snapshot.size }));
      });

      unsubscribes.push(recentUnsubscribe, unreadUnsubscribe);
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

    // Mark all unread messages from this user as read
    const markMessagesAsRead = async () => {
      try {
        const unreadQuery = query(
          messagesRef,
          where("receiverId", "==", auth.currentUser?.uid),
          where("read", "==", false)
        );
        
        const unreadDocs = await getDocs(unreadQuery);
        
        const batch = unreadDocs.docs.map(async (doc) => {
          await updateDoc(doc.ref, { read: true });
        });
        
        await Promise.all(batch);
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    };

    markMessagesAsRead();

    return () => unsubscribe();
  }, [selectedUser]);

  // Sort users by most recent message timestamp
  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const messageA = recentMessages[a.uid];
      const messageB = recentMessages[b.uid];
      
      // If no messages, put at the end
      if (!messageA && !messageB) return 0;
      if (!messageA) return 1;
      if (!messageB) return -1;
      
      // Get timestamps (or 0 if not available)
      const timeA = messageA.timestamp?.toMillis ? messageA.timestamp.toMillis() : 0;
      const timeB = messageB.timestamp?.toMillis ? messageB.timestamp.toMillis() : 0;
      
      // Sort in descending order (newest first)
      return timeB - timeA;
    });
  }, [users, recentMessages]);

  // Auto-scroll to the bottom when messages change or when a chat is opened
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      // Delay to ensure rendering is complete before scrolling
      setTimeout(() => {
        messagesEndRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages, showMessages, selectedUser]);

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
      read: false, // All new messages start as unread
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
          {/* Header with user name, profile image and back button */}
          <View style={styles.headerContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={goBackToList}
            >
              <Ionicons name="arrow-back" size={24} color={Colors[theme].text} />
            </TouchableOpacity>

            {/* Centered profile container */}
            <View style={styles.headerContent}>
              <View style={styles.profileContainer}>
                <Image
                  source={{ uri: selectedUser.profileImage }}
                  style={styles.headerProfileImage}
                />
                <Text style={[styles.username, { color: Colors[theme].text }]}>
                  {selectedUser.username}
                </Text>
              </View>
            </View>
          </View>

          {/* Messages List */}
          <FlatList
            ref={messagesEndRef}
            data={messages}
            keyExtractor={item => item.id || Math.random().toString()}
            renderItem={({ item }) => (
              <View style={[
                styles.messageContainer,
                item.senderId === auth.currentUser?.uid ? styles.myMessageContainer : styles.otherMessageContainer,
              ]}>
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
                
                {/* Read indicator for sent messages */}
                {item.senderId === auth.currentUser?.uid && (
                  <Text style={styles.readIndicator}>
                    {item.read ? "Read" : "Delivered"}
                  </Text>
                )}
              </View>
            )}
            style={[styles.list, { marginTop: 40 }]}
            onContentSizeChange={() => messagesEndRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => messagesEndRef.current?.scrollToEnd({ animated: false })}
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
        data={sortedUsers}
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
              {/* Notification dot for unread messages */}
                {unreadCounts[item.uid] > 0 && (
                <View
                  style={[
                  styles.notificationDot,
                  { backgroundColor: Colors[theme].text },
                  ]}
                />
                )}
              
              <Image
                source={{ uri: item.profileImage }}
                style={styles.profileImage}
              />
              <View style={{ flex: 1 }}>
                <Text
                  style={[
                    styles.username,
                    { 
                      color: theme === "light" ? "#fff" : "#000",
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
                      color: theme === "light" ? "#fff" : "#000",
                      textAlign: "left",
                    }
                  ]}
                >
                  {recentMessages[item.uid]?.text || "No recent messages"}
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
    flex: 1,
    position: "relative", // Added for positioning the notification dot
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
  messageContainer: {
    marginVertical: 5,
    maxWidth: "70%",
  },
  myMessageContainer: {
    alignSelf: "flex-end",
  },
  otherMessageContainer: {
    alignSelf: "flex-start",
  },
  message: {
    fontSize: 18,
    padding: 10,
    borderRadius: 10,
  },
  myMessage: {
    alignSelf: "flex-end",
  },
  otherMessage: {
    alignSelf: "flex-start",
  },
  readIndicator: {
    fontSize: 12,
    color: "#999",
    alignSelf: "flex-end",
    marginTop: 2,
    marginRight: 5,
  },
  notificationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: "absolute",
    left: -11, // Position to the left of the profile image
    top: 20, // Center vertically with the profile image
    zIndex: 1, // Ensure it's visible above other elements
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
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center", // Changed to center the content
    marginBottom: -28,
    marginTop: 30,
    position: "relative",
    width: "100%",
  },
  headerContent: {
    alignItems: "center", // Center the content
    justifyContent: "center", // Center the content
    flex: 1, // Take up available space
  },
  profileContainer: {
    marginTop: 4,
    flexDirection: "row", // Arrange items horizontally
    alignItems: "center", // Align items vertically in the center
    justifyContent: "center", // Center the container horizontally
  },
  headerProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
});
