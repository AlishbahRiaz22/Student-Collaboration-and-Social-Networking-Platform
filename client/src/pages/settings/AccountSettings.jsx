import { Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import SettingsLayout from './SettingsLayout'

const getCurrentUserId = (token) => {
  if (!token) return null

  try {
    return JSON.parse(atob(token.split('.')[1])).userId || null
  } catch {
    return null
  }
}

const AccountSettings = () => {
  const { user } = useAuth()
  const currentUserId = getCurrentUserId(user?.token)

  const sessionSummary = user?.token ? 'You are signed in on this device.' : 'No active session found.'

  return (
    <SettingsLayout
      title="Account"
      description="Keep track of the account identity linked to this session and the actions available to you."
    >
      <section className="settings-panel">
        <div className="settings-kv">
          <strong>Session status</strong>
          <span>{sessionSummary}</span>
        </div>
        <div className="settings-kv">
          <strong>Local identity</strong>
          <span>{currentUserId ? `User ID: ${currentUserId}` : 'Signed in user'}</span>
        </div>
        <div className="settings-kv">
          <strong>Token storage</strong>
          <span>Authentication is stored in localStorage for this browser profile.</span>
        </div>

        <div className="settings-actions" style={{ marginTop: '1rem' }}>
          <Link to="/feed" className="settings-btn settings-btn-primary">
            Back to feed
          </Link>
          <Link to={currentUserId ? `/profile/${currentUserId}` : '/feed'} className="settings-btn">
            Open profile
          </Link>
        </div>
      </section>
    </SettingsLayout>
  )
}

export default AccountSettings