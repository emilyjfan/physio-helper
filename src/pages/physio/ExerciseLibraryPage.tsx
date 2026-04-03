import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { Exercise } from '../../lib/types'

export default function ExerciseLibraryPage() {
  const { user } = useAuth()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  // Form state
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
        <h1 className="text-3xl font-bold text-gray-900">Exercise Library</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="min-h-[48px] px-5 bg-brand-600 text-white text-lg font-semibold rounded-xl"
        >
          {showForm ? 'Cancel' : '+ New'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="card mb-6 space-y-4">
          <div>
            <label htmlFor="exName" className="block text-lg font-medium text-gray-700 mb-1">
              Exercise Name
            </label>
            <input
              id="exName"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Seated Knee Extension"
              className="w-full min-h-touch rounded-xl border-2 border-gray-300 px-4 text-lg focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="exDesc" className="block text-lg font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              id="exDesc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the exercise"
              className="w-full min-h-touch rounded-xl border-2 border-gray-300 px-4 text-lg focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="exInstructions" className="block text-lg font-medium text-gray-700 mb-1">
              Instructions (one step per line)
            </label>
            <textarea
              id="exInstructions"
              required
              rows={4}
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder={"Sit in a sturdy chair\nSlowly straighten one knee\nHold for 5 seconds\nLower slowly and repeat"}
              className="w-full rounded-xl border-2 border-gray-300 p-4 text-lg focus:border-brand-500 focus:outline-none"
            />
          </div>

          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? 'Saving...' : 'Create Exercise'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-lg text-gray-500">Loading...</p>
      ) : exercises.length === 0 ? (
        <p className="text-lg text-gray-400">No exercises yet. Create your first one above.</p>
      ) : (
        <div className="space-y-4">
          {exercises.map((ex) => (
            <div key={ex.id} className="card">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">{ex.name}</h2>
              {ex.description && (
                <p className="text-lg text-gray-600 mb-3">{ex.description}</p>
              )}
              <ol className="list-decimal list-inside space-y-1">
                {ex.instructions.map((step, i) => (
                  <li key={i} className="text-base text-gray-700">{step}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
