import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { Button } from './Button'
import { t } from '../i18n/strings'
import { colors, spacing, typography } from '../theme/tokens'

// Etapa 12 (#90): the one shared look for async screen states. Every screen previously
// hand-rolled the same centered spinner / error-with-retry / empty-text trio with its own
// duplicated styles - these three replace all of them. `inline` is for blocks inside a
// scrolling page (no flex:1 to claim); the default fills the screen and centers.

export function LoadingState({ inline }: { inline?: boolean }) {
  return (
    <View style={inline ? styles.inline : styles.centered}>
      <ActivityIndicator color={colors.accent} size={inline ? 'small' : 'large'} />
    </View>
  )
}

interface ErrorStateProps {
  message: string
  /** Omit to hide the retry button (e.g. a 404 that retrying can never fix). */
  onRetry?: () => void
  retrying?: boolean
  inline?: boolean
}

export function ErrorState({ message, onRetry, retrying, inline }: ErrorStateProps) {
  return (
    <View style={inline ? styles.inline : styles.centered}>
      <Text style={styles.message}>{message}</Text>
      {onRetry && <Button variant="outline" title={t('common.retry')} onPress={onRetry} loading={retrying} />}
    </View>
  )
}

export function EmptyState({ message }: { message: string }) {
  return <Text style={styles.empty}>{message}</Text>
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xxl,
  },
  inline: {
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  message: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize,
    textAlign: 'center',
  },
  empty: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize - 1,
    textAlign: 'center',
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.xxl,
  },
})
