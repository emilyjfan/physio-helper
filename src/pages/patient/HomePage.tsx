import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ClipboardList, Play, CheckCircle2 } from 'lucide-react'
import type { Plan, PlanExercise, Exercise } from '../../lib/types'

interface PlanExerciseWithDetails extends PlanExercise {
  exercises: Exercise
}

interface ActivePlan extends Plan {
  plan_exercises: PlanExerciseWithDetails[]
}

export default function PatientHomePage() {
  const { user } = useAuth()
  const [plan, setPlan] = useState<ActivePlan | null>(null)
  const [loading, setLoading] = useState(true)
  const [todayCompleted, setTodayCompleted] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('plans')
        .select('*, plan_exercises(*, exercises(*))')
        .eq('patient_id', user!.id)
        .eq('is_active', true)
        .single()

      if (data) {
        setPlan(data as ActivePlan)

        const today = new Date().toISOString().split('T')[0]
        const { data: sessions } = await supabase
          .from('sessions')
          .select('id')
          .eq('plan_id', data.id)
          .eq('patient_id', user!.id)
          .not('completed_at', 'is', null)
          .gte('started_at', today)
          .limit(1)

        setTodayCompleted((sessions?.length ?? 0) > 0)
      }
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <p className="text-xl text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen p-6">
        <h1 className="text-3xl font-bold text-foreground mb-4">Today's Exercises</h1>
        <Card>
          <CardContent className="pt-6 text-center">
            <ClipboardList className="size-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-xl text-muted-foreground">
              No exercise plan yet. Your physiotherapist will set one up for you.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sortedExercises = [...plan.plan_exercises].sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-bold text-foreground mb-1">Today's Exercises</h1>
      <p className="text-lg text-muted-foreground mb-6">{plan.title}</p>
      {plan.notes && (
        <Card className="mb-6 bg-accent border-accent">
          <p className="text-base text-accent-foreground">{plan.notes}</p>
        </Card>
      )}

      {todayCompleted && (
        <Card className="mb-6 bg-brand-50 border-brand-200 border-2">
          <div className="text-center">
            <CheckCircle2 className="size-10 mx-auto text-brand-600 mb-2" />
            <p className="text-2xl font-bold text-brand-700">Done for today!</p>
            <p className="text-lg text-brand-600 mt-1">You already completed your exercises. Great work!</p>
          </div>
        </Card>
      )}

      <div className="space-y-4 mb-6">
        {sortedExercises.map((pe, index) => (
          <Card key={pe.id}>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1">
                <span className="text-xl font-bold text-primary">{index + 1}</span>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground">{pe.exercises.name}</h2>
                <p className="text-lg text-muted-foreground mt-1">
                  {pe.sets} set{pe.sets !== 1 && 's'} x {pe.reps} rep{pe.reps !== 1 && 's'}
                  {pe.hold_seconds ? ` — hold ${pe.hold_seconds}s` : ''}
                </p>
                {pe.notes && (
                  <p className="text-base text-muted-foreground/80 mt-1 italic">{pe.notes}</p>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {!todayCompleted && (
        <Link to={`/session/${sortedExercises[0]?.id}`}>
          <Button className="w-full">
            <Play className="size-5" /> Start Exercises
          </Button>
        </Link>
      )}
    </div>
  )
}
