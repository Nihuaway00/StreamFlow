import React, { useRef, useEffect, useState } from 'react'
import Hls from 'hls.js'

const StreamPlayer = ({ stream }) => {
  const videoRef = useRef(null)
  const [hls, setHls] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video || stream.status !== 'live') return

    let hlsInstance = null

    const initializePlayer = () => {
      if (Hls.isSupported()) {
        hlsInstance = new Hls({
          enableWorker: false, // Для лучшей производительности
          lowLatencyMode: true,
          backBufferLength: 90
        })

        hlsInstance.loadSource(stream.hls_url)
        hlsInstance.attachMedia(video)

        hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(e => {
            console.log('Auto-play prevented:', e)
          })
        })

        hlsInstance.on(Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.log('Network error, trying to recover...')
                hlsInstance.startLoad()
                break
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.log('Media error, recovering...')
                hlsInstance.recoverMediaError()
                break
              default:
                console.log('Fatal error, destroying HLS')
                hlsInstance.destroy()
                setError('Ошибка воспроизведения стрима')
                break
            }
          }
        })

        setHls(hlsInstance)
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS support
        video.src = stream.hls_url
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(e => {
            console.log('Auto-play prevented:', e)
          })
        })
      } else {
        setError('Ваш браузер не поддерживает HLS стриминг')
      }
    }

    initializePlayer()

    // Cleanup function
    return () => {
      if (hlsInstance) {
        hlsInstance.destroy()
      }
    }
  }, [stream.hls_url, stream.status])

  // Обработчик изменения качества (можно добавить UI для выбора качества)
  const changeQuality = (level) => {
    if (hls) {
      hls.currentLevel = level
    }
  }

  if (stream.status !== 'live') {
    return (
      <div style={{ 
        background: '#000', 
        height: '70vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📺</div>
          <h2>Стрим завершен или неактивен</h2>
          <p>Стример в данный момент не ведет трансляцию</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ 
        background: '#000', 
        height: '70vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        position: 'relative'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>❌</div>
          <h2>Ошибка воспроизведения</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              background: '#9147ff',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Попробовать снова
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      background: '#000', 
      height: '70vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      position: 'relative'
    }}>
      <video 
        ref={videoRef}
        controls
        autoPlay
        muted // Добавляем muted для автовоспроизведения
        style={{ 
          width: '100%', 
          height: '100%', 
          objectFit: 'contain',
          backgroundColor: '#000'
        }}
        playsInline // Для iOS
      >
        Ваш браузер не поддерживает видео.
      </video>

      {/* Бейдж LIVE */}
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

      {/* Информация о качестве (опционально) */}
      {hls && (
        <div style={{
          position: 'absolute',
          bottom: '10px',
          right: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '5px 10px',
          borderRadius: '4px',
          fontSize: '12px',
          zIndex: 10
        }}>
          HLS.js
        </div>
      )}
    </div>
  )
}

export default StreamPlayer