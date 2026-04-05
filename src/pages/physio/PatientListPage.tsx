import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { User } from '../../lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, X, Users, ChevronRight } from 'lucide-react'

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
        <h1 className="text-3xl font-bold text-foreground">My Patients</h1>
        <Button
          size="sm"
          variant={showInvite ? 'outline' : 'default'}
          onClick={() => setShowInvite(!showInvite)}
        >
          {showInvite ? <><X className="size-5" /> Cancel</> : <><Plus className="size-5" /> Add Patient</>}
        </Button>
      </div>

      {showInvite && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="patientName">Patient's Full Name</Label>
                <Input
                  id="patientName"
                  type="text"
                  required
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="patientEmail">Patient's Email</Label>
                <Input
                  id="patientEmail"
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              {inviteError && <p className="text-lg text-destructive font-medium">{inviteError}</p>}

              <Button type="submit" disabled={inviting} className="w-full">
                {inviting ? 'Adding...' : 'Add Patient'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-lg text-muted-foreground">Loading...</p>
      ) : patients.length === 0 ? (
        <div className="text-center py-12">
          <Users className="size-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-lg text-muted-foreground">No patients yet. Add your first patient above.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {patients.map((patient) => (
            <Link key={patient.id} to={`/patients/${patient.id}`}>
              <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{patient.full_name}</h2>
                    <p className="text-lg text-muted-foreground">{patient.email}</p>
                  </div>
                  <ChevronRight className="size-6 text-muted-foreground" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
