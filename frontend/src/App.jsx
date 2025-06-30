import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './components/landing/HomePage'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/institutional/*" element={<div className="p-8">Institutional Dashboard - Coming Soon</div>} />
        <Route path="/researcher/*" element={<div className="p-8">Researcher Dashboard - Coming Soon</div>} />
      </Routes>
    </Router>
  )
}

export default App
