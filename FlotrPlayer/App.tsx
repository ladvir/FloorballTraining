import { useEffect } from 'react'
import { ActivityIndicator, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { LoginScreen } from './src/features/auth/LoginScreen'
import { CardDetailScreen } from './src/features/roster/CardDetailScreen'
import { RosterScreen } from './src/features/home/RosterScreen'
import { SkillDetailScreen } from './src/features/skills/SkillDetailScreen'
import { MainTabs } from './src/navigation/MainTabs'
import { useAuthStore } from './src/store/authStore'

const queryClient = new QueryClient()
const Stack = createNativeStackNavigator()

export default function App() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isHydrated = useAuthStore((s) => s.isHydrated)
  const hydrate = useAuthStore((s) => s.hydrate)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            {isAuthenticated ? (
              <>
                <Stack.Screen name="Main" component={MainTabs} />
                {/* "Režim prohlížení" entry for Hráč accounts (ProfileScreen) - pushed on top of
                    the tabs, not a tab itself, since it's opt-in per spec section 15. */}
                <Stack.Screen name="Browse">{() => <RosterScreen showBackButton />}</Stack.Screen>
                <Stack.Screen name="CardDetail" component={CardDetailScreen} />
                <Stack.Screen name="SkillDetail" component={SkillDetailScreen} />
              </>
            ) : (
              <Stack.Screen name="Login" component={LoginScreen} />
            )}
          </Stack.Navigator>
        </NavigationContainer>
        <StatusBar style="auto" />
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}
