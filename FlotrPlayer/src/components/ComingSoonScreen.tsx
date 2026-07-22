import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/tokens'

// Etapa 7+ (#85-88) build these out; for #84 only the navigation entry needs to exist per
// spec section 14 - the screens themselves are placeholders, not "half-finished" features.
export function ComingSoonScreen({ message }: { message: string }) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  text: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
})
