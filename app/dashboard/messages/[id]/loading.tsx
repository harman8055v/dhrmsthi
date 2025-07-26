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

      {/* Messages Skeleton */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Message bubbles skeleton */}
        <div className="flex justify-start">
          <div className="max-w-xs bg-gray-200 rounded-2xl p-4 animate-pulse">
            <div className="w-40 h-4 bg-gray-300 rounded mb-2"></div>
            <div className="w-24 h-3 bg-gray-300 rounded"></div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <div className="max-w-xs bg-gray-300 rounded-2xl p-4 animate-pulse">
            <div className="w-32 h-4 bg-gray-400 rounded mb-2"></div>
            <div className="w-16 h-3 bg-gray-400 rounded"></div>
          </div>
        </div>
        
        <div className="flex justify-start">
          <div className="max-w-xs bg-gray-200 rounded-2xl p-4 animate-pulse">
            <div className="w-48 h-4 bg-gray-300 rounded mb-2"></div>
            <div className="w-20 h-3 bg-gray-300 rounded"></div>
          </div>
        </div>
      </div>

      {/* Input Skeleton */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-12 bg-gray-200 rounded-full animate-pulse"></div>
          <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  )
} 