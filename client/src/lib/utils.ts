import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

import type { SeverityLevel } from "./types"

export function getSeverityLabel(severity: SeverityLevel): string {
  switch (severity) {
    case 0:
      return "Emergency"
    case 1:
      return "Alert"
    case 2:
      return "Critical"
    case 3:
      return "Error"
    case 4:
      return "Warning"
    case 5:
      return "Notice"
    case 6:
      return "Info"
    case 7:
      return "Debug"
    default:
      return "Unknown"
  }
}

export function getSeverityColor(severity: SeverityLevel): string {
  if (severity <= 1) {
    return "bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-950/50"
  } else if (severity <= 3) {
    return "bg-orange-50 dark:bg-orange-950/30 hover:bg-orange-100 dark:hover:bg-orange-950/50"
  } else if (severity <= 5) {
    return "bg-yellow-50 dark:bg-yellow-950/30 hover:bg-yellow-100 dark:hover:bg-yellow-950/50"
  } else {
    return "bg-gray-50 dark:bg-gray-800/30 hover:bg-gray-100 dark:hover:bg-gray-800/50"
  }
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date)
}

