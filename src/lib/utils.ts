import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isEventUpcoming(event: { startDate: string; endDate?: string | null }): boolean {
  const now = new Date();
  
  if (event.endDate) {
    const endDate = new Date(event.endDate);
    return endDate >= now;
  } else {
    const startDate = new Date(event.startDate);
    return startDate >= now;
  }
}
