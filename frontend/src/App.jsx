import React, { useState, useEffect } from "react"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext.jsx"
import { streamAPI } from "./services/api"

// Страницы
import Header from "./components/Layout/Header"
import Login from "./components/Auth/Login"
import Register from "./components/Auth/Register"
import Profile from "./components/Profile/Profile"
import CreateStream from "./components/Stream/CreateStream"
import StreamPage from "./components/Stream/StreamPage"
import PublicProfile from "./components/Profile/PublicProfile"
import StreamSettings from "./components/Stream/StreamSettings"

// Новая домашняя страница
import HomePage from "./components/Home/HomePage"

// Фон
import backgroundImage from "./background.png"

function App() {
  const [streams, setStreams] = useState([])
  const [liveStreams, setLiveStreams] = useState([])
  const [loading, setLoading] = useState(true)

  // ====== Загрузка стримов ======
  useEffect(() => {
    const fetchStreams = async () => {
      try {
        const response = await streamAPI.getStreams({ limit: 50, page: 1 })

        const items = response.data.items || []
        setStreams(items)

        // фильтруем LIVE
        const live = items.filter(
          (s) => s.status === "live" || s.status === "LIVE"
        )

        setLiveStreams(live)
      } catch (err) {
        console.error("Ошибка загрузки стримов:", err)
        setStreams([])
        setLiveStreams([])
      } finally {
        setLoading(false)
      }
    }

    fetchStreams()
    const interval = setInterval(fetchStreams, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <AuthProvider>
      <Router>
        <div
          className="app"
          style={{
            background: `url(${backgroundImage}) center/cover fixed`,
            minHeight: "100vh",
            color: "white",
            paddingTop: "50px",
          }}
        >
          <Header />

          <Routes>
            {/* Auth */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Профиль */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/user/:userId" element={<PublicProfile />} />

            {/* Стримы */}
            <Route path="/stream" element={<CreateStream />} />
            <Route path="/stream/:streamId" element={<StreamPage />} />
            <Route
              path="/stream/:streamId/settings"
              element={<StreamSettings />}
            />

            {/* ГЛАВНАЯ СТРАНИЦА */}
            <Route
              path="/"
              element={
                <HomePage
                  streams={streams}
                  liveStreams={liveStreams}
                  loading={loading}
                />
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App