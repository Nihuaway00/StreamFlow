import React, { useState, useEffect } from 'react'
import { filesAPI } from '../../services/api'

const extractFileKey = (url) => {
  if (!url) return null
  
  if (typeof url === 'string' && 
    !url.includes('://') && 
    !url.startsWith('/')) {
    return url
  }
  
  try {
    if (url.startsWith('/')) {
      return url.substring(1)
    }
    
    const parsedUrl = new URL(url)
    return parsedUrl.pathname.substring(1)
  } catch (error) {
    return url
  }
}

const Thumbnail = ({ previewUrl, alt = 'Превью стрима', className = '', ...props }) => {
  const [imgUrl, setImgUrl] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadImage = async () => {
      if (!previewUrl) {
        setImgUrl('/no-preview.jpg')  // ← ИЗМЕНИЛ НА '/no-preview.jpg'
        setLoading(false)
        return
      }
      
      // Проверяем, не является ли уже URL
      if (previewUrl.startsWith('http') || previewUrl.startsWith('data:') || previewUrl.startsWith('/')) {
        // Если это уже полный URL или data URL
        if (previewUrl.includes('storage:9000')) {
          // Исправляем URL для локальной разработки
          setImgUrl(previewUrl.replace('storage:9000', 'localhost:9000'))
        } else {
          setImgUrl(previewUrl)
        }
        setLoading(false)
        return
      }
      
      // Если это file_key или относительный путь
      try {
        setLoading(true)
        const fileKey = extractFileKey(previewUrl)
        if (fileKey) {
          const response = await filesAPI.getFileUrl(fileKey)
          let url = response.data
          if (url && url.includes('storage:9000')) {
            url = url.replace('storage:9000', 'localhost:9000')
          }
          setImgUrl(url)
        } else {
          setImgUrl('/no-preview.jpg')  // ← ИЗМЕНИЛ НА '/no-preview.jpg'
        }
      } catch (error) {
        console.error('Ошибка загрузки превью:', error)
        setImgUrl('/no-preview.jpg')  // ← ИЗМЕНИЛ НА '/no-preview.jpg'
      } finally {
        setLoading(false)
      }
    }
    
    loadImage()
  }, [previewUrl])

  if (loading) {
    return (
      <div className={`thumbnail-loading ${className}`} style={{...props.style, background: '#18181b'}}>
        <div style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#666'
        }}>
          ⏳
        </div>
      </div>
    )
  }

  return (
    <img
      src={imgUrl || '/no-preview.jpg'}
      alt={alt}
      className={className}
      onError={(e) => {
        console.error('Ошибка загрузки изображения:', e)
        e.target.src = '/no-preview.jpg'
        e.target.onerror = null
      }}
      {...props}
    />
  )
}

export default Thumbnail