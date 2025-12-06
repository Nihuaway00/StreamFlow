import React, { useMemo } from "react"
import { Link } from "react-router-dom"
import veschanieBackground from "../../veschanie.png"
import "./home.css"

const HomePage = ({ streams = [], liveStreams = [], loading = false }) => {
  // Формируем отсортированный список: сначала live, затем остальные (без дубликатов)
  const sortedStreams = useMemo(() => {
    const liveIds = new Set(liveStreams.map(s => s.id))
    const others = streams.filter(s => !liveIds.has(s.id))
    return [...liveStreams, ...others].slice(0, 27)
  }, [streams, liveStreams])

  const getThumb = (stream) => stream?.thumbnail || "/no-preview.jpg"

  return (
    <div className="home-page-root">
      {/* анимированный фон (за контентом) */}
      <div className="animated-bg" aria-hidden="true" />

      <div className="home-wrapper">
        {/* LIVE секция — отдельно, если есть */}
        {liveStreams?.length > 0 && (
          <section className="live-section">
            <h2 className="live-heading">🔴 Прямо сейчас в эфире</h2>

            <div className="stream-grid">
              {liveStreams.map(stream => {
                const isLive = true
                return (
                  <Link key={stream.id} to={`/stream/${stream.id}`} className="stream-card">
                    <div className={`preview ${isLive ? "preview-live" : ""}`}>
                      <span className="live-badge">LIVE</span>
                      <img src={getThumb(stream)} alt="preview" className="thumb-img" />
                    </div>

                    <div className="card-body">
                      <h3 className="card-title">{stream.title || "Название стрима"}</h3>
                      <div className="card-sub">{stream.author?.username || "Streamer"}</div>

                      <div className="card-bottom">
                        <div className="views">👁 {stream.viewers_count || 0}</div>
                        <div className="status status-online">online</div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* Основная сетка (LIVE уже вынесены вверх за счёт sortedStreams) */}
        <section className="all-section">
          <h3 className="section-title">🎥 Все стримы</h3>

          {loading ? (
            <div className="loading">Загрузка стримов...</div>
          ) : (
            <div className="stream-grid">
              {sortedStreams.map(stream => {
                const isLive = stream?.status === "live" || stream?.status === "LIVE"
                return (
                  <Link key={stream.id} to={`/stream/${stream.id}`} className="stream-card">
                    <div className={`preview ${isLive ? "preview-live" : ""}`}>
                      {isLive && <span className="live-badge">LIVE</span>}
                      <img src={getThumb(stream)} alt="preview" className="thumb-img" />
                    </div>

                    <div className="card-body">
                      <h3 className="card-title">{stream.title || "Название стрима"}</h3>
                      <div className="card-sub">{stream.author?.username || "Streamer"}</div>

                      <div className="card-bottom">
                        <div className="views">👁 {stream.viewers_count || 0}</div>
                        <div className={isLive ? "status status-online" : "status status-offline"}>
                          {isLive ? "online" : "offline"}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        {/* Нижний блок "Начни вещание" */}
        <div
          className="start-block"
          style={{ backgroundImage: `url(${veschanieBackground})` }}
        >
          <div className="start-content">
            <div className="start-actions">
              <Link to="/stream" className="btn primary">
                🎥 Начать стрим
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage