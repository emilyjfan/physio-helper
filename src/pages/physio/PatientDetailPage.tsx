import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import BackButton from '../../components/ui/BackButton'
import type { User, Plan, PlanExercise, Exercise, Session } from '../../lib/types'

interface PlanWithExercises extends Plan {
  plan_exercises: (PlanExercise & { exercises: Exercise })[]
}

export default function PatientDetailPage() {
  const { patientId } = useParams()
  const [patient, setPatient] = useState<User | null>(null)
  const [plans, setPlans] = useState<PlanWithExercises[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [patientRes, plansRes, sessionsRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', patientId!).single(),
        supabase
          .from('plans')
          .select('*, plan_exercises(*, exercises(*))')
          .eq('patient_id', patientId!)
          .order('created_at', { ascending: false }),
        supabase
          .from('sessions')
          .select('*')
          .eq('patient_id', patientId!)
          .order('started_at', { ascending: false })
          .limit(10),
      ])

      setPatient(patientRes.data as User)
      setPlans((plansRes.data as PlanWithExercises[]) ?? [])
      setSessions((sessionsRes.data as Session[]) ?? [])
      setLoading(false)
    }
    load()
  }, [patientId])

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <p className="text-lg text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen p-6">
        <BackButton />
        <p className="text-lg text-red-600">Patient not found.</p>
      </div>
    )
  }

  const activePlan = plans.find(p => p.is_active)

  return (
    <div className="min-h-screen p-6">
      <BackButton />
      <h1 className="text-3xl font-bold text-gray-900 mb-1">{patient.full_name}</h1>
      <p className="text-lg text-gray-500 mb-6">{patient.email}</p>

      {/* Active Plan */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Active Plan</h2>
        {activePlan ? (
          <div className="card">
            <h3 className="text-xl font-bold text-gray-900 mb-2">{activePlan.title}</h3>
            {activePlan.notes && <p className="text-base text-gray-600 mb-3">{activePlan.notes}</p>}
            <p className="text-base text-gray-500 mb-3">
              {activePlan.plan_exercises.length} exercise{activePlan.plan_exercises.length !== 1 && 'es'}
            </p>
            <ul className="space-y-2">
              {activePlan.plan_exercises
                .sort((a, b) => a.order_index - b.order_index)
                .map((pe) => (
                  <li key={pe.id} className="text-base text-gray-700">
                    <span className="font-medium">{pe.exercises.name}</span>
                    {' — '}
                    {pe.sets} set{pe.sets !== 1 && 's'} x {pe.reps} rep{pe.reps !== 1 && 's'}
                    {pe.hold_seconds ? ` (${pe.hold_seconds}s hold)` : ''}
                  </li>
                ))}
            </ul>
          </div>
        ) : (
          <div className="card">
            <p className="text-lg text-gray-400 mb-4">No active plan.</p>
            <Link
              to={`/patients/${patientId}/plans/new`}
              className="btn-primary inline-flex"
            >
              Create a Plan
            </Link>
          </div>
        )}
      </section>

      {/* Create plan button if they already have an active plan */}
      {activePlan && (
        <Link
          to={`/patients/${patientId}/plans/new`}
          className="btn-secondary mb-8 inline-flex"
        >
          Create New Plan
        </Link>
      )}

      {/* Recent Sessions */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Recent Sessions</h2>
        {sessions.length === 0 ? (
          <p className="text-lg text-gray-400">No sessions yet.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <div key={s.id} className="card flex items-center justify-between">
                <div>
                  <p className="text-lg font-medium text-gray-900">
                    {new Date(s.started_at).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })}
                  </p>
                </div>
                <span className={`text-lg font-semibold ${s.completed_at ? 'text-brand-600' : 'text-yellow-600'}`}>
                  {s.completed_at ? 'Completed' : 'Incomplete'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
