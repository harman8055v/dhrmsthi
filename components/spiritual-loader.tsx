"use client"

interface SpiritualLoaderProps {
  size?: 'sm' | 'md' | 'lg'
  message?: string
  className?: string
}

export default function SpiritualLoader({ 
  size = 'md', 
  message,
  className = "" 
}: SpiritualLoaderProps) {
  
  const sizes = {
    sm: { container: 'w-8 h-8', dots: 'w-1 h-1', distance: '12px' },
    md: { container: 'w-12 h-12', dots: 'w-1.5 h-1.5', distance: '20px' },
    lg: { container: 'w-16 h-16', dots: 'w-2 h-2', distance: '28px' }
  }

  const currentSize = sizes[size]

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      <div className={`relative ${currentSize.container}`}>
        {/* Simple rotating dots forming a circle */}
        <div className="absolute inset-0 animate-spin">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className={`absolute ${currentSize.dots} bg-[#8b0000] rounded-full`}
              style={{
                top: '50%',
                left: '50%',
                transform: `rotate(${i * 45}deg) translateX(${currentSize.distance}) translateY(-50%)`,
                opacity: 0.3 + (i * 0.1)
              }}
            />
          ))}
        </div>
        
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`${currentSize.dots} bg-[#8b0000] rounded-full`}></div>
        </div>
      </div>

      {/* Optional message */}
      {message && (
        <p className="mt-3 text-sm text-gray-600 text-center">
          {message}
        </p>
      )}
    </div>
  )
}