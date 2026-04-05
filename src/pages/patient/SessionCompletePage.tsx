import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Home } from 'lucide-react'

export default function SessionCompletePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="size-14 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-4">Great work!</h1>
        <p className="text-xl text-muted-foreground mb-8">You finished today's exercises.</p>
        <Link to="/">
          <Button className="max-w-xs mx-auto">
            <Home className="size-5" /> Back to Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
