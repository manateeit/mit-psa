import { IScheduleEntry } from '@/interfaces/schedule.interfaces';

export function differentiateRecurringEntries(entries: IScheduleEntry[]): IScheduleEntry[] {
  return entries.map((entry:IScheduleEntry, index):IScheduleEntry => {
    if (entry.isRecurring) {
      return {
        ...entry,
        entry_id: `${entry.originalEntryId || entry.entry_id}_${index}`,
        title: `${entry.title} (Recurring)`
      };
    }
    return entry;
  });
}