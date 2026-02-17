import { useState, useEffect } from 'react'

export type ModelType = 'minimax-m2.5-free' | 'kimi-k2.5-free'

export interface Settings {
  model: ModelType
  imageGenerations: boolean
  thinking: boolean
}

const DEFAULT_SETTINGS: Settings = {
  model: 'minimax-m2.5-free',
  imageGenerations: false,
  thinking: false,
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('v0-settings')
      if (saved) {
        const parsed = JSON.parse(saved)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error)
    }
  }, [])

  const updateSettings = (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings }
    setSettings(updated)

    try {
      localStorage.setItem('v0-settings', JSON.stringify(updated))
    } catch (error) {
      console.warn('Failed to save settings to localStorage:', error)
    }
  }

  return {
    settings,
    updateSettings,
  }
}
