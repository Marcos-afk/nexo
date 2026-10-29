import { Skeleton } from "@/components/ui/skeleton";

export function ChatPanelSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mx-auto flex min-h-0 w-full max-w-202 flex-1 flex-col justify-end gap-5 px-6 pt-7 pb-1">
        <div className="flex justify-end">
          <Skeleton className="h-10 w-80" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-20 w-full max-w-150" />
        </div>
      </div>
      <div className="mx-auto flex w-full max-w-202 flex-col gap-2 px-6 pt-2.5 pb-4.5">
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
