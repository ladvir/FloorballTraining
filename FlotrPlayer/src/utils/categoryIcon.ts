import type { Ionicons } from '@expo/vector-icons'

type IoniconName = keyof typeof Ionicons.glyphMap

// design/images/12-icon-set.png maps each skill category to a line icon. Categories are DB
// rows with Czech names, so match by keyword (first hit wins - "pohyb bez"/"pohyb na" must
// be checked before the bare "míč" of "Práce s míčkem").
const RULES: [string, IoniconName][] = [
  ['zakonč', 'locate-outline'],
  ['pohyb bez', 'walk-outline'],
  ['pohyb na', 'compass-outline'],
  ['komunikace', 'chatbubbles-outline'],
  ['obran', 'shield-outline'],
  ['kondice', 'barbell-outline'],
  ['postoj', 'body-outline'],
  ['zákrok', 'hand-left-outline'],
  ['rozehráv', 'arrow-redo-outline'],
  ['míč', 'tennisball-outline'],
]

export const categoryIcon = (categoryName: string): IoniconName => {
  const name = categoryName.toLowerCase()
  for (const [needle, icon] of RULES) {
    if (name.includes(needle)) return icon
  }
  return 'apps-outline'
}
