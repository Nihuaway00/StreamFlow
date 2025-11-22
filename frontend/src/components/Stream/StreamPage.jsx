import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { streamAPI } from '../../services/api'
import StreamPlayer from './StreamPlayer'

const StreamPage = () => {
  const { streamId } = useParams()
  const [stream, setStream] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStream = async () => {
      try {
        const response = await streamAPI.getStream(streamId)
        setStream(response.data)
      } catch (err) {
        setError('Стрим не найден')
        console.error('Error fetching stream:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStream()

    const interval = setInterval(fetchStream, 10000)
    return () => clearInterval(interval)
  }, [streamId])

  // Функция для получения русского названия тематики
  const getThemeDisplayName = (themeName) => {
    const themeNames = {
      'gaming': '🎮 Игры',
      'music': '🎵 Музыка', 
      'just_chatting': '💬 Общение'
    }
    return themeNames[themeName] || themeName
  }

  // Функция для получения цвета тематики
  const getThemeColor = (themeName) => {
    const themeColors = {
      'gaming': '#9147ff',
      'music': '#00ff7f',
      'just_chatting': '#00d2d3'
    }
    return themeColors[themeName] || '#9147ff'
  }

  if (loading) return (
    <div style={{ padding: '50px', textAlign: 'center', color: 'white' }}>
      <div style={{ fontSize: '32px', marginBottom: '10px' }}>⏳</div>
      Загрузка стрима...
    </div>
  )
  
  if (error) return (
    <div style={{ padding: '50px', textAlign: 'center', color: 'white' }}>
      <div style={{ fontSize: '32px', marginBottom: '10px' }}>❌</div>
      {error}
    </div>
  )
  
  if (!stream) return (
    <div style={{ padding: '50px', textAlign: 'center', color: 'white' }}>
      <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔍</div>
      Стрим не найден
    </div>
  )

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: '1fr 400px', 
      height: 'calc(100vh - 50px)',
      background: '#0e0e10'
    }}>
      
      {/* ЛЕВАЯ ЧАСТЬ - ВИДЕОПЛЕЕР И ИНФО */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        
        {/* ВИДЕОПЛЕЕР */}
        <StreamPlayer stream={stream} />
        
        {/* ИНФОРМАЦИЯ О СТРИМЕ */}
        <div style={{ padding: '20px', color: 'white' }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>{stream.title}</h1>
          <p style={{ color: '#adadb8', marginBottom: '15px' }}>
            {stream.description || 'Описание отсутствует'}
          </p>
          
          {/* ТЕМАТИКИ */}
          {stream.themes && stream.themes.length > 0 && (
            <div style={{ marginBottom: '15px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {stream.themes.map((theme, index) => (
                  <span
                    key={theme.id}
                    style={{
                      background: `${getThemeColor(theme.name)}20`,
                      color: getThemeColor(theme.name),
                      border: `1px solid ${getThemeColor(theme.name)}`,
                      padding: '4px 12px',
                      borderRadius: '16px',
                      fontSize: '12px',
                      fontWeight: '500',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {getThemeDisplayName(theme.name)}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '20px', color: '#adadb8', flexWrap: 'wrap' }}>
            <span>👁️ {stream.viewers_count || 0} зрителей</span>
            <span>👤 {stream.author?.username || 'Streamer'}</span>
            <span>📅 {new Date(stream.created_at).toLocaleDateString('ru-RU')}</span>
            {stream.started_at && (
              <span>⏱️ {new Date(stream.started_at).toLocaleTimeString('ru-RU')}</span>
            )}
          </div>
        </div>
      </div>

      {/* ПРАВАЯ ЧАСТЬ - ЧАТ */}
      <div style={{
        background: '#18181b',
        borderLeft: '1px solid #333',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <h3 style={{ color: 'white', marginBottom: '20px' }}>💬 Чат стрима</h3>
        
        <div style={{
          flex: 1,
          background: '#0e0e10',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px',
          color: '#adadb8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          <div>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>💬</div>
            <p>Чат будет доступен<br />в ближайшем обновлении</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Чат скоро будет доступен..."
            disabled
            style={{
              flex: 1,
              padding: '10px',
              background: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '4px',
              color: '#666',
              fontSize: '14px'
            }}
          />
          <button 
            disabled
            style={{
              background: '#333',
              color: '#666',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: 'not-allowed',
              fontSize: '14px'
            }}
          >
            Отправить
          </button>
        </div>
      </div>

    </div>
  )
}

export default StreamPage