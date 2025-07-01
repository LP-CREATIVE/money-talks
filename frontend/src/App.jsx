import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import HomePage from './components/landing/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import InstitutionalDashboard from './pages/InstitutionalDashboard'
import SubmitIdea from './pages/SubmitIdea'
import IdeaDetail from './pages/IdeaDetail'

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/institutional" element={<InstitutionalDashboard />} />
          <Route path="/institutional/submit-idea" element={<SubmitIdea />} />
          <Route path="/idea/:id" element={<IdeaDetail />} />
          <Route path="/researcher/*" element={<div className="p-8">Researcher Dashboard - Coming Soon</div>} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
