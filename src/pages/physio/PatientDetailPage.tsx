import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import BackButton from '../../components/ui/BackButton'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ClipboardList, CalendarDays } from 'lucide-react'
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
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="min-h-screen p-6">
        <BackButton />
        <p className="text-lg text-destructive">Patient not found.</p>
      </div>
    )
  }

  const activePlan = plans.find(p => p.is_active)

  return (
    <div className="min-h-screen p-6">
      <BackButton />
      <h1 className="text-3xl font-bold text-foreground mb-1">{patient.full_name}</h1>
      <p className="text-lg text-muted-foreground mb-6">{patient.email}</p>

      {/* Active Plan */}
      <section className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-3">Active Plan</h2>
        {activePlan ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{activePlan.title}</CardTitle>
                <Badge variant="default">Active</Badge>
              </div>
              {activePlan.notes && <CardDescription>{activePlan.notes}</CardDescription>}
            </CardHeader>
            <CardContent>
              <p className="text-base text-muted-foreground mb-3">
                {activePlan.plan_exercises.length} exercise{activePlan.plan_exercises.length !== 1 && 'es'}
              </p>
              <ul className="space-y-2">
                {activePlan.plan_exercises
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((pe) => (
                    <li key={pe.id} className="text-base text-foreground/80">
                      <span className="font-medium">{pe.exercises.name}</span>
                      {' — '}
                      {pe.sets} set{pe.sets !== 1 && 's'} x {pe.reps} rep{pe.reps !== 1 && 's'}
                      {pe.hold_seconds ? ` (${pe.hold_seconds}s hold)` : ''}
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6 text-center">
              <ClipboardList className="size-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg text-muted-foreground mb-4">No active plan.</p>
              <Link to={`/patients/${patientId}/plans/new`}>
                <Button className="w-full">Create a Plan</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </section>

      {activePlan && (
        <Link to={`/patients/${patientId}/plans/new`}>
          <Button variant="outline" className="w-full mb-8">Create New Plan</Button>
        </Link>
      )}

      <Separator className="mb-8" />

      {/* Recent Sessions */}
      <section>
        <h2 className="text-2xl font-bold text-foreground mb-3">Recent Sessions</h2>
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <CalendarDays className="size-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg text-muted-foreground">No sessions yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((s) => (
              <Card key={s.id}>
                <div className="flex items-center justify-between">
                  <p className="text-lg font-medium text-foreground">
                    {new Date(s.started_at).toLocaleDateString('en-US', {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })}
                  </p>
                  <Badge variant={s.completed_at ? 'default' : 'secondary'}>
                    {s.completed_at ? 'Completed' : 'Incomplete'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
