import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio'
import * as Haptics from 'expo-haptics'

// Signalling for the live training runner: a short beep + a haptic. Both are best-effort — a
// gym phone on silent still buzzes, and if audio init fails the runner keeps working.

let player: AudioPlayer | null = null

function getPlayer(): AudioPlayer | null {
  try {
    if (!player) {
      // Coaches often keep the phone on silent in the hall — still let the beep through.
      void setAudioModeAsync({ playsInSilentMode: true })
      player = createAudioPlayer(require('../../assets/beep.wav'))
      player.volume = 1
    }
    return player
  } catch {
    return null
  }
}

function blip(p: AudioPlayer) {
  try {
    void p.seekTo(0)
    p.play()
  } catch {
    /* ignore */
  }
}

/** Rising two-beep + success haptic — advancing to the next training part. */
export function signalNextPart(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
  const p = getPlayer()
  if (!p) return
  blip(p)
  setTimeout(() => blip(p), 200)
}

/** Single beep + warning haptic — the current part has run over its planned time. */
export function signalOverrun(): void {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
  const p = getPlayer()
  if (p) blip(p)
}
