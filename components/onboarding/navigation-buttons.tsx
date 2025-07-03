"use client"

interface NavigationButtonsProps {
  currentStage: number
  totalStages: number
  isLoading: boolean
  onBack: () => void
  onNext: () => void
  onSkip: () => void
  canProceed: boolean
}

export default function NavigationButtons({
  currentStage,
  totalStages,
  isLoading,
  onBack,
  onNext,
  onSkip,
  canProceed,
}: NavigationButtonsProps) {
  // Don't show navigation for the first stage (email verification)
  if (currentStage === 1) return null

  const showSkip = currentStage > 2 // Allow skipping from stage 3 onwards (professional info and spiritual preferences) - Stage 1 (mobile verification) is now required

  return (
    <div className="flex justify-between items-center px-4 py-4 mt-6">
      <button
        type="button"
        onClick={onBack}
        disabled={isLoading}
        className="text-amber-600 hover:text-amber-800 disabled:opacity-50 font-medium px-4 py-2 rounded-lg transition-colors"
      >
        ← Back
      </button>

      <div className="flex items-center gap-3">
        {showSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50 font-medium px-4 py-2 rounded-lg transition-colors"
          >
            Skip for now
          </button>
        )}

        <div className="text-sm text-gray-500">
          {currentStage} of {totalStages}
        </div>
      </div>
    </div>
  )
}
