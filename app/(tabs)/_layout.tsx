import { NativeTabs } from "expo-router/unstable-native-tabs";
import { ColorValue, DynamicColorIOS, Platform } from "react-native";

const tintColor: ColorValue =
  Platform.OS === "ios"
    ? DynamicColorIOS({ light: "#00A9A5", dark: "#00A9A5" })
    : "#00A9A5";

export default function TabLayout() {
  return (
    <NativeTabs minimizeBehavior="onScrollDown" tintColor={tintColor}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="house.fill" md="home" />
        <NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore" role="search">
        <NativeTabs.Trigger.Icon sf="magnifyingglass" md="search" />
        <NativeTabs.Trigger.Label>Explore</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="checkin">
        <NativeTabs.Trigger.Icon sf="mappin.circle.fill" md="location_on" />
        <NativeTabs.Trigger.Label>Check In</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="leaderboard">
        <NativeTabs.Trigger.Icon sf="trophy.fill" md="emoji_events" />
        <NativeTabs.Trigger.Label>Ranks</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon sf="person.fill" md="person" />
        <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
