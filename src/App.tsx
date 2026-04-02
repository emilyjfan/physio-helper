import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Auth
import LoginPage from './pages/auth/LoginPage'

// Patient pages
import PatientHomePage from './pages/patient/HomePage'
import ExerciseSessionPage from './pages/patient/ExerciseSessionPage'
import SessionCompletePage from './pages/patient/SessionCompletePage'
import PatientHistoryPage from './pages/patient/HistoryPage'

// Physio pages
import PatientListPage from './pages/physio/PatientListPage'
import PatientDetailPage from './pages/physio/PatientDetailPage'
import PlanBuilderPage from './pages/physio/PlanBuilderPage'
import ExerciseLibraryPage from './pages/physio/ExerciseLibraryPage'

function AppRoutes() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    )
  }

  if (user.role === 'patient') {
    return (
      <Routes>
        <Route path="/" element={<PatientHomePage />} />
        <Route path="/session/:planExerciseId" element={<ExerciseSessionPage />} />
        <Route path="/session/complete" element={<SessionCompletePage />} />
        <Route path="/history" element={<PatientHistoryPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    )
  }

  // physio routes
  return (
    <Routes>
      <Route path="/" element={<PatientListPage />} />
      <Route path="/patients/:patientId" element={<PatientDetailPage />} />
      <Route path="/patients/:patientId/plans/new" element={<PlanBuilderPage />} />
      <Route path="/patients/:patientId/plans/:planId/edit" element={<PlanBuilderPage />} />
      <Route path="/exercises" element={<ExerciseLibraryPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
