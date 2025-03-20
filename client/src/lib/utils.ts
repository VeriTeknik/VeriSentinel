import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { SeverityLevel } from "@shared/types/audit-logs"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

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
  switch (severity) {
    case 0:
      return "bg-red-50"
    case 1:
      return "bg-orange-50"
    case 2:
      return "bg-amber-50"
    case 3:
      return "bg-yellow-50"
    case 4:
      return "bg-blue-50"
    case 5:
      return "bg-indigo-50"
    case 6:
      return "bg-purple-50"
    case 7:
      return "bg-gray-50"
    default:
      return ""
  }
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  })
}

