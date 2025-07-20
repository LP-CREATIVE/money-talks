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
import ExpertDashboard from "./pages/ExpertDashboard"
import ExpertPatterns from "./pages/ExpertPatterns"
import AuthCallback from "./components/AuthCallback"
import ExpertProfile from "./pages/ExpertProfile"
import ExpertEarnings from "./pages/ExpertEarnings";import ExpertAnswers from "./pages/ExpertAnswers"
import AdminDashboard from "./pages/AdminDashboard"
import AdminUsers from "./pages/AdminUsers";
import AdminMetrics from "./pages/AdminMetrics";import AdminPaymentReview from "./pages/AdminPaymentReview"
import ExpertQuestionDetail from "./pages/ExpertQuestionDetail"
import ResaleMarketplace from "./pages/resale/ResaleMarketplace"
import CompleteProfile from "./pages/CompleteProfile"
import ExpertQuestionPreview from './pages/ExpertQuestionPreview'

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
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/institutional" element={<InstitutionalDashboard />} />
            <Route path="/institutional/submit-idea" element={<SubmitIdea />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/institutional/matching/:questionId" element={<QuestionMatchingPage />} />
            <Route path="/idea/:id" element={<IdeaDetail />} />
            <Route path="/researcher/*" element={<div className="p-8">Researcher Dashboard - Coming Soon</div>} />
            <Route path="/expert/dashboard" element={<ExpertDashboard />} />
            <Route path="/expert/answers" element={<ExpertAnswers />} />
            <Route path="/expert/patterns" element={<ExpertPatterns />} />
            <Route path="/expert/profile" element={<ExpertProfile />} />
            <Route path="/expert/earnings" element={<ExpertEarnings />} />            <Route path="/expert/question/:questionId" element={<ExpertQuestionDetail />} />
            <Route path="/expert-preview/:token" element={<ExpertQuestionPreview />} />
            <Route path="/resale/marketplace" element={<ResaleMarketplace />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/payment-review" element={<AdminPaymentReview />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/metrics" element={<AdminMetrics />} />          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
