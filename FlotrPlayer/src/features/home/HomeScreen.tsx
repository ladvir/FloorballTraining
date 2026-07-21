import { StyleSheet, Text, View } from 'react-native'
import { useAuthStore } from '../../store/authStore'

export function HomeScreen() {
  const user = useAuthStore((s) => s.user)

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Vítej, {user?.firstName ?? 'hráči'}!</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 20, fontWeight: '600' },
})
