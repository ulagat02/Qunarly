import { Stack } from 'expo-router';

export default function TripsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name="passenger/[id]" options={{ title: 'Менің сапарым' }} />
      <Stack.Screen name="driver/[id]" options={{ title: 'Менің рейсім' }} />
    </Stack>
  );
}
