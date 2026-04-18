import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/index'
import { useAuth } from '../context/useAuth'
import Avatar from '../components/Avatar'
import './Feed.css'
import './Profile.css'

const Explore = () => {
	const navigate = useNavigate()
	const { user } = useAuth()
	const [query, setQuery] = useState('')
	const [results, setResults] = useState([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')

	const currentUserId = useMemo(() => {
		const token = user?.token || localStorage.getItem('token')
		if (!token) return null

		try {
			return JSON.parse(atob(token.split('.')[1])).userId
		} catch {
			return null
		}
	}, [user?.token])

	useEffect(() => {
		const term = query.trim()

		if (!term) {
			setResults([])
			setError('')
			return
		}

		const timeout = setTimeout(async () => {
			try {
				setLoading(true)
				setError('')
				const res = await api.get('/users/search', { params: { q: term } })
				setResults(res.data)
			} catch (err) {
				setError(err.response?.data?.error || 'Failed to search users')
			} finally {
				setLoading(false)
			}
		}, 250)

		return () => clearTimeout(timeout)
	}, [query])

	return (
		<div className="feed-page">
			<nav className="feed-nav">
				<div className="feed-nav-left">
					<span className="feed-logo">StudentNet</span>
					<Link to="/feed" className="nav-link">Feed</Link>
					<Link to="/societies" className="nav-link">Societies</Link>
					<Link to="/messages" className="nav-link">Messages</Link>
					<Link to="/settings" className="nav-link">Settings</Link>
				</div>
				<div className="feed-nav-right">
					<button onClick={() => navigate(`/profile/${currentUserId}`)} disabled={!currentUserId} className="nav-btn">
						Profile
					</button>
				</div>
			</nav>

			<div className="feed-container">
				<div className="profile-card">
					<h2 className="profile-title">Search users</h2>
					<p className="profile-login-hint" style={{ marginBottom: '0.85rem' }}>
						Find classmates by name or username, then open their profile.
					</p>

					<input
						type="text"
						value={query}
						onChange={(event) => setQuery(event.target.value)}
						placeholder="Search by name or username..."
						className="profile-input"
					/>

					{error && <p className="profile-error" style={{ marginTop: '0.75rem' }}>{error}</p>}
					{loading && <div className="feed-status" style={{ marginTop: '0.75rem' }}>Searching...</div>}

					{!loading && query.trim() && results.length === 0 && !error && (
						<div className="feed-status" style={{ marginTop: '0.75rem' }}>No users found.</div>
					)}

					<div style={{ display: 'grid', gap: '0.75rem', marginTop: '0.9rem' }}>
						{results.map((person) => (
							<div key={person._id} className="suggestion-tile" style={{ maxWidth: 'none' }}>
								<div className="suggestion-info" style={{ marginBottom: '0.75rem' }}>
									<Avatar src={person.avatar} name={person.name || person.username} size={48} className="suggestion-avatar" />
									<div className="suggestion-name">{person.name || 'Student'}</div>
									<div className="suggestion-username">@{person.username}</div>
								</div>
								<div className="suggestion-actions">
									<button className="suggestion-btn suggestion-btn-view" onClick={() => navigate(`/profile/${person._id}`)}>
										View Profile
									</button>
									<button className="suggestion-btn suggestion-btn-follow" onClick={() => navigate(`/messages/${person._id}`)}>
										Message
									</button>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}

export default Explore