import React, { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db, auth } from "../../constants/firebaseConfig";
import { useRouter } from "expo-router";

interface User {
  uid: string;
  username: string;
  firstName: string;
  lastName: string;
  profileImage: string;
}

export default function ChatListScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const router = useRouter();

  useEffect(() => {
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
  }, []);

  const openChat = (receiverId: string) => {
    router.push({ pathname: "/(tabs)/messages", params: { receiverId } }); // Navigate to private chat
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Select a User to Chat</Text>
      <FlatList
        data={users}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.userItem} onPress={() => openChat(item.uid)}>
            <Text style={styles.username}>{item.username || `${item.firstName} ${item.lastName}`}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  header: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  userItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  username: { fontSize: 18 },
});
