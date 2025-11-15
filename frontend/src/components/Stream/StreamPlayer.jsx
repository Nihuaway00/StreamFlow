import React from 'react'

const StreamPlayer = ({ stream }) => {
  return (
    <div style={{ 
      background: '#000', 
      height: '70vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      position: 'relative'
    }}>
      
      {stream.status === 'live' ? (
        // Здесь будет настоящий видеоплеер
        <video 
          controls
          autoPlay
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        >
          <source src={stream.hls_url} type="application/x-mpegURL" />
          Ваш браузер не поддерживает видео.
        </video>
      ) : (
        // Заглушка если стрим оффлайн
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>📺</div>
          <h2>Стрим завершен или неактивен</h2>
          <p>Стример в данный момент не ведет трансляцию</p>
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
          fontWeight: 'bold'
        }}>
          LIVE
        </div>
      )}
    </div>
  )
}

export default StreamPlayer