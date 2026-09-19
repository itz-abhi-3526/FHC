import { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Splash from './components/Splash'
import Navbar from './components/Navbar'
import RequireAuth from './components/RequireAuth'
import RequireMedia from './components/RequireMedia'
import Home from './pages/Home'
import Team from './pages/Team'
import About from './pages/About'
import Gallery from './pages/Gallery'
import GalleryFolder from './pages/GalleryFolder'
import Join from './pages/Join'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import MediaConsole from './pages/MediaConsole'
import ComingSoonPage from './pages/coming-soon/ComingSoonPage'
import AdminApp from './admin/AdminApp'

function App() {
  const [booted, setBooted] = useState(false)
  const location = useLocation()

  if (!booted) {
    return <Splash onComplete={() => setBooted(true)} />
  }

  const isAdmin = location.pathname.startsWith('/admin')
  const isJoin = location.pathname === '/join'
  const isComingSoon = location.pathname === '/coming-soon'
  const isAuth = location.pathname === '/auth'

  if (isAdmin) {
    // Mount via a <Route path="/admin/*"> so the admin tree's descendant
    // <Routes> resolves its basename to /admin (without this, the nested
    // relative routes like path="users" can never match /admin/users and
    // the whole panel renders blank).
    return (
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
      </Routes>
    );
  }

  // Coming Soon page renders its own full-screen experience
  if (isComingSoon) {
    return <ComingSoonPage />
  }

  // Auth page renders its own full-screen terminal experience
  if (isAuth) {
    return <Auth />
  }

  return (
    <div className={`min-h-screen ${isJoin ? '' : 'border-[6px] md:border-[10px] border-pink'}`}>
      <div className="scanlines" />
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/team" element={<Team />} />
        <Route path="/about" element={<About />} />
        <Route path="/gallery" element={<Gallery />} />
        <Route path="/gallery/:folderId" element={<GalleryFolder />} />
        <Route path="/join" element={<Join />} />
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route path="/media" element={<RequireMedia />}>
          <Route index element={<MediaConsole />} />
        </Route>
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  )
}

export default App