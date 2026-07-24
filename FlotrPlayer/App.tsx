import { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { LoginScreen } from './src/features/auth/LoginScreen'
import { OnboardingScreen } from './src/features/onboarding/OnboardingScreen'
import { SplashScreen } from './src/features/onboarding/SplashScreen'
import { CardDetailScreen } from './src/features/roster/CardDetailScreen'
import { RecommendationsScreen } from './src/features/skills/RecommendationsScreen'
import { SkillDetailScreen } from './src/features/skills/SkillDetailScreen'
import { MainTabs } from './src/navigation/MainTabs'
import { useAuthStore } from './src/store/authStore'
import { hasSeenOnboarding } from './src/utils/onboarding'

const queryClient = new QueryClient()
const Stack = createNativeStackNavigator()

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
          <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
              {isAuthenticated ? (
                <>
                  <Stack.Screen name="Main" component={MainTabs} />
                  <Stack.Screen name="CardDetail" component={CardDetailScreen} />
                  <Stack.Screen name="SkillDetail" component={SkillDetailScreen} />
                  <Stack.Screen name="Recommendations" component={RecommendationsScreen} />
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
