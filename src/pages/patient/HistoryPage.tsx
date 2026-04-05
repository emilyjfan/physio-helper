import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, TrendingUp } from 'lucide-react'
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
        <p className="text-xl text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const today = new Date()
  const thisWeekSessions = sessions.filter((s) => {
    const d = new Date(s.started_at)
    const diffDays = Math.floor((today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays < 7
  })
  const completedThisWeek = thisWeekSessions.filter((s) => s.completed_at).length

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-3xl font-bold text-foreground mb-6">My History</h1>

      {/* Weekly summary */}
      <Card className="mb-6">
        <CardContent className="pt-6 text-center">
          <TrendingUp className="size-8 mx-auto text-primary mb-2" />
          <p className="text-lg text-muted-foreground">This Week</p>
          <p className="text-4xl font-bold text-primary my-2">{completedThisWeek}</p>
          <p className="text-lg text-muted-foreground">session{completedThisWeek !== 1 && 's'} completed</p>
        </CardContent>
      </Card>

      {/* Session list */}
      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <CalendarDays className="size-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-lg text-muted-foreground">No sessions yet. Start your first one from the home page!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <Card key={s.id}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-medium text-foreground">
                    {new Date(s.started_at).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-base text-muted-foreground">{s.plans.title}</p>
                </div>
                <Badge variant={s.completed_at ? 'default' : 'secondary'}>
                  {s.completed_at ? 'Done' : 'Partial'}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
