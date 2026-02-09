// @ts-check
import React, {
  Children,
  ReactElement,
  cloneElement,
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import {
  Dimensions,
  Pressable,
  ScrollViewProps,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import {
  Gesture,
  GestureDetector
} from 'react-native-gesture-handler';
import Animated, {
  Extrapolation,
  interpolate,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import {
  DEFAULT_SPRING_CONFIG,
  DEFAULT_TIMING_CONFIG,
  SCROLL_TOP_THRESHOLD
} from './bottom-sheet/conf';
import type { BottomSheetMethods, BottomSheetProps } from './bottom-sheet/types';
import { isScrollableList, parseSnapPoint, triggerHaptic } from './bottom-sheet/utils';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const BottomSheetComponent = forwardRef<BottomSheetMethods, BottomSheetProps>(
  (
    {
      children,
      snapPoints,
      enableBackdrop = true,
      backdropOpacity = 0.5,
      dismissOnBackdropPress = true,
      dismissOnSwipeDown = true,
      onSnapPointChange,
      onClose,
      springConfig = DEFAULT_SPRING_CONFIG,
      sheetStyle,
      backdropStyle,
      handleStyle,
      showHandle = true,
      enableOverDrag = true,
      enableHapticFeedback = true,
      snapVelocityThreshold = 500,
      backgroundColor = '#FFFFFF',
      borderRadius = 24,
      contentContainerStyle,
      enableDynamicSizing = false,
    },
    ref
  ) => {
    const parsedSnapPoints = useMemo(
      () => snapPoints.map(parseSnapPoint),
      [snapPoints]
    );
    const maxSnapPoint = useMemo(
      () => Math.max(...parsedSnapPoints),
      [parsedSnapPoints]
    );
    const minSnapPoint = useMemo(
      () => Math.min(...parsedSnapPoints),
      [parsedSnapPoints]
    );
    const maxSnapIndex = useMemo(() => parsedSnapPoints.length - 1, [parsedSnapPoints]);

    const translateY = useSharedValue(SCREEN_HEIGHT);
    const currentSnapIndex = useSharedValue(-1);
    const context = useSharedValue(0);
    const scrollY = useSharedValue(0);
    const scrollViewRef = useAnimatedRef<Animated.ScrollView>();
    const isDraggingSheet = useSharedValue(false);
    const isScrollLocked = useSharedValue(false);
    const gestureStartScrollY = useSharedValue(0);
    const [enableScroll, setEnableScroll] = useState(false);

    const handleSnapPointChangeJS = useCallback(
      (index: number) => {
        if (enableHapticFeedback) {
          triggerHaptic();
        }
        onSnapPointChange?.(index);
      },
      [onSnapPointChange, enableHapticFeedback]
    );

    const handleCloseJS = useCallback(() => {
      if (enableHapticFeedback) {
        triggerHaptic();
      }
      onClose?.();
    }, [onClose, enableHapticFeedback]);

    const updateScrollEnabled = useCallback((enabled: boolean) => {
      setEnableScroll(enabled);
    }, []);

    const findClosestSnapPoint = useCallback(
      (currentY: number, velocity: number): number => {
        'worklet';
        const height = SCREEN_HEIGHT - currentY;
        if (Math.abs(velocity) > snapVelocityThreshold) {
          const direction = velocity > 0 ? -1 : 1;
          const currentIndex = currentSnapIndex.value;
          const nextIndex = currentIndex + direction;
          if (nextIndex >= 0 && nextIndex < parsedSnapPoints.length) {
            return nextIndex;
          }
        }
        let closestIndex = 0;
        let minDistance = Math.abs(height - parsedSnapPoints[0]);
        for (let i = 1; i < parsedSnapPoints.length; i++) {
          const distance = Math.abs(height - parsedSnapPoints[i]);
          if (distance < minDistance) {
            minDistance = distance;
            closestIndex = i;
          }
        }
        return closestIndex;
      },
      [parsedSnapPoints, snapVelocityThreshold]
    );

    const snapToPoint = useCallback(
      (index: number, animated: boolean = true) => {
        'worklet';
        if (index < 0 || index >= parsedSnapPoints.length) {
          return;
        }
        const targetY = SCREEN_HEIGHT - parsedSnapPoints[index];
        if (animated) {
          translateY.value = withSpring(targetY, springConfig);
        } else {
          translateY.value = targetY;
        }
        currentSnapIndex.value = index;
        const shouldEnableScroll = index === maxSnapIndex;
        isScrollLocked.value = !shouldEnableScroll;
        scheduleOnRN<[boolean], void>(updateScrollEnabled, shouldEnableScroll);
        if (onSnapPointChange) {
          scheduleOnRN<[number], void>(handleSnapPointChangeJS, index);
        }
      },
      [
        parsedSnapPoints,
        springConfig,
        translateY,
        currentSnapIndex,
        maxSnapIndex,
        isScrollLocked,
        handleSnapPointChangeJS,
        updateScrollEnabled,
        onSnapPointChange,
      ]
    );

    const closeSheet = useCallback(() => {
      'worklet';
      isScrollLocked.value = true;
      scheduleOnRN<[boolean], void>(updateScrollEnabled, false);
      translateY.value = withTiming(
        SCREEN_HEIGHT,
        DEFAULT_TIMING_CONFIG,
        (finished) => {
          if (finished) {
            currentSnapIndex.value = -1;
            scrollTo(scrollViewRef, 0, 0, false);
            scrollY.value = 0;
            if (onClose) {
              scheduleOnRN<[], void>(handleCloseJS);
            }
          }
        }
      );
    }, [
      translateY,
      handleCloseJS,
      scrollViewRef,
      scrollY,
      isScrollLocked,
      updateScrollEnabled,
      onClose,
    ]);

    const onScroll = useAnimatedScrollHandler({
      onScroll: (event) => {
        'worklet';
        scrollY.value = event.contentOffset.y;
      },
    });

    const handlePanGesture = useMemo(
      () =>
        Gesture.Pan()
          .onBegin(() => {
            'worklet';
            context.value = translateY.value;
            isDraggingSheet.value = true;
          })
          .onUpdate((event) => {
            'worklet';
            const newY = context.value + event.translationY;
            const minY = SCREEN_HEIGHT - maxSnapPoint;
            const maxY = SCREEN_HEIGHT;
            if (enableOverDrag) {
              if (newY < minY) {
                const overDrag = minY - newY;
                translateY.value = minY - Math.log(overDrag + 1) * 10;
              } else if (newY > maxY) {
                const overDrag = newY - maxY;
                translateY.value = maxY + Math.log(overDrag + 1) * 10;
              } else {
                translateY.value = newY;
              }
            } else {
              translateY.value = Math.max(minY, Math.min(maxY, newY));
            }
          })
          .onEnd((event) => {
            'worklet';
            isDraggingSheet.value = false;
            const currentY = translateY.value;
            const velocity = event.velocityY;
            if (
              dismissOnSwipeDown &&
              currentY > SCREEN_HEIGHT - minSnapPoint &&
              velocity > 500
            ) {
              closeSheet();
              return;
            }
            const closestIndex = findClosestSnapPoint(currentY, velocity);
            snapToPoint(closestIndex, true);
          }),
      [
        translateY,
        context,
        isDraggingSheet,
        enableOverDrag,
        maxSnapPoint,
        minSnapPoint,
        dismissOnSwipeDown,
        closeSheet,
        findClosestSnapPoint,
        snapToPoint,
      ]
    );

    const contentPanGesture = useMemo(
      () =>
        Gesture.Pan()
          .activeOffsetY([-10, 10])
          .onStart(() => {
            'worklet';
            context.value = translateY.value;
            gestureStartScrollY.value = scrollY.value;
            isDraggingSheet.value = false;
          })
          .onUpdate((event) => {
            'worklet';
            const isFullyExpanded = currentSnapIndex.value === maxSnapIndex;
            if (!isFullyExpanded) {
              isDraggingSheet.value = true;
              const newY = context.value + event.translationY;
              const minY = SCREEN_HEIGHT - maxSnapPoint;
              const maxY = SCREEN_HEIGHT;
              if (newY < minY) {
                translateY.value = enableOverDrag
                  ? minY - Math.log(minY - newY + 1) * 10
                  : minY;
              } else if (newY > maxY) {
                translateY.value = enableOverDrag
                  ? maxY + Math.log(newY - maxY + 1) * 10
                  : maxY;
              } else {
                translateY.value = newY;
              }
              return;
            }
            const isAtTop = scrollY.value <= SCROLL_TOP_THRESHOLD;
            const isDraggingDown = event.translationY > 0;
            const wasAtTopAtStart = gestureStartScrollY.value <= SCROLL_TOP_THRESHOLD;
            const shouldDragSheet =
              isDraggingSheet.value || (isAtTop && isDraggingDown && wasAtTopAtStart);
            if (!shouldDragSheet) {
              return;
            }
            isDraggingSheet.value = true;
            const effectiveTranslation = event.translationY;
            const newY = context.value + effectiveTranslation;
            const minY = SCREEN_HEIGHT - maxSnapPoint;
            const maxY = SCREEN_HEIGHT;
            if (newY < minY) {
              translateY.value = enableOverDrag
                ? minY - Math.log(minY - newY + 1) * 10
                : minY;
            } else if (newY > maxY) {
              translateY.value = enableOverDrag
                ? maxY + Math.log(newY - maxY + 1) * 10
                : maxY;
            } else {
              translateY.value = newY;
            }
          })
          .onEnd((event) => {
            'worklet';
            if (isDraggingSheet.value) {
              const currentY = translateY.value;
              const velocity = event.velocityY;
              if (
                dismissOnSwipeDown &&
                currentY > SCREEN_HEIGHT - minSnapPoint &&
                velocity > 500
              ) {
                closeSheet();
              } else {
                const closestIndex = findClosestSnapPoint(currentY, velocity);
                snapToPoint(closestIndex, true);
              }
            }
            isDraggingSheet.value = false;
          })
          .onFinalize(() => {
            'worklet';
            isDraggingSheet.value = false;
          }),
      [
        translateY,
        context,
        scrollY,
        gestureStartScrollY,
        isDraggingSheet,
        currentSnapIndex,
        maxSnapIndex,
        enableOverDrag,
        maxSnapPoint,
        minSnapPoint,
        dismissOnSwipeDown,
        closeSheet,
        findClosestSnapPoint,
        snapToPoint,
      ]
    );

    const scrollViewGesture = useMemo(() => Gesture.Native(), []);
    const simultaneousGesture = useMemo(
      () => Gesture.Simultaneous(scrollViewGesture, contentPanGesture),
      [scrollViewGesture, contentPanGesture]
    );

    useImperativeHandle(
      ref,
      () => ({
        snapToIndex: (index: number) => {
          snapToPoint(index, true);
        },
        snapToPosition: (position: number) => {
          'worklet';
          const targetY = SCREEN_HEIGHT - position;
          translateY.value = withSpring(targetY, springConfig);
        },
        expand: () => {
          snapToPoint(maxSnapIndex, true);
        },
        collapse: () => {
          snapToPoint(0, true);
        },
        close: () => {
          closeSheet();
        },
        getCurrentIndex: () => {
          return currentSnapIndex.value;
        },
      }),
      [snapToPoint, closeSheet, maxSnapIndex, springConfig, translateY, currentSnapIndex]
    );

    const sheetAnimatedStyle = useAnimatedStyle<ViewStyle>(
      () => ({
        transform: [{ translateY: translateY.value }],
      }),
      []
    );

    const backdropAnimatedStyle = useAnimatedStyle<ViewStyle>(() => {
      const opacity = interpolate(
        translateY.value,
        [SCREEN_HEIGHT - maxSnapPoint, SCREEN_HEIGHT],
        [backdropOpacity, 0],
        Extrapolation.CLAMP
      );
      return {
        opacity,
        pointerEvents: opacity > 0 ? ('auto' as const) : ('none' as const),
      };
    });

    const handleBackdropPress = useCallback(() => {
      if (dismissOnBackdropPress) {
        closeSheet();
      }
    }, [dismissOnBackdropPress, closeSheet]);

    const sheetBaseStyle = useMemo<
      Pick<ViewStyle, 'backgroundColor' | 'borderTopLeftRadius' | 'borderTopRightRadius'>
    >(
      () => ({
        backgroundColor,
        borderTopLeftRadius: borderRadius,
        borderTopRightRadius: borderRadius,
      }),
      [backgroundColor, borderRadius]
    );

    const scrollProps: Partial<ScrollViewProps> = useMemo(
      () => ({
        scrollEnabled: enableScroll,
        onScroll: onScroll as ScrollViewProps['onScroll'],
        scrollEventThrottle: 16,
        bounces: false,
        overScrollMode: 'never' as const,
        showsVerticalScrollIndicator: true,
      }),
      [enableScroll, onScroll]
    );

    const renderContent = useCallback(() => {
      const childArray = Children.toArray(children);
      if (childArray.length === 1 && isScrollableList(childArray[0])) {
        const listElement = childArray[0] as ReactElement;
        const enhancedList = cloneElement(listElement, {
          ...scrollProps,
          onScroll: (event: any) => {
            (scrollProps.onScroll as any)?.(event);
            (listElement.props as any).onScroll?.(event);
          },
        });
        return (
          <Animated.ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            scrollEnabled={enableScroll}
            scrollEventThrottle={16}
            bounces={false}
            overScrollMode="never"
            showsVerticalScrollIndicator={true}
          >
            {enhancedList}
          </Animated.ScrollView>
        );
      }
      return (
        <Animated.ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          {...scrollProps}
        >
          <View style={[styles.contentContainer, contentContainerStyle]}>{children}</View>
        </Animated.ScrollView>
      );
    }, [children, scrollProps, scrollViewRef, contentContainerStyle, enableScroll]);

    return (
      <>
        {enableBackdrop && (
          <Animated.View style={[styles.backdrop, backdropAnimatedStyle, backdropStyle]}>
            <Pressable style={styles.backdropPress} onPress={handleBackdropPress} />
          </Animated.View>
        )}
        <GestureDetector gesture={handlePanGesture}>
          <Animated.View style={[styles.sheet, sheetAnimatedStyle, sheetBaseStyle, sheetStyle]}>
            {showHandle && (
              <View style={[styles.handleContainer, handleStyle]}>
                <View style={styles.handle} />
              </View>
            )}
            <View style={styles.contentWrapper}>{renderContent()}</View>
          </Animated.View>
        </GestureDetector>
      </>
    );
  }
);

export const BottomSheet = memo(BottomSheetComponent);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
  },
  backdropPress: {
    flex: 1,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: SCREEN_HEIGHT,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
  },
  contentWrapper: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
});

export default BottomSheet;
