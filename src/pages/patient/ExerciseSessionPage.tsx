import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
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

  // Load the active plan
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

        // Create a session
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

  // Log completed exercise and move to next
  const logAndAdvance = useCallback(async () => {
    if (!sessionId || !currentPlanExercise) return

    // Log this exercise
    await supabase.from('session_exercise_logs').insert({
      session_id: sessionId,
      plan_exercise_id: currentPlanExercise.id,
      sets_completed: currentPlanExercise.sets,
    })

    if (isLastExercise) {
      // Mark session complete
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

  // Read-aloud
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
        <p className="text-xl text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!plan || !currentExercise || !currentPlanExercise) {
    return (
      <div className="min-h-screen p-6">
        <p className="text-xl text-gray-500">No exercises found.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 flex flex-col">
      {/* Progress bar */}
      <div className="mb-4">
        <p className="text-sm text-gray-500 mb-1">
          Exercise {exerciseIndex + 1} of {totalExercises}
        </p>
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-300"
            style={{ width: `${((exerciseIndex) / totalExercises) * 100}%` }}
          />
        </div>
      </div>

      {/* Exercise name */}
      <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentExercise.name}</h1>

      {currentExercise.description && (
        <p className="text-lg text-gray-600 mb-4">{currentExercise.description}</p>
      )}

      {/* Read aloud button */}
      <button
        onClick={speakInstructions}
        className="min-h-[48px] px-4 text-lg text-brand-600 font-medium flex items-center gap-2 mb-4 self-start"
      >
        🔊 Read Aloud
      </button>

      {/* Instructions */}
      <div className="card mb-6 flex-1">
        <h2 className="text-xl font-bold text-gray-800 mb-3">Steps</h2>
        <ol className="space-y-3">
          {currentExercise.instructions.map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="text-xl font-bold text-brand-500 shrink-0">{i + 1}.</span>
              <span className="text-xl text-gray-800">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Set counter */}
      <div className="mb-6">
        <p className="text-xl text-center text-gray-700 mb-3">
          <span className="font-bold">{currentPlanExercise.reps}</span> reps per set
          {currentPlanExercise.hold_seconds
            ? ` — hold ${currentPlanExercise.hold_seconds} seconds`
            : ''}
        </p>
        <div className="flex justify-center gap-3 mb-4">
          {Array.from({ length: currentPlanExercise.sets }).map((_, i) => (
            <div
              key={i}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold
                ${i < setsCompleted
                  ? 'bg-brand-500 text-white'
                  : i === setsCompleted
                    ? 'bg-brand-100 text-brand-700 border-2 border-brand-500'
                    : 'bg-gray-200 text-gray-400'
                }`}
            >
              {i < setsCompleted ? '✓' : i + 1}
            </div>
          ))}
        </div>
        <p className="text-lg text-center text-gray-500">
          Set {setsCompleted + 1} of {currentPlanExercise.sets}
        </p>
      </div>

      {/* Action button */}
      <button onClick={handleSetDone} className="btn-primary">
        {isLastSet
          ? isLastExercise
            ? 'Finish Exercises'
            : 'Done — Next Exercise'
          : 'Done — Next Set'}
      </button>

      {currentPlanExercise.notes && (
        <p className="text-base text-gray-500 mt-4 text-center italic">
          Note from your physio: {currentPlanExercise.notes}
        </p>
      )}
    </div>
  )
}
