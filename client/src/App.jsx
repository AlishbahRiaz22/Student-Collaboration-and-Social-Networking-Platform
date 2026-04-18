import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './utils/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Feed from './pages/Feed'
import Profile from './pages/Profile'
import Explore from './pages/Explore'
import CreatePostPage from './pages/CreatePost'
import MessagesInbox from './pages/MessagesInbox'
import Messages from './pages/Messages'
import PostDetail from './pages/PostDetail'
import SettingsHome from './pages/settings/SettingsHome'
import AccountSettings from './pages/settings/AccountSettings'
import NotificationsSettings from './pages/settings/NotificationsSettings'
import PrivacySettings from './pages/settings/PrivacySettings'
import AppearanceSettings from './pages/settings/AppearanceSettings'
import SocietiesHome from './pages/societies/SocietiesHome'
import SocietyCreate from './pages/societies/SocietyCreate'
import SocietyDetail from './pages/societies/SocietyDetail'
import SocietyManage from './pages/societies/SocietyManage'
import NotFound from './pages/NotFound'
import './index.css'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/feed" element={<ProtectedRoute><Feed /></ProtectedRoute>} />
          <Route path="/create-post" element={<ProtectedRoute><CreatePostPage /></ProtectedRoute>} />
          <Route path="/post/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
          <Route path="/posts/:id" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/u/:username" element={<Profile />} />
          <Route path="/messages" element={<ProtectedRoute><MessagesInbox /></ProtectedRoute>} />
          <Route path="/messages/:userId" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
          <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
          <Route path="/societies" element={<ProtectedRoute><SocietiesHome /></ProtectedRoute>} />
          <Route path="/societies/new" element={<ProtectedRoute><SocietyCreate /></ProtectedRoute>} />
          <Route path="/societies/:identifier" element={<ProtectedRoute><SocietyDetail /></ProtectedRoute>} />
          <Route path="/societies/:identifier/manage" element={<ProtectedRoute><SocietyManage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsHome /></ProtectedRoute>} />
          <Route path="/settings/account" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
          <Route path="/settings/notifications" element={<ProtectedRoute><NotificationsSettings /></ProtectedRoute>} />
          <Route path="/settings/privacy" element={<ProtectedRoute><PrivacySettings /></ProtectedRoute>} />
          <Route path="/settings/appearance" element={<ProtectedRoute><AppearanceSettings /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App