/**
 * Badge Selector Modal Component
 * Modal for selecting up to 5 featured badges
 */

import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { Colors, Spacing, BorderRadius } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { LimitedBadgeCard } from "@/components/events/limited-badge-card";
import { Button } from "@/components/ui/button";
import {
  useUserLimitedBadges,
  useBadgeSelector,
  sortBadgesByRarity,
} from "@/hooks/use-user-limited-badges";
import type { UserLimitedBadge } from "@/types/limited-event";

interface BadgeSelectorModalProps {
  visible: boolean;
  onClose: () => void;
}

export function BadgeSelectorModal({ visible, onClose }: BadgeSelectorModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];
  const { data: badges, isLoading } = useUserLimitedBadges();
  const { featuredIds, setFeaturedBadges, maxBadges, isUpdating } = useBadgeSelector(5);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Sync local state with hook state when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedIds(featuredIds);
    }
  }, [visible, featuredIds]);

  const sortedBadges = badges ? sortBadgesByRarity(badges) : [];

  const handleToggle = (badgeId: string) => {
    if (selectedIds.includes(badgeId)) {
      setSelectedIds(selectedIds.filter((id) => id !== badgeId));
    } else if (selectedIds.length < maxBadges) {
      setSelectedIds([...selectedIds, badgeId]);
    }
  };

  const handleSave = async () => {
    try {
      await setFeaturedBadges(selectedIds);
      onClose();
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const isSelected = (badgeId: string) => selectedIds.includes(badgeId);
  const canSelect = (badgeId: string) => isSelected(badgeId) || selectedIds.length < maxBadges;

  const renderItem = ({ item }: { item: UserLimitedBadge }) => {
    const selected = isSelected(item.badgeId);
    const selectable = canSelect(item.badgeId);

    return (
      <Pressable
        style={[
          styles.badgeItem,
          { backgroundColor: colors.card },
          selected && { backgroundColor: colors.primaryLight },
          !selectable && styles.badgeItemDisabled,
        ]}
        onPress={() => selectable && handleToggle(item.badgeId)}
        disabled={!selectable}
      >
        <LimitedBadgeCard badge={item} size="sm" isEarned />
        <View
          style={[
            styles.checkbox,
            {
              borderColor: selected ? colors.primary : colors.border,
              backgroundColor: selected ? colors.primary : "transparent",
            },
          ]}
        >
          {selected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
        </View>
      </Pressable>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="ribbon-outline" size={48} color={colors.textTertiary} />
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        No badges earned yet
      </Text>
      <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
        Participate in limited events to earn exclusive badges
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Select Badges
          </Text>
          <View style={styles.headerRight} />
        </View>

        {/* Counter */}
        <View style={styles.counterContainer}>
          <Text style={[styles.counterText, { color: colors.textSecondary }]}>
            {selectedIds.length}/{maxBadges} selected
          </Text>
        </View>

        {/* Badge Grid */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            data={sortedBadges}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            numColumns={3}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Footer */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            variant="outline"
            onPress={onClose}
            style={styles.footerButton}
            title="Cancel"
          />
          <Button
            variant="primary"
            onPress={handleSave}
            disabled={isUpdating}
            style={styles.footerButton}
            title={isUpdating ? "Saving..." : "Save Changes"}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
  headerRight: {
    width: 32,
  },
  counterContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  counterText: {
    fontSize: 14,
    textAlign: "center",
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  badgeItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    margin: Spacing.xs,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeItemDisabled: {
    opacity: 0.4,
  },
  checkbox: {
    position: "absolute",
    top: Spacing.xs,
    right: Spacing.xs,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xxl,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: Spacing.md,
  },
  emptyHint: {
    fontSize: 14,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.md,
  },
  footerButton: {
    flex: 1,
  },
});
