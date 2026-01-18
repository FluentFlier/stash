import { addDays, addHours, addMinutes, format, parseISO } from 'date-fns';

export const dateUtils = {
  /**
   * Parse ISO string to Date
   */
  parse(dateString: string): Date {
    return parseISO(dateString);
  },

  /**
   * Format date to ISO string
   */
  toISO(date: Date): string {
    return date.toISOString();
  },

  /**
   * Format date with custom pattern
   */
  format(date: Date, pattern: string = 'yyyy-MM-dd HH:mm:ss'): string {
    return format(date, pattern);
  },

  /**
   * Add days to date
   */
  addDays(date: Date, days: number): Date {
    return addDays(date, days);
  },

  /**
   * Add hours to date
   */
  addHours(date: Date, hours: number): Date {
    return addHours(date, hours);
  },

  /**
   * Add minutes to date
   */
  addMinutes(date: Date, minutes: number): Date {
    return addMinutes(date, minutes);
  },

  /**
   * Get current timestamp
   */
  now(): Date {
    return new Date();
  },

  /**
   * Check if date is in the past
   */
  isPast(date: Date): boolean {
    return date < new Date();
  },

  /**
   * Check if date is in the future
   */
  isFuture(date: Date): boolean {
    return date > new Date();
  },
};
