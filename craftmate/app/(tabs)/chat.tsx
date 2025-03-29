import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { collection, query, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db, auth } from "../../constants/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth"; // Import onAuthStateChanged
import { useRouter } from "expo-router";
import { useColorScheme } from "react-native";
import { Colors } from "../../constants/Colors";

interface User {
  uid: string;
  username: string;
  firstName: string;
  lastName: string;
  profileImage: string;
}

interface Message {
  text: string;
  senderId: string;
  timestamp: any;
}

export default function ChatListScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [recentMessages, setRecentMessages] = useState<{ [key: string]: string }>({});
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login state
  const router = useRouter();
  const theme = useColorScheme() || "light"; // Detect system theme

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!user); // Set login state based on user presence
    });

    return () => unsubscribe();
  }, []);

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

  const openChat = (receiverId: string) => {
    router.push({ pathname: "/(tabs)/messages", params: { receiverId } }); // Navigate to private chat
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
            onPress={() => openChat(item.uid)}
          >
            <View style={styles.userInfo}>
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
    marginBottom: 20,
    marginTop: 40, // Added top margin to prevent clipping
    textAlign: "center",
  },
  userItem: {
    padding: 15,
    borderRadius: 8,
    marginVertical: 5,
    alignItems: "flex-start",
  },
  userInfo: {
    flexDirection: "column",
  },
  username: {
    fontSize: 18,
    fontWeight: "bold",
  },
  recentMessage: {
    fontSize: 14,
    marginTop: 5,
  },
});
