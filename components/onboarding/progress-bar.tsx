interface ProgressBarProps {
  currentStage: number
  totalStages: number
  stageName: string
}

export default function ProgressBar({ currentStage, totalStages, stageName }: ProgressBarProps) {
  const progressPercentage = (currentStage / totalStages) * 100

  const stageNames = ["Seed", "Stem", "Leaves", "Petals", "Full Bloom"]

  return (
    <div className="w-full max-w-2xl mx-auto mb-8">
      {/* Stage info */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{stageName}</h3>
          <p className="text-sm text-gray-600">
            Step {currentStage} of {totalStages}
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-orange-600">{Math.round(progressPercentage)}%</div>
          <div className="text-xs text-gray-500">Complete</div>
        </div>
      </div>

      {/* Progress bar container */}
      <div className="relative">
        {/* Background bar */}
        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          {/* Progress fill */}
          <div
            className="h-full bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 rounded-full transition-all duration-700 ease-out relative overflow-hidden"
            style={{ width: `${progressPercentage}%` }}
          >
            {/* Animated shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />

            {/* Moving sparkle effect */}
            {progressPercentage > 0 && (
              <div
                className="absolute top-1/2 transform -translate-y-1/2 w-2 h-2 bg-white rounded-full opacity-80 animate-bounce"
                style={{
                  right: "4px",
                  animationDuration: "1.5s",
                }}
              />
            )}
          </div>
        </div>

        {/* Stage markers */}
        <div className="flex justify-between absolute -top-1 w-full">
          {Array.from({ length: totalStages }, (_, index) => {
            const stageNumber = index + 1
            const isCompleted = currentStage > stageNumber
            const isCurrent = currentStage === stageNumber

            return (
              <div
                key={stageNumber}
                className={`relative flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all duration-500 ${
                  isCompleted
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 border-orange-500 text-white shadow-lg"
                    : isCurrent
                      ? "bg-white border-orange-500 text-orange-600 shadow-lg animate-pulse"
                      : "bg-gray-100 border-gray-300 text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <span className="text-xs font-bold">{stageNumber}</span>
                )}

                {/* Stage name tooltip */}
                <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {stageNames[index]}
                  </div>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1 w-0 h-0 border-l-2 border-r-2 border-b-2 border-transparent border-b-gray-900" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stage descriptions */}
      <div className="flex justify-between mt-8 text-xs text-gray-500">
        {stageNames.map((name, index) => (
          <div
            key={name}
            className={`text-center transition-colors duration-300 ${
              currentStage > index + 1
                ? "text-green-600 font-medium"
                : currentStage === index + 1
                  ? "text-orange-600 font-semibold"
                  : "text-gray-400"
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Completion celebration */}
      {currentStage === totalStages && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
            <span className="text-green-700 font-medium text-sm">Profile Complete! 🌸</span>
          </div>
        </div>
      )}
    </div>
  )
}
