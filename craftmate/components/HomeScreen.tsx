import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  TextInput,
  Platform,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '../constants/firebaseConfig';
import { useRouter, Link } from 'expo-router';
import styles from './HomeScreen.styles';

interface Post {
  id: string;
  username: string;
  content: string;
  timestamp: string;
  likes: number;
  profileImage: string;
  comments: number;
  images?: string[];
  likedBy?: string[];
}

const HomeScreen = () => {
  const theme: 'light' | 'dark' = useColorScheme() || 'light';
  const [posts, setPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const dropdownAnimation = useRef(new Animated.Value(0)).current;
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const posts = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Post[];
      setPosts(posts);
    });

    return () => unsubscribe();
  }, []);

  const handleSearchPress = () => {
    if (isDropdownVisible) {
      Animated.timing(dropdownAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setIsDropdownVisible(false));
    } else {
      setIsDropdownVisible(true);
      Animated.timing(dropdownAnimation, {
        toValue: 100,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };

  const filteredPosts = searchQuery
    ? posts.filter((post) =>
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.username.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : posts;

  const renderItem = ({ item }: { item: Post }) => {
    return (
      <Link href={`/post/${item.id}`} style={{ textDecorationLine: 'none' }}>
        <TouchableOpacity>
          <View style={[styles.postContainer, { backgroundColor: Colors[theme].background, borderColor: Colors[theme].text }]}>
            <View style={styles.postHeader}>
              <View style={styles.postHeaderLeft}>
                <Image
                  source={item.profileImage ? { uri: item.profileImage } : require('../assets/images/PortraitPlaceholder.png')}
                  style={styles.profileImage}
                />
                <Text style={[styles.postUsername, { color: Colors[theme].text }]}>
                  {item.username}
                </Text>
              </View>
              <Text style={[styles.postTimestamp, { color: Colors[theme].text }]}>
                {new Date(item.timestamp).toLocaleDateString()}
              </Text>
            </View>
            <Text style={[styles.postContent, { color: Colors[theme].postText }]}>
              {item.content}
            </Text>
            {item.images && item.images.length > 0 && (
              <Image
                source={{ uri: item.images[0] }}
                style={styles.postImage}
              />
            )}
            <View style={styles.postFooter}>
              <View style={styles.postActions}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    styles.ovalContainer,
                    { backgroundColor: Colors[theme].tint },
                  ]}
                >
                  <Ionicons name="thumbs-up-outline" size={16} color={Colors[theme].icon} />
                  <Text style={[styles.ovalText, { color: Colors[theme].icon }]}>
                    {item.likes}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.ovalContainer, { backgroundColor: Colors[theme].tint }]}
                  onPress={() => router.push(`/post/${item.id}`)}
                >
                  <Ionicons name="chatbubble-outline" size={16} color={Colors[theme].icon} />
                  <Text style={[styles.ovalText, { color: Colors[theme].icon }]}>
                    {item.comments || 0}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Link>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.container, { backgroundColor: Colors[theme].background }]}>
        <View style={styles.headerContainer}>
          {user ? (
            <Link href="../pages/writepost" style={styles.leftIconContainer}>
              <Ionicons name="add" size={26} color={Colors[theme].text} />
            </Link>
          ) : (
            <Link href="/login" style={styles.leftIconContainer}>
              <Ionicons name="add" size={26} color={Colors[theme].text} />
            </Link>
          )}
          <View style={styles.logoContainer}>
            <Image 
              source={require('../assets/images/craftmate-logo.png')} 
              style={styles.logo} 
            />
          </View>
          <TouchableOpacity 
            style={styles.searchIconContainer}
            onPress={handleSearchPress}
          >
            <Ionicons name="search" size={26} color={Colors[theme].text} />
          </TouchableOpacity>
        </View>
        {isDropdownVisible && (
          <Animated.View
            style={[
              styles.dropdownContainer,
              { height: dropdownAnimation, backgroundColor: Colors[theme].background },
            ]}
          >
            <View style={styles.dropdownContent}>
              <TextInput
                placeholder="Search posts..."
                placeholderTextColor={Colors[theme].icon}
                style={[
                  styles.searchInput,
                  { borderColor: Colors[theme].text, color: Colors[theme].text },
                ]}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              <TouchableOpacity onPress={handleSearchPress}>
                <Ionicons name="close" size={26} color={Colors[theme].text} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
        <FlatList
          data={filteredPosts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          horizontal={false}
          ItemSeparatorComponent={() => <View style={[styles.separator, { backgroundColor: Colors[theme].tint }]} />}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

export default HomeScreen;