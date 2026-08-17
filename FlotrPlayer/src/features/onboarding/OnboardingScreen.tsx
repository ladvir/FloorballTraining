import { useRef, useState } from 'react'
import type { Ionicons } from '@expo/vector-icons'
import { Dimensions, NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Button } from '../../components/Button'
import { IconTile } from '../../components/Icon'
import { LogoMark } from '../../components/LogoMark'
import { Screen } from '../../components/Screen'
import { t } from '../../i18n/strings'
import { colors, spacing, typography } from '../../theme/tokens'
import { setSeenOnboarding } from '../../utils/onboarding'

const SLIDE_WIDTH = Dimensions.get('window').width

const SLIDES: { icon: keyof typeof Ionicons.glyphMap; titleKey: 'onboarding.slide1Title' | 'onboarding.slide2Title' | 'onboarding.slide3Title'; bodyKey: 'onboarding.slide1Body' | 'onboarding.slide2Body' | 'onboarding.slide3Body' }[] = [
  { icon: 'trending-up-outline', titleKey: 'onboarding.slide1Title', bodyKey: 'onboarding.slide1Body' },
  { icon: 'analytics-outline', titleKey: 'onboarding.slide2Title', bodyKey: 'onboarding.slide2Body' },
  { icon: 'clipboard-outline', titleKey: 'onboarding.slide3Title', bodyKey: 'onboarding.slide3Body' },
]

// design/images/07-onboarding.png: 3 slides, pagination dots, "Začít" CTA on the last one.
// IconTile illustrations (vector) instead of the mockup's raster art per plan Fáze 0. Shown once,
// gated by utils/onboarding.ts.
//
// Swipe/scroll is supported but NEVER the only way through: a horizontal ScrollView's paging
// only responds to touch/trackpad gestures, not a plain mouse click-drag - relying on it alone
// left desktop-mouse users (and anyone who doesn't think to swipe) stuck on slide 1 with no way
// to reach Login. Every slide always has an explicit Next/Začít button, plus a Skip in the header.
export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const [index, setIndex] = useState(0)
  const scrollRef = useRef<ScrollView>(null)
  const isLast = index === SLIDES.length - 1

  const goToSlide = (next: number) => {
    setIndex(next)
    scrollRef.current?.scrollTo({ x: next * SLIDE_WIDTH, animated: true })
  }

  const handleScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIndex(Math.round(e.nativeEvent.contentOffset.x / SLIDE_WIDTH))
  }

  const finish = async () => {
    await setSeenOnboarding()
    onDone()
  }

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.headerBrand}>
          <LogoMark size={28} />
          <Text style={styles.wordmark}>{t('common.appName')}</Text>
        </View>
        {!isLast && (
          <Pressable onPress={finish} hitSlop={8}>
            <Text style={styles.skip}>{t('onboarding.skip')}</Text>
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        style={styles.pager}
        // Slides only grow to their content's height - without this they hug the top of the
        // pager instead of sitting vertically centered like mockup 07's hero layout.
        contentContainerStyle={styles.pagerContent}
      >
        {SLIDES.map((slide) => (
          <View key={slide.titleKey} style={[styles.slide, { width: SLIDE_WIDTH }]}>
            <View style={styles.heroGlow}>
              <IconTile name={slide.icon} tileSize={128} size={60} />
            </View>
            <Text style={styles.title}>{t(slide.titleKey)}</Text>
            <Text style={styles.body}>{t(slide.bodyKey)}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((slide, i) => (
            <Pressable key={slide.titleKey} onPress={() => goToSlide(i)} hitSlop={8}>
              <View style={[styles.dot, i === index && styles.dotActive]} />
            </Pressable>
          ))}
        </View>
        <View style={styles.ctaWrapper}>
          <Button
            title={isLast ? t('onboarding.start') : t('roster.next')}
            onPress={isLast ? finish : () => goToSlide(index + 1)}
          />
        </View>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  headerBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  wordmark: {
    color: colors.textPrimary,
    fontSize: typography.body.fontSize,
    fontWeight: '700',
  },
  skip: {
    color: colors.textSecondary,
    fontSize: typography.caption.fontSize + 1,
    fontWeight: '600',
  },
  pager: {
    flex: 1,
  },
  pagerContent: {
    alignItems: 'center',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xxxl,
    gap: spacing.xl,
  },
  // Mockup 07's neon hero: a strong accent glow around the icon tile.
  heroGlow: {
    borderRadius: 32,
    shadowColor: colors.accent,
    shadowOpacity: 0.9,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.title.fontSize,
    fontWeight: typography.title.fontWeight,
    textAlign: 'center',
  },
  body: {
    color: colors.textSecondary,
    fontSize: typography.body.fontSize - 1,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.xl,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  dotActive: {
    backgroundColor: colors.accent,
    width: 20,
  },
  ctaWrapper: {
    width: '100%',
  },
})
