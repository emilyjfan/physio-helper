import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import BackButton from '../../components/ui/BackButton'
import type { Exercise } from '../../lib/types'

interface PlanExerciseEntry {
  exercise: Exercise
  sets: number
  reps: number
  hold_seconds: string
  notes: string
}

export default function PlanBuilderPage() {
  const { user } = useAuth()
  const { patientId } = useParams()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [planNotes, setPlanNotes] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [selectedExercises, setSelectedExercises] = useState<PlanExerciseEntry[]>([])
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    supabase
      .from('exercises')
      .select('*')
      .order('name')
      .then(({ data }) => setExercises((data as Exercise[]) ?? []))
  }, [])

  const filteredExercises = exercises.filter(
    (ex) =>
      ex.name.toLowerCase().includes(search.toLowerCase()) &&
      !selectedExercises.some((se) => se.exercise.id === ex.id)
  )

  function addExercise(ex: Exercise) {
    setSelectedExercises([
      ...selectedExercises,
      { exercise: ex, sets: 3, reps: 10, hold_seconds: '', notes: '' },
    ])
    setSearch('')
  }

  function removeExercise(index: number) {
    setSelectedExercises(selectedExercises.filter((_, i) => i !== index))
  }

  function updateEntry(index: number, updates: Partial<PlanExerciseEntry>) {
    setSelectedExercises(
      selectedExercises.map((entry, i) => (i === index ? { ...entry, ...updates } : entry))
    )
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (selectedExercises.length === 0) return
    setSaving(true)

    // Deactivate any existing active plans for this patient
    await supabase
      .from('plans')
      .update({ is_active: false })
      .eq('patient_id', patientId!)
      .eq('is_active', true)

    // Create the plan
    const { data: plan, error: planError } = await supabase
      .from('plans')
      .insert({
        physio_id: user!.id,
        patient_id: patientId!,
        title,
        notes: planNotes || null,
        is_active: true,
      })
      .select()
      .single()

    if (planError || !plan) {
      setSaving(false)
      return
    }

    // Insert plan exercises
    const planExercises = selectedExercises.map((entry, index) => ({
      plan_id: plan.id,
      exercise_id: entry.exercise.id,
      sets: entry.sets,
      reps: entry.reps,
      hold_seconds: entry.hold_seconds ? parseInt(entry.hold_seconds) : null,
      order_index: index,
      notes: entry.notes || null,
    }))

    await supabase.from('plan_exercises').insert(planExercises)

    setSaving(false)
    navigate(`/patients/${patientId}`)
  }

  return (
    <div className="min-h-screen p-6">
      <BackButton />
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Build a Plan</h1>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Plan title */}
        <div>
          <label htmlFor="planTitle" className="block text-lg font-medium text-gray-700 mb-1">
            Plan Title
          </label>
          <input
            id="planTitle"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Post knee replacement — Week 1"
            className="w-full min-h-touch rounded-xl border-2 border-gray-300 px-4 text-lg focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Plan notes */}
        <div>
          <label htmlFor="planNotes" className="block text-lg font-medium text-gray-700 mb-1">
            Notes for Patient (optional)
          </label>
          <textarea
            id="planNotes"
            rows={2}
            value={planNotes}
            onChange={(e) => setPlanNotes(e.target.value)}
            placeholder="e.g. Do these exercises twice a day"
            className="w-full rounded-xl border-2 border-gray-300 p-4 text-lg focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Add exercises */}
        <div>
          <label htmlFor="exSearch" className="block text-lg font-medium text-gray-700 mb-1">
            Add Exercises
          </label>
          <input
            id="exSearch"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your exercise library..."
            className="w-full min-h-touch rounded-xl border-2 border-gray-300 px-4 text-lg focus:border-brand-500 focus:outline-none"
          />
          {search && filteredExercises.length > 0 && (
            <div className="mt-2 border-2 border-gray-200 rounded-xl overflow-hidden">
              {filteredExercises.slice(0, 5).map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => addExercise(ex)}
                  className="w-full text-left px-4 py-3 text-lg hover:bg-brand-50 border-b border-gray-100 last:border-0"
                >
                  {ex.name}
                </button>
              ))}
            </div>
          )}
          {search && filteredExercises.length === 0 && (
            <p className="mt-2 text-base text-gray-400">No matching exercises found.</p>
          )}
        </div>

        {/* Selected exercises */}
        {selectedExercises.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Exercises in Plan</h2>
            {selectedExercises.map((entry, index) => (
              <div key={entry.exercise.id} className="card">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-xl font-bold text-gray-900">
                    {index + 1}. {entry.exercise.name}
                  </h3>
                  <button
                    type="button"
                    onClick={() => removeExercise(index)}
                    className="text-lg text-red-500 font-medium min-h-[48px] min-w-[48px] flex items-center justify-center"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Sets</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={entry.sets}
                      onChange={(e) => updateEntry(index, { sets: parseInt(e.target.value) || 1 })}
                      className="w-full min-h-[56px] rounded-xl border-2 border-gray-300 px-4 text-lg text-center focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Reps</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={entry.reps}
                      onChange={(e) => updateEntry(index, { reps: parseInt(e.target.value) || 1 })}
                      className="w-full min-h-[56px] rounded-xl border-2 border-gray-300 px-4 text-lg text-center focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Hold (seconds)</label>
                    <input
                      type="number"
                      min={0}
                      value={entry.hold_seconds}
                      onChange={(e) => updateEntry(index, { hold_seconds: e.target.value })}
                      placeholder="—"
                      className="w-full min-h-[56px] rounded-xl border-2 border-gray-300 px-4 text-lg text-center focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Notes</label>
                    <input
                      type="text"
                      value={entry.notes}
                      onChange={(e) => updateEntry(index, { notes: e.target.value })}
                      placeholder="Optional"
                      className="w-full min-h-[56px] rounded-xl border-2 border-gray-300 px-4 text-lg focus:border-brand-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={saving || selectedExercises.length === 0}
          className="btn-primary"
        >
          {saving ? 'Saving...' : 'Save Plan'}
        </button>
      </form>
    </div>
  )
}
