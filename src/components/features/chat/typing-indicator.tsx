const DOT_DELAYS = ["delay-0", "delay-150", "delay-300"] as const;

export function TypingIndicator() {
  return (
    <div role="status" className="flex items-center gap-2 text-xs text-ink-3">
      <span aria-hidden="true" className="flex gap-1">
        {DOT_DELAYS.map((delay) => (
          <span key={delay} className={`size-1.5 animate-pulse rounded-full bg-ink-3 ${delay}`} />
        ))}
      </span>
      Nexo está digitando
    </div>
  );
}
