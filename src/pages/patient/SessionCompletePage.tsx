import { Link } from 'react-router-dom'

export default function SessionCompletePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-5xl text-brand-600">✓</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Great work!</h1>
        <p className="text-xl text-gray-600 mb-8">You finished today's exercises.</p>
        <Link to="/" className="btn-primary max-w-xs mx-auto">
          Back to Home
        </Link>
      </div>
    </div>
  )
}
