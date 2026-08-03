import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import type { Ionicons } from '@expo/vector-icons'
import { BlurView } from 'expo-blur'
import { Platform, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Icon } from '../components/Icon'
import { ChildrenScreen } from '../features/guardian/ChildrenScreen'
import { PlayerCardScreen } from '../features/home/PlayerCardScreen'
import { RosterScreen } from '../features/home/RosterScreen'
import { LeaderboardScreen } from '../features/leaderboard/LeaderboardScreen'
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

// Height of the tab bar's icon+label row, above whatever bottom inset the device needs.
const TAB_BAR_HEIGHT = 56

const renderTabBarBackground = () => (
  <BlurView intensity={glass.intensity} tint={glass.tint} style={StyleSheet.absoluteFill} />
)

function useTabScreenOptions() {
  const insets = useSafeAreaInsets()
  // Expo edge-to-edge on Android often reports the 3-button nav-bar inset as 0, which left this
  // floating glass tab bar stranded behind the system Back/Home buttons. Trust a real reported
  // inset (gesture pill or button bar); only fall back to the standard 48dp nav-bar height when
  // the value is implausibly small. react-navigation's own paddingBottom/height come earlier in
  // its style array, so setting them here overrides them (see BottomTabBar render order).
  const bottomInset =
    insets.bottom > 8 ? insets.bottom : Platform.OS === 'android' ? 48 : insets.bottom

  return {
    headerShown: false,
    tabBarActiveTintColor: colors.accent,
    tabBarInactiveTintColor: colors.textMuted,
    tabBarBackground: renderTabBarBackground,
    tabBarStyle: {
      backgroundColor: 'transparent',
      borderTopColor: glass.border,
      position: 'absolute' as const,
      height: TAB_BAR_HEIGHT + bottomInset,
      paddingBottom: bottomInset,
    },
  }
}

// Navigace se liší podle typu účtu (spec section 14): Hráč má 4 položky (vlastní kartička,
// dovednosti a statistiky jsou dostupné jen v kontextu vlastní karty), Trenér jen 2 - roster
// nemá vlastní kartičku, Dovednosti/Statistiky nejsou samostatné položky pro Trenéra.
export function MainTabs() {
  const accountType = useAuthStore((s) => s.accountType)
  // A coach who is also a parent gets a "Moje děti" tab too — but only if they actually have
  // linked children (#102). A pure Guardian account already routes to the guardian nav below.
  const hasChildren = useAuthStore((s) => s.user?.hasGuardianChildren ?? false)
  const screenOptions = useTabScreenOptions()

  // Guardian (rodič, #102): no own card and no club leaderboard (must not see other children) -
  // just their own children, each opening a read-only card that shows the child's club placement.
  if (accountType === 'Guardian') {
    return (
      <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen
          name="Children"
          component={ChildrenScreen}
          options={{ title: t('nav.children'), tabBarIcon: tabIcon('people-outline') }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{ title: t('nav.profile'), tabBarIcon: tabIcon('person-outline') }}
        />
      </Tab.Navigator>
    )
  }

  if (accountType === 'Coach') {
    return (
      <Tab.Navigator screenOptions={screenOptions}>
        <Tab.Screen
          name="Roster"
          component={RosterScreen}
          options={{ title: t('nav.roster'), tabBarIcon: tabIcon('people-outline') }}
        />
        <Tab.Screen
          name="Leaderboard"
          component={LeaderboardScreen}
          options={{ title: t('nav.leaderboard'), tabBarIcon: tabIcon('trophy-outline') }}
        />
        {hasChildren && (
          <Tab.Screen
            name="Children"
            component={ChildrenScreen}
            options={{ title: t('nav.children'), tabBarIcon: tabIcon('happy-outline') }}
          />
        )}
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
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{ title: t('nav.leaderboard'), tabBarIcon: tabIcon('trophy-outline') }}
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
