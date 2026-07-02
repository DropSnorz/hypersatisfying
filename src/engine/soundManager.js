/**
 * Web Audio SFX with zero asset files: short satisfying blips are
 * synthesized on the fly (oscillator + envelope), so rapid-fire pops
 * never cut off and the repo stays asset-light.
 */

let ctx = null
let muted = false

function audioCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function setMuted(value) {
  muted = value
}

function tone({ freq = 440, endFreq, duration = 0.12, type = 'sine', volume = 0.25, delay = 0 }) {
  if (muted) return
  const ac = audioCtx()
  const t0 = ac.currentTime + delay
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t0)
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + duration)
  gain.gain.setValueAtTime(volume, t0)
  gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration)
  osc.connect(gain).connect(ac.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.05)
}

/** Named SFX palette — every juice moment maps to one of these. */
export const sfx = {
  pop(pitchScale = 1) {
    tone({ freq: 520 * pitchScale, endFreq: 880 * pitchScale, duration: 0.08, type: 'square', volume: 0.12 })
  },
  chime(step = 0) {
    // rising pentatonic steps for combos/sequences
    const scale = [523, 587, 659, 784, 880, 1047, 1175, 1319]
    tone({ freq: scale[Math.min(step, scale.length - 1)], duration: 0.18, type: 'sine', volume: 0.2 })
  },
  coin() {
    tone({ freq: 988, duration: 0.06, type: 'square', volume: 0.1 })
    tone({ freq: 1319, duration: 0.15, type: 'square', volume: 0.1, delay: 0.06 })
  },
  whoosh() {
    tone({ freq: 220, endFreq: 60, duration: 0.25, type: 'sawtooth', volume: 0.08 })
  },
  thud() {
    tone({ freq: 110, endFreq: 45, duration: 0.2, type: 'triangle', volume: 0.3 })
  },
  fanfare() {
    tone({ freq: 523, duration: 0.15, volume: 0.2 })
    tone({ freq: 659, duration: 0.15, volume: 0.2, delay: 0.12 })
    tone({ freq: 784, duration: 0.3, volume: 0.25, delay: 0.24 })
    tone({ freq: 1047, duration: 0.5, volume: 0.25, delay: 0.36 })
  },
  error() {
    tone({ freq: 200, endFreq: 130, duration: 0.2, type: 'sawtooth', volume: 0.15 })
  },
}
