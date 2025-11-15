import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import { streamAPI } from './services/api'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import Header from './components/Layout/Header'
import Profile from './components/Profile/Profile'
import CreateStream from './components/Stream/CreateStream'
import backgroundImage from './background.png'
import StreamPage from './components/Stream/StreamPage'

function App() {
  const [streams, setStreams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const response = await streamAPI.getStreams({
          limit: 9,
          page: 1
        })
        setStreams(response.data.items || [])
      } catch (error) {
        console.error('Error fetching streams:', error)
        setStreams([])
      } finally {
        setLoading(false)
      }
    }

    fetchStreams()
  }, [])

  const getGradient = (index) => {
    const gradients = [
      'linear-gradient(45deg, #ff6b35, #ff8e53)',
      'linear-gradient(45deg, #9147ff, #772ce8)',
      'linear-gradient(45deg, #00ff7f, #00cc66)',
      'linear-gradient(45deg, #ff4757, #ff3742)',
      'linear-gradient(45deg, #00d2d3, #00a8a8)',
      'linear-gradient(45deg, #ff9ff3, #f368e0)',
      'linear-gradient(45deg, #ff3838, #ff0d0d)',
      'linear-gradient(45deg, #ff9f43, #ff7f00)',
      'linear-gradient(45deg, #54a0ff, #2e86de)'
    ]
    return gradients[index % gradients.length]
  }

  const getStreamEmoji = (title) => {
    if (!title) return '🎥'
    const lowerTitle = title.toLowerCase()
    if (lowerTitle.includes('музыка') || lowerTitle.includes('трек') || lowerTitle.includes('концерт') || lowerTitle.includes('акустика')) return '🎵'
    if (lowerTitle.includes('игра') || lowerTitle.includes('турнир') || lowerTitle.includes('cs2')) return '🎮'
    if (lowerTitle.includes('dota') || lowerTitle.includes('дота')) return '⚔️'
    if (lowerTitle.includes('minecraft') || lowerTitle.includes('майнкрафт')) return '⛏️'
    if (lowerTitle.includes('общение') || lowerTitle.includes('chat')) return '💬'
    if (lowerTitle.includes('valorant') || lowerTitle.includes('валорант')) return '🔫'
    if (lowerTitle.includes('рисование') || lowerTitle.includes('арт') || lowerTitle.includes('искусство')) return '🎨'
    if (lowerTitle.includes('путешествие') || lowerTitle.includes('irl')) return '🌍'
    return '🎥'
  }

  return (
    <AuthProvider>
      <Router>
        <div className="app" style={{ 
          background: `url(${backgroundImage}) center/cover fixed`,
          minHeight: '100vh', 
          color: 'white',
          fontFamily: 'Arial, sans-serif',
          paddingTop: '50px'
        }}>
          
          <Header />

          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/stream" element={<CreateStream />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/stream/:streamId" element={<StreamPage />} />
            <Route path="/" element={
              <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>🎥 Прямо сейчас в эфире</h1>
                  <p style={{ color: '#adadb8', fontSize: '18px' }}>
                    Присоединяйся к самым популярным стримам платформы
                  </p>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Загрузка стримов...</p>
                  </div>
                ) : streams.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ color: '#adadb8', fontSize: '18px' }}>
                      Пока нет активных стримов
                    </p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '20px',
                    marginBottom: '40px'
                  }}>
                    {streams.map((stream, index) => (
                      <Link 
                        key={stream.id}
                        to={`/stream/${stream.id}`}
                        style={{ textDecoration: 'none' }}
                      >
                        <div 
                          style={{
                            background: '#18181b',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: '1px solid #333',
                            transition: 'transform 0.2s',
                            cursor: 'pointer'
                          }} 
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                          <div style={{
                            background: getGradient(index),
                            height: '180px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '20px',
                            fontWeight: 'bold'
                          }}>
                            {getStreamEmoji(stream.title)} {stream.author?.username || 'Streamer'}
                          </div>
                          <div style={{ padding: '15px' }}>
                            <h3 style={{ margin: '0 0 10px 0', color: '#efeff1' }}>
                              {stream.title || 'Название стрима'}
                            </h3>
                            <p style={{ color: '#adadb8', marginBottom: '15px' }}>
                              {stream.author?.username || 'Streamer'}
                            </p>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#adadb8' }}>
                                👁️ {stream.viewers_count || 0}
                              </span>
                              <span style={{ 
                                background: stream.status === 'live' ? '#e91916' : '#666', 
                                color: 'white', 
                                padding: '2px 8px', 
                                borderRadius: '4px', 
                                fontSize: '12px' 
                              }}>
                                {stream.status === 'live' ? 'LIVE' : 'OFFLINE'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}

                <div style={{
                  background: 'linear-gradient(135deg, #18181b, #9147ff20)',
                  padding: '30px',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  textAlign: 'center'
                }}>
                  <h2 style={{ marginBottom: '15px' }}>
                    {localStorage.getItem('access_token') ? 'Начни своё вещание!' : 'Готов начать своё вещание?'}
                  </h2>
                  <p style={{ color: '#adadb8', marginBottom: '20px' }}>
                    Присоединяйся к сообществу стримеров и делись своим контентом с тысячами зрителей
                  </p>
                  <div>
                    <Link 
                      to="/stream" 
                      style={{ 
                        background: '#9147ff', 
                        color: 'white', 
                        padding: '12px 24px', 
                        borderRadius: '4px',
                        textDecoration: 'none',
                        marginRight: '15px',
                        fontSize: '16px',
                        display: 'inline-block'
                      }}
                    >
                      🎥 Начать стримить
                    </Link>
                    {!localStorage.getItem('access_token') && (
                      <Link 
                        to="/login"
                        style={{ 
                          color: '#9147ff', 
                          padding: '12px 24px', 
                          border: '1px solid #9147ff',
                          borderRadius: '4px',
                          textDecoration: 'none',
                          fontSize: '16px',
                          display: 'inline-block'
                        }}
                      >
                        Войти в аккаунт
                      </Link>
                    )}
                  </div>
                </div>

              </div>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App