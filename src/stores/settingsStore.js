import { defineStore } from 'pinia'
import { setMuted } from '../engine/soundManager'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    soundOn: true,
    reducedMotion: false,
  }),

  actions: {
    toggleSound() {
      this.soundOn = !this.soundOn
      setMuted(!this.soundOn)
    },
    /** Re-apply persisted settings to non-reactive systems on boot */
    applyToEngine() {
      setMuted(!this.soundOn)
    },
  },

  persist: true,
})
