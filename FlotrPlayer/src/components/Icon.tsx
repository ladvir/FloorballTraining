import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, View } from 'react-native'
import { colors, glass, radius } from '../theme/tokens'

interface IconProps {
  name: keyof typeof Ionicons.glyphMap
  size?: number
  color?: string
}

// Thin wrapper over Ionicons (design/images/12-icon-set.png's line-icon style, vector instead of
// the raster mockup tiles - see plan Fáze 0) with the app's default size/color, so every emoji/
// text glyph (🏠🎯📊👤, ‹ › ✕ ✎) becomes one consistent icon family.
export function Icon({ name, size = 22, color = colors.textPrimary }: IconProps) {
  return <Ionicons name={name} size={size} color={color} />
}

interface IconTileProps extends IconProps {
  /** Outer glass tile size - the icon itself stays proportional via `size`. */
  tileSize?: number
}

// Glass tile behind an icon (design/images/12-icon-set.png's glowing square chips) - used for
// skill-category icons and onboarding illustrations instead of separate raster art per Fáze 0.
export function IconTile({ name, size = 28, color = colors.accent, tileSize = 56 }: IconTileProps) {
  return (
    <View
      style={[
        styles.tile,
        { width: tileSize, height: tileSize, borderRadius: radius.lg, shadowColor: color },
      ]}
    >
      <Icon name={name} size={size} color={color} />
    </View>
  )
}

const styles = StyleSheet.create({
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: glass.fill,
    borderWidth: 1,
    borderColor: glass.border,
    shadowOpacity: 0.5,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
})
