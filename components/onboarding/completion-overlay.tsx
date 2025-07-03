export default function CompletionOverlay() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-lg p-8 max-w-md text-center">
        <div className="w-24 h-24 mx-auto mb-4">
          {/* Full bloom lotus animation */}
          <svg viewBox="0 0 100 100" className="w-full h-full animate-pulse">
            <circle cx="50" cy="50" r="10" fill="#f59e0b" />
            <path d="M50,50 C60,30 70,20 50,0 C30,20 40,30 50,50" fill="#fbbf24" transform="rotate(0, 50, 50)" />
            <path d="M50,50 C60,30 70,20 50,0 C30,20 40,30 50,50" fill="#fbbf24" transform="rotate(72, 50, 50)" />
            <path d="M50,50 C60,30 70,20 50,0 C30,20 40,30 50,50" fill="#fbbf24" transform="rotate(144, 50, 50)" />
            <path d="M50,50 C60,30 70,20 50,0 C30,20 40,30 50,50" fill="#fbbf24" transform="rotate(216, 50, 50)" />
            <path d="M50,50 C60,30 70,20 50,0 C30,20 40,30 50,50" fill="#fbbf24" transform="rotate(288, 50, 50)" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-amber-800 mb-2">Welcome to the DharmaSaathi Community!</h2>
        <p className="text-amber-700">Your spiritual journey begins now. Redirecting to your dashboard...</p>
      </div>
    </div>
  )
}
