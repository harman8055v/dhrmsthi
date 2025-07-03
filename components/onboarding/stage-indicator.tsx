interface StageIndicatorProps {
  currentStage: number
  totalStages: number
  stageName: string
}

export default function StageIndicator({ currentStage, totalStages }: StageIndicatorProps) {
  return (
    <div className="fixed top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg z-10 border border-orange-100">
      <div className="flex items-center text-sm">
        <span className="font-medium text-amber-800">
          {currentStage} of {totalStages}
        </span>
      </div>
    </div>
  )
}
