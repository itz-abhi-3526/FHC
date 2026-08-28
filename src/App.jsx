import { useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Splash from './components/Splash'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Team from './pages/Team'
import About from './pages/About'
import Gallery from './pages/Gallery'
import Join from './pages/Join'
import ComingSoonPage from './pages/coming-soon/ComingSoonPage'

function App() {
  const [booted, setBooted] = useState(false)
  const location = useLocation()

  if (!booted) {
    return <Splash onComplete={() => setBooted(true)} />
  }

  const isJoin = location.pathname === '/join'
  const isComingSoon = location.pathname === '/coming-soon'

  // Coming Soon page renders its own full-screen experience
  if (isComingSoon) {
    return <ComingSoonPage />
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
        <Route path="/join" element={<Join />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  )
}

export default App