import { Skeleton } from "@/components/ui/skeleton";

const LINE_KEYS = ["first", "second"] as const;

export function ChatPanelSkeleton() {
  return (
    <main className="mx-auto my-8 flex max-w-2xl flex-col gap-4 px-4">
      <Skeleton className="h-9 w-48" />
      {LINE_KEYS.map((key) => (
        <Skeleton key={key} className="h-5 w-full" />
      ))}
      <div className="flex gap-2">
        <Skeleton className="h-11 flex-1" />
        <Skeleton className="h-10 w-20" />
      </div>
    </main>
  );
}
