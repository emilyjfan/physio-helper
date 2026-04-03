import { useNavigate } from 'react-router-dom'

export default function BackButton({ label = 'Back' }: { label?: string }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(-1)}
      className="min-h-[48px] text-lg text-brand-600 font-medium flex items-center gap-2 mb-4"
    >
      <span aria-hidden="true">&larr;</span> {label}
    </button>
  )
}
