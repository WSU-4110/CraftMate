import { Tabs, Stack } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { AppState } from 'react-native';
import Toast from 'react-native-toast-message'; // ✅ Import Toast

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

import { auth, db } from '@/constants/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';


export default function TabLayout() {
  const colorScheme = useColorScheme();

  const [user, setUser] = useState(null);
  const [isActive, setIsActive] = useState(false);

  // Function to update isActive status in Firestore
  const handleUserInactive = async (uid: string | null) => {
    if (!uid) return;
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { isActive: false });
      console.log(`User ${uid} marked as inactive`);
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const handleUserActive = async (uid: string | null) => {
    if (!uid) return;
    try {
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, { isActive: true });
      console.log(`User ${uid} marked as active`);
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  useEffect(() => {
    // Listen for authentication state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (authenticatedUser) => {
      setUser(authenticatedUser);
      if (authenticatedUser) {
        setIsActive(true);
        await handleUserActive(authenticatedUser.uid); // Update Firestore when logged in
      } else {
        await handleUserInactive(auth?.currentUser?.uid ?? ""); // Update Firestore on logout
      }
    });

    // Listen for AppState changes (detect background/inactive state)
    const appStateListener = AppState.addEventListener("change", async (nextAppState) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        await handleUserInactive(auth?.currentUser?.uid ?? "");
      } else if (nextAppState === "active") {
        if (auth.currentUser) {
          setIsActive(true);
          await handleUserActive(auth.currentUser.uid);
        }
      }
    });

    return () => {
      unsubscribeAuth(); // Unsubscribe Firebase listener
      appStateListener.remove(); // Remove AppState listener
    };
  }, []);

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tabIconSelected,
          tabBarInactiveTintColor: Colors[colorScheme ?? 'light'].tabIconDefault,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarShowLabel: false, // Hide the titles
          tabBarItemStyle: { paddingVertical: 10 }, // Adjust the padding to lower the icons
          tabBarStyle: { backgroundColor: '#E89600' }, // Fixed background color
        }}
      >
        {/* Home Screen */}


        {/* Chat List Screen (User List for Private Chats) */}
        <Tabs.Screen
          name="chat"
          options={{
            tabBarIcon: ({ color }) => <IconSymbol size={32} name="bubble.left.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color }) => <IconSymbol size={32} name="house.fill" color={color} />,
          }}
        />
        
        {/* Login Screen */}
        <Tabs.Screen
          name="login"
          options={{
            tabBarIcon: ({ color }) => <IconSymbol size={32} name="person.crop.circle.fill" color={color} />,
          }}
        />
        {/* Login Screen */}
        <Tabs.Screen
          name="video"
          options={{
          tabBarIcon: ({ color }) => <IconSymbol size={32} name="video.fill" color={color} />,
  }}
/>


        {/* Stack Navigation for Private Messages */}
        <Tabs.Screen
          name="messages"
          options={{
            href: null, 
          }}
        />
      </Tabs>

      {/* ✅ Add Toast globally */}
      <Toast />
    </>
  );
}
