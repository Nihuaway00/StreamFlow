import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import Header from './components/Layout/Header'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app" style={{ 
          background: '#0e0e10', 
          minHeight: '100vh', 
          color: 'white',
          fontFamily: 'Arial, sans-serif',
          paddingTop: '50px'
        }}>
          
          <Header />

          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  <h1 style={{ fontSize: '36px', marginBottom: '10px' }}>🎥 Прямо сейчас в эфире</h1>
                  <p style={{ color: '#adadb8', fontSize: '18px' }}>
                    Присоединяйся к самым популярным стримам платформы
                  </p>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                  gap: '20px',
                  marginBottom: '40px'
                }}>
                  
                  {/* СТРИМ 1 - МАКАН */}
                  <div style={{
                    background: '#18181b',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #333',
                    transition: 'transform 0.2s',
                    cursor: 'pointer'
                  }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                     onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                    <div style={{
                      background: 'linear-gradient(45deg, #ff6b35, #ff8e53)',
                      height: '180px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }}>
                      🎵 Макан
                    </div>
                    <div style={{ padding: '15px' }}>
                      <h3 style={{ margin: '0 0 10px 0', color: '#efeff1' }}>Треки по заявкам</h3>
                      <p style={{ color: '#adadb8', marginBottom: '15px' }}>MakanBeats</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#adadb8' }}>👁️ 3.7K</span>
                        <span style={{ background: '#e91916', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>LIVE</span>
                      </div>
                    </div>
                  </div>

                  {/* СТРИМ 2 - CS2 */}
                  <div style={{
                    background: '#18181b',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #333',
                    transition: 'transform 0.2s',
                    cursor: 'pointer'
                  }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                     onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                    <div style={{
                      background: 'linear-gradient(45deg, #9147ff, #772ce8)',
                      height: '180px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }}>
                      🎮 CS2
                    </div>
                    <div style={{ padding: '15px' }}>
                      <h3 style={{ margin: '0 0 10px 0', color: '#efeff1' }}>Турнирная игра</h3>
                      <p style={{ color: '#adadb8', marginBottom: '15px' }}>ProGamer</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#adadb8' }}>👁️ 2.4K</span>
                        <span style={{ background: '#e91916', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>LIVE</span>
                      </div>
                    </div>
                  </div>

                  {/* СТРИМ 3 - МУЗЫКА */}
                  <div style={{
                    background: '#18181b',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #333',
                    transition: 'transform 0.2s',
                    cursor: 'pointer'
                  }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                     onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                    <div style={{
                      background: 'linear-gradient(45deg, #00ff7f, #00cc66)',
                      height: '180px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }}>
                      🎵 Акустика
                    </div>
                    <div style={{ padding: '15px' }}>
                      <h3 style={{ margin: '0 0 10px 0', color: '#efeff1' }}>Живой концерт</h3>
                      <p style={{ color: '#adadb8', marginBottom: '15px' }}>MusicLover</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#adadb8' }}>👁️ 1.2K</span>
                        <span style={{ background: '#e91916', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>LIVE</span>
                      </div>
                    </div>
                  </div>

                  {/* СТРИМ 4 - DOTA 2 */}
                  <div style={{
                    background: '#18181b',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #333',
                    transition: 'transform 0.2s',
                    cursor: 'pointer'
                  }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                     onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                    <div style={{
                      background: 'linear-gradient(45deg, #ff4757, #ff3742)',
                      height: '180px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }}>
                      ⚔️ DOTA 2
                    </div>
                    <div style={{ padding: '15px' }}>
                      <h3 style={{ margin: '0 0 10px 0', color: '#efeff1' }}>Покатаем ранкед без токса</h3>
                      <p style={{ color: '#adadb8', marginBottom: '15px' }}>EvilArthas</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#adadb8' }}>👁️ 1.8K</span>
                        <span style={{ background: '#e91916', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>LIVE</span>
                      </div>
                    </div>
                  </div>

                  {/* СТРИМ 5 - MINECRAFT */}
                  <div style={{
                    background: '#18181b',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #333',
                    transition: 'transform 0.2s',
                    cursor: 'pointer'
                  }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                     onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                    <div style={{
                      background: 'linear-gradient(45deg, #00d2d3, #00a8a8)',
                      height: '180px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }}>
                      ⛏️ Minecraft
                    </div>
                    <div style={{ padding: '15px' }}>
                      <h3 style={{ margin: '0 0 10px 0', color: '#efeff1' }}>Выживание с 52 модами</h3>
                      <p style={{ color: '#adadb8', marginBottom: '15px' }}>лололошка ака роман фильченков</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#adadb8' }}>👁️ 956</span>
                        <span style={{ background: '#e91916', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>LIVE</span>
                      </div>
                    </div>
                  </div>

                  {/* СТРИМ 6 - JUST CHATTING */}
                  <div style={{
                    background: '#18181b',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #333',
                    transition: 'transform 0.2s',
                    cursor: 'pointer'
                  }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                     onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                    <div style={{
                      background: 'linear-gradient(45deg, #ff9ff3, #f368e0)',
                      height: '180px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }}>
                      💬 Общение
                    </div>
                    <div style={{ padding: '15px' }}>
                      <h3 style={{ margin: '0 0 10px 0', color: '#efeff1' }}>Just Chatting</h3>
                      <p style={{ color: '#adadb8', marginBottom: '15px' }}>ChatterBox</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#adadb8' }}>👁️ 2.1K</span>
                        <span style={{ background: '#e91916', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>LIVE</span>
                      </div>
                    </div>
                  </div>

                  {/* СТРИМ 7 - VALORANT */}
                  <div style={{
                    background: '#18181b',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #333',
                    transition: 'transform 0.2s',
                    cursor: 'pointer'
                  }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                     onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                    <div style={{
                      background: 'linear-gradient(45deg, #ff3838, #ff0d0d)',
                      height: '180px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }}>
                      🔫 Valorant
                    </div>
                    <div style={{ padding: '15px' }}>
                      <h3 style={{ margin: '0 0 10px 0', color: '#efeff1' }}>Командная игра</h3>
                      <p style={{ color: '#adadb8', marginBottom: '15px' }}>ValoPro</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#adadb8' }}>👁️ 3.2K</span>
                        <span style={{ background: '#e91916', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>LIVE</span>
                      </div>
                    </div>
                  </div>

                  {/* СТРИМ 8 - ART */}
                  <div style={{
                    background: '#18181b',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #333',
                    transition: 'transform 0.2s',
                    cursor: 'pointer'
                  }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                     onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                    <div style={{
                      background: 'linear-gradient(45deg, #ff9f43, #ff7f00)',
                      height: '180px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }}>
                      🎨 Рисование
                    </div>
                    <div style={{ padding: '15px' }}>
                      <h3 style={{ margin: '0 0 10px 0', color: '#efeff1' }}>Цифровое искусство</h3>
                      <p style={{ color: '#adadb8', marginBottom: '15px' }}>DigitalArtist</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#adadb8' }}>👁️ 784</span>
                        <span style={{ background: '#e91916', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>LIVE</span>
                      </div>
                    </div>
                  </div>

                  {/* СТРИМ 9 - IRL */}
                  <div style={{
                    background: '#18181b',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #333',
                    transition: 'transform 0.2s',
                    cursor: 'pointer'
                  }} onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                     onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                    <div style={{
                      background: 'linear-gradient(45deg, #54a0ff, #2e86de)',
                      height: '180px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }}>
                      🌍 IRL
                    </div>
                    <div style={{ padding: '15px' }}>
                      <h3 style={{ margin: '0 0 10px 0', color: '#efeff1' }}>Путешествия</h3>
                      <p style={{ color: '#adadb8', marginBottom: '15px' }}>Traveler</p>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#adadb8' }}>👁️ 1.5K</span>
                        <span style={{ background: '#e91916', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px' }}>LIVE</span>
                      </div>
                    </div>
                  </div>

                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #18181b, #9147ff20)',
                  padding: '30px',
                  borderRadius: '8px',
                  border: '1px solid #333',
                  textAlign: 'center'
                }}>
                  <h2 style={{ marginBottom: '15px' }}>Готов начать своё вещание?</h2>
                  <p style={{ color: '#adadb8', marginBottom: '20px' }}>
                    Присоединяйся к сообществу стримеров и делись своим контентом с тысячами зрителей
                  </p>
                  <div>
                    <a href="/register" style={{ 
                      background: '#9147ff', 
                      color: 'white', 
                      padding: '12px 24px', 
                      borderRadius: '4px',
                      textDecoration: 'none',
                      marginRight: '15px',
                      fontSize: '16px',
                      display: 'inline-block'
                    }}>
                      🎥 Начать стримить
                    </a>
                    <a href="/login" style={{ 
                      color: '#9147ff', 
                      padding: '12px 24px', 
                      border: '1px solid #9147ff',
                      borderRadius: '4px',
                      textDecoration: 'none',
                      fontSize: '16px',
                      display: 'inline-block'
                    }}>
                      Войти в аккаунт
                    </a>
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