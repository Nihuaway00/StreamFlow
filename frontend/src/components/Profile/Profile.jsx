import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'

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
    
    // Новые состояния для формы бэк круто
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

    // Функция для исправления URL аватара
    const fixAvatarUrl = (avatarUrl) => {
        if (!avatarUrl) return null;
        
        // Если это уже полный URL с http, возвращаем как есть
        if (avatarUrl.startsWith('http')) {
            return avatarUrl;
        }
        
        // Если это внутренний Docker URL (storage:9000), заменяем на правильный
        if (avatarUrl.includes('storage:9000')) {
            // Заменяем на localhost или внешний URL
            return avatarUrl.replace('storage:9000', 'localhost:9000');
        }
        
        // Если это просто file_key, используем API для получения URL
        if (!avatarUrl.includes('://')) {
            return `http://localhost:8000/api/files/?file_key=${avatarUrl}`;
        }
        
        return avatarUrl;
    }

    // Функция для получения URL аватара через API
    const getAvatarUrl = async (fileKey) => {
        if (!fileKey) return null;
        
        try {
            // Сначала пытаемся получить URL через API
            const response = await api.post('/files/', null, {
                params: { file_key: fileKey }
            });
            
            let avatarUrl = response.data;
            
            // Исправляем URL если он внутренний
            avatarUrl = fixAvatarUrl(avatarUrl);
            
            return avatarUrl;
        } catch (error) {
            console.error('Error getting avatar URL from API:', error);
            
            // Fallback: создаем URL напрямую
            return fixAvatarUrl(fileKey);
        }
    }

    // Загружаем данные при монтировании
    useEffect(() => {
        if (!user) return;

        // Загружаем аватар если есть avatar_url
        const loadAvatar = async () => {
            if (user.avatar_url) {
                try {
                    console.log('🔄 Загрузка аватара:', user.avatar_url);
                    const avatarUrl = await getAvatarUrl(user.avatar_url);
                    console.log('✅ Получен URL аватара:', avatarUrl);
                    setAvatarPreview(avatarUrl);
                } catch (error) {
                    console.error('❌ Ошибка загрузки аватара:', error);
                    // Fallback на прямой URL
                    const fallbackUrl = fixAvatarUrl(user.avatar_url);
                    console.log('🔄 Использую fallback URL:', fallbackUrl);
                    setAvatarPreview(fallbackUrl);
                }
            } else {
                console.log('ℹ️ Аватар не установлен');
            }
        };

        // Загружаем стримы пользователя
        const fetchUserStreams = async () => {
            try {
                const response = await api.get('/streams/my');
                setUserStreams(response.data || []);
            } catch (error) {
                console.error('Error fetching user streams:', error);
            } finally {
                setStreamsLoading(false);
            }
        };

        // Загружаем тематики с бэкенда
        const fetchThemes = async () => {
            try {
                const response = await api.get('/themes/');
                setBackendThemes(response.data);
            } catch (error) {
                console.error('Error fetching themes:', error);
            } finally {
                setThemesLoading(false);
            }
        };

        loadAvatar();
        fetchUserStreams();
        fetchThemes();
        setUsername(user.username || '');
        
        // Заполняем форму данными пользователя
        setFormData({
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            bio: user?.bio || '',
            phone: user?.phone || '',
            date_of_birth: user?.date_of_birth || '',
            country: user?.country || '',
            city: user?.city || '',
            website: user?.website || ''
        });
    }, [user])

    // Обновляем аватар когда обновляются данные пользователя
    useEffect(() => {
        if (user?.avatar_url) {
            const loadNewAvatar = async () => {
                try {
                    const avatarUrl = await getAvatarUrl(user.avatar_url);
                    setAvatarPreview(avatarUrl);
                } catch (error) {
                    console.error('Error loading new avatar:', error);
                    const fallbackUrl = fixAvatarUrl(user.avatar_url);
                    setAvatarPreview(fallbackUrl);
                }
            };
            loadNewAvatar();
        }
    }, [user?.avatar_url]);

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

            console.log('🔄 Загрузка аватара...')

            const response = await api.post('/users/me', uploadData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            console.log("✅ Ответ от сервера:", response.data)

            // Обновляем пользователя
            updateUser(response.data)
            
            // Сразу показываем превью загруженного файла
            setAvatarPreview(URL.createObjectURL(avatarFile))
            setAvatarFile(null)
            
            // Обновляем аватар с сервера
            if (response.data.avatar_url) {
                try {
                    const newAvatarUrl = await getAvatarUrl(response.data.avatar_url);
                    setAvatarPreview(newAvatarUrl);
                } catch (error) {
                    console.error('Error loading new avatar URL:', error);
                    const fallbackUrl = fixAvatarUrl(response.data.avatar_url);
                    setAvatarPreview(fallbackUrl);
                }
            }
            
            alert("Аватар успешно обновлён!")

        } catch (error) {
            console.error('❌ Ошибка загрузки аватара:', error)
            alert('Ошибка при загрузке аватара')
        } finally {
            setIsUploading(false)
        }
    }

    const handleFileSelect = (event) => {
        const file = event.target.files[0]
        if (file) {
            // Проверяем размер файла (максимум 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Файл слишком большой. Максимальный размер: 5MB')
                return
            }

            // Проверяем тип файла
            if (!file.type.startsWith('image/')) {
                alert('Пожалуйста, выберите изображение')
                return
            }

            setAvatarFile(file)
            setAvatarPreview(URL.createObjectURL(file))
        }
    }

    // Обработчик изменения полей формы
    const handleInputChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    // Сохранение настроек профиля
    const handleSaveSettings = async () => {
        try {
            setSaveLoading(true)
            
            // Создаем FormData для отправки
            const submitData = new FormData()
            
            // Добавляем текстовые поля
            Object.keys(formData).forEach(key => {
                if (formData[key]) {
                    submitData.append(key, formData[key])
                }
            })
            
            // Добавляем аватар если есть
            if (avatarFile) {
                submitData.append('avatar', avatarFile)
            }

            console.log('💾 Сохранение настроек профиля...')
            const response = await api.post('/users/me', submitData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })

            console.log("✅ Настройки сохранены:", response.data)
            updateUser(response.data)
            
            // Обновляем аватар если он был загружен
            if (response.data.avatar_url && avatarFile) {
                try {
                    const newAvatarUrl = await getAvatarUrl(response.data.avatar_url);
                    setAvatarPreview(newAvatarUrl);
                } catch (error) {
                    console.error('Error loading new avatar URL:', error);
                    const fallbackUrl = fixAvatarUrl(response.data.avatar_url);
                    setAvatarPreview(fallbackUrl);
                }
            }
            
            alert('Настройки успешно сохранены!')
            setShowSettings(false)
            
        } catch (error) {
            console.error('❌ Ошибка сохранения настроек:', error)
            alert('Ошибка при сохранении настроек')
        } finally {
            setSaveLoading(false)
        }
    }

    const handleUsernameChange = (e) => {
        if (!usernameChanged) {
            setUsername(e.target.value)
        }
    }

    // Функция для получения русского названия тематики
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

    return (
        <div style={{padding: '20px', maxWidth: '1000px', margin: '0 auto'}}>

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
                    width: '80px',
                    height: '80px',
                    background: avatarPreview ? 'transparent' : 'linear-gradient(45deg, #9147ff, #772ce8)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: 'white',
                    cursor: 'pointer',
                    position: 'relative',
                    overflow: 'hidden'
                }}
                     onClick={() => document.getElementById('avatar-input-main').click()}
                     title="Нажмите чтобы сменить аватар">
                    {avatarPreview ? (
                        <img
                            src={avatarPreview}
                            alt="Avatar"
                            style={{width: '100%', height: '100%', objectFit: 'cover'}}
                            onError={(e) => {
                                console.error('❌ Ошибка загрузки изображения аватара:', avatarPreview);
                                e.target.style.display = 'none';
                            }}
                        />
                    ) : null}
                    {(!avatarPreview) && (
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
                    )}
                    <input
                        id="avatar-input-main"
                        type="file"
                        accept="image/*"
                        style={{display: 'none'}}
                        onChange={handleFileSelect}
                    />
                    <div style={{
                        position: 'absolute',
                        bottom: '2px',
                        right: '2px',
                        background: '#9147ff',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '10px'
                    }}>
                        ✏️
                    </div>
                </div>

                <div style={{flex: 1}}>
                    <h1 style={{margin: '0 0 5px 0', fontSize: '24px'}}>
                        {user?.username || 'Пользователь'}
                    </h1>
                    {user?.first_name && user?.last_name && (
                        <p style={{margin: '0 0 5px 0', color: '#adadb8'}}>
                            {user.first_name} {user.last_name}
                        </p>
                    )}
                    <p style={{margin: 0, color: '#adadb8'}}>
                        {user?.email || 'email@example.com'}
                    </p>
                    {user?.bio && (
                        <p style={{margin: '10px 0 0 0', color: '#efeff1', fontStyle: 'italic'}}>
                            "{user.bio}"
                        </p>
                    )}
                    {(user?.country || user?.city) && (
                        <p style={{margin: '5px 0 0 0', color: '#9147ff', fontSize: '14px'}}>
                            📍 {[user?.city, user?.country].filter(Boolean).join(', ')}
                        </p>
                    )}
                </div>

                <div style={{display: 'flex', gap: '10px'}}>
                    <button
                        onClick={() => setShowSettings(true)}
                        style={{
                            background: '#9147ff',
                            color: 'white',
                            border: 'none',
                            padding: '10px 20px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        ⚙️ Настройки
                    </button>
                    <button
                        onClick={logout}
                        style={{
                            background: 'transparent',
                            color: '#efeff1',
                            border: '1px solid #333',
                            padding: '10px 20px',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '14px'
                        }}
                    >
                        Выйти
                    </button>
                </div>
            </div>

            {/* МОДАЛЬНОЕ ОКНО НАСТРОЕК */}
            {showSettings && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        background: '#18181b',
                        borderRadius: '12px',
                        padding: '30px',
                        width: '90%',
                        maxWidth: '600px',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        border: '1px solid #333'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '25px'
                        }}>
                            <h2 style={{margin: 0, fontSize: '24px'}}>⚙️ Настройки профиля</h2>
                            <button
                                onClick={() => setShowSettings(false)}
                                style={{
                                    background: 'transparent',
                                    color: '#adadb8',
                                    border: 'none',
                                    fontSize: '20px',
                                    cursor: 'pointer',
                                    padding: '5px'
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* СМЕНА АВАТАРКИ */}
                        <div style={{marginBottom: '25px'}}>
                            <h3 style={{marginBottom: '15px', color: '#efeff1'}}>🖼️ Аватарка</h3>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '15px'
                            }}>
                                <div
                                    style={{
                                        width: '60px',
                                        height: '60px',
                                        background: avatarPreview ? 'transparent' : 'linear-gradient(45deg, #9147ff, #772ce8)',
                                        borderRadius: '50%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '24px',
                                        fontWeight: 'bold',
                                        color: 'white',
                                        overflow: 'hidden',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => document.getElementById('avatar-input-modal').click()}
                                >
                                    {avatarPreview ? (
                                        <img
                                            src={avatarPreview}
                                            alt="Preview"
                                            style={{width: '100%', height: '100%', objectFit: 'cover'}}
                                            onError={(e) => {
                                                console.error('Error loading avatar preview');
                                                e.target.style.display = 'none';
                                            }}
                                        />
                                    ): (
                                        <div style={{
                                            width: '100%',
                                            height: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            background: 'linear-gradient(45deg, #9147ff, #772ce8)',
                                            color: 'white',
                                            fontSize: '24px',
                                            fontWeight: 'bold'
                                        }}>
                                            {username.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <input
                                        id="avatar-input-modal"
                                        type="file"
                                        accept="image/*"
                                        style={{display: 'none'}}
                                        onChange={handleFileSelect}
                                    />
                                </div>
                                <div>
                                    <p style={{margin: '0 0 8px 0', color: '#adadb8', fontSize: '14px'}}>
                                        Нажмите на аватар для загрузки нового
                                    </p>
                                    <button
                                        onClick={() => document.getElementById('avatar-input-modal').click()}
                                        style={{
                                            background: '#333',
                                            color: '#efeff1',
                                            border: '1px solid #444',
                                            padding: '8px 16px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '14px',
                                            marginRight: '10px'
                                        }}
                                    >
                                        📁 Выбрать файл
                                    </button>
                                    {avatarFile && (
                                        <button
                                            onClick={handleAvatarUpload}
                                            disabled={isUploading}
                                            style={{
                                                background: isUploading ? '#666' : '#9147ff',
                                                color: 'white',
                                                border: 'none',
                                                padding: '8px 16px',
                                                borderRadius: '4px',
                                                cursor: isUploading ? 'not-allowed' : 'pointer',
                                                fontSize: '14px'
                                            }}
                                        >
                                            {isUploading ? '📤 Загрузка...' : '💾 Сохранить'}
                                        </button>
                                    )}
                                </div>
                            </div>
                            {avatarFile && (
                                <p style={{margin: '10px 0 0 0', color: '#adadb8', fontSize: '12px'}}>
                                    Выбран файл: {avatarFile.name} ({(avatarFile.size / 1024 / 1024).toFixed(2)} MB)
                                </p>
                            )}
                        </div>

                        {/* ОСНОВНАЯ ИНФОРМАЦИЯ */}
                        <div style={{marginBottom: '25px'}}>
                            <h3 style={{marginBottom: '15px', color: '#efeff1'}}>👤 Основная информация</h3>
                            
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px'}}>
                                <div>
                                    <label style={{display: 'block', marginBottom: '5px', color: '#adadb8', fontSize: '14px'}}>
                                        Имя
                                    </label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            background: '#0e0e10',
                                            border: '1px solid #444',
                                            borderRadius: '4px',
                                            color: 'white',
                                            fontSize: '14px'
                                        }}
                                        placeholder="Ваше имя"
                                    />
                                </div>
                                <div>
                                    <label style={{display: 'block', marginBottom: '5px', color: '#adadb8', fontSize: '14px'}}>
                                        Фамилия
                                    </label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleInputChange}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            background: '#0e0e10',
                                            border: '1px solid #444',
                                            borderRadius: '4px',
                                            color: 'white',
                                            fontSize: '14px'
                                        }}
                                        placeholder="Ваша фамилия"
                                    />
                                </div>
                            </div>

                            <div style={{marginBottom: '15px'}}>
                                <label style={{display: 'block', marginBottom: '5px', color: '#adadb8', fontSize: '14px'}}>
                                    О себе
                                </label>
                                <textarea
                                    name="bio"
                                    value={formData.bio}
                                    onChange={handleInputChange}
                                    rows="3"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: '#0e0e10',
                                        border: '1px solid #444',
                                        borderRadius: '4px',
                                        color: 'white',
                                        fontSize: '14px',
                                        resize: 'vertical'
                                    }}
                                    placeholder="Расскажите о себе..."
                                />
                            </div>
                        </div>

                        {/* КОНТАКТНАЯ ИНФОРМАЦИЯ */}
                        <div style={{marginBottom: '25px'}}>
                            <h3 style={{marginBottom: '15px', color: '#efeff1'}}>📞 Контактная информация</h3>
                            
                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px'}}>
                                <div>
                                    <label style={{display: 'block', marginBottom: '5px', color: '#adadb8', fontSize: '14px'}}>
                                        Телефон
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            background: '#0e0e10',
                                            border: '1px solid #444',
                                            borderRadius: '4px',
                                            color: 'white',
                                            fontSize: '14px'
                                        }}
                                        placeholder="+7 (XXX) XXX-XX-XX"
                                    />
                                </div>
                                <div>
                                    <label style={{display: 'block', marginBottom: '5px', color: '#adadb8', fontSize: '14px'}}>
                                        Дата рождения
                                    </label>
                                    <input
                                        type="date"
                                        name="date_of_birth"
                                        value={formData.date_of_birth}
                                        onChange={handleInputChange}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            background: '#0e0e10',
                                            border: '1px solid #444',
                                            borderRadius: '4px',
                                            color: 'white',
                                            fontSize: '14px'
                                        }}
                                    />
                                </div>
                            </div>

                            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px'}}>
                                <div>
                                    <label style={{display: 'block', marginBottom: '5px', color: '#adadb8', fontSize: '14px'}}>
                                        Страна
                                    </label>
                                    <input
                                        type="text"
                                        name="country"
                                        value={formData.country}
                                        onChange={handleInputChange}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            background: '#0e0e10',
                                            border: '1px solid #444',
                                            borderRadius: '4px',
                                            color: 'white',
                                            fontSize: '14px'
                                        }}
                                        placeholder="Страна"
                                    />
                                </div>
                                <div>
                                    <label style={{display: 'block', marginBottom: '5px', color: '#adadb8', fontSize: '14px'}}>
                                        Город
                                    </label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            background: '#0e0e10',
                                            border: '1px solid #444',
                                            borderRadius: '4px',
                                            color: 'white',
                                            fontSize: '14px'
                                        }}
                                        placeholder="Город"
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{display: 'block', marginBottom: '5px', color: '#adadb8', fontSize: '14px'}}>
                                    Веб-сайт
                                </label>
                                <input
                                    type="url"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleInputChange}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: '#0e0e10',
                                        border: '1px solid #444',
                                        borderRadius: '4px',
                                        color: 'white',
                                        fontSize: '14px'
                                    }}
                                    placeholder="https://example.com"
                                />
                            </div>
                        </div>

                        {/* ТЕМАТИКИ С БЭКЕНДА */}
                        <div style={{marginBottom: '30px'}}>
                            <h3 style={{marginBottom: '15px', color: '#efeff1'}}>🎯 Интересные тематики</h3>
                            <p style={{margin: '0 0 15px 0', color: '#adadb8', fontSize: '14px'}}>
                                Выберите темы, которые вам интересны (для рекомендаций)
                            </p>
                            {themesLoading ? (
                                <p style={{color: '#adadb8', fontSize: '14px'}}>Загрузка тематик...</p>
                            ) : (
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                    gap: '10px'
                                }}>
                                    {backendThemes.map((theme) => (
                                        <button
                                            key={theme.id}
                                            onClick={() => handleThemeToggle(theme.name)}
                                            style={{
                                                background: selectedThemes.includes(theme.name) ? '#9147ff' : '#333',
                                                color: 'white',
                                                border: 'none',
                                                padding: '10px',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '14px',
                                                textAlign: 'left',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            {getThemeDisplayName(theme.name)}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* КНОПКИ */}
                        <div style={{
                            display: 'flex',
                            gap: '10px',
                            justifyContent: 'flex-end'
                        }}>
                            <button
                                onClick={() => setShowSettings(false)}
                                style={{
                                    background: 'transparent',
                                    color: '#efeff1',
                                    border: '1px solid #333',
                                    padding: '12px 24px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Отмена
                            </button>
                            <button
                                onClick={handleSaveSettings}
                                disabled={saveLoading}
                                style={{
                                    background: saveLoading ? '#666' : '#9147ff',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '4px',
                                    cursor: saveLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                }}
                            >
                                {saveLoading ? '💾 Сохранение...' : '💾 Сохранить изменения'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ОСТАЛЬНАЯ ЧАСТЬ ПРОФИЛЯ */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr',
                gap: '20px'
            }}>

                {/* ЛЕВАЯ КОЛОНКА - ОСНОВНАЯ ИНФА */}
                <div>

                    {/* ДОСТИЖЕНИЯ */}
                    <div style={{
                        background: '#18181b',
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '20px',
                        border: '1px solid #333'
                    }}>
                        <h2 style={{marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px'}}>
                            🏆 Достижения
                            <span style={{
                                background: '#9147ff',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 'normal'
                            }}>
                                {achievements.filter(a => a.progress >= a.total).length}/{achievements.length}
                            </span>
                        </h2>

                        <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                            {achievements.map((achievement) => {
                                const progressPercent = calculateProgress(achievement.progress, achievement.total)
                                const isCompleted = achievement.progress >= achievement.total

                                return (
                                    <div key={achievement.id} style={{
                                        background: isCompleted ? `${achievement.color}20` : '#0e0e10',
                                        border: `1px solid ${isCompleted ? achievement.color : '#333'}`,
                                        borderRadius: '8px',
                                        padding: '15px',
                                        position: 'relative',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            height: '100%',
                                            width: `${progressPercent}%`,
                                            background: `${achievement.color}30`,
                                            transition: 'width 0.3s ease'
                                        }}/>

                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '15px',
                                            position: 'relative',
                                            zIndex: 1
                                        }}>
                                            <div style={{
                                                width: '40px',
                                                height: '40px',
                                                background: isCompleted ? achievement.color : '#333',
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '18px',
                                                flexShrink: 0
                                            }}>
                                                {achievement.icon}
                                            </div>

                                            <div style={{flex: 1}}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    marginBottom: '5px'
                                                }}>
                                                    <h3 style={{
                                                        margin: 0,
                                                        color: isCompleted ? achievement.color : '#efeff1',
                                                        fontSize: '16px'
                                                    }}>
                                                        {achievement.title}
                                                    </h3>
                                                    {isCompleted && (
                                                        <span style={{
                                                            background: achievement.color,
                                                            color: 'white',
                                                            padding: '2px 6px',
                                                            borderRadius: '4px',
                                                            fontSize: '10px',
                                                            fontWeight: 'bold'
                                                        }}>
                                                            ✅ Выполнено
                                                        </span>
                                                    )}
                                                </div>

                                                <p style={{
                                                    margin: '0 0 8px 0',
                                                    color: '#adadb8',
                                                    fontSize: '14px'
                                                }}>
                                                    {achievement.description}
                                                </p>

                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '10px',
                                                    fontSize: '12px'
                                                }}>
                                                    <div style={{
                                                        flex: 1,
                                                        height: '6px',
                                                        background: '#333',
                                                        borderRadius: '3px',
                                                        overflow: 'hidden'
                                                    }}>
                                                        <div style={{
                                                            height: '100%',
                                                            width: `${progressPercent}%`,
                                                            background: achievement.color,
                                                            borderRadius: '3px',
                                                            transition: 'width 0.3s ease'
                                                        }}/>
                                                    </div>

                                                    <span style={{
                                                        color: isCompleted ? achievement.color : '#adadb8',
                                                        minWidth: '60px',
                                                        fontWeight: isCompleted ? 'bold' : 'normal'
                                                    }}>
                                                        {achievement.progress}/{achievement.total}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* МОИ СТРИМЫ */}
                    <div style={{
                        background: '#18181b',
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '20px',
                        border: '1px solid #333'
                    }}>
                        <h2 style={{marginBottom: '15px'}}>🎥 Мои стримы</h2>
                        
                        {streamsLoading ? (
                            <div style={{
                                background: '#0e0e10',
                                padding: '15px',
                                borderRadius: '4px',
                                textAlign: 'center',
                                color: '#adadb8'
                            }}>
                                <p>Загрузка стримов...</p>
                            </div>
                        ) : userStreams.length === 0 ? (
                            <div style={{
                                background: '#0e0e10',
                                padding: '15px',
                                borderRadius: '4px',
                                textAlign: 'center',
                                color: '#adadb8'
                            }}>
                                <p>У вас пока нет стримов</p>
                                <button style={{
                                    background: '#9147ff',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 20px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginTop: '10px'
                                }}>
                                    🎥 Начать первый стрим
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {(Array.isArray(userStreams) ? userStreams.slice(0, 3) : []).map((stream, index) => (
                                    <div key={stream.id} style={{
                                        background: '#0e0e10',
                                        padding: '15px',
                                        borderRadius: '4px',
                                        border: '1px solid #333'
                                    }}>
                                        <h4 style={{ margin: '0 0 8px 0', color: '#efeff1' }}>
                                            {stream.title}
                                        </h4>
                                        <p style={{ margin: '0 0 8px 0', color: '#adadb8', fontSize: '14px' }}>
                                            {stream.description || 'Без описания'}
                                        </p>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#adadb8' }}>
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
                                ))}
                            </div>
                        )}
                    </div>

                </div>

                {/* ПРАВАЯ КОЛОНКА - БЫСТРЫЕ ДЕЙСТВИЯ */}
                <div>

                    {/* БЫСТРЫЕ ДЕЙСТВИЯ */}
                    <div style={{
                        background: '#18181b',
                        borderRadius: '8px',
                        padding: '20px',
                        marginBottom: '20px',
                        border: '1px solid #333'
                    }}>
                        <h3 style={{marginBottom: '15px'}}>⚡ Быстрые действия</h3>
                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                            <button style={{
                                background: '#9147ff',
                                color: 'white',
                                border: 'none',
                                padding: '12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                textAlign: 'left'
                            }}>
                                🎥 Начать стрим
                            </button>
                            <button
                                onClick={() => setShowSettings(true)}
                                style={{
                                    background: '#333',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    textAlign: 'left'
                                }}
                            >
                                ⚙️ Настройки профиля
                            </button>
                            <button style={{
                                background: '#333',
                                color: 'white',
                                border: 'none',
                                padding: '12px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                textAlign: 'left'
                            }}>
                                👥 Мои подписки
                            </button>
                        </div>
                    </div>

                    {/* ИНФОРМАЦИЯ */}
                    <div style={{
                        background: '#18181b',
                        borderRadius: '8px',
                        padding: '20px',
                        border: '1px solid #333'
                    }}>
                        <h3 style={{marginBottom: '15px'}}>ℹ️ Информация</h3>
                        <div style={{color: '#adadb8', fontSize: '14px', lineHeight: '1.5'}}>
                            <p>🎯 <strong>Статус:</strong> {user?.is_verified ? '✅ Подтвержден' : '🟡 Не подтвержден'}</p>
                            <p>📅 <strong>Регистрация:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString('ru-RU') : 'Неизвестно'}</p>
                            <p>🌟 <strong>Достижения:</strong> {achievements.filter(a => a.progress >= a.total).length}/{achievements.length} выполнено</p>
                            {user?.last_login && (
                                <p>🕐 <strong>Последний вход:</strong> {new Date(user.last_login).toLocaleDateString('ru-RU')}</p>
                            )}
                            {selectedThemes.length > 0 && (
                                <p>🎯 <strong>Интересы:</strong> {selectedThemes.length} тем</p>
                            )}
                            {user?.phone && <p>📱 <strong>Телефон:</strong> {user.phone}</p>}
                            {user?.website && <p>🌐 <strong>Сайт:</strong> {user.website}</p>}
                        </div>
                    </div>

                </div>

            </div>

        </div>
    )
}

export default Profile