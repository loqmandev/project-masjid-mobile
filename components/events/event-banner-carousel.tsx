/**
 * Event Banner Carousel Component
 * Auto-scrolling carousel for multiple active events
 */

import React, { useEffect, useRef, useState } from "react";
import { FlatList, useWindowDimensions, View } from "react-native";

import { Card } from "@/components/ui/card";
import { Colors, Spacing } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";
import type {
  LimitedEvent,
  UserEventParticipation,
} from "@/types/limited-event";
import { EventBanner } from "./event-banner";

interface EventBannerCarouselProps {
  events: LimitedEvent[];
  userParticipations?: UserEventParticipation[];
  autoScrollInterval?: number;
}

export function EventBannerCarousel({
  events,
  userParticipations = [],
  autoScrollInterval = 5000,
}: EventBannerCarouselProps) {
  const { width: windowWidth } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const bannerWidth = windowWidth - Spacing.md * 2;
  const snapInterval = bannerWidth + Spacing.sm;

  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Auto-scroll carousel
  useEffect(() => {
    if (events.length <= 1) return;

    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % events.length;
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true,
      });
      setActiveIndex(nextIndex);
    }, autoScrollInterval);

    return () => clearInterval(interval);
  }, [activeIndex, events.length, autoScrollInterval]);

  const getUserParticipation = (eventId: string) => {
    return userParticipations.find((p) => p.eventId === eventId);
  };

  if (events.length === 0) return null;

  return (
    <View style={{ marginHorizontal: Spacing.md, gap: Spacing.sm }}>
      <FlatList
        ref={flatListRef}
        data={events}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapInterval}
        decelerationRate="fast"
        contentContainerStyle={{ gap: Spacing.sm }}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / snapInterval,
          );
          setActiveIndex(index);
        }}
        renderItem={({ item }) => (
          <Card
            variant="default"
            style={{ width: bannerWidth, padding: 0, overflow: "hidden" }}
          >
            <EventBanner
              event={item}
              participation={getUserParticipation(item.id)}
            />
          </Card>
        )}
      />
      {events.length > 1 && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            gap: 6,
          }}
        >
          {events.map((_, index) => (
            <View
              key={index}
              style={{
                height: 6,
                borderRadius: 3,
                width: index === activeIndex ? 18 : 6,
                backgroundColor:
                  index === activeIndex ? colors.primary : colors.border,
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}
