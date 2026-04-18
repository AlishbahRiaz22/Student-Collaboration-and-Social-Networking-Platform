import { useEffect, useState } from 'react'
import SettingsLayout from './SettingsLayout'

const STORAGE_KEY = 'studentnet-settings-privacy'

const defaultPrivacy = {
  profileVisible: true,
  allowMessages: true,
  showOnlineStatus: true,
  searchableByEmail: false
}

const readPrivacy = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? { ...defaultPrivacy, ...JSON.parse(saved) } : defaultPrivacy
  } catch {
    return defaultPrivacy
  }
}

const PrivacySettings = () => {
  const [settings, setSettings] = useState(readPrivacy)
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
      title="Privacy"
      description="Set the boundaries that make sense for a campus-facing social network."
    >
      <section className="settings-panel">
        {saved && <p className="settings-status">Saved locally</p>}

        <div className="settings-toggle-row">
          <div className="settings-toggle-copy">
            <strong className="settings-toggle-label">Public profile</strong>
            <span>Allow other users to open and view your profile page.</span>
          </div>
          <button
            type="button"
            className={`settings-switch ${settings.profileVisible ? 'is-on' : ''}`}
            aria-pressed={settings.profileVisible}
            onClick={() => toggleSetting('profileVisible')}
          />
        </div>

        <div className="settings-toggle-row">
          <div className="settings-toggle-copy">
            <strong className="settings-toggle-label">Direct messages</strong>
            <span>Let classmates start private conversations with you.</span>
          </div>
          <button
            type="button"
            className={`settings-switch ${settings.allowMessages ? 'is-on' : ''}`}
            aria-pressed={settings.allowMessages}
            onClick={() => toggleSetting('allowMessages')}
          />
        </div>

        <div className="settings-toggle-row">
          <div className="settings-toggle-copy">
            <strong className="settings-toggle-label">Online status</strong>
            <span>Show when you are active in the app.</span>
          </div>
          <button
            type="button"
            className={`settings-switch ${settings.showOnlineStatus ? 'is-on' : ''}`}
            aria-pressed={settings.showOnlineStatus}
            onClick={() => toggleSetting('showOnlineStatus')}
          />
        </div>

        <div className="settings-toggle-row">
          <div className="settings-toggle-copy">
            <strong className="settings-toggle-label">Searchable by email</strong>
            <span>Let people discover you using the email address on your account.</span>
          </div>
          <button
            type="button"
            className={`settings-switch ${settings.searchableByEmail ? 'is-on' : ''}`}
            aria-pressed={settings.searchableByEmail}
            onClick={() => toggleSetting('searchableByEmail')}
          />
        </div>
      </section>
    </SettingsLayout>
  )
}

export default PrivacySettings