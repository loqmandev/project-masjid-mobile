import { Redirect } from 'expo-router';

import { loadOnboardingCompleted } from '@/lib/storage';

export default function Index() {
  const hasCompletedOnboarding = loadOnboardingCompleted();
  return <Redirect href={hasCompletedOnboarding ? '/(tabs)' : '/onboarding'} />;
}
