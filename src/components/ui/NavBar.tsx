import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function NavBar() {
  const { user, signOut } = useAuth()
  if (!user) return null

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center px-4 py-2 text-sm font-medium min-h-[56px] ${
      isActive ? 'text-brand-600' : 'text-gray-500'
    }`

  if (user.role === 'physio') {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around safe-area-bottom">
        <NavLink to="/" end className={linkClass}>
          <span className="text-2xl">👥</span>
          <span>Patients</span>
        </NavLink>
        <NavLink to="/exercises" className={linkClass}>
          <span className="text-2xl">💪</span>
          <span>Exercises</span>
        </NavLink>
        <button onClick={signOut} className="flex flex-col items-center justify-center px-4 py-2 text-sm font-medium min-h-[56px] text-gray-500">
          <span className="text-2xl">🚪</span>
          <span>Sign Out</span>
        </button>
      </nav>
    )
  }

  // Patient nav
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around safe-area-bottom">
      <NavLink to="/" end className={linkClass}>
        <span className="text-2xl">🏠</span>
        <span>Today</span>
      </NavLink>
      <NavLink to="/history" className={linkClass}>
        <span className="text-2xl">📋</span>
        <span>History</span>
      </NavLink>
      <button onClick={signOut} className="flex flex-col items-center justify-center px-4 py-2 text-sm font-medium min-h-[56px] text-gray-500">
        <span className="text-2xl">🚪</span>
        <span>Sign Out</span>
      </button>
    </nav>
  )
}
