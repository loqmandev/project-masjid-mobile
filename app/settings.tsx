import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { clearAppCache } from '@/lib/storage';

type ThemeOption = 'light' | 'dark' | 'system';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // Settings state (UI only for now)
  const [pushNotifications, setPushNotifications] = useState(true);
  const [checkoutReminders, setCheckoutReminders] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<ThemeOption>('system');

  const handleBack = () => {
    router.back();
  };

  const handleThemeSelect = (theme: ThemeOption) => {
    setSelectedTheme(theme);
    // TODO: Implement theme switching
  };

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear the app cache? This will remove temporary data but keep your active check-in.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => {
          clearAppCache();
          Alert.alert('Cache Cleared', 'App cache has been cleared successfully.');
        }},
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          // TODO: Implement account deletion
        }},
      ]
    );
  };

  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

  const handleRateApp = () => {
    // TODO: Implement rate app (link to app store)
    Alert.alert('Rate App', 'This will open the app store (not implemented yet)');
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@jejakmasjid.com');
  };

  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
      {title}
    </Text>
  );

  const renderMenuItem = (
    icon: string,
    label: string,
    onPress: () => void,
    rightElement?: React.ReactNode,
    showChevron: boolean = true
  ) => (
    <TouchableOpacity
      style={[styles.menuItem, { borderBottomColor: colors.border }]}
      onPress={onPress}
      disabled={!!rightElement}
    >
      <View style={styles.menuItemLeft}>
        <IconSymbol name={icon as any} size={20} color={colors.textSecondary} />
        <Text style={[styles.menuItemLabel, { color: colors.text }]}>{label}</Text>
      </View>
      {rightElement || (showChevron && (
        <IconSymbol name="chevron.right" size={16} color={colors.textTertiary} />
      ))}
    </TouchableOpacity>
  );

  const renderToggleItem = (
    icon: string,
    label: string,
    value: boolean,
    onValueChange: (value: boolean) => void
  ) => (
    <View style={[styles.menuItem, { borderBottomColor: colors.border }]}>
      <View style={styles.menuItemLeft}>
        <IconSymbol name={icon as any} size={20} color={colors.textSecondary} />
        <Text style={[styles.menuItemLabel, { color: colors.text }]}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );

  const renderThemeOption = (theme: ThemeOption, label: string) => (
    <TouchableOpacity
      style={[
        styles.themeOption,
        { borderColor: selectedTheme === theme ? colors.primary : colors.border },
        selectedTheme === theme && { backgroundColor: colors.primary + '10' },
      ]}
      onPress={() => handleThemeSelect(theme)}
    >
      <Text
        style={[
          styles.themeOptionText,
          { color: selectedTheme === theme ? colors.primary : colors.text },
        ]}
      >
        {label}
      </Text>
      {selectedTheme === theme && (
        <IconSymbol name="checkmark" size={16} color={colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        {renderSectionHeader('ACCOUNT')}
        <Card variant="outlined" padding="xs" style={styles.sectionCard}>
          {renderMenuItem('person.fill', 'Edit Profile', () => {
            // TODO: Navigate to edit profile
          })}
          {renderMenuItem('link', 'Linked Accounts', () => {
            // TODO: Navigate to linked accounts
          })}
        </Card>

        {/* Notifications Section */}
        {renderSectionHeader('NOTIFICATIONS')}
        <Card variant="outlined" padding="xs" style={styles.sectionCard}>
          {renderToggleItem(
            'bell.fill',
            'Push Notifications',
            pushNotifications,
            setPushNotifications
          )}
          {renderToggleItem(
            'clock.fill',
            'Check-out Reminders',
            checkoutReminders,
            setCheckoutReminders
          )}
        </Card>

        {/* Privacy Section */}
        {renderSectionHeader('PRIVACY')}
        <Card variant="outlined" padding="xs" style={styles.sectionCard}>
          {renderToggleItem(
            'eye.fill',
            'Show on Leaderboard',
            profileVisibility,
            setProfileVisibility
          )}
          {renderMenuItem('location.fill', 'Location Services', () => {
            Linking.openSettings();
          })}
        </Card>

        {/* Appearance Section */}
        {renderSectionHeader('APPEARANCE')}
        <Card variant="outlined" padding="sm" style={styles.sectionCard}>
          <Text style={[styles.themeLabel, { color: colors.text }]}>Theme</Text>
          <View style={styles.themeOptions}>
            {renderThemeOption('light', 'Light')}
            {renderThemeOption('dark', 'Dark')}
            {renderThemeOption('system', 'System')}
          </View>
        </Card>

        {/* Data & Storage Section */}
        {renderSectionHeader('DATA & STORAGE')}
        <Card variant="outlined" padding="xs" style={styles.sectionCard}>
          {renderMenuItem('trash.fill', 'Clear Cache', handleClearCache)}
        </Card>

        {/* About Section */}
        {renderSectionHeader('ABOUT')}
        <Card variant="outlined" padding="xs" style={styles.sectionCard}>
          {renderMenuItem(
            'info.circle.fill',
            'App Version',
            () => {},
            <Text style={[styles.versionText, { color: colors.textTertiary }]}>1.0.0</Text>,
            false
          )}
          {renderMenuItem('doc.text.fill', 'Terms of Service', () => {
            handleOpenLink('https://jejakmasjid.com/terms');
          })}
          {renderMenuItem('lock.shield.fill', 'Privacy Policy', () => {
            handleOpenLink('https://jejakmasjid.com/privacy');
          })}
          {renderMenuItem('star.fill', 'Rate the App', handleRateApp)}
          {renderMenuItem('envelope.fill', 'Contact Support', handleContactSupport)}
        </Card>

        {/* Danger Zone */}
        {renderSectionHeader('DANGER ZONE')}
        <Card variant="outlined" padding="xs" style={styles.sectionCard}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
          >
            <IconSymbol name="trash.fill" size={20} color={colors.error} />
            <Text style={[styles.deleteButtonText, { color: colors.error }]}>
              Delete Account
            </Text>
          </TouchableOpacity>
        </Card>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: Spacing.xs,
    marginLeft: -Spacing.xs,
  },
  headerTitle: {
    ...Typography.h3,
  },
  headerRight: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },
  sectionHeader: {
    ...Typography.caption,
    fontWeight: '600',
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
    marginLeft: Spacing.xs,
  },
  sectionCard: {
    marginBottom: Spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuItemLabel: {
    ...Typography.body,
  },
  themeLabel: {
    ...Typography.bodySmall,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  themeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  themeOptionText: {
    ...Typography.bodySmall,
    fontWeight: '500',
  },
  versionText: {
    ...Typography.body,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  deleteButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
  bottomSpacer: {
    height: Spacing.xxl,
  },
});
