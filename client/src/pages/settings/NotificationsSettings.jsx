import { useEffect, useState } from 'react'
import SettingsLayout from './SettingsLayout'

const STORAGE_KEY = 'studentnet-settings-notifications'

const defaultNotifications = {
  directMessages: true,
  mentions: true,
  weeklyDigest: false,
  browserAlerts: true
}

const readNotifications = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? { ...defaultNotifications, ...JSON.parse(saved) } : defaultNotifications
  } catch {
    return defaultNotifications
  }
}

const NotificationsSettings = () => {
  const [settings, setSettings] = useState(readNotifications)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    setSaved(true)

    const timeout = window.setTimeout(() => setSaved(false), 1200)
    return () => window.clearTimeout(timeout)
  }, [settings])

  const toggleSetting = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <SettingsLayout
      title="Notifications"
      description="Control how noisy the app should be when people message, mention, or interact with you."
    >
      <section className="settings-panel">
        {saved && <p className="settings-status">Saved locally</p>}

        <div className="settings-toggle-row">
          <div className="settings-toggle-copy">
            <strong className="settings-toggle-label">Direct messages</strong>
            <span>Show alerts when someone starts or updates a conversation with you.</span>
          </div>
          <button
            type="button"
            className={`settings-switch ${settings.directMessages ? 'is-on' : ''}`}
            aria-pressed={settings.directMessages}
            onClick={() => toggleSetting('directMessages')}
          />
        </div>

        <div className="settings-toggle-row">
          <div className="settings-toggle-copy">
            <strong className="settings-toggle-label">Mentions</strong>
            <span>Get notified when classmates mention your name in posts or comments.</span>
          </div>
          <button
            type="button"
            className={`settings-switch ${settings.mentions ? 'is-on' : ''}`}
            aria-pressed={settings.mentions}
            onClick={() => toggleSetting('mentions')}
          />
        </div>

        <div className="settings-toggle-row">
          <div className="settings-toggle-copy">
            <strong className="settings-toggle-label">Weekly digest</strong>
            <span>Receive a summary of activity instead of every single event.</span>
          </div>
          <button
            type="button"
            className={`settings-switch ${settings.weeklyDigest ? 'is-on' : ''}`}
            aria-pressed={settings.weeklyDigest}
            onClick={() => toggleSetting('weeklyDigest')}
          />
        </div>

        <div className="settings-toggle-row">
          <div className="settings-toggle-copy">
            <strong className="settings-toggle-label">Browser alerts</strong>
            <span>Keep desktop/browser notifications enabled for live collaboration.</span>
          </div>
          <button
            type="button"
            className={`settings-switch ${settings.browserAlerts ? 'is-on' : ''}`}
            aria-pressed={settings.browserAlerts}
            onClick={() => toggleSetting('browserAlerts')}
          />
        </div>
      </section>
    </SettingsLayout>
  )
}

export default NotificationsSettings