import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../services/api'

const PublicProfile = () => {
    const { userId } = useParams()
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [userStreams, setUserStreams] = useState([])
    const [streamsLoading, setStreamsLoading] = useState(true)

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                console.log('🔄 Загружаем публичные данные пользователя:', userId)
                
                // Загружаем публичные данные пользователя
                const userResponse = await api.get(`/users/${userId}`)
                console.log('✅ Данные пользователя:', userResponse.data)
                setUser(userResponse.data)

                // Загружаем стримы пользователя
                const streamsResponse = await api.get('/streams', {
                    params: { user_id: userId, limit: 6 }
                })
                console.log('📺 Стримы пользователя:', streamsResponse.data)
                setUserStreams(streamsResponse.data.items || [])

            } catch (err) {
                console.error('❌ Ошибка загрузки данных:', err)
                setError('Пользователь не найден')
            } finally {
                setLoading(false)
                setStreamsLoading(false)
            }
        }

        fetchUserData()
    }, [userId])

    const getGradient = (index) => {
        const gradients = [
            'linear-gradient(45deg, #ff6b35, #ff8e53)',
            'linear-gradient(45deg, #9147ff, #772ce8)',
            'linear-gradient(45deg, #00ff7f, #00cc66)',
            'linear-gradient(45deg, #ff4757, #ff3742)',
            'linear-gradient(45deg, #00d2d3, #00a8a8)',
            'linear-gradient(45deg, #ff9ff3, #f368e0)'
        ]
        return gradients[index % gradients.length]
    }

    const getStreamEmoji = (title) => {
        if (!title) return '🎥'
        const lowerTitle = title.toLowerCase()
        if (lowerTitle.includes('музыка') || lowerTitle.includes('трек') || lowerTitle.includes('концерт')) return '🎵'
        if (lowerTitle.includes('игра') || lowerTitle.includes('турнир') || lowerTitle.includes('cs2')) return '🎮'
        if (lowerTitle.includes('dota') || lowerTitle.includes('дота')) return '⚔️'
        if (lowerTitle.includes('общение') || lowerTitle.includes('chat')) return '💬'
        if (lowerTitle.includes('рисование') || lowerTitle.includes('арт')) return '🎨'
        if (lowerTitle.includes('путешествие') || lowerTitle.includes('irl')) return '🌍'
        return '🎥'
    }

    // Условный рендеринг должен быть внутри функции компонента
    if (loading) {
        return (
            <div style={{ padding: '50px', textAlign: 'center', color: 'white' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
                Загрузка профиля...
            </div>
        )
    }
    
    if (error) {
        return (
            <div style={{ padding: '50px', textAlign: 'center', color: 'white' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>❌</div>
                {error}
            </div>
        )
    }
    
    if (!user) {
        return (
            <div style={{ padding: '50px', textAlign: 'center', color: 'white' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
                Пользователь не найден
            </div>
        )
    }

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            
            {/* ШАПКА ПРОФИЛЯ */}
            <div style={{
                background: '#18181b',
                borderRadius: '8px',
                padding: '30px',
                marginBottom: '20px',
                border: '1px solid #333',
                display: 'flex',
                alignItems: 'center',
                gap: '20px'
            }}>
                <div style={{
                    width: '100px',
                    height: '100px',
                    background: user?.avatar_url ? 'transparent' : 'linear-gradient(45deg, #9147ff, #772ce8)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '36px',
                    fontWeight: 'bold',
                    color: 'white',
                    overflow: 'hidden'
                }}>
                    {user?.avatar_url ? (
                        <img 
                            src={`http://localhost:8000/api/files/?file_key=${user.avatar_url}`} 
                            alt="Avatar" 
                            style={{width: '100%', height: '100%', objectFit: 'cover'}}
                        />
                    ) : (
                        user?.username?.charAt(0).toUpperCase() || 'U'
                    )}
                </div>
                
                <div style={{ flex: 1 }}>
                    <h1 style={{ margin: '0 0 5px 0', fontSize: '28px' }}>
                        {user?.username || 'Пользователь'}
                    </h1>
                    {user?.first_name && user?.last_name && (
                        <p style={{ margin: '0 0 5px 0', color: '#adadb8', fontSize: '18px' }}>
                            {user.first_name} {user.last_name}
                        </p>
                    )}
                    <p style={{ margin: 0, color: '#adadb8' }}>
                        {user?.email || 'email@example.com'}
                    </p>
                    {user?.bio && (
                        <p style={{ margin: '10px 0 0 0', color: '#efeff1', fontStyle: 'italic' }}>
                            "{user.bio}"
                        </p>
                    )}
                </div>
                
                <div style={{
                    background: '#9147ff20',
                    border: '1px solid #9147ff',
                    padding: '10px 20px',
                    borderRadius: '20px',
                    color: '#9147ff',
                    fontSize: '14px'
                }}>
                    📍 Участник StreamFlow
                </div>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '20px'
            }}>
                
                {/* ЛЕВАЯ КОЛОНКА - ОСНОВНАЯ ИНФОРМАЦИЯ */}
                <div>
                    
                    {/* ИНФОРМАЦИЯ О ПОЛЬЗОВАТЕЛЕ */}
                    <div style={{
                        background: '#18181b',
                        borderRadius: '8px',
                        padding: '25px',
                        marginBottom: '20px',
                        border: '1px solid #333'
                    }}>
                        <h2 style={{ marginBottom: '20px', color: '#efeff1' }}>👤 Информация</h2>
                        
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '15px'
                        }}>
                            {user?.country && (
                                <div>
                                    <strong style={{ color: '#adadb8' }}>🌍 Страна:</strong>
                                    <p style={{ color: 'white', margin: '5px 0 0 0' }}>{user.country}</p>
                                </div>
                            )}
                            
                            {user?.city && (
                                <div>
                                    <strong style={{ color: '#adadb8' }}>🏙️ Город:</strong>
                                    <p style={{ color: 'white', margin: '5px 0 0 0' }}>{user.city}</p>
                                </div>
                            )}
                            
                            {user?.website && (
                                <div>
                                    <strong style={{ color: '#adadb8' }}>🌐 Веб-сайт:</strong>
                                    <p style={{ color: 'white', margin: '5px 0 0 0' }}>
                                        <a 
                                            href={user.website} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            style={{ color: '#9147ff', textDecoration: 'none' }}
                                        >
                                            {user.website}
                                        </a>
                                    </p>
                                </div>
                            )}
                            
                            <div>
                                <strong style={{ color: '#adadb8' }}>📅 Регистрация:</strong>
                                <p style={{ color: 'white', margin: '5px 0 0 0' }}>
                                    {new Date(user.created_at).toLocaleDateString('ru-RU')}
                                </p>
                            </div>
                            
                            {user?.last_login && (
                                <div>
                                    <strong style={{ color: '#adadb8' }}>🕐 Последний вход:</strong>
                                    <p style={{ color: 'white', margin: '5px 0 0 0' }}>
                                        {new Date(user.last_login).toLocaleDateString('ru-RU')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* СТРИМЫ ПОЛЬЗОВАТЕЛЯ */}
                    <div style={{
                        background: '#18181b',
                        borderRadius: '8px',
                        padding: '25px',
                        border: '1px solid #333'
                    }}>
                        <h2 style={{ marginBottom: '20px', color: '#efeff1' }}>🎥 Стримы пользователя</h2>
                        
                        {streamsLoading ? (
                            <div style={{
                                background: '#0e0e10',
                                padding: '30px',
                                borderRadius: '4px',
                                textAlign: 'center',
                                color: '#adadb8'
                            }}>
                                <p>Загрузка стримов...</p>
                            </div>
                        ) : userStreams.length === 0 ? (
                            <div style={{
                                background: '#0e0e10',
                                padding: '30px',
                                borderRadius: '4px',
                                textAlign: 'center',
                                color: '#adadb8'
                            }}>
                                <div style={{ fontSize: '48px', marginBottom: '15px' }}>📺</div>
                                <p>Пользователь пока не проводил трансляции</p>
                            </div>
                        ) : (
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                                gap: '15px'
                            }}>
                                {userStreams.map((stream, index) => (
                                    <Link 
                                        key={stream.id}
                                        to={`/stream/${stream.id}`}
                                        style={{ textDecoration: 'none' }}
                                    >
                                        <div style={{
                                            background: '#0e0e10',
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
                                                height: '120px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '24px',
                                                fontWeight: 'bold',
                                                position: 'relative'
                                            }}>
                                                {getStreamEmoji(stream.title)}
                                                {stream.status === 'live' && (
                                                    <div style={{
                                                        position: 'absolute',
                                                        top: '10px',
                                                        left: '10px',
                                                        background: '#e91916',
                                                        color: 'white',
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        fontSize: '10px',
                                                        fontWeight: 'bold'
                                                    }}>
                                                        🔴 LIVE
                                                    </div>
                                                )}
                                            </div>
                                            <div style={{ padding: '15px' }}>
                                                <h3 style={{ 
                                                    margin: '0 0 8px 0', 
                                                    color: '#efeff1',
                                                    fontSize: '16px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {stream.title || 'Название стрима'}
                                                </h3>
                                                <p style={{ 
                                                    color: '#adadb8', 
                                                    marginBottom: '10px',
                                                    fontSize: '14px',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap'
                                                }}>
                                                    {stream.description || 'Без описания'}
                                                </p>
                                                <div style={{ 
                                                    display: 'flex', 
                                                    justifyContent: 'space-between',
                                                    fontSize: '12px',
                                                    color: '#adadb8'
                                                }}>
                                                    <span>👁️ {stream.viewers_count || 0}</span>
                                                    <span style={{ 
                                                        background: stream.status === 'live' ? '#e91916' : '#666', 
                                                        color: 'white', 
                                                        padding: '2px 6px', 
                                                        borderRadius: '4px' 
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
                    </div>

                </div>

                {/* ПРАВАЯ КОЛОНКА - ДОПОЛНИТЕЛЬНАЯ ИНФО */}
                <div>
                    
                    {/* СТАТУС */}
                    <div style={{
                        background: '#18181b',
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '20px',
                        border: '1px solid #333'
                    }}>
                        <h3 style={{ marginBottom: '15px', color: '#efeff1' }}>ℹ️ Статус</h3>
                        <div style={{ color: '#adadb8', fontSize: '14px', lineHeight: '1.5' }}>
                            <p>🎯 <strong>Статус:</strong> {user.is_verified ? '✅ Подтвержден' : '⏳ Ожидает подтверждения'}</p>
                            <p>📊 <strong>Активность:</strong> {user.is_active ? '🟢 Активен' : '🔴 Неактивен'}</p>
                            <p>👁️ <strong>Подписчики:</strong> 0</p>
                            <p>🎥 <strong>Стримов:</strong> {userStreams.length}</p>
                            <p>🌟 <strong>Всего просмотров:</strong> {userStreams.reduce((total, stream) => total + (stream.viewers_count || 0), 0)}</p>
                        </div>
                    </div>

                    {/* КОНТАКТЫ */}
                    {(user?.phone) && (
                        <div style={{
                            background: '#18181b',
                            borderRadius: '8px',
                            padding: '20px',
                            border: '1px solid #333'
                        }}>
                            <h3 style={{ marginBottom: '15px', color: '#efeff1' }}>📞 Контакты</h3>
                            <div style={{ color: '#adadb8', fontSize: '14px', lineHeight: '1.5' }}>
                                {user.phone && <p>📱 <strong>Телефон:</strong> {user.phone}</p>}
                                {user.email && <p>📧 <strong>Email:</strong> {user.email}</p>}
                            </div>
                        </div>
                    )}

                </div>

            </div>

        </div>
    )
}

export default PublicProfile