import React, { useRef, useEffect, useState } from 'react';
import Hls from 'hls.js';

const HlsVideoPlayer = ({ streamKey, streamTitle }) => {
  const videoRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const hlsRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !streamKey) return;

    const hlsUrl = `http://localhost:8080/live/${streamKey}/index.m3u8`;
    console.log('🔄 Loading HLS stream:', hlsUrl);

    // Очищаем предыдущий HLS
    if (hlsRef.current) {
      hlsRef.current.destroy();
    }

    if (Hls.isSupported()) {
      // Chrome, Firefox, Edge
      const hls = new Hls({
        debug: false,
        enableWorker: false, // Для лучшей совместимости
        lowLatencyMode: true,
        backBufferLength: 90
      });

      hlsRef.current = hls;

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log('✅ Stream loaded successfully');
        setLoading(false);
        setError(null);
        video.play().catch(err => {
          console.log('⚠️ Auto-play prevented:', err);
          setError('Нажмите play для начала просмотра');
        });
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error('❌ HLS Error:', data);
        if (data.fatal) {
          setLoading(false);
          switch(data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              setError('📡 Стрим не найден. Проверьте что трансляция активна и OBS запущен');
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              setError('🎬 Ошибка видео потока. Перезагрузите страницу');
              hls.recoverMediaError();
              break;
            default:
              setError('❌ Ошибка загрузки стрима');
              break;
          }
        }
      });

    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari
      video.src = hlsUrl;
      
      video.addEventListener('loadedmetadata', () => {
        console.log('✅ Stream loaded successfully (Safari)');
        setLoading(false);
        setError(null);
        video.play().catch(err => {
          console.log('⚠️ Auto-play prevented:', err);
          setError('Нажмите play для начала просмотра');
        });
      });

      video.addEventListener('error', () => {
        setLoading(false);
        setError('❌ Не удалось загрузить стрим. Проверьте трансляцию');
      });
    } else {
      setLoading(false);
      setError('🚫 Ваш браузер не поддерживает HLS видео');
    }

    // Очистка при размонтировании
    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [streamKey]);

  const retryStream = () => {
    setLoading(true);
    setError(null);
    // Эффект перезапустится сам из-за изменения состояния
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <video
        ref={videoRef}
        controls
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#000',
          display: loading || error ? 'none' : 'block'
        }}
        title={streamTitle}
      />
      
      {/* Индикатор загрузки */}
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          textAlign: 'center',
          background: 'rgba(0,0,0,0.8)',
          padding: '20px',
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>⏳</div>
          <div>Загрузка стрима...</div>
          <div style={{ fontSize: '12px', color: '#adadb8', marginTop: '5px' }}>
            Ключ: {streamKey}
          </div>
        </div>
      )}
      
      {/* Сообщение об ошибке */}
      {error && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          color: '#ff6b6b',
          textAlign: 'center',
          background: 'rgba(0,0,0,0.9)',
          padding: '30px',
          borderRadius: '8px',
          border: '1px solid #ff6b6b',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '15px' }}>❌</div>
          <div style={{ marginBottom: '15px' }}>{error}</div>
          <button 
            onClick={retryStream}
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
            🔄 Повторить попытку
          </button>
        </div>
      )}
    </div>
  );
};

export default HlsVideoPlayer;