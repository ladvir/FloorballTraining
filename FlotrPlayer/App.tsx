import { useEffect, useState } from 'react'
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import * as Notifications from 'expo-notifications'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { LoginScreen } from './src/features/auth/LoginScreen'
import { OnboardingScreen } from './src/features/onboarding/OnboardingScreen'
import { SplashScreen } from './src/features/onboarding/SplashScreen'
import { HomeTrainingScreen } from './src/features/home/HomeTrainingScreen'
import { LiveTrainingScreen } from './src/features/live/LiveTrainingScreen'
import { CardDetailScreen } from './src/features/roster/CardDetailScreen'
import { CoachAwardsScreen } from './src/features/coach/CoachAwardsScreen'
import { TeamChallengesScreen } from './src/features/coach/TeamChallengesScreen'
import { RecommendationsScreen } from './src/features/skills/RecommendationsScreen'
import { SkillDetailScreen } from './src/features/skills/SkillDetailScreen'
import { HowToEarnXpScreen } from './src/features/gamification/HowToEarnXpScreen'
import { MainTabs } from './src/navigation/MainTabs'
import { useAuthStore } from './src/store/authStore'
import { hasSeenOnboarding } from './src/utils/onboarding'
import { registerPushTokenAsync } from './src/utils/pushNotifications'

const queryClient = new QueryClient()
const Stack = createNativeStackNavigator()
const navigationRef = createNavigationContainerRef()

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const hydrate = useAuthStore((s) => s.hydrate)
  // null = not checked yet (still counts as "show splash"), so onboarding can never flash
  // before this resolves.
  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null)

  useEffect(() => {
    hydrate()
    hasSeenOnboarding().then(setOnboardingSeen)
  }, [hydrate])

  // Register this device's push token once the session is live (no-op on simulators / if denied).
  useEffect(() => {
    if (isAuthenticated) registerPushTokenAsync()
  }, [isAuthenticated])

  // Tapping a push (e.g. the "confirm attendance" reminder) opens the app on the events list.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(() => {
      if (navigationRef.isReady()) navigationRef.navigate('Main' as never)
    })
    return () => sub.remove()
  }, [])

  const showSplash = !isHydrated || onboardingSeen === null
  // Onboarding only gates the unauthenticated (pre-Login) flow per design/images/07-onboarding.png
  // - an already-authenticated session (valid stored token) skips straight to Main, same as before.
  const showOnboarding = !showSplash && !isAuthenticated && !onboardingSeen

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        {showSplash ? (
          <SplashScreen />
        ) : showOnboarding ? (
          <OnboardingScreen onDone={() => setOnboardingSeen(true)} />
        ) : (
          <NavigationContainer ref={navigationRef}>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {isAuthenticated ? (
                <>
                  <Stack.Screen name="Main" component={MainTabs} />
                  <Stack.Screen name="HomeTraining" component={HomeTrainingScreen} />
                  <Stack.Screen name="LiveTraining" component={LiveTrainingScreen} />
                  <Stack.Screen name="CardDetail" component={CardDetailScreen} />
                  <Stack.Screen name="CoachAwards" component={CoachAwardsScreen} />
                  <Stack.Screen name="TeamChallenges" component={TeamChallengesScreen} />
                  <Stack.Screen name="SkillDetail" component={SkillDetailScreen} />
                  <Stack.Screen name="Recommendations" component={RecommendationsScreen} />
                  <Stack.Screen name="HowToEarnXp" component={HowToEarnXpScreen} />
                </>
              ) : (
                <Stack.Screen name="Login" component={LoginScreen} />
              )}
            </Stack.Navigator>
          </NavigationContainer>
        )}
        {/* App is deliberately dark-first throughout (design/README.md) - status bar icons are
            always light, not "auto"-adapted to a system light mode this app never uses. */}
        <StatusBar style="light" />
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}
