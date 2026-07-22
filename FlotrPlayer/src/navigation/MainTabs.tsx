import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Text } from 'react-native'
import { PlayerCardScreen } from '../features/home/PlayerCardScreen'
import { RosterScreen } from '../features/home/RosterScreen'
import { ProfileScreen } from '../features/profile/ProfileScreen'
import { SkillsScreen } from '../features/skills/SkillsScreen'
import { StatsScreen } from '../features/stats/StatsScreen'
import { t } from '../i18n/strings'
import { useAuthStore } from '../store/authStore'
import { colors } from '../theme/tokens'

const Tab = createBottomTabNavigator()

const tabIcon = (emoji: string) => {
  function TabIcon({ color }: { color: string }) {
    return <Text style={{ fontSize: 20, color }}>{emoji}</Text>
  }
  return TabIcon
}

const screenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.accent,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarStyle: { backgroundColor: colors.backgroundElevated, borderTopColor: colors.background },
}

// Navigace se liší podle typu účtu (spec section 14): Hráč má 4 položky (vlastní kartička,
// dovednosti a statistiky jsou dostupné jen v kontextu vlastní karty), Trenér jen 2 - roster
// nemá vlastní kartičku, Dovednosti/Statistiky nejsou samostatné položky pro Trenéra.
export function MainTabs() {
  const accountType = useAuthStore((s) => s.accountType)

  if (accountType === 'Coach') {
    return (
      <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen
          name="Roster"
          component={RosterScreen}
          options={{ title: t('nav.roster'), tabBarIcon: tabIcon('🏠') }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: t('nav.profile'), tabBarIcon: tabIcon('👤') }}
        />
      </Tab.Navigator>
    )
  }

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Home"
        component={PlayerCardScreen}
        options={{ title: t('nav.home'), tabBarIcon: tabIcon('🏠') }}
      />
      <Tab.Screen
        name="Skills"
        component={SkillsScreen}
        options={{ title: t('nav.skills'), tabBarIcon: tabIcon('🎯') }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{ title: t('nav.stats'), tabBarIcon: tabIcon('📊') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t('nav.profile'), tabBarIcon: tabIcon('👤') }}
      />
    </Tab.Navigator>
  )
}
