import React from 'react'

const StreamList = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ marginBottom: '20px', color: '#efeff1' }}>Популярные стримы</h1>
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {/* Временный контент */}
        <div style={{
          background: '#18181b',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid #333',
          padding: '20px',
          textAlign: 'center',
          color: '#efeff1'
        }}>
          <h3>Тестовый стрим 1</h3>
          <p>Streamer: testuser</p>
          <span style={{ 
            background: '#e91916',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '12px'
          }}>
            LIVE
          </span>
        </div>
      </div>
    </div>
  )
}

export default StreamList