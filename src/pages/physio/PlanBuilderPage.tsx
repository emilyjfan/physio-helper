import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import BackButton from '../../components/ui/BackButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Trash2 } from 'lucide-react'
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

    await supabase
      .from('plans')
      .update({ is_active: false })
      .eq('patient_id', patientId!)
      .eq('is_active', true)

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
      <h1 className="text-3xl font-bold text-foreground mb-6">Build a Plan</h1>

      <form onSubmit={handleSave} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="planTitle">Plan Title</Label>
          <Input
            id="planTitle"
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Post knee replacement — Week 1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="planNotes">Notes for Patient (optional)</Label>
          <Textarea
            id="planNotes"
            rows={2}
            value={planNotes}
            onChange={(e) => setPlanNotes(e.target.value)}
            placeholder="e.g. Do these exercises twice a day"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="exSearch">Add Exercises</Label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <Input
              id="exSearch"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your exercise library..."
              className="pl-12"
            />
          </div>
          {search && filteredExercises.length > 0 && (
            <Card className="mt-2 p-0 overflow-hidden">
              {filteredExercises.slice(0, 5).map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => addExercise(ex)}
                  className="w-full text-left px-4 py-3 text-lg hover:bg-accent border-b border-border last:border-0 transition-colors"
                >
                  {ex.name}
                </button>
              ))}
            </Card>
          )}
          {search && filteredExercises.length === 0 && (
            <p className="mt-2 text-base text-muted-foreground">No matching exercises found.</p>
          )}
        </div>

        {selectedExercises.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Exercises in Plan</h2>
            {selectedExercises.map((entry, index) => (
              <Card key={entry.exercise.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">
                      {index + 1}. {entry.exercise.name}
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeExercise(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-5" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="space-y-1">
                      <Label className="text-sm">Sets</Label>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        value={entry.sets}
                        onChange={(e) => updateEntry(index, { sets: parseInt(e.target.value) || 1 })}
                        className="text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Reps</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={entry.reps}
                        onChange={(e) => updateEntry(index, { reps: parseInt(e.target.value) || 1 })}
                        className="text-center"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-sm">Hold (seconds)</Label>
                      <Input
                        type="number"
                        min={0}
                        value={entry.hold_seconds}
                        onChange={(e) => updateEntry(index, { hold_seconds: e.target.value })}
                        placeholder="—"
                        className="text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-sm">Notes</Label>
                      <Input
                        type="text"
                        value={entry.notes}
                        onChange={(e) => updateEntry(index, { notes: e.target.value })}
                        placeholder="Optional"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Button
          type="submit"
          disabled={saving || selectedExercises.length === 0}
          className="w-full"
        >
          {saving ? 'Saving...' : 'Save Plan'}
        </Button>
      </form>
    </div>
  )
}
