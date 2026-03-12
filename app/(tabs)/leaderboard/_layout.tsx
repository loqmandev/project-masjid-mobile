import { Stack } from "expo-router/stack";

export default function LeaderboardLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
