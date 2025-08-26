export default function ChatLoading() {
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="flex-1">
            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
            <div className="w-24 h-3 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Simple centered loader */}
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          {/* Simple lotus-inspired spinner */}
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0">
              {/* Petals as loading dots with CSS animation classes */}
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 bg-[#8b0000] rounded-full animate-pulse"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${i * 45}deg) translateX(20px) translateY(-50%)`,
                    animationDelay: `${i * 0.1}s`
                  }}
                />
              ))}
            </div>
          </div>
          <p className="text-gray-600">Loading conversation...</p>
        </div>
      </div>

      {/* Input Skeleton */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-3">
          <div className="flex-1 h-10 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}