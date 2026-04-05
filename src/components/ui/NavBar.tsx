import { NavLink } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Users, Dumbbell, Home, ClipboardList, LogOut } from 'lucide-react'

export default function NavBar() {
  const { user, signOut } = useAuth()
  if (!user) return null

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center px-4 py-2 text-sm font-medium min-h-[56px] transition-colors ${
      isActive ? 'text-primary' : 'text-muted-foreground'
    }`

  if (user.role === 'physio') {
    return (
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around safe-area-bottom">
        <NavLink to="/" end className={linkClass}>
          <Users className="size-6" />
          <span>Patients</span>
        </NavLink>
        <NavLink to="/exercises" className={linkClass}>
          <Dumbbell className="size-6" />
          <span>Exercises</span>
        </NavLink>
        <button onClick={signOut} className="flex flex-col items-center justify-center px-4 py-2 text-sm font-medium min-h-[56px] text-muted-foreground transition-colors">
          <LogOut className="size-6" />
          <span>Sign Out</span>
        </button>
      </nav>
    )
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around safe-area-bottom">
      <NavLink to="/" end className={linkClass}>
        <Home className="size-6" />
        <span>Today</span>
      </NavLink>
      <NavLink to="/history" className={linkClass}>
        <ClipboardList className="size-6" />
        <span>History</span>
      </NavLink>
      <button onClick={signOut} className="flex flex-col items-center justify-center px-4 py-2 text-sm font-medium min-h-[56px] text-muted-foreground transition-colors">
        <LogOut className="size-6" />
        <span>Sign Out</span>
      </button>
    </nav>
  )
}
