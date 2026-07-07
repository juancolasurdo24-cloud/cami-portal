import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isSameDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";

export function monthRange(date: Date) {
  return { start: startOfMonth(date), end: endOfMonth(date) };
}

export function calendarGridRange(date: Date) {
  return {
    start: startOfWeek(startOfMonth(date), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(date), { weekStartsOn: 1 }),
  };
}

export function toDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const mo = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1, 12));
}

export function formatEs(date: Date, formatStr: string): string {
  return format(date, formatStr, { locale: es });
}

export function isSameDate(a: Date, b: Date): boolean {
  return isSameDay(a, b);
}

export function daysBetween(start: Date, end: Date): Date[] {
  return eachDayOfInterval({ start, end });
}

export function today(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function getWeekday(date: Date): number {
  return getDay(date);
}
