import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { Exercise } from '../../lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Plus, X, Dumbbell } from 'lucide-react'

export default function ExerciseLibraryPage() {
  const { user } = useAuth()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [instructions, setInstructions] = useState('')
  const [saving, setSaving] = useState(false)

  async function fetchExercises() {
    const { data } = await supabase
      .from('exercises')
      .select('*')
      .order('created_at', { ascending: false })

    setExercises((data as Exercise[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchExercises() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { error } = await supabase.from('exercises').insert({
      created_by: user!.id,
      name,
      description,
      instructions: instructions.split('\n').filter(line => line.trim()),
    })

    if (!error) {
      setName('')
      setDescription('')
      setInstructions('')
      setShowForm(false)
      fetchExercises()
    }
    setSaving(false)
  }

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-foreground">Exercise Library</h1>
        <Button
          size="sm"
          variant={showForm ? 'outline' : 'default'}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <><X className="size-5" /> Cancel</> : <><Plus className="size-5" /> New</>}
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="exName">Exercise Name</Label>
                <Input
                  id="exName"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Seated Knee Extension"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exDesc">Description</Label>
                <Input
                  id="exDesc"
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Brief description of the exercise"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="exInstructions">Instructions (one step per line)</Label>
                <Textarea
                  id="exInstructions"
                  required
                  rows={4}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder={"Sit in a sturdy chair\nSlowly straighten one knee\nHold for 5 seconds\nLower slowly and repeat"}
                />
              </div>

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? 'Saving...' : 'Create Exercise'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <p className="text-lg text-muted-foreground">Loading...</p>
      ) : exercises.length === 0 ? (
        <div className="text-center py-12">
          <Dumbbell className="size-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-lg text-muted-foreground">No exercises yet. Create your first one above.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {exercises.map((ex) => (
            <Card key={ex.id}>
              <CardHeader>
                <CardTitle>{ex.name}</CardTitle>
                {ex.description && <CardDescription>{ex.description}</CardDescription>}
              </CardHeader>
              <CardContent>
                <ol className="list-decimal list-inside space-y-1">
                  {ex.instructions.map((step, i) => (
                    <li key={i} className="text-base text-foreground/80">{step}</li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
