import { Stack } from 'expo-router';

export default function FieldLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Alap', headerShown: true }} />
      <Stack.Screen name="create" options={{ title: 'Жаңа жұмыс' }} />
    </Stack>
  );
}
