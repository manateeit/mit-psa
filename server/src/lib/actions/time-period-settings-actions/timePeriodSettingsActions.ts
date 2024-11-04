'use server'
import { createTenantKnex } from '../../../lib/db';
import { ITimePeriod, ITimePeriodSettings } from '../../../interfaces/timeEntry.interfaces';
import { set } from 'date-fns';
import { formatISO } from 'date-fns';
import { validateData, validateArray } from '../../utils/validation';
import { timePeriodSettingsSchema } from '../../schemas/timeSheet.schemas';
import { Knex } from 'knex';

export async function getActiveTimePeriodSettings(): Promise<ITimePeriodSettings[]> {
  const { knex: db } = await createTenantKnex();

  const activeSettings = await db<ITimePeriodSettings>('time_period_settings')
    .where({ is_active: true })
    .orderBy('effective_from', 'desc')
    .then(settings => settings.map((setting):ITimePeriodSettings => ({
      ...setting,
      effective_from: formatISO(new Date(setting.effective_from)),
      effective_to: setting.effective_to ? formatISO(new Date(setting.effective_to)) : undefined,
      created_at: formatISO(new Date(setting.created_at)),
      updated_at: formatISO(new Date(setting.updated_at)),
      start_month: setting.start_month || 1,
      end_month: setting.end_month || 12,
      start_day_of_month: setting.start_day_of_month || 1,
      end_day_of_month: setting.end_day_of_month || 1
    })));

  return validateArray(timePeriodSettingsSchema, activeSettings);
}

export async function updateTimePeriodSettings(settings: ITimePeriodSettings): Promise<void> {
  const { knex: db } = await createTenantKnex();

  // Validate input settings
  const validatedSettings = validateData(timePeriodSettingsSchema, {
    ...settings,
    effective_from: formatISO(new Date(settings.effective_from)),
    effective_to: settings.effective_to ? formatISO(new Date(settings.effective_to)) : undefined,
    created_at: formatISO(new Date(settings.created_at)),
    updated_at: formatISO(new Date())
  });

  // Validate business rules and check for overlaps
  await validateTimePeriodSettings(validatedSettings, db, settings.time_period_settings_id);

  await db('time_period_settings')
    .where({ time_period_settings_id: validatedSettings.time_period_settings_id })
    .update({
      frequency: validatedSettings.frequency,
      frequency_unit: validatedSettings.frequency_unit,
      is_active: validatedSettings.is_active,
      effective_from: validatedSettings.effective_from,
      effective_to: validatedSettings.effective_to,
      start_day: validatedSettings.start_day,
      end_day: validatedSettings.end_day,
      start_month: validatedSettings.start_month,
      start_day_of_month: validatedSettings.start_day_of_month,
      end_month: validatedSettings.end_month,
      end_day_of_month: validatedSettings.end_day_of_month,
      updated_at: validatedSettings.updated_at,
    });
}

export async function createTimePeriodSettings(settings: Partial<ITimePeriodSettings>): Promise<ITimePeriodSettings> {
  const { knex: db, tenant } = await createTenantKnex();

  if (!tenant) {
    throw new Error('User is not logged in');
  }

  const now = formatISO(new Date());
  const newSettings = {
    ...settings,
    is_active: true,
    effective_from: settings.effective_from ? formatISO(new Date(settings.effective_from)) : now,
    effective_to: settings.effective_to ? formatISO(new Date(settings.effective_to)) : undefined,
    start_day: settings.start_day || 1,
    end_day: settings.end_day || 1,
    start_month: settings.start_month || 1,
    start_day_of_month: settings.start_day_of_month || 1,
    end_month: settings.end_month || 12,
    end_day_of_month: settings.end_day_of_month || 1,
    created_at: now,
    updated_at: now,
    tenant_id: tenant,
  };

  // Validate the business rules and check for overlaps before database insertion
  await validateTimePeriodSettings(newSettings, db);

  // First insert into database to get the ID
  const [insertedSetting] = await db('time_period_settings')
    .insert({
      ...newSettings,
      effective_from: new Date(newSettings.effective_from),
      effective_to: newSettings.effective_to ? new Date(newSettings.effective_to) : null,
      created_at: new Date(newSettings.created_at),
      updated_at: new Date(newSettings.updated_at),
    })
    .returning('*');

  // Format all date fields as ISO strings before validation
  const formattedSetting = {
    ...insertedSetting,
    effective_from: formatISO(new Date(insertedSetting.effective_from)),
    effective_to: insertedSetting.effective_to ? formatISO(new Date(insertedSetting.effective_to)) : undefined,
    created_at: formatISO(new Date(insertedSetting.created_at)),
    updated_at: formatISO(new Date(insertedSetting.updated_at)),
    start_date: insertedSetting.start_date ? formatISO(new Date(insertedSetting.start_date)) : undefined,
    end_date: insertedSetting.end_date ? formatISO(new Date(insertedSetting.end_date)) : undefined
  };

  // Now validate the complete record with the schema
  return validateData(timePeriodSettingsSchema, formattedSetting);
}

