import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import HomePage from './components/landing/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import InstitutionalDashboard from './pages/InstitutionalDashboard'
import SubmitIdea from './pages/SubmitIdea'
import IdeaDetail from './pages/IdeaDetail'
import QuestionMatchingPage from './components/matching/QuestionMatchingPage'
import ExpertDashboard from "./pages/ExpertDashboard";
import ExpertQuestionDetail from "./pages/ExpertQuestionDetail";
const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/institutional" element={<InstitutionalDashboard />} />
            <Route path="/institutional/submit-idea" element={<SubmitIdea />} />
            <Route path="/institutional/matching/:questionId" element={<QuestionMatchingPage />} />
            <Route path="/idea/:id" element={<IdeaDetail />} />
            <Route path="/researcher/*" element={<div className="p-8">Researcher Dashboard - Coming Soon</div>} />
            <Route path="/expert/dashboard" element={<ExpertDashboard />} />
            <Route path="/expert/question/:questionId" element={<ExpertQuestionDetail />} />          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
