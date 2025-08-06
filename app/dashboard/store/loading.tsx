import { Skeleton } from "@/components/ui/skeleton";

export default function StoreLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100 flex items-center justify-center">
      <div className="w-full max-w-4xl px-4">
        <div className="text-center mb-8">
          <Skeleton className="h-10 w-64 mx-auto mb-2" />
          <Skeleton className="h-4 w-40 mx-auto mb-4" />
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-6 w-32" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
} 