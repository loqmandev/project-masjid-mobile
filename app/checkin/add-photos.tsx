import { File } from 'expo-file-system';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAnalytics } from '@/lib/analytics';
import { createMasjidPhoto, getMasjidPhotoUploadUrl } from '@/lib/api';
import { useSession } from '@/lib/auth-client';

const MAX_PHOTOS = 5;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const DEFAULT_CATEGORY = 'OTHER';
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
  'image/webp',
]);

function normalizeMimeType(mimeType: string) {
  if (mimeType === 'image/jpg') return 'image/jpeg';
  return mimeType;
}

type SelectedPhoto = {
  id: string;
  uri: string;
  fileName: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
};

function getMimeTypeFromUri(uri: string) {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.heic')) return 'image/heic';
  if (lower.endsWith('.heif')) return 'image/heif';
  return 'image/jpeg';
}

function getFileExtension(name?: string, uri?: string) {
  const source = name || uri || '';
  const match = source.toLowerCase().match(/\.([a-z0-9]+)$/);
  return match?.[1] ?? 'jpg';
}

async function normalizeAssetUri(
  asset: ImagePicker.ImagePickerAsset
): Promise<{ uri: string; size: number }> {
  let normalizedUri = asset.uri;
  if (Platform.OS === 'android' && normalizedUri.startsWith('content://')) {
    const extension = getFileExtension(asset.fileName, asset.uri);
    const targetUri = `${FileSystem.cacheDirectory}upload-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;
    await FileSystem.copyAsync({ from: normalizedUri, to: targetUri });
    normalizedUri = targetUri;
  }

  let size = asset.fileSize ?? 0;
  if (!size) {
    const fileInfo = new File(normalizedUri).info();
    size = typeof fileInfo.size === 'number' ? fileInfo.size : 0;
  }

  return { uri: normalizedUri, size };
}

export default function AddPhotosScreen() {
  const { masjidId, masjidName } = useLocalSearchParams<{
    masjidId: string;
    masjidName?: string;
  }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { data: session } = useSession();
  const { track, screen } = useAnalytics();
  const hasTrackedView = useRef(false);
  const hasCheckedPending = useRef(false);

  const [photos, setPhotos] = useState<SelectedPhoto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPicking, setIsPicking] = useState(false);

  const remainingSlots = MAX_PHOTOS - photos.length;

  const photoSummary = useMemo(() => {
    if (photos.length === 0) return 'No photos selected yet.';
    if (photos.length === 1) return '1 photo selected.';
    return `${photos.length} photos selected.`;
  }, [photos.length]);

  const addAssets = useCallback(async (assets: ImagePicker.ImagePickerAsset[]) => {
    if (assets.length === 0) return;

    const nextPhotos: SelectedPhoto[] = [];
    let rejectedLarge = 0;
    let rejectedType = 0;
    let rejectedUnreadable = 0;

    for (let i = 0; i < assets.length; i += 1) {
      const asset = assets[i];
      let normalized;
      try {
        normalized = await normalizeAssetUri(asset);
      } catch {
        rejectedUnreadable += 1;
        continue;
      }
      const { uri, size } = normalized;
      if (size > MAX_FILE_SIZE_BYTES) {
        rejectedLarge += 1;
        continue;
      }

      const rawMimeType =
        asset.mimeType || getMimeTypeFromUri(asset.fileName || asset.uri);
      const mimeType = normalizeMimeType(rawMimeType);
      if (!ALLOWED_MIME_TYPES.has(mimeType)) {
        rejectedType += 1;
        continue;
      }

      nextPhotos.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        uri,
        fileName: asset.fileName || uri.split('/').pop() || 'photo',
        mimeType,
        size,
        width: asset.width,
        height: asset.height,
      });
    }

    if (rejectedLarge > 0) {
      Alert.alert(
        'File too large',
        `${rejectedLarge} photo${rejectedLarge > 1 ? 's are' : ' is'} over ${MAX_FILE_SIZE_MB}MB and were skipped.`
      );
    }
    if (rejectedType > 0) {
      Alert.alert(
        'Unsupported format',
        `${rejectedType} photo${rejectedType > 1 ? 's are' : ' is'} not a supported image type.`
      );
    }
    if (rejectedUnreadable > 0) {
      Alert.alert(
        'Unreadable photo',
        `${rejectedUnreadable} photo${rejectedUnreadable > 1 ? 's were' : ' was'} not accessible and were skipped.`
      );
    }

    if (nextPhotos.length > 0) {
      setPhotos((prev) => [...prev, ...nextPhotos].slice(0, MAX_PHOTOS));
    }
  }, []);

  const pickFromLibrary = useCallback(async () => {
    if (remainingSlots <= 0) return;
    setIsPicking(true);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync(false);
    if (!permission.granted) {
      setIsPicking(false);
      Alert.alert('Permission required', 'Allow photo access to upload images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 1,
    });

    if (!result.canceled) {
      track('photo_library_selected', {
        masjid_id: masjidId,
        count: result.assets?.length ?? 0,
      });
      await addAssets(result.assets ?? []);
    }
    setIsPicking(false);
  }, [addAssets, remainingSlots, track, masjidId]);

  const takePhoto = useCallback(async () => {
    if (remainingSlots <= 0) return;
    setIsPicking(true);
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      setIsPicking(false);
      Alert.alert('Permission required', 'Allow camera access to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 1,
    });

    if (!result.canceled) {
      track('photo_camera_taken', { masjid_id: masjidId });
      await addAssets(result.assets ?? []);
    }
    setIsPicking(false);
  }, [addAssets, track, masjidId, remainingSlots]);

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== id));
  };

  const handleSubmit = useCallback(async () => {
    if (!session?.user) {
      Alert.alert('Sign In Required', 'Please sign in to upload photos.');
      router.push('/auth/login');
      return;
    }
    if (!masjidId) {
      Alert.alert('Missing Masjid', 'Masjid information is unavailable.');
      return;
    }
    if (photos.length === 0) {
      Alert.alert('No Photos', 'Please select at least one photo.');
      return;
    }

    setIsSubmitting(true);
    try {
      track('photo_upload_started', { masjid_id: masjidId, count: photos.length });

      for (let i = 0; i < photos.length; i += 1) {
        const photo = photos[i];
        const normalizedType = normalizeMimeType(photo.mimeType);
        const uploadData = await getMasjidPhotoUploadUrl(masjidId, {
          category: DEFAULT_CATEGORY,
          contentType: normalizedType,
        });
        const contentType = uploadData.contentType || normalizedType;

        const fileBytes = await new File(photo.uri).bytes();
        const body = fileBytes.buffer.slice(                                                         
          fileBytes.byteOffset,
          fileBytes.byteOffset + fileBytes.byteLength
        );
        const uploadResult = await fetch(uploadData.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': contentType,
          },
          body,
        });

        console.log('Upload result', uploadResult.status, await uploadResult.text()); 

        if (!uploadResult.ok) {
          throw new Error('Failed to upload photo to storage.');
        }

        await createMasjidPhoto(masjidId, {
          key: uploadData.key,
          category: DEFAULT_CATEGORY,
          facilityCode: null,
        });
      }

      track('photo_upload_success', { masjid_id: masjidId, count: photos.length });
      Alert.alert('Upload complete', 'Thanks! Photos are pending approval.');
      setPhotos([]);
      router.back();
    } catch (error) {
      track('photo_upload_failed', { masjid_id: masjidId });
      Alert.alert('Upload failed', (error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  }, [masjidId, photos, session?.user, track]);

  if (!masjidId) {
    return (
      <>
        <Stack.Screen options={{ title: 'Add Photos' }} />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.centeredContent}>
            <Text style={[styles.errorText, { color: colors.error }]}>
              Missing masjid information.
            </Text>
            <Button title="Go Back" variant="primary" onPress={() => router.back()} />
          </View>
        </SafeAreaView>
      </>
    );
  }

  useEffect(() => {
    if (hasTrackedView.current) return;
    screen('add_photos', { masjid_id: masjidId });
    track('add_photos_viewed', { masjid_id: masjidId });
    hasTrackedView.current = true;
  }, [masjidId, screen, track]);

  // useEffect(() => {
  //   if (hasCheckedPending.current) return;
  //   hasCheckedPending.current = true;
  //   ImagePicker.getPendingResultAsync().then((pending) => {
  //     if (pending && !pending.canceled && pending.assets?.length) {
  //       addAssets(pending.assets);
  //     }
  //   });
  // }, [addAssets]);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Add Photos',
          headerBackTitle: 'Back',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Card variant="outlined" padding="md" style={styles.headerCard}>
            <View style={styles.headerRow}>
              <IconSymbol name="camera.fill" size={20} color={colors.primary} />
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                {masjidName || 'This masjid'}
              </Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
              Upload up to {MAX_PHOTOS} photos. We’ll review before publishing.
            </Text>
          </Card>

          <Card variant="outlined" padding="md" style={styles.pickerCard}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select photos</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              {photoSummary}
            </Text>
            <View style={styles.pickerButtons}>
              <Button
                title="Choose from Library"
                variant="primary"
                onPress={pickFromLibrary}
                disabled={remainingSlots <= 0 || isPicking || isSubmitting}
              />
              <Button
                title="Take a Photo"
                variant="outline"
                onPress={takePhoto}
                disabled={remainingSlots <= 0 || isPicking || isSubmitting}
              />
            </View>
          </Card>

          {photos.length > 0 && (
            <View style={styles.previewSection}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Preview</Text>
              <View style={styles.previewGrid}>
                {photos.map((photo) => (
                  <View key={photo.id} style={styles.previewItem}>
                    <Image source={{ uri: photo.uri }} style={styles.previewImage} />
                    <TouchableOpacity
                      style={[styles.removeButton, { backgroundColor: colors.card }]}
                      onPress={() => removePhoto(photo.id)}
                    >
                      <IconSymbol name="xmark.circle.fill" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <View
          style={[
            styles.footer,
            { backgroundColor: colors.background, borderTopColor: colors.border },
          ]}
        >
          <Button
            title={isSubmitting ? 'Uploading...' : 'Upload Photos'}
            variant="primary"
            onPress={handleSubmit}
            disabled={photos.length === 0 || isSubmitting || isPicking}
            loading={isSubmitting}
          />
          {isSubmitting && (
            <View style={styles.uploadingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.uploadingText, { color: colors.textSecondary }]}>
                Uploading photos…
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  headerCard: {
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    ...Typography.body,
    fontWeight: '600',
  },
  headerSubtitle: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
  },
  pickerCard: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.bodySmall,
    fontWeight: '600',
  },
  sectionSubtitle: {
    ...Typography.bodySmall,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
  },
  pickerButtons: {
    gap: Spacing.sm,
  },
  previewSection: {
    marginBottom: Spacing.md,
  },
  previewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  previewItem: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    borderRadius: 12,
  },
  footer: {
    padding: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  uploadingText: {
    ...Typography.caption,
  },
  errorText: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
});
