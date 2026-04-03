import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import type { UserRole } from '../../lib/types'

export default function LoginPage() {
  const { signIn, signUp } = useAuth()

  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState<UserRole>('patient')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = isSignUp
      ? await signUp(email, password, fullName, role)
      : await signIn(email, password)

    if (result.error) {
      setError(result.error)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="card w-full max-w-md">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Physio Helper</h1>
        <p className="text-lg text-gray-600 mb-8">
          {isSignUp ? 'Create your account' : 'Sign in to your account'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isSignUp && (
            <>
              <div>
                <label htmlFor="fullName" className="block text-lg font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full min-h-touch rounded-xl border-2 border-gray-300 px-4 text-lg
                             focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="role" className="block text-lg font-medium text-gray-700 mb-1">
                  I am a...
                </label>
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full min-h-touch rounded-xl border-2 border-gray-300 px-4 text-lg
                             focus:border-brand-500 focus:outline-none bg-white"
                >
                  <option value="patient">Patient</option>
                  <option value="physio">Physiotherapist</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="block text-lg font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full min-h-touch rounded-xl border-2 border-gray-300 px-4 text-lg
                         focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-lg font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full min-h-touch rounded-xl border-2 border-gray-300 px-4 text-lg
                         focus:border-brand-500 focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-lg text-red-600 font-medium">{error}</p>
          )}

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Please wait...' : isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <button
          onClick={() => { setIsSignUp(!isSignUp); setError(null) }}
          className="w-full mt-4 text-lg text-brand-600 font-medium underline
                     min-h-[48px] flex items-center justify-center"
        >
          {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
        </button>
      </div>
    </div>
  )
}
