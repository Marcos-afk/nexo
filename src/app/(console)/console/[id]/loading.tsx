import { Skeleton } from "@/components/ui/skeleton";

export default function ConversationLoading() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-rule px-6 py-3.5">
        <Skeleton className="size-11 rounded-full" />
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="flex-1" />
      <div className="px-6 py-4">
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    </div>
  );
}
