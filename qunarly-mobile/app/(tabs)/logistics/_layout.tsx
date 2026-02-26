import { Stack } from 'expo-router';

export default function LogisticsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Tasymal', headerShown: true }} />
      <Stack.Screen name="create" options={{ title: 'Жаңа тасымал' }} />
    </Stack>
  );
}
