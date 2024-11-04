import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import knex from 'knex';
import dotenv from 'dotenv';
import { ITimePeriodSettings, ITimePeriod } from '@/interfaces/timeEntry.interfaces';
import { createTimePeriod, generateAndSaveTimePeriods, generateTimePeriods } from '@/lib/actions/timePeriodsActions';
import { TimePeriodSettings } from '@/lib/models/timePeriodSettings';
import { ISO8601String } from '@/types/types.d';

import * as tenantModule from '@/lib/tenant';
import { parseISO } from 'date-fns';
import { parse } from 'path';

dotenv.config();

let db: knex.Knex;

beforeAll(async () => {
  db = knex({
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER_ADMIN,
      password: process.env.DB_PASSWORD_ADMIN,
      database: process.env.DB_NAME_SERVER
    },
    migrations: {
      directory: "./migrations"
    },
    seeds: {
      directory: "./seeds/dev"
    }
  });

  // Drop all tables
  await db.raw('DROP SCHEMA public CASCADE');
  await db.raw('CREATE SCHEMA public');

  // Ensure the database is set up correctly
  await db.raw(`SET app.environment = '${process.env.APP_ENV}'`);

  await db.migrate.latest();
  await db.seed.run();
});

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

afterAll(async () => {
  await db.destroy();
});

