import { useEffect, useState } from 'react'
import SettingsLayout from './SettingsLayout'

const STORAGE_KEY = 'studentnet-settings-appearance'

const defaultAppearance = {
  theme: 'system',
  compactConversations: false,
  reduceMotion: false
}

const readAppearance = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? { ...defaultAppearance, ...JSON.parse(saved) } : defaultAppearance
  } catch {
    return defaultAppearance
  }
}

const applyThemeHint = (theme) => {
  document.documentElement.setAttribute('data-studentnet-theme', theme)
}

const AppearanceSettings = () => {
  const [settings, setSettings] = useState(readAppearance)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    applyThemeHint(settings.theme)
    setSaved(true)

    const timeout = window.setTimeout(() => setSaved(false), 1200)
    return () => window.clearTimeout(timeout)
  }, [settings])

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <SettingsLayout
      title="Appearance"
      description="Make the interface easier to scan and more comfortable to use during long study sessions."
    >
      <section className="settings-panel">
        {saved && <p className="settings-status">Saved locally</p>}

        <div className="settings-field">
          <label htmlFor="theme-select">Theme preference</label>
          <select
            id="theme-select"
            value={settings.theme}
            onChange={(event) => setSettings((prev) => ({ ...prev, theme: event.target.value }))}
            className="settings-select"
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div className="settings-toggle-row">
          <div className="settings-toggle-copy">
            <strong className="settings-toggle-label">Compact conversations</strong>
            <span>Reduce message spacing so long threads fit more information on screen.</span>
          </div>
          <button
            type="button"
            className={`settings-switch ${settings.compactConversations ? 'is-on' : ''}`}
            aria-pressed={settings.compactConversations}
            onClick={() => toggleSetting('compactConversations')}
          />
        </div>

        <div className="settings-toggle-row">
          <div className="settings-toggle-copy">
            <strong className="settings-toggle-label">Reduce motion</strong>
            <span>Keep the interface calm by limiting animated transitions.</span>
          </div>
          <button
            type="button"
            className={`settings-switch ${settings.reduceMotion ? 'is-on' : ''}`}
            aria-pressed={settings.reduceMotion}
            onClick={() => toggleSetting('reduceMotion')}
          />
        </div>
      </section>
    </SettingsLayout>
  )
}

export default AppearanceSettings