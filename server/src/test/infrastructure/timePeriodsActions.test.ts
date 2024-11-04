import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { generateAndSaveTimePeriods, getTimePeriodSettings } from '../../lib/actions/timePeriodsActions';
import { TimePeriod } from '../../lib/models/timePeriod';
import { TimePeriodSettings } from '../../lib/models/timePeriodSettings';
import { ITimePeriodSettings, ITimePeriod } from '@/interfaces/timeEntry.interfaces';

// Mock the database models
vi.mock('../../lib/models/timePeriod', () => ({
  TimePeriod: {
    create: vi.fn(),
  },
}));

vi.mock('../../lib/models/timePeriodSettings', () => ({
  TimePeriodSettings: {
    getActiveSettings: vi.fn(),
  },
}));

// Mock the revalidatePath function
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

describe('Time Periods Actions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should generate and save time periods based on settings', async () => {
    // Arrange
    const mockSettings: ITimePeriodSettings[] = [
      {
        time_period_settings_id: 'setting1',
        start_day: 1,
        frequency: 7,
        frequency_unit: 'day',
        is_active: true,
        effective_from: new Date('2023-01-01'),
        effective_to: undefined,
        created_at: new Date(),
        updated_at: new Date(),
        tenant_id: 'tenant1',
      },
    ];

    const mockCreatedPeriod: ITimePeriod = {
      period_id: 'period1',
      start_date: new Date('2023-01-01'),
      end_date: new Date('2023-01-07'),
      tenant: 'tenant1',
    };

    vi.mocked(TimePeriodSettings.getActiveSettings).mockResolvedValue(mockSettings);
    vi.mocked(TimePeriod.create).mockResolvedValue(mockCreatedPeriod);

    // Act
    const result = await generateAndSaveTimePeriods(new Date('2023-01-01'), new Date('2023-01-31'));

    // Assert
    expect(TimePeriodSettings.getActiveSettings).toHaveBeenCalled();
    expect(TimePeriod.create).toHaveBeenCalledTimes(5); // 5 weeks in January 2023
    expect(result).toHaveLength(5);
    expect(result[0]).toEqual(mockCreatedPeriod);
  });

  it('should throw an error if fetching settings fails', async () => {
    // Arrange
    vi.mocked(TimePeriodSettings.getActiveSettings).mockRejectedValue(new Error('Failed to fetch settings'));

    // Act & Assert
    await expect(generateAndSaveTimePeriods(new Date('2023-01-01'), new Date('2023-01-31')))
      .rejects.toThrow('Failed to generate and save time periods');
  });

  it('should throw an error if saving periods fails', async () => {
    // Arrange
    const mockSettings: ITimePeriodSettings[] = [
      {
        time_period_settings_id: 'setting1',
        start_day: 1,
        frequency: 7,
        frequency_unit: 'day',
        is_active: true,
        effective_from: new Date('2023-01-01'),
        effective_to: undefined,
        created_at: new Date(),
        updated_at: new Date(),
        tenant_id: 'tenant1',
      },
    ];

    vi.mocked(TimePeriodSettings.getActiveSettings).mockResolvedValue(mockSettings);
    vi.mocked(TimePeriod.create).mockRejectedValue(new Error('Failed to save period'));

    // Act & Assert
    await expect(generateAndSaveTimePeriods(new Date('2023-01-01'), new Date('2023-01-31')))
      .rejects.toThrow('Failed to generate and save time periods');
  });
});
