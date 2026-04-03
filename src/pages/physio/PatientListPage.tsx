import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { User } from '../../lib/types'

export default function PatientListPage() {
  const { user } = useAuth()
  const [patients, setPatients] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviting, setInviting] = useState(false)

  async function fetchPatients() {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('physio_id', user!.id)
      .order('full_name')

    setPatients((data as User[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchPatients() }, [])

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteError(null)
    setInviting(true)

    // First, try to link an existing patient by email
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, role, physio_id')
      .eq('email', inviteEmail)
      .single()

    if (existingUser) {
      if (existingUser.role !== 'patient') {
        setInviteError('That email belongs to a physiotherapist account, not a patient.')
        setInviting(false)
        return
      }
      if (existingUser.physio_id && existingUser.physio_id !== user!.id) {
        setInviteError('That patient is already linked to another physiotherapist.')
        setInviting(false)
        return
      }
      if (existingUser.physio_id === user!.id) {
        setInviteError('That patient is already in your list.')
        setInviting(false)
        return
      }

      // Link existing patient to this physio
      const { error } = await supabase
        .from('users')
        .update({ physio_id: user!.id })
        .eq('id', existingUser.id)

      if (error) {
        setInviteError(error.message)
      } else {
        setInviteEmail('')
        setInviteName('')
        setShowInvite(false)
        fetchPatients()
      }
      setInviting(false)
      return
    }

    // No existing user — create a new patient auth account
    const { data, error: authError } = await supabase.auth.signUp({
      email: inviteEmail,
      password: crypto.randomUUID().slice(0, 16),
    })

    if (authError || !data.user) {
      setInviteError(authError?.message ?? 'Failed to create patient account')
      setInviting(false)
      return
    }

    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      email: inviteEmail,
      full_name: inviteName,
      role: 'patient',
      physio_id: user!.id,
    })

    if (profileError) {
      setInviteError(profileError.message)
    } else {
      setInviteEmail('')
      setInviteName('')
      setShowInvite(false)
      fetchPatients()
    }
    setInviting(false)
  }

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Patients</h1>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="min-h-[48px] px-5 bg-brand-600 text-white text-lg font-semibold rounded-xl"
        >
          {showInvite ? 'Cancel' : '+ Add Patient'}
        </button>
      </div>

      {showInvite && (
        <form onSubmit={handleInvite} className="card mb-6 space-y-4">
          <div>
            <label htmlFor="patientName" className="block text-lg font-medium text-gray-700 mb-1">
              Patient's Full Name
            </label>
            <input
              id="patientName"
              type="text"
              required
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              className="w-full min-h-touch rounded-xl border-2 border-gray-300 px-4 text-lg focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="patientEmail" className="block text-lg font-medium text-gray-700 mb-1">
              Patient's Email
            </label>
            <input
              id="patientEmail"
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full min-h-touch rounded-xl border-2 border-gray-300 px-4 text-lg focus:border-brand-500 focus:outline-none"
            />
          </div>

          {inviteError && <p className="text-lg text-red-600 font-medium">{inviteError}</p>}

          <button type="submit" disabled={inviting} className="btn-primary">
            {inviting ? 'Adding...' : 'Add Patient'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-lg text-gray-500">Loading...</p>
      ) : patients.length === 0 ? (
        <p className="text-lg text-gray-400">No patients yet. Add your first patient above.</p>
      ) : (
        <div className="space-y-3">
          {patients.map((patient) => (
            <Link
              key={patient.id}
              to={`/patients/${patient.id}`}
              className="card block hover:border-brand-300 transition-colors"
            >
              <h2 className="text-2xl font-bold text-gray-900">{patient.full_name}</h2>
              <p className="text-lg text-gray-500">{patient.email}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
