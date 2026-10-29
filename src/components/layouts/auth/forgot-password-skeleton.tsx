import { Skeleton } from "@/components/ui/skeleton";

export function ForgotPasswordSkeleton() {
  return (
    <div className="flex w-full max-w-100 flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-11 w-full" />
      </div>
      <Skeleton className="h-11 w-full" />
    </div>
  );
}
