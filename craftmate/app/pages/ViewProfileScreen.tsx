// app/pages/viewprofile.tsx
import React, { useEffect, useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc, updateDoc, collection, query, where, getDocs, arrayUnion, arrayRemove } from "firebase/firestore";
import { db } from "../../constants/firebaseConfig";
import { useColorScheme } from "react-native";
import { Colors } from "../../constants/Colors";
import { getAuth } from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";


interface UserPost {
  id: string;
  username: string;
  userId: string;
  postTitle: string;
  postBody: string;
  timestamp: string | any;
  likes: number;
  profileImage: string;
  comments: number;
  images?: string[];
  likedBy?: string[];
}

export default function ViewProfileScreen() {
  const { userId } = useLocalSearchParams();
  const [profile, setProfile] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<UserPost[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);

  const theme = useColorScheme() || "light";
  const router = useRouter();
  const currentUserId = getAuth().currentUser?.uid;
  const isOwnProfile = userId === currentUserId;

  const fetchUser = async () => {
    const ref = doc(db, "users", userId as string);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      setProfile(data);
      setIsFollowing(data.followers?.includes(currentUserId));
    } else {
      Alert.alert("Error", "User not found");
      router.back();
    }
  };

  useEffect(() => {
    fetchUser();

    const fetchPosts = async () => {
      const postsQuery = query(collection(db, "posts"), where("userId", "==", userId));
      const postsSnapshot = await getDocs(postsQuery);
      const posts = postsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as UserPost[];
      posts.sort((a, b) => {
        const dateA = a.timestamp?.toDate?.() || new Date(a.timestamp);
        const dateB = b.timestamp?.toDate?.() || new Date(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      });
      setUserPosts(posts);
    };

    fetchPosts();
  }, [userId]);

  const handleFollowToggle = async () => {
    if (!currentUserId || typeof userId !== "string") return;

    const viewerRef = doc(db, "users", currentUserId);
    const viewedRef = doc(db, "users", userId);

    try {
      if (isFollowing) {
        await updateDoc(viewerRef, {
          following: arrayRemove(userId),
        });
        await updateDoc(viewedRef, {
          followers: arrayRemove(currentUserId),
        });
        setIsFollowing(false);
        setProfile((prev: any) => ({
          ...prev,
          followers: prev.followers?.filter((id: string) => id !== currentUserId),
        }));
      } else {
        await updateDoc(viewerRef, {
          following: arrayUnion(userId),
        });
        await updateDoc(viewedRef, {
          followers: arrayUnion(currentUserId),
        });
        setIsFollowing(true);
        setProfile((prev: any) => ({
          ...prev,
          followers: [...(prev.followers || []), currentUserId],
        }));
      }
    } catch (error) {
      console.error("Follow toggle failed", error);
      Alert.alert("Error", "Could not update follow status.");
    }
  };

  if (!profile) return null;

  return (
    <View style={{ flex: 1, backgroundColor: Colors[theme].background }}>
      <ScrollView contentContainerStyle={{ padding: 20, alignItems: "center", marginTop: 60 }}>
        <Image
          source={{
            uri: profile.profileImage?.startsWith("data:image/")
              ? profile.profileImage
              : profile.profileImage || "https://via.placeholder.com/150",
          }}
          style={{ width: 150, height: 150, borderRadius: 75, borderWidth: 2, borderColor: "#E89600", marginBottom: 15 }}
        />
        <Text style={{ fontWeight: "bold", fontSize: 18, marginBottom: 10, color: Colors[theme].text }}>
          {profile.firstName} {profile.lastName}
        </Text>
        <Text style={{ color: Colors[theme].text, marginBottom: 10 }}>
          {profile.bio || "No bio available."}
        </Text>
  
        {isOwnProfile && (
          <TouchableOpacity
            style={{
              backgroundColor: "#E89600",
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: 8,
              marginBottom: 20,
            }}
            onPress={() => router.push("/pages/editprofile")}
          >
            <Text style={{ color: "#fff", fontWeight: "bold" }}>Edit Profile</Text>
          </TouchableOpacity>
        )}
  
        {!isOwnProfile && (
          <TouchableOpacity
            style={{
              backgroundColor: isFollowing ? "#ccc" : "#E89600",
              paddingVertical: 10,
              paddingHorizontal: 30,
              borderRadius: 10,
              marginBottom: 20,
            }}
            onPress={handleFollowToggle}
          >
            <Text style={{ color: isFollowing ? "#000" : "#fff", fontWeight: "bold" }}>
              {isFollowing ? "Unfollow" : "Follow"}
            </Text>
          </TouchableOpacity>
        )}
  
        <View style={{ flexDirection: "row", justifyContent: "space-around", width: "100%", marginBottom: 10 }}>
          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={{ color: Colors[theme].text, fontWeight: "bold" }}>
              {profile.posts?.length || 0}
            </Text>
            <Text style={{ color: Colors[theme].text }}>Posts</Text>
          </View>
          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={{ color: Colors[theme].text, fontWeight: "bold" }}>
              {profile.followers?.length || 0}
            </Text>
            <Text style={{ color: Colors[theme].text }}>Followers</Text>
          </View>
          <View style={{ alignItems: "center", flex: 1 }}>
            <Text style={{ color: Colors[theme].text, fontWeight: "bold" }}>
              {profile.following?.length || 0}
            </Text>
            <Text style={{ color: Colors[theme].text }}>Following</Text>
          </View>
        </View>
  
        {profile.tags?.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", marginVertical: 10 }}>
            {profile.tags.map((tag: string) => (
              <View
                key={tag}
                style={{
                  backgroundColor: "#E89600",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  margin: 4,
                }}
              >
                <Text style={{ color: Colors[theme].background }}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
  
        <View style={{ width: "100%", alignItems: "center" }}>
          <Text style={{ fontSize: 16, fontWeight: "bold", color: Colors[theme].text, marginVertical: 10 }}>
            Posts
          </Text>
  
          {userPosts.length === 0 ? (
            <View style={{ alignItems: "center", marginTop: 20 }}>
              <Ionicons name="image-outline" size={60} color={Colors[theme].text} />
              <Text style={{ marginTop: 10, fontSize: 16, color: Colors[theme].text }}>No posts yet</Text>
            </View>
          ) : (
            userPosts.map((item) => {
              const postDate = item.timestamp?.toDate?.() || new Date(item.timestamp);
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => router.push(`/pages/viewpost?postId=${item.id}`)}
                  style={{
                    marginBottom: 20,
                    backgroundColor: Colors[theme].card || "#222222",
                    padding: 10,
                    borderRadius: 10,
                    width: "100%",
                  }}
                >
                  <Text style={{ color: Colors[theme].text, fontWeight: "bold", marginBottom: 5 }}>
                    {item.postTitle}
                  </Text>
                  <Text style={{ color: Colors[theme].text, marginBottom: 5 }}>
                    {postDate.toLocaleDateString()}
                  </Text>
                  {item.images?.[0] && (
                    <Image
                      source={{ uri: item.images[0] }}
                      style={{ width: "100%", height: 200, borderRadius: 10 }}
                    />
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}  