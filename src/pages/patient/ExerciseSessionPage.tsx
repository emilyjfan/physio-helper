import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Volume2, CheckCircle2, ArrowRight, Flag } from 'lucide-react'
import type { Plan, PlanExercise, Exercise } from '../../lib/types'

interface PlanExerciseWithDetails extends PlanExercise {
  exercises: Exercise
}

interface ActivePlan extends Plan {
  plan_exercises: PlanExerciseWithDetails[]
}

export default function ExerciseSessionPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [plan, setPlan] = useState<ActivePlan | null>(null)
  const [exerciseIndex, setExerciseIndex] = useState(0)
  const [setsCompleted, setSetsCompleted] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('plans')
        .select('*, plan_exercises(*, exercises(*))')
        .eq('patient_id', user!.id)
        .eq('is_active', true)
        .single()

      if (data) {
        const planData = data as ActivePlan
        planData.plan_exercises.sort((a, b) => a.order_index - b.order_index)
        setPlan(planData)

        const { data: session } = await supabase
          .from('sessions')
          .insert({ plan_id: planData.id, patient_id: user!.id })
          .select()
          .single()

        if (session) setSessionId(session.id)
      }
      setLoading(false)
    }
    load()
  }, [user])

  const currentPlanExercise = plan?.plan_exercises[exerciseIndex]
  const currentExercise = currentPlanExercise?.exercises
  const totalExercises = plan?.plan_exercises.length ?? 0
  const isLastExercise = exerciseIndex === totalExercises - 1
  const isLastSet = currentPlanExercise ? setsCompleted + 1 >= currentPlanExercise.sets : false

  const logAndAdvance = useCallback(async () => {
    if (!sessionId || !currentPlanExercise) return

    await supabase.from('session_exercise_logs').insert({
      session_id: sessionId,
      plan_exercise_id: currentPlanExercise.id,
      sets_completed: currentPlanExercise.sets,
    })

    if (isLastExercise) {
      await supabase
        .from('sessions')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', sessionId)

      navigate('/session/complete')
    } else {
      setExerciseIndex(exerciseIndex + 1)
      setSetsCompleted(0)
    }
  }, [sessionId, currentPlanExercise, isLastExercise, exerciseIndex, navigate])

  function handleSetDone() {
    if (!currentPlanExercise) return

    if (isLastSet) {
      logAndAdvance()
    } else {
      setSetsCompleted(setsCompleted + 1)
    }
  }

  function speakInstructions() {
    if (!currentExercise) return
    window.speechSynthesis.cancel()
    const text = currentExercise.instructions
      .map((step, i) => `Step ${i + 1}. ${step}`)
      .join('. ')
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.85
    window.speechSynthesis.speak(utterance)
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <p className="text-xl text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!plan || !currentExercise || !currentPlanExercise) {
    return (
      <div className="min-h-screen p-6">
        <p className="text-xl text-muted-foreground">No exercises found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 flex flex-col">
      {/* Progress */}
      <div className="mb-4">
        <p className="text-sm text-muted-foreground mb-2">
          Exercise {exerciseIndex + 1} of {totalExercises}
        </p>
        <Progress value={(exerciseIndex / totalExercises) * 100} className="h-3" />
      </div>

      {/* Exercise name */}
      <h1 className="text-3xl font-bold text-foreground mb-2">{currentExercise.name}</h1>

      {currentExercise.description && (
        <p className="text-lg text-muted-foreground mb-4">{currentExercise.description}</p>
      )}

      {/* Read aloud */}
      <Button
        variant="ghost"
        size="sm"
        onClick={speakInstructions}
        className="self-start mb-4 text-primary"
      >
        <Volume2 className="size-5" /> Read Aloud
      </Button>

      {/* Instructions */}
      <Card className="mb-6 flex-1">
        <CardHeader>
          <CardTitle className="text-xl">Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3">
            {currentExercise.instructions.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-xl font-bold text-primary shrink-0">{i + 1}.</span>
                <span className="text-xl text-foreground/90">{step}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Set counter */}
      <div className="mb-6">
        <p className="text-xl text-center text-foreground mb-3">
          <span className="font-bold">{currentPlanExercise.reps}</span> reps per set
          {currentPlanExercise.hold_seconds
            ? ` — hold ${currentPlanExercise.hold_seconds} seconds`
            : ''}
        </p>
        <div className="flex justify-center gap-3 mb-4">
          {Array.from({ length: currentPlanExercise.sets }).map((_, i) => (
            <div
              key={i}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-colors
                ${i < setsCompleted
                  ? 'bg-primary text-primary-foreground'
                  : i === setsCompleted
                    ? 'bg-primary/10 text-primary border-2 border-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
            >
              {i < setsCompleted ? <CheckCircle2 className="size-6" /> : i + 1}
            </div>
          ))}
        </div>
        <p className="text-lg text-center text-muted-foreground">
          Set {setsCompleted + 1} of {currentPlanExercise.sets}
        </p>
      </div>

      {/* Action button */}
      <Button onClick={handleSetDone} className="w-full">
        {isLastSet
          ? isLastExercise
            ? <><Flag className="size-5" /> Finish Exercises</>
            : <><ArrowRight className="size-5" /> Done — Next Exercise</>
          : <><CheckCircle2 className="size-5" /> Done — Next Set</>}
      </Button>

      {currentPlanExercise.notes && (
        <p className="text-base text-muted-foreground mt-4 text-center italic">
          Note from your physio: {currentPlanExercise.notes}
        </p>
      )}
    </div>
  )
}
