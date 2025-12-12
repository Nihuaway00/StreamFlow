import React, { useMemo, useState, useEffect } from "react"
import { Link } from "react-router-dom"
import veschanieBackground from "../../veschanie.png"
import Thumbnail from "../Stream/Thumbnail"
import "./Home.css"

const HomePage = ({ streams = [], liveStreams = [], loading = false }) => {
  const sortedStreams = useMemo(() => {
    const liveIds = new Set(liveStreams.map(s => s.id))
    const others = streams.filter(s => !liveIds.has(s.id))
    return [...liveStreams, ...others].slice(0, 27)
  }, [streams, liveStreams])

  return (
    <div className="home-page-root">
      {/* Анимированный фон в стеклянном стиле */}
      <div className="profile-bg" aria-hidden="true" />

      <div className="home-wrapper">
        {/* LIVE секция */}
        {liveStreams?.length > 0 && (
          <section className="live-section">
            <div className="glass section-header">
              <h2 className="live-heading">
                <span className="live-icon">🔴</span>
                Прямо сейчас в эфире
              </h2>
              <div className="live-count">
                <span className="live-badge-count">{liveStreams.length}</span>
                <span>стримов</span>
              </div>
            </div>

            <div className="stream-grid">
              {liveStreams.map(stream => {
                const isLive = true
                return (
                  <Link key={stream.id} to={`/stream/${stream.id}`} className="stream-card glass">
                    <div className={`preview ${isLive ? "preview-live" : ""}`}>
                      <span className="live-badge">LIVE</span>
                      <Thumbnail
                        previewUrl={stream.preview_url}
                        className="thumb-img"
                        alt={stream.title || "Превью стрима"}
                      />
                    </div>

                    <div className="card-body">
                      <h3 className="card-title">{stream.title || "Название стрима"}</h3>
                      <div className="card-author">
                        <div className="author-avatar">
                          {stream.author?.username?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <div className="card-sub">{stream.author?.username || "Streamer"}</div>
                      </div>

                      <div className="card-bottom">
                        <div className="views">
                          <span className="view-icon">👁</span>
                          <span className="view-count">{stream.viewers_count || 0}</span>
                        </div>
                        <div className="status status-online">online</div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Секция всех стримов с красивым заголовком */}
        <section className="all-section">
          <div className="glass section-header all-header">
            <div className="header-content">
              <h3 className="section-title">
                <span className="section-icon"></span>
                Все стримы
              </h3>
              <div className="stream-count">
                <span className="count-number">{sortedStreams.length}</span>
                <span>всего</span>
              </div>
            </div>
            {sortedStreams.length > 0 && (
              <div className="stream-tags">
                <span className="stream-tag active">Все</span>
                <span className="stream-tag">Игры</span>
                <span className="stream-tag">Музыка</span>
                <span className="stream-tag">Общение</span>
              </div>
            )}
          </div>

          {loading ? (
            <div className="glass loading-container">
              <div className="loading-spinner"></div>
              <p>Загрузка стримов...</p>
            </div>
          ) : sortedStreams.length > 0 ? (
            <div className="stream-grid">
              {sortedStreams.map(stream => {
                const isLive = stream?.status === "live" || stream?.status === "LIVE"
                return (
                  <Link key={stream.id} to={`/stream/${stream.id}`} className="stream-card glass">
                    <div className={`preview ${isLive ? "preview-live" : ""}`}>
                      {isLive && <span className="live-badge">LIVE</span>}
                      <Thumbnail
                        previewUrl={stream.preview_url}
                        className="thumb-img"
                        alt={stream.title || "Превью стрима"}
                      />
                    </div>

                    <div className="card-body">
                      <h3 className="card-title">{stream.title || "Название стрима"}</h3>
                      <div className="card-author">
                        <div className="author-avatar">
                          {stream.author?.username?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <div className="card-sub">{stream.author?.username || "Streamer"}</div>
                      </div>

                      <div className="card-bottom">
                        <div className="views">
                          <span className="view-icon">👁</span>
                          <span className="view-count">{stream.viewers_count || 0}</span>
                        </div>
                        <div className={`status ${isLive ? "status-online" : "status-offline"}`}>
                          {isLive ? "online" : "offline"}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="glass empty-streams">
              <div className="empty-icon">🎥</div>
              <h4>Стримов пока нет</h4>
              <p>Будьте первым, кто начнет трансляцию!</p>
              <Link to="/stream" className="btn btn-primary">
                🎥 Начать стрим
              </Link>
            </div>
          )}
        </section>

        {/* Нижний блок "Начни вещание" */}
        <div className="glass start-block">
          <div className="start-bg" style={{ backgroundImage: `url(${veschanieBackground})` }}></div>
          <div className="start-content">
            <div className="start-text">
              <h3 className="start-title">Готовы начать вещание?</h3>
              <p className="start-description">
                Присоединяйтесь к сообществу стримеров и делитесь своим контентом с миром
              </p>
            </div>
            <div className="start-actions">
              <Link to="/stream" className="btn btn-primary start-btn">
                <span className="btn-icon">🎥</span>
                Начать стрим
              </Link>
              <Link to="/profile" className="btn btn-ghost">
                <span className="btn-icon">👤</span>
                Мой профиль
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage