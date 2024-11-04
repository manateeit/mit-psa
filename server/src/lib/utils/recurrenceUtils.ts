import { IScheduleEntry } from '@/interfaces/schedule.interfaces';
import { Frequency, RRule, Weekday } from 'rrule';

export function generateOccurrences(entry: IScheduleEntry, start: Date, end: Date): Date[] {
  if (!entry.recurrence_pattern) {
    return [entry.scheduled_start];
  }

  const pattern = entry.recurrence_pattern;
  const rrule = new RRule({
    freq: RRule[pattern.frequency.toUpperCase() as keyof typeof RRule] as Frequency,
    interval: pattern.interval,
    dtstart: new Date(pattern.startDate),
    until: pattern.endDate ? new Date(pattern.endDate) : undefined,
    byweekday: pattern.daysOfWeek?.map((day):Weekday => RRule[`MO TU WE TH FR SA SU`.split(' ')[day] as keyof typeof RRule] as Weekday),
    bymonthday: pattern.dayOfMonth,
    bymonth: pattern.monthOfYear,
    count: pattern.count
  });

  const occurrences = rrule.between(start, end);

  // Apply exceptions
  if (pattern.exceptions) {
    const exceptionDates = pattern.exceptions.map((d):string => d.toISOString().split('T')[0]);
    return occurrences.filter((date: Date) => !exceptionDates.includes(date.toISOString().split('T')[0]));
  }

  return occurrences;
}

export function applyTimeToDate(date: Date, time: Date): Date {
  const result = new Date(date);
  result.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds());
  return result;
}