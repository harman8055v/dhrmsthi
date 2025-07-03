export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-orange-50">
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-amber-200 border-t-amber-600"></div>
      <p className="mt-4 text-amber-800">Loading your spiritual journey...</p>
    </div>
  )
}
