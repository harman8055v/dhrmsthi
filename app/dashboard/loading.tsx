import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
      <div className="w-full max-w-4xl px-4">
        <div className="flex flex-col items-center gap-6 mb-8">
          <Skeleton className="h-12 w-12 rounded-full" />
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
} 