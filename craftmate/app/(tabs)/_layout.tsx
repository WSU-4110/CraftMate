import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
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
        <Tabs.Screen
          name="explore"
          options={{
            tabBarIcon: ({ color }) => <IconSymbol size={36} name="bubble.left" color={color} />,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color }) => <IconSymbol size={36} name="house" color={color} />,
          }}
        />
        <Tabs.Screen
          name="login"
          options={{
            tabBarIcon: ({ color }) => <IconSymbol size={36} name="person.crop.circle" color={color} />,
          }}
        />
      </Tabs>

      {/* ✅ Add Toast globally */}
      <Toast />
    </>
  );
}