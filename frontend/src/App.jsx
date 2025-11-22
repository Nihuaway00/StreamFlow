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
import veschanieBackground from './veschanie.png'
import PublicProfile from './components/Profile/PublicProfile'

function App() {
  const [streams, setStreams] = useState([])
  const [liveStreams, setLiveStreams] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStreams = async () => {
      try {
        console.log('🔄 Запрашиваем стримы...')
        
        // Получаем ВСЕ стримы без лимита для LIVE
        const response = await streamAPI.getStreams({
          limit: 50, // Увеличиваем лимит
          page: 1
        })
        
        console.log('📊 Все стримы:', response.data.items)
        setStreams(response.data.items || [])
        
        // Фильтруем только LIVE стримы
        const live = response.data.items.filter(stream => {
          const isLive = stream.status === 'live' || stream.status === 'LIVE'
          console.log(`Стрим "${stream.title}": статус="${stream.status}", isLive=${isLive}`)
          return isLive
        })
        
        console.log('🔴 Найдено LIVE стримов:', live.length)
        console.log('📺 LIVE стримы:', live)
        setLiveStreams(live)
        
      } catch (error) {
        console.error('Error fetching streams:', error)
        setStreams([])
        setLiveStreams([])
      } finally {
        setLoading(false)
      }
    }

    fetchStreams()

    // Обновляем каждые 5 секунд
    const interval = setInterval(fetchStreams, 5000)
    return () => clearInterval(interval)
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

  // Показываем только первые 27 стримов в общем списке
  const displayedStreams = streams.slice(0, 27)

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
            <Route path="/user/:userId" element={<PublicProfile />} />
            <Route path="/stream/:streamId" element={<StreamPage />} />
            <Route path="/" element={
              <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                
                {/* БЛОК С АКТИВНЫМИ СТРИМАМИ */}
                {liveStreams.length > 0 && (
                  <div style={{ marginBottom: '40px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                      <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>🔴 Прямо сейчас в эфире</h1>
                      <p style={{ color: '#adadb8', fontSize: '18px' }}>
                        Присоединяйтесь к живым трансляциям
                      </p>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                      gap: '20px',
                      marginBottom: '30px'
                    }}>
                      {liveStreams.map((stream, index) => (
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
                              border: '2px solid #e91916',
                              transition: 'transform 0.2s',
                              cursor: 'pointer',
                              position: 'relative'
                            }} 
                            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            {/* Бейдж LIVE */}
                            <div style={{
                              position: 'absolute',
                              top: '10px',
                              left: '10px',
                              background: '#e91916',
                              color: 'white',
                              padding: '5px 10px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              zIndex: 2
                            }}>
                              🔴 LIVE
                            </div>

                            <div style={{
                              background: getGradient(index),
                              height: '200px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontSize: '24px',
                              fontWeight: 'bold',
                              position: 'relative'
                            }}>
                              {getStreamEmoji(stream.title)} {stream.author?.username || 'Streamer'}
                              {/* Анимация пульсации для LIVE */}
                              <div style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                width: '12px',
                                height: '12px',
                                background: '#e91916',
                                borderRadius: '50%'
                              }} />
                            </div>
                            <div style={{ padding: '15px' }}>
                              <h3 style={{ margin: '0 0 10px 0', color: '#efeff1', fontSize: '18px' }}>
                                {stream.title || 'Название стрима'}
                              </h3>
                              <p style={{ color: '#adadb8', marginBottom: '15px' }}>
                                {stream.author?.username || 'Streamer'}
                              </p>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#adadb8' }}>
                                  👁️ {stream.viewers_count || 0} зрителей
                                </span>
                                <span style={{ 
                                  background: '#9147ff', 
                                  color: 'white', 
                                  padding: '4px 12px', 
                                  borderRadius: '4px', 
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}>
                                  СМОТРЕТЬ
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* ВСЕ СТРИМЫ */}
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                  <h2 style={{ fontSize: '28px', marginBottom: '10px' }}>
                    {liveStreams.length > 0 ? '🎥 Другие стримы' : '🎥 Все стримы'}
                  </h2>
                  <p style={{ color: '#adadb8', fontSize: '16px' }}>
                    {liveStreams.length > 0 ? 'Откройте для себя все доступные трансляции' : 'Начните смотреть трансляции'}
                  </p>
                </div>

                {loading ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p>Загрузка стримов...</p>
                  </div>
                ) : displayedStreams.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px' }}>
                    <p style={{ color: '#adadb8', fontSize: '18px' }}>
                      Пока нет стримов
                    </p>
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '20px',
                    marginBottom: '40px'
                  }}>
                    {displayedStreams.map((stream, index) => (
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

                {/* КНОПКА НАЧАТЬ СТРИМ */}
                <div style={{
                  background: `url(${veschanieBackground}) center/cover`,
                  padding: '30px',
                  borderRadius: '8px',
                  border: '1px solid #1b0606ff',
                  textAlign: 'center',
                  position: 'relative',
                  height: '230px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{ marginTop: '105px' }}>
                    <Link 
                      to="/stream" 
                      style={{ 
                        background: ('#300f615f', '#2b25345f', '#715797ff'),
                        color: 'white', 
                        padding: '12px 32px', 
                        borderRadius: '4px',
                        textDecoration: 'none',
                        fontSize: '16px',
                        display: 'inline-block',
                        marginLeft: '25px'
                      }}
                    >
                      🎥 Начать стримить
                    </Link>
                    {!localStorage.getItem('access_token') && (
                      <Link 
                        to="/login"
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.9)', 
                          color: '#9147ff', 
                          padding: '12px 24px', 
                          borderRadius: '4px',
                          textDecoration: 'none',
                          fontSize: '16px',
                          display: 'inline-block',
                          marginLeft: '15px'
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

// Добавляем CSS анимацию
const style = document.createElement('style')
style.textContent = `
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.3; }
    100% { opacity: 1; }
  }
`
document.head.appendChild(style)
const streams = await streamAPI.getStreams({limit: 50})
const statuses = streams.data.items.map(s => s.status)
console.log('Все статусы:', [...new Set(statuses)])

export default App