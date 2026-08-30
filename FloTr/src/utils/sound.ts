// Tiny Web Audio helpers — no assets, no library. Same approach as the tournament match timer.
// One shared AudioContext; browsers keep it suspended until resumed from a user gesture, so call
// primeAudio() inside a click handler (e.g. the "Start live" button) before relying on sound.

let ctx: AudioContext | null = null

function getCtx(): AudioContext {
  if (!ctx) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    ctx = new Ctor()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/** Call from within a user gesture so later programmatic beeps are allowed to play. */
export function primeAudio(): void {
  try {
    getCtx()
  } catch {
    /* Web Audio unavailable — sound is best-effort only. */
  }
}

export function beep(freq = 880, durationSec = 0.15): void {
  try {
    const c = getCtx()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.3, c.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + durationSec)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start()
    osc.stop(c.currentTime + durationSec)
  } catch {
    /* ignore */
  }
}

/** Two quick rising notes — used when advancing to the next training part. */
export function chime(): void {
  beep(660, 0.12)
  setTimeout(() => beep(990, 0.16), 130)
}

/** Alternating siren — used once when the current part runs over its planned time. */
export function siren(durationSec = 1.6): void {
  try {
    const c = getCtx()
    const osc = c.createOscillator()
    const gain = c.createGain()
    osc.type = 'sawtooth'
    const now = c.currentTime
    const leg = 0.35
    for (let t = now; t < now + durationSec; t += 2 * leg) {
      osc.frequency.setValueAtTime(600, t)
      osc.frequency.linearRampToValueAtTime(1000, t + leg)
      osc.frequency.setValueAtTime(1000, t + leg)
      osc.frequency.linearRampToValueAtTime(600, t + 2 * leg)
    }
    gain.gain.setValueAtTime(0.25, now)
    gain.gain.linearRampToValueAtTime(0.001, now + durationSec)
    osc.connect(gain)
    gain.connect(c.destination)
    osc.start(now)
    osc.stop(now + durationSec)
  } catch {
    /* ignore */
  }
}
