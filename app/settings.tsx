import { router, Stack } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/hooks/use-color-scheme';
import { useCheckinNotification } from '@/hooks/use-checkin-notification';
import { clearAllAppData, clearAppCache, loadCheckoutRemindersEnabled, saveCheckoutRemindersEnabled, ThemePreference } from '@/lib/storage';
import { deleteAccount } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { signOut } from '@/lib/auth-client';

export default function SettingsScreen() {
  const { colorScheme, themePreference, setThemePreference } = useTheme();
  const colors = Colors[colorScheme ?? 'light'];
  const queryClient = useQueryClient();
  const { cancelCheckoutReminder, requestPermissions } = useCheckinNotification();

  // Notification preferences
  const [checkoutReminders, setCheckoutReminders] = useState(
    () => loadCheckoutRemindersEnabled()
  );
  const [profileVisibility, setProfileVisibility] = useState(true);

  // Delete account modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const REQUIRED_CONFIRMATION_TEXT = 'Delete my account';

  const handleCheckoutRemindersToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestPermissions();
      if (!granted) {
        Alert.alert(
          'Notifications Disabled',
          'To receive check-out reminders, please enable notifications for Jejak Masjid in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]
        );
        return;
      }
    } else {
      // Cancel any pending reminder when user disables
      await cancelCheckoutReminder();
    }
    saveCheckoutRemindersEnabled(enabled);
    setCheckoutReminders(enabled);
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
        { text: 'Continue', style: 'destructive', onPress: () => {
          setShowDeleteModal(true);
          setDeleteConfirmText('');
        }},
      ]
    );
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmText !== REQUIRED_CONFIRMATION_TEXT) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteAccount();

      // Clear all app data
      clearAllAppData();

      // Clear React Query cache
      queryClient.clear();

      // Sign out from auth
      await signOut();

      Alert.alert(
        'Account Deleted',
        'Your account has been permanently deleted.',
        [{ text: 'OK' }]
      );

      // Navigate to login
      router.replace('/auth/login');
    } catch (error) {
      setIsDeleting(false);
      Alert.alert(
        'Deletion Failed',
        error instanceof Error ? error.message : 'Failed to delete account. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteConfirmText('');
    setIsDeleting(false);
  };

  const isDeleteEnabled = deleteConfirmText === REQUIRED_CONFIRMATION_TEXT && !isDeleting;

  const handleOpenLink = (url: string) => {
    Linking.openURL(url);
  };

  const handleRateApp = () => {
    const APP_STORE_ID = '6757920248'; // iOS App Store ID
    const PLAY_STORE_PACKAGE = 'my.lonasoft.jejakmasjidmobile'; // Android package name

    const url = Platform.select({
      ios: `itms-apps://itunes.apple.com/app/id${APP_STORE_ID}?action=write-review`,
      android: `market://details?id=${PLAY_STORE_PACKAGE}`,
      // Fallback for web or other platforms
      default: `https://apps.apple.com/app/id${APP_STORE_ID}`,
    });

    if (url) {
      Linking.openURL(url).catch((err) => {
        console.error('Failed to open app store:', err);
        Alert.alert(
          'Unable to Open Store',
          'Could not open the app store. Please visit the store manually to rate the app.',
          [{ text: 'OK' }]
        );
      });
    }
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@jejakmasjid.my');
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

  const renderThemeOption = (theme: ThemePreference, label: string) => (
    <TouchableOpacity
      style={[
        styles.themeOption,
        { borderColor: themePreference === theme ? colors.primary : colors.border },
        themePreference === theme && { backgroundColor: colors.primary + '10' },
      ]}
      onPress={() => setThemePreference(theme)}
    >
      <Text
        style={[
          styles.themeOptionText,
          { color: themePreference === theme ? colors.primary : colors.text },
        ]}
      >
        {label}
      </Text>
      {themePreference === theme && (
        <IconSymbol name="checkmark" size={16} color={colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['bottom']}
      >
        <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Account Section */}
        {renderSectionHeader('ACCOUNT')}
        <Card variant="outlined" padding="xs" style={styles.sectionCard}>
          {renderMenuItem('person.fill', 'Edit Profile', () => {
            router.push('/edit-profile');
          })}
        </Card>

        {/* Notifications Section */}
        {renderSectionHeader('NOTIFICATIONS')}
        <Card variant="outlined" padding="xs" style={styles.sectionCard}>
          {renderToggleItem(
            'clock.fill',
            'Check-out Reminders',
            checkoutReminders,
            handleCheckoutRemindersToggle
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
            handleOpenLink('https://jejakmasjid.my/tos');
          })}
          {renderMenuItem('lock.shield.fill', 'Privacy Policy', () => {
            handleOpenLink('https://jejakmasjid.my/privacy');
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

      {/* Delete Account Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        animationType="fade"
        transparent={true}
        onRequestClose={handleCloseDeleteModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <IconSymbol name="exclamationmark.triangle.fill" size={28} color={colors.error} />
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Confirm Account Deletion
              </Text>
            </View>

            {/* Modal Body */}
            <View style={styles.modalBody}>
              <Text style={[styles.modalMessage, { color: colors.text }]}>
                This action cannot be undone. All your data including:
              </Text>
              <View style={styles.dataLossList}>
                <Text style={[styles.dataLossItem, { color: colors.textSecondary }]}>
                  • Profile and settings
                </Text>
                <Text style={[styles.dataLossItem, { color: colors.textSecondary }]}>
                  • Check-in history
                </Text>
                <Text style={[styles.dataLossItem, { color: colors.textSecondary }]}>
                  • Points and achievements
                </Text>
                <Text style={[styles.dataLossItem, { color: colors.textSecondary }]}>
                  • Leaderboard rankings
                </Text>
              </View>
              <Text style={[styles.modalMessage, { color: colors.text }]}>
                will be permanently lost.
              </Text>

              <Text style={[styles.confirmationLabel, { color: colors.text }]}>
                To confirm, type &quot;{REQUIRED_CONFIRMATION_TEXT}&quot; below:
              </Text>

              <TextInput
                style={[
                  styles.confirmationInput,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: deleteConfirmText === REQUIRED_CONFIRMATION_TEXT
                      ? colors.error
                      : colors.border,
                  },
                ]}
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                placeholder={REQUIRED_CONFIRMATION_TEXT}
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isDeleting}
                accessible={true}
                accessibilityLabel="Confirm account deletion"
                accessibilityHint="Type the confirmation text to enable deletion"
              />
            </View>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton, { borderColor: colors.border }]}
                onPress={handleCloseDeleteModal}
                disabled={isDeleting}
                accessible={true}
                accessibilityLabel="Cancel account deletion"
              >
                <Text style={[styles.modalButtonText, { color: colors.text }]}>
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.deleteButtonModal,
                  { backgroundColor: isDeleteEnabled ? colors.error : colors.border },
                ]}
                onPress={handleConfirmDelete}
                disabled={!isDeleteEnabled}
                accessible={true}
                accessibilityLabel="Confirm delete account"
                accessibilityState={{ disabled: !isDeleteEnabled }}
              >
                {isDeleting ? (
                  <Text style={[styles.modalButtonText, { color: '#fff' }]}>
                    Deleting...
                  </Text>
                ) : (
                  <Text style={[styles.modalButtonText, { color: isDeleteEnabled ? '#fff' : colors.textTertiary }]}>
                    Delete Account
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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

  // Delete Account Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    borderRadius: BorderRadius.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  modalTitle: {
    ...Typography.h3,
    fontWeight: '700',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  modalBody: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  modalMessage: {
    ...Typography.body,
    lineHeight: 22,
  },
  dataLossList: {
    marginVertical: Spacing.md,
    gap: Spacing.xs,
  },
  dataLossItem: {
    ...Typography.bodySmall,
    lineHeight: 20,
  },
  confirmationLabel: {
    ...Typography.bodySmall,
    fontWeight: '600',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  confirmationInput: {
    ...Typography.body,
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    minHeight: 48, // Touch target minimum
    textAlign: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    minHeight: 48, // Touch target minimum
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  deleteButtonModal: {
    backgroundColor: Colors.light.error,
  },
  modalButtonText: {
    ...Typography.body,
    fontWeight: '600',
  },
});
