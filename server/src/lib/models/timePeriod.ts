import { createTenantKnex } from '../db';
import { ITimePeriod } from '../../interfaces/timeEntry.interfaces';
import { ISO8601String } from '../../types/types.d';

export class TimePeriod {
  static async getLatest(): Promise<ITimePeriod | null> {
    const {knex: db} = await createTenantKnex();
    const latestPeriod = await db<ITimePeriod>('time_periods')
      .orderBy('end_date', 'desc')
      .first();

    return latestPeriod || null;
  }

  static async getAll(): Promise<ITimePeriod[]> {
    const {knex: db} = await createTenantKnex();
    const timePeriods = await db<ITimePeriod>('time_periods')
      .select('*')
      .orderBy('start_date', 'desc');

    return timePeriods;
  }  

  static async create(timePeriodData: Omit<ITimePeriod, 'period_id' | 'tenant'>): Promise<ITimePeriod> {
    const {knex: db, tenant} = await createTenantKnex();
    const [newPeriod] = await db<ITimePeriod>('time_periods')
      .insert({...timePeriodData, tenant: tenant!})
      .returning('*');

    return newPeriod;
  }

  static async findByDate(date: ISO8601String): Promise<ITimePeriod | null> {
    const {knex: db} = await createTenantKnex();
    const period = await db<ITimePeriod>('time_periods')
      .where('start_date', '<=', date)
      .where('end_date', '>=', date)
      .first();

    return period || null;
  }

  static async findOverlapping(startDate: ISO8601String, endDate: ISO8601String): Promise<ITimePeriod | null> {
    const {knex: db} = await createTenantKnex();
    const overlappingPeriod = await db<ITimePeriod>('time_periods')
      .where((qb) => {
        qb.whereBetween('start_date', [startDate, endDate])
          .orWhereBetween('end_date', [startDate, endDate])
          .orWhere((inner) => {
            inner.where('start_date', '<', startDate).andWhere('end_date', '>', endDate);
          });
      })
      .first();

    return overlappingPeriod || null;
  }  
}
