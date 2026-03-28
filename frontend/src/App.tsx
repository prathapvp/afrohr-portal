import { AuthProvider, useAuth } from './hooks/useAuth'
import JobsPage from './pages/jobs/JobsPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import CandidateDashboard from './pages/candidates/CandidateDashboard'
import EmployerDashboard from './pages/employers/EmployerDashboard'

function AppRoutes() {
  const { user } = useAuth()

  // Minimal hash-based routing (replace with react-router-dom for production)
  const path = window.location.hash.replace('#', '') || '/'

  if (!user) {
    if (path === '/register') return <RegisterPage />
    return <LoginPage />
  }

  if (user.role === 'EMPLOYER') {
    if (path === '/jobs' || path === '/') return <JobsPage />
    return <EmployerDashboard />
  }

  if (user.role === 'CANDIDATE') {
    if (path === '/jobs') return <JobsPage />
    return <CandidateDashboard />
  }

  return <JobsPage />
}

function App() {
  return (
    <AuthProvider>
      <nav style={{ padding: '12px 24px', background: '#1a1a2e', color: '#fff', display: 'flex', gap: 16 }}>
        <strong>AfroHR Portal</strong>
        <a href="#/" style={{ color: '#ccc' }}>Dashboard</a>
        <a href="#/jobs" style={{ color: '#ccc' }}>Jobs</a>
        <a href="#/register" style={{ color: '#ccc' }}>Register</a>
      </nav>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App
