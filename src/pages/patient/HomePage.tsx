import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
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
      // Fetch active plan with exercises
      const { data } = await supabase
        .from('plans')
        .select('*, plan_exercises(*, exercises(*))')
        .eq('patient_id', user!.id)
        .eq('is_active', true)
        .single()

      if (data) {
        setPlan(data as ActivePlan)

        // Check if already completed a session today
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
        <p className="text-xl text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="min-h-screen p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Today's Exercises</h1>
        <div className="card">
          <p className="text-xl text-gray-500">
            No exercise plan yet. Your physiotherapist will set one up for you.
          </p>
        </div>
      </div>
    )
  }

  const sortedExercises = [...plan.plan_exercises].sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-1">Today's Exercises</h1>
      <p className="text-lg text-gray-500 mb-6">{plan.title}</p>
      {plan.notes && (
        <p className="text-base text-gray-600 bg-brand-50 rounded-xl p-4 mb-6">{plan.notes}</p>
      )}

      {todayCompleted && (
        <div className="bg-brand-50 border-2 border-brand-200 rounded-2xl p-5 mb-6 text-center">
          <p className="text-2xl font-bold text-brand-700">Done for today!</p>
          <p className="text-lg text-brand-600 mt-1">You already completed your exercises. Great work!</p>
        </div>
      )}

      <div className="space-y-4 mb-6">
        {sortedExercises.map((pe, index) => (
          <div key={pe.id} className="card">
            <div className="flex items-start gap-4">
              <span className="text-2xl font-bold text-brand-600 mt-1">{index + 1}</span>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900">{pe.exercises.name}</h2>
                <p className="text-lg text-gray-600 mt-1">
                  {pe.sets} set{pe.sets !== 1 && 's'} x {pe.reps} rep{pe.reps !== 1 && 's'}
                  {pe.hold_seconds ? ` — hold ${pe.hold_seconds}s` : ''}
                </p>
                {pe.notes && (
                  <p className="text-base text-gray-500 mt-1">{pe.notes}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!todayCompleted && (
        <Link
          to={`/session/${sortedExercises[0]?.id}`}
          className="btn-primary"
        >
          Start Exercises
        </Link>
      )}
    </div>
  )
}
