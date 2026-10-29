import { Skeleton } from "@/components/ui/skeleton";

const FIELD_KEYS = ["email", "password"] as const;

export function LoginFormSkeleton() {
  return (
    <div className="flex w-full max-w-100 flex-col gap-6">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="flex flex-col gap-4">
        {FIELD_KEYS.map((key) => (
          <div key={key} className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-11 w-full" />
          </div>
        ))}
        <Skeleton className="h-4 w-56" />
      </div>
      <Skeleton className="h-11 w-full" />
    </div>
  );
}
