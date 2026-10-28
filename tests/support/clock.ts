import type { Clock } from "@/lib/clock";

export const createFixedClock = (iso: string): Clock => ({ now: () => new Date(iso) });
