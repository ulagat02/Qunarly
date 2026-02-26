import { Stack } from 'expo-router';

export default function MarketLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Järmeñke', headerShown: false }} />
      <Stack.Screen name="details/[id]" options={{ title: 'Тауар' }} />
      <Stack.Screen name="create" options={{ title: 'Жаңа жарияланым' }} />
      <Stack.Screen name="my-listings" options={{ title: 'Менің жарияланымдарым' }} />
      <Stack.Screen name="inbox" options={{ title: 'Ұсыныстар' }} />
      <Stack.Screen name="deals" options={{ title: 'Келісімдер' }} />
    </Stack>
  );
}
