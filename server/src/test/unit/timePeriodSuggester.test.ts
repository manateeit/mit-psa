import { describe, it, expect } from 'vitest';
import { Temporal } from '@js-temporal/polyfill';
import { TimePeriodSuggester } from '../../lib/timePeriodSuggester';
import { ITimePeriodSettings, ITimePeriod } from '@/interfaces/timeEntry.interfaces';

const createTestSettings = (unit: 'day' | 'week' | 'month' | 'year', frequency: number): ITimePeriodSettings => ({
  time_period_settings_id: 'test-settings-id',
  frequency_unit: unit,
  frequency,
  is_active: true,
  effective_from: Temporal.Now.plainDateTimeISO().toString(),
  created_at: Temporal.Now.plainDateTimeISO().toString(),
  updated_at: Temporal.Now.plainDateTimeISO().toString(),
  tenant_id: 'test-tenant-id'
});

describe('TimePeriodSuggester', () => {
  describe('suggestNewTimePeriod', () => {
    it('should suggest monthly periods with no existing periods', () => {
      const settings = createTestSettings('month', 1);
      const existingPeriods: ITimePeriod[] = [];      
      const period = TimePeriodSuggester.suggestNewTimePeriod(settings, existingPeriods);

      expect(period.start_date).toBe(Temporal.Now.plainDateISO().toString());
      expect(period.end_date).toBe(
        Temporal.Now.plainDateISO().add({ months: 1 }).toString()
      );
    });

    it('should suggest monthly periods with existing periods', () => {
      const settings = createTestSettings('month', 1);
      const existingPeriods: ITimePeriod[] = [{
        period_id: 'test-period-1',
        start_date: '2025-01-01',
        end_date: '2025-01-31'
      }];
      const period = TimePeriodSuggester.suggestNewTimePeriod(settings, existingPeriods);

      expect(period.start_date).toBe('2025-02-01');
      expect(period.end_date).toBe('2025-03-01');
    });

    it('should suggest weekly periods', () => {
      const settings = createTestSettings('week', 1);
      const period = TimePeriodSuggester.suggestNewTimePeriod(settings);

      expect(period.start_date).toBe(Temporal.Now.plainDateISO().toString());
      expect(period.end_date).toBe(
        Temporal.Now.plainDateISO().add({ weeks: 1 }).toString()
      );
    });

    it('should suggest yearly periods', () => {
      const settings = createTestSettings('year', 1);
      const period = TimePeriodSuggester.suggestNewTimePeriod(settings);

      expect(period.start_date).toBe(Temporal.Now.plainDateISO().toString());
      expect(period.end_date).toBe(
        Temporal.Now.plainDateISO().add({ years: 1 }).toString()
      );
    });
  });
});
