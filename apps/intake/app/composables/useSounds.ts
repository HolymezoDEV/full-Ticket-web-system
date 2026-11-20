import { createSharedComposable, useLocalStorage } from '@vueuse/core'

export type SoundName = 'message' | 'ticket' | 'send'

// Each sound is a few short sine notes: [frequency in Hz, start offset in s, duration in s].
const SOUNDS: Record<SoundName, [number, number, number][]> = {
  // Incoming message: soft two-note chime.
  message: [[880, 0, 0.18], [1318.5, 0.09, 0.28]],
  // New ticket: three rising notes.
  ticket: [[659.3, 0, 0.16], [880, 0.1, 0.16], [1174.7, 0.2, 0.3]],
  // Own message sent: short upward blip.
  send: [[740, 0, 0.09], [1108.7, 0.05, 0.12]]
}

/**
 * Small notification sounds generated with Web Audio (no audio files).
 * Browsers only allow audio after the first click or key press on the page.
 */
const _useSounds = () => {
  const enabled = useLocalStorage('mezohelpdesk-sounds', true)
  let context: AudioContext | undefined

  function play(name: SoundName) {
    if (!enabled.value || import.meta.server) return
    try {
      context ??= new AudioContext()
      if (context.state === 'suspended') context.resume().catch(() => {})
      const now = context.currentTime
      for (const [frequency, offset, duration] of SOUNDS[name]) {
        const oscillator = context.createOscillator()
        const gain = context.createGain()
        oscillator.type = 'sine'
        oscillator.frequency.value = frequency
        gain.gain.setValueAtTime(0, now + offset)
        gain.gain.linearRampToValueAtTime(0.07, now + offset + 0.012)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + duration)
        oscillator.connect(gain).connect(context.destination)
        oscillator.start(now + offset)
        oscillator.stop(now + offset + duration + 0.02)
      }
    } catch {
      // Audio is optional; ignore browsers without Web Audio.
    }
  }

  const toggle = () => {
    enabled.value = !enabled.value
    if (enabled.value) play('message')
  }

  return { enabled, play, toggle }
}

export const useSounds = createSharedComposable(_useSounds)

/** Enter sends, Shift+Enter adds a line break (IME composition is left alone). */
export function sendOnEnter(send: () => void) {
  return (event: KeyboardEvent) => {
    if (event.key !== 'Enter' || event.shiftKey || event.isComposing) return
    event.preventDefault()
    send()
  }
}
