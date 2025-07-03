import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
      <div className="w-full max-w-4xl px-4">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="space-y-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
          <Skeleton className="h-12 w-1/2" />
        </div>
      </div>
    </div>
  );
} 