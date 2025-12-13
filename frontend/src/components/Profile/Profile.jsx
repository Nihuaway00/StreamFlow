import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import Thumbnail from '../Stream/Thumbnail'
import './Profile.css'

const Profile = () => {
    const { user, logout, updateUser } = useAuth()
    const [showSettings, setShowSettings] = useState(false)
    const [username, setUsername] = useState(user?.username || '')
    const [usernameChanged, setUsernameChanged] = useState(false)
    const [selectedThemes, setSelectedThemes] = useState([])
    const [avatarFile, setAvatarFile] = useState(null)
    const [avatarPreview, setAvatarPreview] = useState(null)
    const [isUploading, setIsUploading] = useState(false)
    const [userStreams, setUserStreams] = useState([])
    const [streamsLoading, setStreamsLoading] = useState(true)
    const [backendThemes, setBackendThemes] = useState([])
    const [themesLoading, setThemesLoading] = useState(true)
    
    const [formData, setFormData] = useState({
        first_name: user?.first_name || '',
        last_name: user?.last_name || '',
        bio: user?.bio || '',
        phone: user?.phone || '',
        date_of_birth: user?.date_of_birth || '',
        country: user?.country || '',
        city: user?.city || '',
        website: user?.website || ''
    })
    const [saveLoading, setSaveLoading] = useState(false)

    const achievements = [
        {
            id: 1,
            title: "Начинающий стример",
            description: "Провести один стрим",
            progress: 0,
            total: 1,
            icon: "🎥",
            color: "#9147ff"
        },
        {
            id: 2,
            title: "Я - душа компании",
            description: "Отправить в чат 100 сообщений",
            progress: 25,
            total: 100,
            icon: "💬",
            color: "#00ff7f"
        },
        {
            id: 3,
            title: "Звезда",
            description: "Собрать 10000 подписчиков",
            progress: 0,
            total: 10000,
            icon: "⭐",
            color: "#ffd700"
        }
    ]

    const getAvatarUrl = async (fileKey) => {
        if (!fileKey) {
            console.log('❌ fileKey пустой')
            return null
        }
        
        console.log('🔍 Получение URL для file_key:', fileKey)
        
        try {
            const response = await api.post('/files/', null, {
                params: { file_key: fileKey }
            })
            
            let signedUrl = response.data
            console.log('✅ Signed URL от бэкенда:', signedUrl)
            
            if (typeof signedUrl === 'string') {
                if (signedUrl.includes('storage:9000')) {
                    signedUrl = signedUrl.replace('storage:9000', 'localhost:9000')
                    console.log('🔧 Исправленный URL:', signedUrl)
                }
                
                try {
                    new URL(signedUrl)
                    return signedUrl
                } catch (urlError) {
                    console.error('❌ Невалидный URL:', signedUrl)
                    return null
                }
            } else {
                console.error('❌ Ответ не строка:', signedUrl)
                return null
            }
            
        } catch (error) {
            console.error('❌ Ошибка получения URL:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            })
            return null
        }
    }

    const extractFileKey = (avatarUrl) => {
        if (!avatarUrl) {
            console.log('❌ avatarUrl пустой')
            return null
        }
        
        console.log('🔍 Извлечение file_key из:', avatarUrl)
        
        if (typeof avatarUrl === 'string' && 
            !avatarUrl.includes('://') && 
            !avatarUrl.startsWith('/')) {
            console.log('✅ Это уже file_key:', avatarUrl)
            return avatarUrl
        }
        
        try {
            if (avatarUrl.startsWith('/')) {
                const path = avatarUrl.substring(1)
                console.log('📁 Извлечен из относительного пути:', path)
                return path
            }
            
            const url = new URL(avatarUrl)
            let path = url.pathname.substring(1)
            console.log('📁 Извлечен из URL:', path)
            return path
        } catch (error) {
            console.error('❌ Ошибка парсинга URL:', error)
            return avatarUrl
        }
    }

    useEffect(() => {
        if (showSettings) {
            document.body.classList.add('modal-open')
        } else {
            document.body.classList.remove('modal-open')
        }
        
        return () => {
            document.body.classList.remove('modal-open')
        }
    }, [showSettings])

    useEffect(() => {
        if (!user) return

        const loadAvatar = async () => {
            if (user.avatar_url) {
                try {
                    console.log('🔄 Загрузка аватара:', user.avatar_url)
                    
                    const fileKey = extractFileKey(user.avatar_url)
                    console.log('📁 File key:', fileKey)
                    
                    if (fileKey) {
                        const avatarUrl = await getAvatarUrl(fileKey)
                        if (avatarUrl) {
                            console.log('✅ Устанавливаем аватар:', avatarUrl)
                            setAvatarPreview(avatarUrl)
                        } else {
                            console.log('❌ Не удалось получить URL аватара')
                            setAvatarPreview(null)
                        }
                    } else {
                        console.log('❌ Не удалось извлечь file_key')
                        setAvatarPreview(null)
                    }
                } catch (error) {
                    console.error('❌ Ошибка загрузки аватара:', error)
                    setAvatarPreview(null)
                }
            } else {
                console.log('ℹ️ Аватар не установлен')
                setAvatarPreview(null)
            }
        }

        const fetchUserStreams = async () => {
            try {
                setStreamsLoading(true)
                console.log('📡 Загружаю стримы пользователя...')
                
                let userStreamsData = []
                
                try {
                    const response = await api.get('/streams/my')
                    console.log('📦 Стримы через /streams/my:', response.data)
                    
                    if (response.data) {
                        if (Array.isArray(response.data)) {
                            userStreamsData = response.data
                        } else if (response.data.items) {
                            userStreamsData = response.data.items
                        } else {
                            userStreamsData = response.data
                        }
                    }
                } catch (myStreamsError) {
                    console.log('❌ /streams/my не работает, пробую альтернативный способ:', myStreamsError.message)
                    
                    try {
                        const response = await api.get('/streams', {
                            params: { limit: 100, page: 1 }
                        })
                        
                        console.log('📦 Все стримы:', response.data)
                        
                        let allStreams = []
                        
                        if (Array.isArray(response.data)) {
                            allStreams = response.data
                        } else if (response.data && Array.isArray(response.data.items)) {
                            allStreams = response.data.items
                        } else if (response.data && response.data.streams) {
                            allStreams = response.data.streams
                        }
                        
                        if (user?.id) {
                            userStreamsData = allStreams.filter(stream => {
                                return stream.author?.id === user.id || 
                                    stream.user_id === user.id ||
                                    stream.owner_id === user.id ||
                                    (stream.author && typeof stream.author === 'object' && stream.author.id === user.id)
                            })
                        }
                    } catch (allStreamsError) {
                        console.error('❌ Ошибка загрузки всех стримов:', allStreamsError)
                    }
                }
                
                setUserStreams(userStreamsData || [])
                
            } catch (error) {
                console.error('❌ Ошибка загрузки стримов:', error)
                setUserStreams([])
            } finally {
                setStreamsLoading(false)
            }
        }

        const fetchThemes = async () => {
            try {
                const response = await api.get('/themes/')
                setBackendThemes(response.data)
            } catch (error) {
                console.error('Error fetching themes:', error)
            } finally {
                setThemesLoading(false)
            }
        }

        loadAvatar()
        fetchUserStreams()
        fetchThemes()
        setUsername(user.username || '')
        
        setFormData({
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            bio: user?.bio || '',
            phone: user?.phone || '',
            date_of_birth: user?.date_of_birth || '',
            country: user?.country || '',
            city: user?.city || '',
            website: user?.website || ''
        })
    }, [user])

    useEffect(() => {
        if (user?.avatar_url) {
            const loadNewAvatar = async () => {
                try {
                    const fileKey = extractFileKey(user.avatar_url)
                    if (fileKey) {
                        const avatarUrl = await getAvatarUrl(fileKey)
                        setAvatarPreview(avatarUrl)
                    }
                } catch (error) {
                    console.error('Error loading new avatar:', error)
                }
            }
            loadNewAvatar()
        } else {
            setAvatarPreview(null)
        }
    }, [user?.avatar_url])

    const calculateProgress = (progress, total) => {
        return total > 0 ? Math.min((progress / total) * 100, 100) : 0
    }

    const handleThemeToggle = (theme) => {
        if (selectedThemes.includes(theme)) {
            setSelectedThemes(selectedThemes.filter(t => t !== theme))
        } else {
            setSelectedThemes([...selectedThemes, theme])
        }
    }

    const handleAvatarUpload = async () => {
        if (!avatarFile) return

        setIsUploading(true)
        try {
            const uploadData = new FormData()
            uploadData.append('avatar', avatarFile)
            
            const fields = [
                'first_name', 'last_name', 'bio', 'phone', 
                'date_of_birth', 'country', 'city', 'website'
            ]
            
            fields.forEach(field => {
                const value = formData[field] || user?.[field] || ''
                uploadData.append(field, value)
            })

            console.log('🔄 Загрузка аватара...')
            console.log('FormData содержимое:')
            for (let pair of uploadData.entries()) {
                console.log(pair[0], ':', pair[1])
            }

            const response = await api.post('/users/me', uploadData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            console.log("✅ Ответ от сервера:", response.data)

            updateUser(response.data)
            
            const previewUrl = URL.createObjectURL(avatarFile)
            setAvatarPreview(previewUrl)
            setAvatarFile(null)
            
            if (response.data.avatar_url) {
                try {
                    const fileKey = extractFileKey(response.data.avatar_url)
                    if (fileKey) {
                        const newAvatarUrl = await getAvatarUrl(fileKey)
                        if (newAvatarUrl) {
                            setAvatarPreview(newAvatarUrl)
                        }
                    }
                } catch (error) {
                    console.error('Error loading new avatar URL:', error)
                }
            }
            
            alert("Аватар успешно обновлён!")

        } catch (error) {
            console.error('❌ Ошибка загрузки аватара:', error)
            console.error('Статус:', error.response?.status)
            console.error('Данные ответа:', error.response?.data)
            
            let errorMessage = 'Ошибка при загрузке аватара'
            
            if (error.response?.data?.detail) {
                if (Array.isArray(error.response.data.detail)) {
                    errorMessage = error.response.data.detail.map(d => d.msg).join(', ')
                } else {
                    errorMessage = error.response.data.detail
                }
            }
            
            alert(`Ошибка: ${errorMessage}`)
        } finally {
            setIsUploading(false)
        }
    }

    const handleFileSelect = (event) => {
        const file = event.target.files[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Файл слишком большой. Максимальный размер: 5MB')
                return
            }

            if (!file.type.startsWith('image/')) {
                alert('Пожалуйста, выберите изображение')
                return
            }

            setAvatarFile(file)
            const previewUrl = URL.createObjectURL(file)
            setAvatarPreview(previewUrl)
            
            console.log('✅ Файл выбран:', file.name, '(', (file.size / 1024).toFixed(2), 'KB)')
        }
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleSaveSettings = async () => {
        try {
            setSaveLoading(true)
            
            console.log('💾 Начинаю сохранение настроек...')
            
            const submitData = new FormData()
            
            const fields = [
                'first_name', 'last_name', 'bio', 'phone', 
                'date_of_birth', 'country', 'city', 'website'
            ]
            
            fields.forEach(field => {
                const value = formData[field] || ''
                submitData.append(field, value)
            })
            
            if (avatarFile) {
                console.log('📤 Добавляю файл аватара:', avatarFile.name)
                submitData.append('avatar', avatarFile)
            } else {
                console.log('ℹ️ Файл аватара не выбран')
            }
            
            console.log('📦 FormData содержимое:')
            for (let pair of submitData.entries()) {
                console.log(pair[0], ':', pair[1])
            }
            
            console.log('🔄 Отправляю POST запрос на /users/me...')
            
            const response = await api.post('/users/me', submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            
            console.log("✅ Данные сохранены:", response.data)
            
            updateUser(response.data)
            
            if (response.data.avatar_url) {
                console.log('🔄 Новый avatar_url:', response.data.avatar_url)
                try {
                    const fileKey = extractFileKey(response.data.avatar_url)
                    if (fileKey) {
                        const newAvatarUrl = await getAvatarUrl(fileKey)
                        if (newAvatarUrl) {
                            setAvatarPreview(newAvatarUrl)
                        }
                    }
                } catch (error) {
                    console.error('Ошибка загрузки нового аватара:', error)
                }
            }
            
            if (avatarFile) {
                setAvatarFile(null)
            }
            
            alert('Настройки успешно сохранены!')
            setShowSettings(false)
            
        } catch (error) {
            console.error('❌ Ошибка сохранения:', error)
            console.error('Статус:', error.response?.status)
            console.error('Данные ответа:', error.response?.data)
            
            let errorMessage = 'Ошибка при сохранении настроек'
            
            if (error.response?.data?.detail) {
                if (Array.isArray(error.response.data.detail)) {
                    errorMessage = error.response.data.detail.map(d => d.msg).join(', ')
                } else {
                    errorMessage = error.response.data.detail
                }
            }
            
            alert(`Ошибка: ${errorMessage}`)
            
        } finally {
            setSaveLoading(false)
        }
    }

    const handleUsernameChange = (e) => {
        if (!usernameChanged) {
            setUsername(e.target.value)
        }
    }

    const getThemeDisplayName = (themeName) => {
        const themeNames = {
            'gaming': '🎮 Игры',
            'music': '🎵 Музыка', 
            'just_chatting': '💬 Общение'
        }
        return themeNames[themeName] || themeName
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

    const handleImageError = (e) => {
        console.error('❌ Ошибка загрузки изображения аватара')
        e.target.style.display = 'none'
    }

    const renderAvatar = () => {
        if (avatarPreview) {
            return (
                <img
                    src={avatarPreview}
                    alt="Avatar"
                    style={{width: '100%', height: '100%', objectFit: 'cover'}}
                    onError={handleImageError}
                />
            )
        } else {
            return (
                <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(45deg, #9147ff, #772ce8)',
                    color: 'white',
                    fontSize: '32px',
                    fontWeight: 'bold'
                }}>
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
            )
        }
    }

    return (
        <div className="profile-page">
            <div className="profile-bg" aria-hidden="true"></div>
            <div className="profile-wrapper">
                {/* ШАПКА ПРОФИЛЯ */}
                <div className="glass profile-header">
                    <div className="profile-header-left">
                        <div
                            className="profile-avatar"
                            onClick={() => document.getElementById('avatar-input-main').click()}
                            title="Нажмите чтобы сменить аватар"
                        >
                            {renderAvatar()}
                            <input
                                id="avatar-input-main"
                                type="file"
                                accept="image/*"
                                style={{display: 'none'}}
                                onChange={handleFileSelect}
                            />
                        </div>
                        <div className="profile-info">
                            <h1>{user?.username || 'Пользователь'}</h1>
                            {user?.first_name && user?.last_name && (
                                <p>{user.first_name} {user.last_name}</p>
                            )}
                            <p className="small-muted">{user?.email || 'email@example.com'}</p>
                            {user?.bio && <p className="small-muted" style={{fontStyle:'italic'}}>"{user.bio}"</p>}
                            {(user?.country || user?.city) && (
                                <p className="small-muted">📍 {[user?.city, user?.country].filter(Boolean).join(', ')}</p>
                            )}
                        </div>
                    </div>
                    <div className="profile-head-buttons">
                        <button className="btn btn-primary" onClick={() => setShowSettings(true)}>
                            ⚙️ Настройки
                        </button>
                        <button className="btn btn-ghost" onClick={logout}>
                            Выйти
                        </button>
                    </div>
                </div>

                {/* МОДАЛЬНОЕ ОКНО НАСТРОЕК */}
                {showSettings && (
                    <div className="modal-overlay">
                        <div className="glass modal-window">
                            <div className="modal-header">
                                <h2>⚙️ Настройки профиля</h2>
                                <button className="modal-close" onClick={() => setShowSettings(false)}>✕</button>
                            </div>
                            <div className="modal-avatar-row">
                                <div className="modal-avatar" onClick={() => document.getElementById('avatar-input-modal').click()}>
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt="Preview"
                                            style={{width: '100%', height: '100%', objectFit: 'cover'}}
                                            onError={handleImageError}
                                        />
                                    ) : (
                                        <div className="avatar-placeholder" style={{fontSize:28}}>
                                            {username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div style={{flex:1}}>
                                    <p className="small-muted" style={{marginBottom:8}}>Нажмите на аватар для загрузки нового</p>
                                    <div style={{display:'flex', gap:8}}>
                                        <button className="btn btn-ghost" onClick={() => document.getElementById('avatar-input-modal').click()}>
                                            📁 Выбрать файл
                                        </button>
                                        {avatarFile && (
                                            <button className="btn btn-primary" onClick={handleAvatarUpload} disabled={isUploading}>
                                                {isUploading ? '📤 Загрузка...' : '💾 Сохранить аватар'}
                                            </button>
                                        )}
                                    </div>
                                    <input id="avatar-input-modal" type="file" accept="image/*" style={{display: 'none'}} onChange={handleFileSelect} />
                                    {avatarFile && <p className="small-muted" style={{marginTop:10}}>Выбран файл: {avatarFile.name}</p>}
                                </div>
                            </div>
                            <div className="modal-form">
                                <div>
                                    <div className="field">
                                        <label>Имя</label>
                                        <input type="text" name="first_name" value={formData.first_name} onChange={handleInputChange} placeholder="Ваше имя" />
                                    </div>
                                    <div className="field">
                                        <label>Фамилия</label>
                                        <input type="text" name="last_name" value={formData.last_name} onChange={handleInputChange} placeholder="Ваша фамилия" />
                                    </div>
                                    <div className="field">
                                        <label>О себе</label>
                                        <textarea name="bio" value={formData.bio} onChange={handleInputChange} rows="4" placeholder="Расскажите о себе..." />
                                    </div>
                                </div>
                                <div>
                                    <div className="field">
                                        <label>Телефон</label>
                                        <input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+7 (XXX) XXX-XX-XX" />
                                    </div>
                                    <div className="field">
                                        <label>Дата рождения</label>
                                        <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange} />
                                    </div>
                                    <div className="field">
                                        <label>Страна</label>
                                        <input type="text" name="country" value={formData.country} onChange={handleInputChange} placeholder="Страна" />
                                    </div>
                                    <div className="field">
                                        <label>Город</label>
                                        <input type="text" name="city" value={formData.city} onChange={handleInputChange} placeholder="Город" />
                                    </div>
                                    <div className="field">
                                        <label>Веб-сайт</label>
                                        <input type="url" name="website" value={formData.website} onChange={handleInputChange} placeholder="https://example.com" />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-section">
                                <h3 style={{marginBottom:8}}>🎯 Интересные тематики</h3>
                                <p className="small-muted" style={{marginBottom:10}}>Выберите темы, которые вам интересны (для рекомендаций)</p>
                                {themesLoading ? (
                                    <p className="small-muted">Загрузка тематик...</p>
                                ) : (
                                    <div className="theme-list">
                                        {backendThemes.map((theme) => (
                                            <button
                                                key={theme.id}
                                                className={`theme-pill ${selectedThemes.includes(theme.name) ? 'selected' : ''}`}
                                                onClick={() => handleThemeToggle(theme.name)}
                                            >
                                                {getThemeDisplayName(theme.name)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="modal-actions">
                                <button className="btn btn-ghost" onClick={() => setShowSettings(false)}>Отмена</button>
                                <button className="btn btn-primary" onClick={handleSaveSettings} disabled={saveLoading}>
                                    {saveLoading ? '💾 Сохранение...' : '💾 Сохранить все изменения'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ОСТАЛЬНАЯ ЧАСТЬ ПРОФИЛЯ */}
                <div className="profile-grid" style={{marginTop:18}}>
                    {/* ЛЕВАЯ КОЛОНКА */}
                    <div>
                        {/* ДОСТИЖЕНИЯ */}
                        <div className="glass ach-block">
                            <div className="ach-title">
                                <span>🏆 Достижения</span>
                                <span className="ach-count">{achievements.filter(a => a.progress >= a.total).length}/{achievements.length}</span>
                            </div>
                            <div className="ach-list">
                                {achievements.map((achievement) => {
                                    const progressPercent = calculateProgress(achievement.progress, achievement.total)
                                    const isCompleted = achievement.progress >= achievement.total
                                    return (
                                        <div key={achievement.id} className="ach-item">
                                            <div className="ach-icon" style={{background: isCompleted ? achievement.color : 'rgba(255,255,255,0.06)'}}>
                                                {achievement.icon}
                                            </div>
                                            <div className="ach-progress">
                                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                                                    <strong style={{color: isCompleted ? achievement.color : '#fff'}}>{achievement.title}</strong>
                                                    {isCompleted && <span style={{background:achievement.color, color:'#fff', padding:'4px 8px', borderRadius:6}}>✅</span>}
                                                </div>
                                                <p className="small-muted" style={{margin:'6px 0'}}>{achievement.description}</p>
                                                <div className="progress-bar">
                                                    <i style={{width: `${progressPercent}%`}}></i>
                                                </div>
                                                <div style={{marginTop:8, fontSize:12, color: isCompleted ? achievement.color : 'rgba(255,255,255,0.6)'}}>
                                                    {achievement.progress}/{achievement.total}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* МОИ СТРИМЫ */}
                        <div className="glass streams-block">
                            <h3 style={{margin:'0 0 12px 0'}}>🎥 Мои стримы</h3>
                            {streamsLoading ? (
                                <div className="small-muted">Загрузка стримов...</div>
                            ) : userStreams.length === 0 ? (
                                <div className="small-muted">
                                    <p>У вас пока нет стримов</p>
                                    <button className="btn btn-primary" onClick={() => window.location.href = '/stream'}>🎥 Начать первый стрим</button>
                                </div>
                            ) : (
                                <div>
                                    {userStreams.slice(0, 3).map((stream) => (
                                        <div key={stream.id} className="stream-item">
                                            <div style={{display:'flex', alignItems:'center', gap:12}}>
                                                {/* ИСПОЛЬЗУЕМ Thumbnail вместо StreamPreview */}
                                                <Thumbnail
                                                    previewUrl={stream.preview_url}
                                                    alt={stream.title || "Превью стрима"}
                                                    style={{width:72, height:48, borderRadius: '8px'}}
                                                />
                                                <div>
                                                    <div className="stream-title">{stream.title}</div>
                                                    <div className="small-muted">{stream.description || 'Без описания'}</div>
                                                </div>
                                            </div>
                                            <div className="stream-meta">
                                                <div className="small-muted">👁️ {stream.viewers_count || 0}</div>
                                                <div className={`stream-status ${stream.status === 'live' ? 'live' : 'off'}`}>
                                                    {stream.status === 'live' ? 'LIVE' : 'OFFLINE'}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ПРАВАЯ КОЛОНКА */}
                    <div>
                        <div className="glass side-block">
                            <h3 className="side-title">⚡ Быстрые действия</h3>
                            <button className="side-btn btn-primary" onClick={() => window.location.href = '/stream'}>🎥 Начать стрим</button>
                            <button className="side-btn btn-ghost" onClick={() => setShowSettings(true)}>⚙️ Настройки профиля</button>
                            <button className="side-btn btn-ghost">👥 Мои подписки</button>
                        </div>
                        <div className="glass side-block" style={{marginTop:12}}>
                            <h3 className="side-title">ℹ️ Информация</h3>
                            <div className="small-muted">
                                <p>🎯 <strong>Статус:</strong> {user?.is_verified ? '✅ Подтвержден' : '🟡 Не подтвержден'}</p>
                                <p>📅 <strong>Регистрация:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : 'Неизвестно'}</p>
                                <p>🌟 <strong>Достижения:</strong> {achievements.filter(a => a.progress >= a.total).length}/{achievements.length} выполнено</p>
                                {user?.last_login && <p>🕐 <strong>Последний вход:</strong> {new Date(user.last_login).toLocaleDateString('ru-RU')}</p>}
                                {selectedThemes.length > 0 && <p>🎯 <strong>Интересы:</strong> {selectedThemes.length} тем</p>}
                                {user?.phone && <p>📱 <strong>Телефон:</strong> {user.phone}</p>}
                                {user?.website && <p>🌐 <strong>Сайт:</strong> {user.website}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Profile