export async function deleteTimePeriodSettings(settingId: string): Promise<void> {
  const { knex: db } = await createTenantKnex();

  await db('time_period_settings')
    .where({ time_period_settings_id: settingId })
    .delete();
}

async function validateTimePeriodSettings(settings: Partial<ITimePeriodSettings>, db: Knex, excludeId?: string): Promise<void> {
  if (settings.frequency && settings.frequency <= 0) {
    throw new Error('Frequency must be a positive number');
  }

  if (settings.frequency_unit && !['day', 'week', 'month', 'year'].includes(settings.frequency_unit)) {
    throw new Error('Invalid frequency unit');
  }

  if (settings.start_day && (settings.start_day < 1 || settings.start_day > 31)) {
    throw new Error('Start day must be between 1 and 31');
  }

  if (settings.end_day && (settings.end_day < 0 || settings.end_day > 31)) {
    throw new Error('End day must be between 0 and 31');
  }

  if (settings.start_month && (settings.start_month < 1 || settings.start_month > 12)) {
    throw new Error('Start month must be between 1 and 12');
  }

  if (settings.end_month && (settings.end_month < 1 || settings.end_month > 12)) {
    throw new Error('End month must be between 1 and 12');
  }

  if (settings.start_day_of_month && (settings.start_day_of_month < 1 || settings.start_day_of_month > 31)) {
    throw new Error('Start day of month must be between 1 and 31');
  }

  if (settings.end_day_of_month && (settings.end_day_of_month < 0 || settings.end_day_of_month > 31)) {
    throw new Error('End day of month must be between 0 and 31');
  }

  // Convert dates for database comparison
  const effectiveFrom = new Date(settings.effective_from!);
  const effectiveTo = settings.effective_to ? new Date(settings.effective_to) : null;

  // Check for overlapping periods
  let query = db<ITimePeriodSettings>('time_period_settings')
    .where('is_active', true);

  // Add conditions for overlapping periods
  query = query.andWhere(builder => {
    // Case 1: New period starts during an existing period
    builder.orWhere(builder => {
      builder
        .where('effective_from', '<=', effectiveFrom)
        .andWhere(builder => {
          builder
            .whereNull('effective_to')
            .orWhere('effective_to', '>=', effectiveFrom);
        });
    });

    // Case 2: New period ends during an existing period
    if (effectiveTo) {
      builder.orWhere(builder => {
        builder
          .where('effective_from', '<=', effectiveTo)
          .andWhere(builder => {
            builder
              .whereNull('effective_to')
              .orWhere('effective_to', '>=', effectiveTo);
          });
      });
    }

    // Case 3: New period completely encompasses an existing period
    builder.orWhere(builder => {
      builder.where('effective_from', '>=', effectiveFrom);
      if (effectiveTo) {
        builder.andWhere('effective_from', '<=', effectiveTo);
      }
    });
  });

  // Exclude the current record when updating
  if (excludeId) {
    query = query.whereNot('time_period_settings_id', excludeId);
  }

  const overlappingPeriods = await query;

  if (overlappingPeriods.length > 0) {
    throw new Error('The specified time period overlaps with existing time periods');
  }
}
