import type { PostHogEventProperties } from '@posthog/core';
import { usePostHog } from 'posthog-react-native';
import { useCallback } from 'react';

type AnalyticsProps = PostHogEventProperties;

export function useAnalytics() {
  const posthog = usePostHog();

  const track = useCallback(
    (event: string, properties?: AnalyticsProps) => {
      posthog?.capture(event, properties);
    },
    [posthog]
  );

  const identify = useCallback(
    (id: string, properties?: AnalyticsProps) => {
      posthog?.identify(id, properties);
    },
    [posthog]
  );

  const screen = useCallback(
    (name: string, properties?: AnalyticsProps) => {
      posthog?.capture('screen_view', { screen: name, ...properties });
    },
    [posthog]
  );

  return { track, identify, screen };
}
