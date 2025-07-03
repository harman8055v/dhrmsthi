interface LotusAnimationProps {
  currentStage: number
}

export default function LotusAnimation({ currentStage }: LotusAnimationProps) {
  // Calculate completion percentage based on stage
  const completionPercentage = (currentStage / 5) * 100

  return (
    <div className="fixed top-8 left-8 z-20">
      <div className="relative w-20 h-20">
        {/* Animated background glow */}
        <div
          className="absolute inset-0 rounded-full blur-xl transition-all duration-1000 ease-out"
          style={{
            background: `radial-gradient(circle, rgba(251, 191, 36, ${0.1 + currentStage * 0.1}) 0%, transparent 70%)`,
            transform: `scale(${1 + currentStage * 0.1})`,
          }}
        />

        {/* Main lotus container */}
        <div className="relative w-full h-full">
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full transform transition-transform duration-500 hover:scale-110"
          >
            {/* Center of lotus - glows brighter as stages complete */}
            <circle
              cx="50"
              cy="50"
              r="8"
              className="transition-all duration-700 ease-out"
              style={{
                fill: currentStage >= 5 ? "#f59e0b" : "#fbbf24",
                filter: currentStage >= 5 ? "drop-shadow(0 0 8px #f59e0b)" : "none",
                transform: currentStage >= 5 ? "scale(1.2)" : "scale(1)",
              }}
            />

            {/* Petals - each opens progressively with smooth animation */}
            {[0, 72, 144, 216, 288].map((rotation, index) => {
              const isOpen = currentStage > index
              const isCompleted = currentStage >= 5

              return (
                <path
                  key={rotation}
                  d="M50,50 C60,30 70,20 50,0 C30,20 40,30 50,50"
                  className="transition-all duration-700 ease-out transform-origin-center"
                  style={{
                    fill: isOpen ? (isCompleted ? "#f59e0b" : "#fbbf24") : "#fef3c7",
                    transform: `rotate(${rotation}deg) ${isOpen ? "translateY(-3px) scale(1.05)" : "translateY(0) scale(1)"}`,
                    filter: isOpen && isCompleted ? "drop-shadow(0 2px 4px rgba(245, 158, 11, 0.3))" : "none",
                    opacity: isOpen ? 1 : 0.6,
                  }}
                />
              )
            })}

            {/* Completion sparkles */}
            {currentStage >= 5 && (
              <>
                <circle cx="30" cy="30" r="1" fill="#fbbf24" className="animate-ping" />
                <circle
                  cx="70"
                  cy="30"
                  r="1"
                  fill="#f59e0b"
                  className="animate-ping"
                  style={{ animationDelay: "0.5s" }}
                />
                <circle
                  cx="30"
                  cy="70"
                  r="1"
                  fill="#fbbf24"
                  className="animate-ping"
                  style={{ animationDelay: "1s" }}
                />
                <circle
                  cx="70"
                  cy="70"
                  r="1"
                  fill="#f59e0b"
                  className="animate-ping"
                  style={{ animationDelay: "1.5s" }}
                />
              </>
            )}
          </svg>

          {/* Progress ring around the lotus */}
          <div className="absolute inset-0 rounded-full">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(251, 191, 36, 0.2)" strokeWidth="2" />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#fbbf24"
                strokeWidth="2"
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                style={{
                  strokeDasharray: `${2 * Math.PI * 45}`,
                  strokeDashoffset: `${2 * Math.PI * 45 * (1 - completionPercentage / 100)}`,
                  filter: currentStage >= 5 ? "drop-shadow(0 0 4px #fbbf24)" : "none",
                }}
              />
            </svg>
          </div>

          {/* Stage number indicator */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-xs font-bold transition-all duration-500"
              style={{
                color: currentStage >= 5 ? "#92400e" : "#d97706",
                transform: currentStage >= 5 ? "scale(1.1)" : "scale(1)",
              }}
            >
              {currentStage}
            </span>
          </div>
        </div>

        {/* Floating particles for completed state */}
        {currentStage >= 5 && (
          <div className="absolute inset-0 pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-yellow-400 rounded-full animate-bounce"
                style={{
                  left: `${20 + i * 12}%`,
                  top: `${15 + (i % 2) * 70}%`,
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: "2s",
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
