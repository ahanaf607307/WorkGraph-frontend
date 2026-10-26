import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isPast } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined, fmt = "MMM d, yyyy") {
  if (!date) return "No deadline";
  try {
    return format(new Date(date), fmt);
  } catch (error) {
    return "Invalid date";
  }
}

export function formatRelativeDate(date: string | Date | null | undefined) {
  if (!date) return "";
  try {
    const d = new Date(date);
    return formatDistanceToNow(d, { addSuffix: true });
  } catch (error) {
    return "";
  }
}

export function isDatePast(date: string | Date | null | undefined) {
  if (!date) return false;
  try {
    return isPast(new Date(date));
  } catch (error) {
    return false;
  }
}

export function getInitials(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
