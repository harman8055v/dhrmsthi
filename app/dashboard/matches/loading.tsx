import { Skeleton } from "@/components/ui/skeleton";

export default function MatchesLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
      <div className="w-full max-w-4xl px-4">
        <div className="mb-6">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="mb-8">
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
        <div className="mb-4">
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
