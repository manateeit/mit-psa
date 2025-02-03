import { describe, it, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { TimePeriodSuggester } from '../../lib/timePeriodSuggester';
import { ITimePeriodSettings, ITimePeriod } from '@/interfaces/timeEntry.interfaces';

const createTestSettings = (
  unit: 'day' | 'week' | 'month' | 'year',
  frequency: number,
  start_day?: number,
  end_day?: number
): ITimePeriodSettings => ({
  time_period_settings_id: 'test-settings-id',
  frequency_unit: unit,
  frequency,
  start_day,
  end_day,
  is_active: true,
  effective_from: Temporal.PlainDate.from('2024-01-01').toString(),
  created_at: Temporal.Now.plainDateTimeISO().toString(),
  updated_at: Temporal.Now.plainDateTimeISO().toString(),
  tenant_id: 'test-tenant-id'
});

describe('TimePeriodSuggester', () => {
  describe('suggestNewTimePeriod', () => {
    it('should suggest monthly periods with no existing periods', () => {
      const settings = [createTestSettings('month', 1)];
      const existingPeriods: ITimePeriod[] = [];
      const period = TimePeriodSuggester.suggestNewTimePeriod(settings, existingPeriods);

      expect(period.start_date).toBe(Temporal.Now.plainDateISO().toString());
      expect(period.end_date).toBe(
        Temporal.Now.plainDateISO().add({ months: 1 }).with({ day: 1 }).toString()
      );
    });

    it('should suggest monthly periods with existing periods', () => {
      const settings = [createTestSettings('month', 1)];
      const existingPeriods: ITimePeriod[] = [{
        period_id: 'test-period-1',
        start_date: '2025-01-01',
        end_date: '2025-02-01'
      }];
      const period = TimePeriodSuggester.suggestNewTimePeriod(settings, existingPeriods);

      expect(period.start_date).toBe('2025-02-01');
      expect(period.end_date).toBe('2025-03-01');
    });

    it('should suggest weekly periods', () => {
      const settings = [createTestSettings('week', 1)];
      const period = TimePeriodSuggester.suggestNewTimePeriod(settings);

      expect(period.start_date).toBe(Temporal.Now.plainDateISO().toString());
      expect(period.end_date).toBe(
        Temporal.Now.plainDateISO().add({ weeks: 1 }).toString()
      );
    });

    it('should suggest yearly periods', () => {
      const settings = [createTestSettings('year', 1)];
      const period = TimePeriodSuggester.suggestNewTimePeriod(settings);

      expect(period.start_date).toBe(Temporal.Now.plainDateISO().toString());
      expect(period.end_date).toBe(
        Temporal.Now.plainDateISO().add({ years: 1 }).toString()
      );
    });

    it('should handle multiple semi-monthly settings together', () => {
      const settings = [
        createTestSettings('month', 1, 1, 15),
        createTestSettings('month', 1, 16, 0)
      ];

      const existingPeriod: ITimePeriod[] = [{
        period_id: 'test-period-1',
        start_date: '2024-12-16',
        end_date: '2025-01-01'
      }];

      // Generate first period using first setting
      const period1 = TimePeriodSuggester.suggestNewTimePeriod(settings, existingPeriod);
      expect(period1.start_date).toBe('2025-01-01');
      expect(period1.end_date).toBe('2025-01-16');

      // Generate second period using second setting
      const period2 = TimePeriodSuggester.suggestNewTimePeriod(settings, [period1]);
      expect(period2.start_date).toBe('2025-01-16');
      expect(period2.end_date).toBe('2025-02-01');

      // Generate next month's first period
      const period3 = TimePeriodSuggester.suggestNewTimePeriod(settings, [period1, period2]);
      expect(period3.start_date).toBe('2025-02-01');
      expect(period3.end_date).toBe('2025-02-16');

      // Generate next month's second period
      const period4 = TimePeriodSuggester.suggestNewTimePeriod(settings, [period1, period2, period3]);
      expect(period4.start_date).toBe('2025-02-16');
      expect(period4.end_date).toBe('2025-03-01');
    });

    it('should handle February correctly in leap years', () => {
      const settings = [
        createTestSettings('month', 1, 1, 15),
        createTestSettings('month', 1, 16, 0)
      ];
      const existingPeriods: ITimePeriod[] = [{
        period_id: 'test-period-1',
        start_date: '2024-01-16',
        end_date: '2024-02-01'
      }];
      const period = TimePeriodSuggester.suggestNewTimePeriod(settings, existingPeriods);

      expect(period.start_date).toBe('2024-02-01');
      expect(period.end_date).toBe('2024-02-16');
    });

    it('should suggest next period after existing periods', () => {
      const settings = [createTestSettings('month', 1)];
      const existingPeriods: ITimePeriod[] = [
        {
          period_id: 'test-period-1',
          start_date: '2024-12-25',
          end_date: '2025-01-14'
        },
        {
          period_id: 'test-period-2',
          start_date: '2024-12-17',
          end_date: '2024-12-24'
        },
        {
          period_id: 'test-period-3',
          start_date: '2024-11-01',
          end_date: '2024-11-30'
        }
      ];
      const period = TimePeriodSuggester.suggestNewTimePeriod(settings, existingPeriods);

      expect(period.start_date).toBe('2025-01-14');
    });
  });
});
