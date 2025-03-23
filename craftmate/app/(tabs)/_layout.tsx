import { Tabs, Stack } from 'expo-router';
import React from 'react';
import Toast from 'react-native-toast-message'; // ✅ Import Toast

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

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
