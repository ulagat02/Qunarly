import { Stack } from 'expo-router';

export default function TaxiStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'center',
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Ауыл таксисі' }} />
      <Stack.Screen name="passenger/index" options={{ title: 'Жолаушы', headerShown: false }} />
      <Stack.Screen name="passenger/trips" options={{ title: 'Рейстер' }} />
      <Stack.Screen name="passenger/queue" options={{ title: 'Кезек' }} />
      <Stack.Screen name="passenger/request" options={{ title: 'Тапсырыс' }} />
      <Stack.Screen name="passenger/wait" options={{ title: 'Күту' }} />
      <Stack.Screen name="driver/index" options={{ title: 'Жүргізуші' }} />
      <Stack.Screen name="driver/queue" options={{ title: 'Кезек' }} />
      <Stack.Screen name="driver/active" options={{ title: 'Кезекте' }} />
    </Stack>
  );
}
