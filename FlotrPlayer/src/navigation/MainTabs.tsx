import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import type { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { StyleSheet } from 'react-native'
import { Icon } from '../components/Icon'
import { PlayerCardScreen } from '../features/home/PlayerCardScreen'
import { RosterScreen } from '../features/home/RosterScreen'
import { ProfileScreen } from '../features/profile/ProfileScreen'
import { SkillsScreen } from '../features/skills/SkillsScreen'
import { StatsScreen } from '../features/stats/StatsScreen'
import { t } from '../i18n/strings'
import { useAuthStore } from '../store/authStore'
import { colors, glass } from '../theme/tokens'

const Tab = createBottomTabNavigator()

const tabIcon = (name: keyof typeof Ionicons.glyphMap) => {
  function TabIcon({ color }: { color: string }) {
    return <Icon name={name} size={22} color={color} />
  }
  return TabIcon
}

const screenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.accent,
  tabBarInactiveTintColor: colors.textMuted,
  tabBarBackground: () => <BlurView intensity={glass.intensity} tint={glass.tint} style={StyleSheet.absoluteFill} />,
  tabBarStyle: {
    backgroundColor: 'transparent',
    borderTopColor: glass.border,
    position: 'absolute' as const,
  },
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
          options={{ title: t('nav.roster'), tabBarIcon: tabIcon('people-outline') }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: t('nav.profile'), tabBarIcon: tabIcon('person-outline') }}
        />
      </Tab.Navigator>
    )
  }

  return (
    <Tab.Navigator screenOptions={screenOptions}>
      <Tab.Screen
        name="Home"
        component={PlayerCardScreen}
        options={{ title: t('nav.home'), tabBarIcon: tabIcon('home-outline') }}
      />
      <Tab.Screen
        name="Skills"
        component={SkillsScreen}
        options={{ title: t('nav.skills'), tabBarIcon: tabIcon('locate-outline') }}
      />
      <Tab.Screen
        name="Stats"
        component={StatsScreen}
        options={{ title: t('nav.stats'), tabBarIcon: tabIcon('bar-chart-outline') }}
      />
      {/* Club roster browsing, promoted from a ProfileScreen button to a first-class tab (user
          feedback 2026-07-24) - read-only for a Hráč, see CardDetailScreen. */}
      <Tab.Screen
        name="Browse"
        component={RosterScreen}
        options={{ title: t('nav.roster'), tabBarIcon: tabIcon('people-outline') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: t('nav.profile'), tabBarIcon: tabIcon('person-outline') }}
      />
    </Tab.Navigator>
  )
}
