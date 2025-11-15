import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { streamAPI } from '../../services/api'

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
  }, [streamId])

  if (loading) return (
    <div style={{ padding: '50px', textAlign: 'center', color: 'white' }}>
      Загрузка стрима...
    </div>
  )
  
  if (error) return (
    <div style={{ padding: '50px', textAlign: 'center', color: 'white' }}>
      {error}
    </div>
  )
  
  if (!stream) return (
    <div style={{ padding: '50px', textAlign: 'center', color: 'white' }}>
      Стрим не найден
    </div>
  )

  // Генерируем HLS URL на основе stream_key
  const hlsUrl = `http://localhost:8080/live/${stream.stream_key}/index.m3u8`

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
        <div style={{ 
          background: '#000', 
          height: '70vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative'
        }}>
          
          {stream.status === 'live' ? (
            // РЕАЛЬНЫЙ ВИДЕОПЛЕЕР
            <video 
              key={hlsUrl} // Важно для перезагрузки при смене стрима
              controls
              autoPlay
              muted
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain',
                backgroundColor: '#000'
              }}
            >
              <source src={hlsUrl} type="application/x-mpegURL" />
              Ваш браузер не поддерживает видео поток.
            </video>
          ) : (
            // ЗАГЛУШКА ЕСЛИ СТРИМ ОФФЛАЙН
            <div style={{ textAlign: 'center', color: 'white' }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>📺</div>
              <h2>Стрим завершен или неактивен</h2>
              <p style={{ color: '#adadb8' }}>Стример в данный момент не ведет трансляцию</p>
              {stream.stream_key && (
                <p style={{ color: '#9147ff', fontSize: '12px', marginTop: '20px' }}>
                  Stream Key: {stream.stream_key}
                </p>
              )}
            </div>
          )}

          {/* Бейдж LIVE */}
          {stream.status === 'live' && (
            <div style={{
              position: 'absolute',
              top: '10px',
              left: '10px',
              background: '#e91916',
              color: 'white',
              padding: '5px 10px',
              borderRadius: '4px',
              fontSize: '14px',
              fontWeight: 'bold',
              zIndex: 10
            }}>
              🔴 LIVE
            </div>
          )}
        </div>
        
        {/* ИНФОРМАЦИЯ О СТРИМЕ */}
        <div style={{ padding: '20px', color: 'white' }}>
          <h1 style={{ margin: '0 0 10px 0', fontSize: '24px' }}>{stream.title}</h1>
          <p style={{ color: '#adadb8', marginBottom: '15px' }}>
            {stream.description || 'Описание отсутствует'}
          </p>
          <div style={{ display: 'flex', gap: '20px', color: '#adadb8' }}>
            <span>👁️ {stream.viewers_count || 0} зрителей</span>
            <span>🎮 {stream.category || 'Игры'}</span>
            <span>👤 {stream.author?.username || 'Streamer'}</span>
          </div>
          {/* ДЛЯ ОТЛАДКИ - показываем stream_key */}
          {stream.stream_key && (
            <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
              Stream Key: {stream.stream_key}
            </div>
          )}
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
          {stream.status === 'live' ? (
            <div>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>💬</div>
              <p>Чат будет доступен когда<br />стрим будет активен</p>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🔒</div>
              <p>Чат недоступен<br />Стрим оффлайн</p>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Напишите сообщение..."
            disabled={stream.status !== 'live'}
            style={{
              flex: 1,
              padding: '10px',
              background: stream.status === 'live' ? '#0e0e10' : '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '4px',
              color: stream.status === 'live' ? 'white' : '#666',
              fontSize: '14px'
            }}
          />
          <button 
            disabled={stream.status !== 'live'}
            style={{
              background: stream.status === 'live' ? '#9147ff' : '#333',
              color: stream.status === 'live' ? 'white' : '#666',
              border: 'none',
              padding: '10px 15px',
              borderRadius: '4px',
              cursor: stream.status === 'live' ? 'pointer' : 'not-allowed',
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