describe('Time Periods Infrastructure', () => {
  let tenantId: string;

  beforeEach(async () => {
    // Create test data for each test
    ({ tenant: tenantId } = await db('tenants').select("tenant").first());

    // Update the mock to use the new tenantId
    vi.spyOn(tenantModule, 'getTenantForCurrentRequest').mockResolvedValue(tenantId);
  });

  afterEach(async () => {
    // Clean up test data
    await db('time_entries').where('tenant', tenantId).del();
    await db('time_sheets').where('tenant', tenantId).del();
    await db('time_periods').where('tenant', tenantId).del();
    await db('time_period_settings').where('tenant_id', tenantId).del();
  });

  it('should create a time period based on settings', async () => {
    // Arrange
    const setting: ITimePeriodSettings = {
      time_period_settings_id: uuidv4(),
      start_day: 1,
      frequency: 7,
      frequency_unit: 'day',
      is_active: true,
      effective_from: '2023-01-01T00:00:00.000Z',
      effective_to: undefined,
      created_at: new Date().toISOString() as ISO8601String,
      updated_at: new Date().toISOString() as ISO8601String,
      tenant_id: tenantId,
      end_day: 0
    };

    await db('time_period_settings').insert(setting);

    const timePeriodData: Omit<ITimePeriod, 'period_id'> = {
      start_date: '2023-01-01T00:00:00.000Z',
      end_date: '2023-01-07T00:00:00.000Z',
      tenant: tenantId,
    };

    // Act
    const result = await createTimePeriod(timePeriodData);

    // Assert
    expect(result).toMatchObject({
      start_date: parseISO('2023-01-01T00:00:00.000Z'),
      end_date: parseISO('2023-01-07T00:00:00.000Z'),
      tenant: tenantId,
    });

    const savedPeriod = await db('time_periods').where('period_id', result.period_id).first();
    expect(savedPeriod).toBeDefined();
    expect(savedPeriod.start_date).toEqual(parseISO('2023-01-01T00:00:00.000Z'));
    expect(savedPeriod.end_date).toEqual(parseISO('2023-01-07T00:00:00.000Z'));
  });

  it('should generate and save multiple time periods', async () => {
    // Arrange
    const setting: ITimePeriodSettings = {
      time_period_settings_id: uuidv4(),
      start_day: 1,
      frequency: 7,
      frequency_unit: 'day',
      is_active: true,
      effective_from: '2023-01-01T00:00:00.000Z',
      effective_to: undefined,
      created_at: new Date().toISOString() as ISO8601String,
      updated_at: new Date().toISOString() as ISO8601String,
      tenant_id: tenantId,
      end_day: 0
    };

    await db('time_period_settings').insert(setting);

    // Act
    const result = await generateAndSaveTimePeriods('2023-01-01T00:00:00.000Z', '2023-02-01T00:00:00.000Z');

    // Log the results, each start and end date
    result.forEach((period: ITimePeriod, index: number) => {
      console.log(`Period ${index + 1}:`);
      console.log(`  Start Date: ${period.start_date}`);
      console.log(`  End Date:   ${period.end_date}`);
    });

    // Assert
    expect(result).toHaveLength(5);
    expect(result[0]).toMatchObject({
      start_date: parseISO('2023-01-01T00:00:00.000Z'),
      end_date: parseISO('2023-01-07T00:00:00.000Z'),
      tenant: tenantId,
    });
    expect(result[3]).toMatchObject({
      start_date: parseISO('2023-01-19T00:00:00.000Z'),
      end_date: parseISO('2023-01-25T00:00:00.000Z'),
      tenant: tenantId,
    });
    expect(result[4]).toMatchObject({
      start_date: parseISO('2023-01-25T00:00:00.000Z'),
      end_date: parseISO('2023-01-31T00:00:00.000Z'),
      tenant: tenantId,
    });    
  });

  it('should handle multiple non-overlapping settings', async () => {
    // Arrange
    const settings: ITimePeriodSettings[] = [
      {
        time_period_settings_id: uuidv4(),
        start_day: 1,
        frequency: 14,
        frequency_unit: 'day',
        is_active: true,
        effective_from: '2023-01-01T00:00:00.000Z',
        effective_to: '2023-02-01T00:00:00.000Z',
        created_at: new Date().toISOString() as ISO8601String,
        updated_at: new Date().toISOString() as ISO8601String,
        tenant_id: tenantId,
        end_day: 0
      },
      {
        time_period_settings_id: uuidv4(),
        start_day: 1,
        frequency: 1,
        frequency_unit: 'month',
        is_active: true,
        effective_from: '2023-02-01T00:00:00.000Z',
        effective_to: undefined,
        created_at: new Date().toISOString() as ISO8601String,
        updated_at: new Date().toISOString() as ISO8601String,
        tenant_id: tenantId,
        end_day: 0
      },
    ];

    await db('time_period_settings').insert(settings);

    // Act
    const result = await generateAndSaveTimePeriods('2023-01-01T00:00:00.000Z', '2023-04-01T00:00:00.000Z');

    // sort by start_date
    result.sort((a: ITimePeriod, b: ITimePeriod) => a.start_date < b.start_date ? -1 : 1);

    // Assert
    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      start_date: parseISO('2023-01-01T00:00:00.000Z'),
      end_date: parseISO('2023-01-14T00:00:00.000Z'),
      tenant: tenantId,
    });
    expect(result[1]).toMatchObject({
      start_date: parseISO('2023-01-14T00:00:00.000Z'),
      end_date: parseISO('2023-01-27T00:00:00.000Z'),
      tenant: tenantId,
    });  
    expect(result[2]).toMatchObject({
      start_date: parseISO('2023-02-01T00:00:00.000Z'),
      end_date: parseISO('2023-03-01T00:00:00.000Z'),
      tenant: tenantId,
    });

   
  });

  it('should throw an error when trying to create overlapping time periods', async () => {
    // Arrange
    const setting: ITimePeriodSettings = {
      time_period_settings_id: uuidv4(),
      start_day: 1,
      frequency: 7,
      frequency_unit: 'day',
      is_active: true,
      effective_from: '2023-01-01T00:00:00.000Z',
      effective_to: undefined,
      created_at: new Date().toISOString() as ISO8601String,
      updated_at: new Date().toISOString() as ISO8601String,
      tenant_id: tenantId,
      end_day: 0
    };

    await db('time_period_settings').insert(setting);

    const timePeriodData1: Omit<ITimePeriod, 'period_id'> = {
      start_date: '2023-01-01T00:00:00.000Z',
      end_date: '2023-01-07T00:00:00.000Z',
      tenant: tenantId,
    };

    const timePeriodData2: Omit<ITimePeriod, 'period_id'> = {
      start_date: '2023-01-05T00:00:00.000Z',
      end_date: '2023-01-11T00:00:00.000Z',
      tenant: tenantId,
    };

    // Act & Assert
    await createTimePeriod(timePeriodData1);
    await expect(createTimePeriod(timePeriodData2)).rejects.toThrow('The new time period overlaps with an existing period.');
  });

  it('should generate semi-monthly periods correctly', async () => {
    // Arrange
    const settings: ITimePeriodSettings[] = [
      {
        time_period_settings_id: uuidv4(),
        start_day: 1,
        end_day: 15,
        frequency: 1,
        frequency_unit: 'month',
        is_active: true,
        effective_from: '2023-01-01T00:00:00.000Z',
        created_at: new Date().toISOString() as ISO8601String,
        updated_at: new Date().toISOString() as ISO8601String,
        tenant_id: tenantId,
      },
      {
        time_period_settings_id: uuidv4(),
        start_day: 16,
        end_day: 0, // Treat 0 as end of month
        frequency: 1,
        frequency_unit: 'month',
        is_active: true,
        effective_from: '2023-01-01T00:00:00.000Z',
        created_at: new Date().toISOString() as ISO8601String,
        updated_at: new Date().toISOString() as ISO8601String,
        tenant_id: tenantId,
      },
    ];
  
    const startDate = '2023-01-01T00:00:00.000Z';
    const endDate = '2023-05-01T00:00:00.000Z';
  
    // Act
    const periods = await generateTimePeriods(settings, startDate, endDate);

    console.log('periods:', periods);
  
    // sort periods by start_date
    periods.sort((a: ITimePeriod, b: ITimePeriod) => a.start_date < b.start_date ? -1 : 1);

    // Assert
    expect(periods).toHaveLength(5);
  
    expect(periods[0]).toMatchObject({
      start_date: '2023-01-01T00:00:00Z',
      end_date: '2023-01-15T00:00:00Z',
    });
    expect(periods[2]).toMatchObject({
      start_date: '2023-02-01T00:00:00Z',
      end_date: '2023-02-15T00:00:00Z',
    });
    expect(periods[4]).toMatchObject({
      start_date: '2023-04-01T00:00:00Z',
      end_date: '2023-04-15T00:00:00Z',
    });
  });
});
