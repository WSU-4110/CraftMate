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
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarShowLabel: false, // Hide the titles
          tabBarItemStyle: { paddingVertical: 10 }, // Adjust the padding to lower the icons
          tabBarStyle: Platform.select({
            ios: {
              position: 'absolute',
              backgroundColor: '#ffce1b', // Set tab bar background color
            },
            default: {
              backgroundColor: '#ffce1b', // Set tab bar background color
            },
          }),
        }}
      >
        <Tabs.Screen
          name="explore"
          options={{
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="login"
          options={{
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.crop.circle.fill" color={color} />,
          }}
        />
      </Tabs>

      {/* ✅ Add Toast globally */}
      <Toast />
    </>
  );
}
