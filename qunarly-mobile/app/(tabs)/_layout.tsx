import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { useTheme } from '@/src/mobile/theme';

type TabRoute = {
  name: 'index' | 'market' | 'taxi' | 'logistics' | 'field';
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  isFab?: boolean;
};

const TAB_ORDER: TabRoute[] = [
  { name: 'index', label: 'Басты', icon: 'home' },
  { name: 'market', label: 'Jarmeke', icon: 'storefront' },
  { name: 'taxi', label: 'Такси', icon: 'directions-car', isFab: true },
  { name: 'logistics', label: 'Tasymal', icon: 'local-shipping' },
  { name: 'field', label: 'Алап', icon: 'grass' },
];

function BottomTabs({ state, navigation }: any) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.surface,
        borderTopColor: theme.colors.border,
        borderTopWidth: 1,
        paddingHorizontal: 12,
        paddingBottom: Math.max(insets.bottom, 8),
        paddingTop: 6,
        height: 68 + insets.bottom,
      }}
    >
      {TAB_ORDER.map((tab) => {
        const routeIndex = state.routes.findIndex((r: any) => r.name === tab.name);
        const isFocused = state.index === routeIndex;
        const color = isFocused ? theme.colors.primary : theme.colors.mutedText;

        if (tab.isFab) {
          return (
            <Pressable
              key={tab.name}
              onPress={() => navigation.navigate(tab.name)}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: theme.colors.primary,
                marginBottom: Math.max(insets.bottom - 6, 0),
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              <MaterialIcons name="directions-car" size={30} color="#FFFFFF" />
            </Pressable>
          );
        }

        return (
          <Pressable
            key={tab.name}
            onPress={() => navigation.navigate(tab.name)}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 }}
          >
            <MaterialIcons name={tab.icon} size={24} color={color} />
            <Text style={{ color, fontSize: 12, fontWeight: '600' }}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <BottomTabs {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.text,
        headerShown: true,
      }}
    >
      <Tabs.Screen name="index" options={{ headerShown: false, title: 'Басты' }} />
      <Tabs.Screen name="market" options={{ title: 'Jarmeke' }} />
      <Tabs.Screen name="taxi" options={{ title: 'Ауыл таксисі', headerShown: false }} />
      <Tabs.Screen name="logistics" options={{ title: 'Tasymal', headerShown: false }} />
      <Tabs.Screen name="field" options={{ title: 'Алап', headerShown: false }} />
    </Tabs>
  );
}
