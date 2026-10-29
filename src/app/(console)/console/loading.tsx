import { Skeleton } from "@/components/ui/skeleton";

const ROW_KEYS = ["first", "second", "third", "fourth", "fifth", "sixth"] as const;

export default function ConsoleLoading() {
  return (
    <div className="flex h-full">
      <div className="flex w-95 shrink-0 flex-col gap-3 border-r border-rule p-4">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-9 w-full rounded-full" />
        {ROW_KEYS.map((key) => (
          <Skeleton key={key} className="h-16 w-full rounded-xl" />
        ))}
      </div>
      <div className="flex-1 bg-desk" />
    </div>
  );
}
