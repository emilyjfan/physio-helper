import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import type { Session, Plan } from '../../lib/types'

interface SessionWithPlan extends Session {
  plans: Pick<Plan, 'title'>
}

export default function PatientHistoryPage() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState<SessionWithPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('sessions')
        .select('*, plans(title)')
        .eq('patient_id', user!.id)
        .order('started_at', { ascending: false })
        .limit(30)

      setSessions((data as SessionWithPlan[]) ?? [])
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

  // Group sessions by week
  const today = new Date()
  const thisWeekSessions = sessions.filter((s) => {
    const d = new Date(s.started_at)
    const diffDays = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays < 7
  })
  const completedThisWeek = thisWeekSessions.filter((s) => s.completed_at).length

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">My History</h1>

      {/* Weekly summary */}
      <div className="card mb-6 text-center">
        <p className="text-lg text-gray-500">This Week</p>
        <p className="text-4xl font-bold text-brand-600 my-2">{completedThisWeek}</p>
        <p className="text-lg text-gray-500">session{completedThisWeek !== 1 && 's'} completed</p>
      </div>

      {/* Session list */}
      {sessions.length === 0 ? (
        <p className="text-lg text-gray-400">No sessions yet. Start your first one from the home page!</p>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="card flex items-center justify-between">
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {new Date(s.started_at).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
                <p className="text-base text-gray-500">{s.plans.title}</p>
              </div>
              <span
                className={`text-lg font-semibold px-3 py-1 rounded-full ${
                  s.completed_at
                    ? 'bg-brand-100 text-brand-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}
              >
                {s.completed_at ? 'Done' : 'Partial'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
