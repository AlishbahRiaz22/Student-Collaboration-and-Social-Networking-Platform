import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import CreatePostForm from '../components/CreatePostForm'
import Avatar from '../components/Avatar'
import PostCard from '../components/PostCard'
import api from '../api/index'
import './Feed.css'

const Key = ({ letter, color, style }) => (
  <div style={{
    position: 'absolute', width: 68, height: 68, borderRadius: 16,
    background: color, border: '3.5px solid #111', boxShadow: '4px 4px 0 #111',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
    fontSize: '2rem', color: '#111', animation: 'floatKey 3s ease-in-out infinite',
    userSelect: 'none', pointerEvents: 'none', ...style,
  }}>
    {letter}
  </div>
)

const Feed = () => {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const carouselRef = useRef(null)

  const currentUserId = useMemo(() => {
    const token = user?.token || localStorage.getItem('token')
    if (!token) return null
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      return payload.userId || null
    } catch { return null }
  }, [user])

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedMode, setFeedMode] = useState('all')
  const [suggestedUsers, setSuggestedUsers] = useState([])
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true); setError('')
      const url = feedMode === 'smart' ? '/posts/feed' : '/posts'
      const res = await api.get(url)
      setPosts(res.data)
    } catch { setError('Failed to load posts') }
    finally { setLoading(false) }
  }, [feedMode])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const fetchSuggestions = useCallback(async () => {
    if (!currentUserId) return
    try {
      setSuggestionsLoading(true)
      const res = await api.get('/users/suggestions')
      setSuggestedUsers(res.data.filter(p => p._id !== currentUserId && !p.isFollowing))
    } catch { setSuggestedUsers([]) }
    finally { setSuggestionsLoading(false) }
  }, [currentUserId])

  useEffect(() => { fetchSuggestions() }, [fetchSuggestions])

  const handleFollowSuggestion = async (userId) => {
    const old = suggestedUsers
    setSuggestedUsers(prev => prev.map(u => u._id === userId ? { ...u, isFollowing: true } : u))
    try {
      await api.put(`/users/${userId}/follow`)
      if (feedMode === 'smart') fetchPosts()
    } catch { setSuggestedUsers(old) }
  }

  // ── inline styles ──
  const s = {
    page: {
      minHeight: '100vh', background: '#eef3e2',
      backgroundImage: 'linear-gradient(#c8d8a0 1px,transparent 1px),linear-gradient(90deg,#c8d8a0 1px,transparent 1px)',
      backgroundSize: '24px 24px', display: 'flex', flexDirection: 'column',
      fontFamily: "'Nunito', sans-serif",
    },
    nav: {
      background: '#d4e6a5', borderBottom: '2.5px solid #b5cc7a',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 36px', height: 60, flexShrink: 0,
    },
    navLeft: { display: 'flex', alignItems: 'center', gap: 4 },
    logo: {
      fontFamily: "'Playfair Display', Georgia, serif", fontWeight: 900,
      fontSize: '1.35rem', color: '#1a4a1a', display: 'flex',
      alignItems: 'center', gap: 8, textDecoration: 'none', marginRight: 14,
    },
    navA: {
      textDecoration: 'none', fontWeight: 700, fontSize: '0.92rem',
      color: '#1a4a1a', padding: '6px 14px', fontFamily: "'Nunito', sans-serif",
    },
    navRight: { display: 'flex', alignItems: 'center', gap: 8 },
    btnOutline: {
      fontWeight: 700, fontSize: '0.88rem', color: '#1a4a1a',
      padding: '7px 18px', border: '2px solid #1a4a1a', borderRadius: 999,
      fontFamily: "'Nunito', sans-serif", background: 'none', cursor: 'pointer',
    },
    btnFill: {
      fontWeight: 700, fontSize: '0.88rem', color: '#fff',
      padding: '8px 20px', background: '#1a4a1a', border: 'none',
      borderRadius: 999, fontFamily: "'Nunito', sans-serif", cursor: 'pointer',
    },
    body: {
      flex: 1, display: 'flex', justifyContent: 'center',
      padding: '40px 20px', position: 'relative',
    },
    center: { width: '100%', maxWidth: 700, zIndex: 5 },

    // Suggestions carousel
    sugCard: {
      background: '#f9faf4', borderRadius: 22, border: '2.5px solid #1a4a1a',
      borderTop: '7px solid #43a047', boxShadow: '0 6px 28px rgba(0,0,0,0.10)',
      padding: '20px 20px 16px', marginBottom: 22, overflow: 'hidden',
    },
    sugTitle: {
      fontFamily: "'Playfair Display', Georgia, serif",
      fontWeight: 900, fontSize: '1.05rem', color: '#1a4a1a', marginBottom: 2,
    },
    sugSub: { fontSize: '0.8rem', color: '#6a8f4a', fontWeight: 700, marginBottom: 14 },
    carouselWrap: { overflow: 'hidden' },
    carouselTrack: {
      display: 'flex', gap: 14,
      animation: 'scrollCarousel 22s linear infinite',
      width: 'max-content',
    },
    tile: {
      background: 'linear-gradient(145deg, #f0f7e8, #e8f5d0)',
      border: '2px solid #6abf4b', borderRadius: 18,
      padding: '16px 14px 12px', width: 136, flexShrink: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      cursor: 'pointer', transition: 'transform 0.2s',
    },
    tileAvatar: {
      width: 52, height: 52, borderRadius: '50%', border: '3px solid #43a047',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 900, fontSize: '1.1rem', color: '#fff',
    },
    tileName: { fontWeight: 800, fontSize: '0.82rem', color: '#1a4a1a', textAlign: 'center' },
    tileUser: { fontSize: '0.72rem', color: '#6a8f4a', fontWeight: 700 },
    tileBtns: { display: 'flex', gap: 6, marginTop: 4 },
    followBtn: {
      background: '#1a4a1a', color: '#fff', border: 'none', borderRadius: 999,
      padding: '5px 12px', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer',
    },
    viewBtn: {
      background: 'none', color: '#1a4a1a', border: '1.5px solid #1a4a1a',
      borderRadius: 999, padding: '4px 10px', fontSize: '0.72rem',
      fontWeight: 800, cursor: 'pointer',
    },
    footer: {
      textAlign: 'center', padding: 18, fontSize: '0.82rem',
      color: '#2e7d32', fontWeight: 700,
    },
  }

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet" />

      <style>{`
        @keyframes floatKey {
          0%,100% { transform: translateY(0) rotate(var(--rot,0deg)); }
          50% { transform: translateY(-7px) rotate(var(--rot,0deg)); }
        }
        @keyframes scrollCarousel {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .carousel-track:hover { animation-play-state: paused !important; }
        .sug-tile:hover { transform: translateY(-4px); border-color: #1a4a1a !important; }
      `}</style>

      <div style={s.page}>
        {/* ── NAV (matches Register style) ── */}
        <nav style={s.nav}>
          <div style={s.navLeft}>
            <Link to="/" style={s.logo}>★ UNIVERSE</Link>
            <Link to="/Feed" style={s.navA}>Feed</Link>
            <Link to="/create-post" style={s.navA}>Create Post</Link>
            <Link to="/societies"   style={s.navA}>Societies</Link>
            <Link to="/explore"     style={s.navA}>Explore</Link>
            <Link to="/messages"    style={s.navA}>Messages</Link>
            <Link to="/settings"    style={s.navA}>Settings</Link>
            <Link to="/about"       style={s.navA}>About</Link>
            <Link to="/contact"     style={s.navA}>Contact</Link>
          </div>
          <div style={s.navRight}>
            <button style={s.btnOutline} onClick={() => navigate(`/profile/${currentUserId}`)}>
              Profile
            </button>
            <button style={s.btnFill} onClick={() => { logout(); navigate('/login', { replace: true }) }}>
              Logout
            </button>
          </div>
        </nav>

        {/* ── BODY ── */}
        <div style={s.body}>
          {/* Floating keys */}
          <Key letter="M" color="#f4845f" style={{ left:'4%', top:'12%', '--rot':'-10deg' }} />
          <Key letter="Y" color="#f6c94e" style={{ left:'7%', top:'38%', '--rot':'8deg', animationDelay:'0.4s' }} />
          <Key letter="F" color="#e85b5b" style={{ right:'5%', top:'10%', '--rot':'10deg', animationDelay:'0.6s' }} />
          <Key letter="E" color="#49c4a0" style={{ right:'8%', top:'30%', '--rot':'-8deg', animationDelay:'1s' }} />
          <Key letter="E" color="#b16ae8" style={{ right:'4%', top:'52%', '--rot':'6deg', animationDelay:'0.3s' }} />
          <Key letter="D" color="#5b9af5" style={{ right:'7%', top:'74%', '--rot':'-12deg', animationDelay:'0.9s' }} />

          <div style={s.center}>
            {/* Feed toggle */}
            <div style={{ display:'flex', background:'#f9faf4', border:'2.5px solid #1a4a1a', borderRadius:18, padding:6, marginBottom:24 }}>
              {['all','smart'].map(mode => (
                <button key={mode} onClick={() => setFeedMode(mode)} style={{
                  flex:1, padding:12, borderRadius:14, border:'none', fontWeight:800,
                  fontFamily:"'Nunito', sans-serif", fontSize:'0.9rem', cursor:'pointer',
                  background: feedMode === mode ? '#1a4a1a' : 'transparent',
                  color: feedMode === mode ? '#fff' : '#1a4a1a',
                  transition: 'all 0.2s',
                }}>
                  {mode === 'all' ? 'All Posts' : 'My Feed'}
                </button>
              ))}
            </div>

            {currentUserId && <CreatePostForm onPostCreated={fetchPosts} />}

            {/* ── SUGGESTIONS CAROUSEL ── */}
            {currentUserId && (
              <div style={s.sugCard}>
                <div style={s.sugTitle}>👥 Suggested People</div>
                <div style={s.sugSub}>Discover classmates to follow</div>

                {suggestionsLoading && <p style={{ color:'#6a8f4a', fontWeight:700, fontSize:'0.85rem' }}>Loading suggestions…</p>}

                {!suggestionsLoading && suggestedUsers.length > 0 && (
                  <div style={s.carouselWrap}>
                    {/* Duplicate list for seamless infinite scroll */}
                    <div className="carousel-track" style={s.carouselTrack} ref={carouselRef}>
                      {[...suggestedUsers, ...suggestedUsers].map((person, i) => (
                        <div key={`${person._id}-${i}`} className="sug-tile" style={s.tile}>
                          <Avatar src={person.avatar} name={person.name || person.username} size={52}
                            style={{ border:'3px solid #43a047', borderRadius:'50%' }} />
                          <div style={s.tileName}>{person.name}</div>
                          <div style={s.tileUser}>@{person.username}</div>
                          {person.department && (
                            <div style={{ fontSize:'0.68rem', color:'#6a8f4a', fontWeight:700, background:'#e8f5d0', borderRadius:999, padding:'2px 8px' }}>
                              {person.department}
                            </div>
                          )}
                          <div style={s.tileBtns}>
                            <button style={person.isFollowing
                              ? { ...s.followBtn, background:'#43a047' }
                              : s.followBtn}
                              onClick={() => handleFollowSuggestion(person._id)}>
                              {person.isFollowing ? '✓ Following' : 'Follow'}
                            </button>
                            <button style={s.viewBtn} onClick={() => navigate(`/profile/${person._id}`)}>
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {loading && <div style={{ textAlign:'center', color:'#6a8f4a', fontWeight:700, padding:20 }}>Loading posts…</div>}
            {error   && <div style={{ background:'#ffeef0', border:'1.5px solid #f48fb1', borderRadius:12, padding:'12px 16px', color:'#c62828', fontWeight:700 }}>{error}</div>}

            {posts.map(post => (
              <PostCard key={post._id} post={post} currentUserId={currentUserId}
                onDelete={id => setPosts(prev => prev.filter(p => p._id !== id))}
                onUpdate={updated => setPosts(prev => prev.map(p => p._id === updated._id ? updated : p))}
              />
            ))}
          </div>
        </div>

        <footer style={s.footer}>✦ UNIVERSE — made with ♥ ✦</footer>
      </div>
    </>
  )
}

export default Feed