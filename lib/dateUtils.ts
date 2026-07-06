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
  return format(date, "yyyy-MM-dd");
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
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
