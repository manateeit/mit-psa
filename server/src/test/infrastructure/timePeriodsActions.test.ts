import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import knex from 'knex';
import dotenv from 'dotenv';
import { generateAndSaveTimePeriods, fetchAllTimePeriods } from '@/lib/actions/timePeriodsActions';
import { TimePeriodSettings } from '@/lib/models/timePeriodSettings';
import { TimePeriod } from '@/lib/models/timePeriod';
import { ITimePeriodSettings } from '@/interfaces/timeEntry.interfaces';
import { ISO8601String } from '@/types/types.d';

dotenv.config();

let db: knex.Knex;

// Create a more complete mock Headers implementation
const mockHeaders = {
  get: vi.fn((key: string) => {
    if (key === 'x-tenant-id') {
      return '11111111-1111-1111-1111-111111111111';
    }
    return null;
  }),
  append: vi.fn(),
  delete: vi.fn(),
  entries: vi.fn(),
  forEach: vi.fn(),
  has: vi.fn(),
  keys: vi.fn(),
  set: vi.fn(),
  values: vi.fn(),
};

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: vi.fn(() => mockHeaders)
}));

// Mock next-auth with tenant information
vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(() => Promise.resolve({
    user: {
      id: 'mock-user-id',
      tenant: '11111111-1111-1111-1111-111111111111'
    },
  })),
}));

vi.mock("@/app/api/auth/[...nextauth]/options", () => ({
  options: {},
}));

beforeEach(async () => {
  db = knex({
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER_SERVER,
      password: process.env.DB_PASSWORD_SERVER,
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

describe('Time Periods Actions', () => {
  let tenantId: string;
  let timePeriodSettingsId: string;

  beforeEach(async () => {
    // Create test data for each test
    ({ tenant: tenantId } = await db('tenants').select("tenant").first());

    // Create time period settings
    timePeriodSettingsId = uuidv4();
    const settings: Omit<ITimePeriodSettings, 'tenant'> = {
      time_period_settings_id: timePeriodSettingsId,
      tenant_id: tenantId,
      frequency: 1,
      frequency_unit: 'month',
      start_day: 1,
      end_day: 0,
      is_active: true,
      effective_from: new Date('2024-01-01').toISOString() as ISO8601String,
      created_at: new Date('2024-01-01').toISOString() as ISO8601String,
      updated_at: new Date('2024-01-01').toISOString() as ISO8601String
    };

    await db('time_period_settings').insert(settings);
  });

  beforeAll(async () => {
    db = knex({
      client: 'pg',
      connection: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER_SERVER,
        password: process.env.DB_PASSWORD_SERVER,
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
  
  it('should generate and save time periods based on settings', async () => {
    // Arrange
    const startDate = '2026-01-01T00:00:00.000Z';
    const endDate = '2027-03-01T00:00:00.000Z';

    const expectedEndDateToExist = '2026-03-01T00:00:00.000Z';

    // Act
    const result = await generateAndSaveTimePeriods(startDate, endDate);

    const periods = await fetchAllTimePeriods();
    console.log('periods:', periods);

    // Assert
    expect(result).toBeDefined();
    expect(result.length).toBeGreaterThan(0);

    // Verify the periods were saved to the database
    const savedPeriods = await db('time_periods')
      .where('tenant', tenantId)
      .orderBy('start_date', 'asc');

    // Verify that time periods were saved
    expect(savedPeriods.length).toBeGreaterThan(0);

    // Verify that at least one period has the correct structure
    const hasValidPeriod = savedPeriods.some(period => {
      return period.tenant === tenantId &&
             period.start_date instanceof Date &&
             period.end_date instanceof Date;
    });
    expect(hasValidPeriod).toBe(true);

    // Verify that the date range is covered
    const startDateExists = savedPeriods.some(period => 
      period.start_date.getTime() === new Date(startDate).getTime()
    );
    const endDateExists = savedPeriods.some(period => 
      period.end_date.getTime() === new Date(expectedEndDateToExist).getTime()
    );

    // console log the periods
    console.log('savedPeriods:', savedPeriods);
    console.log('startDateExists:', startDateExists);
    console.log('endDateExists:', endDateExists);    

    expect(startDateExists).toBe(true);
    expect(endDateExists).toBe(true);
  });
});
