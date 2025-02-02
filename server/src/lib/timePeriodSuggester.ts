import { Temporal } from '@js-temporal/polyfill';
import { v4 as uuidv4 } from 'uuid';
import { ITimePeriodSettings, ITimePeriod } from '@/interfaces/timeEntry.interfaces';


export type TimePeriodSettings = ITimePeriodSettings;

export class TimePeriodSuggester {
  private static parseDateString(dateStr: string): Temporal.PlainDate {
    return Temporal.PlainDate.from(dateStr.split('T')[0]);
  }  
  static suggestNewTimePeriod(
    settings: TimePeriodSettings,
    existingPeriods: ITimePeriod[] = []
  ): ITimePeriod {
    let currentDate = Temporal.Now.plainDateISO();

    if (existingPeriods.length > 0) {
      const lastPeriod = existingPeriods[existingPeriods.length - 1];
      currentDate = this.parseDateString(lastPeriod.end_date).add({ days: 1 });
    }

    const startDate = currentDate;
    let endDate: Temporal.PlainDate;

    switch (settings.frequency_unit) {
      case 'day':
        endDate = startDate.add({ days: settings.frequency - 1 });
        break;
      case 'week':
        endDate = startDate.add({ weeks: settings.frequency });
        break;
      case 'month':
        endDate = startDate.add({ months: settings.frequency });
        if (settings.end_day) {
          endDate = endDate.with({ day: settings.end_day });
        }
        break;
      case 'year':
        endDate = startDate.add({ years: settings.frequency });
        break;
      default:
        throw new Error(`Unsupported frequency unit: ${settings.frequency_unit}`);
    }

    return {
      period_id: existingPeriods.length > 0
        ? existingPeriods[existingPeriods.length - 1].period_id
        : uuidv4(),
      start_date: startDate.toString(),
      end_date: endDate.toString()
    };
  }

  static calculateEndDate(
    startDate: Temporal.PlainDate,
    settings: TimePeriodSettings
  ): Temporal.PlainDate {
    let endDate: Temporal.PlainDate;

    switch (settings.frequency_unit) {
      case 'day':
        endDate = startDate.add({ days: settings.frequency - 1 });
        break;
      case 'week':
        endDate = startDate.add({ weeks: settings.frequency });
        break;
      case 'month':
        endDate = startDate.add({ months: settings.frequency }).subtract({ days: 1 });
        if (settings.end_day) {
          endDate = endDate.with({ day: settings.end_day });
        }
        break;
      case 'year':
        endDate = startDate.add({ years: settings.frequency }).subtract({ days: 1 });
        break;
      default:
        throw new Error(`Unsupported frequency unit: ${settings.frequency_unit}`);
    }

    return endDate;
  }
}
