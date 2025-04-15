import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../constants/firebaseConfig";
import { Colors } from "../../constants/Colors";
import { useColorScheme } from "react-native";

export default function FollowersFollowingScreen() {
  const { userId, type } = useLocalSearchParams<{ userId: string; type: string }>();
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const theme = useColorScheme() || "light";
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!userId || !type) return;

      const userRef = doc(db, "users", userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const ids = userSnap.data()[type] || [];

        const userDocs = await Promise.all(
          ids.map(async (id: string) => {
            const ref = doc(db, "users", id);
            const snap = await getDoc(ref);
            return snap.exists() ? { id: snap.id, ...snap.data() } : null;
          })
        );

        setUsersList(userDocs.filter(Boolean));
      }

      setLoading(false);
    };

    fetchUsers();
  }, [userId, type]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: Colors[theme].background, padding: 20 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", color: Colors[theme].text,  marginTop: 50, marginBottom: 20 }}>
        {type === "followers" ? "Followers" : "Following"}
      </Text>

      {loading ? (
        <ActivityIndicator size="large" color="#E89600" />
      ) : usersList.length === 0 ? (
        <Text style={{ color: Colors[theme].text }}>No users found.</Text>
      ) : (
        usersList.map((user) => (
          <TouchableOpacity
            key={user.id}
            style={{ flexDirection: "row", alignItems: "center", marginBottom: 15 }}
            onPress={() => router.push(`/pages/ViewProfileScreen?userId=${user.id}`)}
          >
            <Image
              source={{ uri: user.profileImage || "https://via.placeholder.com/100" }}
              style={{ width: 50, height: 50, borderRadius: 25, marginRight: 12 }}
            />
            <Text style={{ color: Colors[theme].text, fontSize: 16 }}>
              {user.firstName} {user.lastName}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}
