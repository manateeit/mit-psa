import { createTenantKnex } from '../db';
import { IScheduleEntry, IRecurrencePattern } from '../../interfaces/schedule.interfaces';
import { getCurrentUser } from '../actions/user-actions/userActions';
import { v4 as uuidv4 } from 'uuid';

class ScheduleEntry {
  static async getAll(start: Date, end: Date): Promise<IScheduleEntry[]> {
    const {knex: db} = await createTenantKnex();
    return db('schedule_entries')
      .whereBetween('scheduled_start', [start, end])
      .orWhereBetween('scheduled_end', [start, end])
      .select('*');
  }

  static async getEarliest(): Promise<IScheduleEntry | undefined> {
    const {knex: db} = await createTenantKnex();
    return db('schedule_entries')
      .orderBy('scheduled_start', 'asc')
      .first();
  }

  static async get(entry_id: string): Promise<IScheduleEntry | undefined> {
    const {knex: db} = await createTenantKnex();
    return db('schedule_entries').where({ entry_id }).first();
  }

  static async create(
    entry: Omit<IScheduleEntry, 'entry_id' | 'created_at' | 'updated_at' | 'tenant'>,
    options: { useCurrentUser?: boolean } = {}
  ): Promise<IScheduleEntry> {
    const { useCurrentUser = true } = options;
    
    if (useCurrentUser) {
      const user = await getCurrentUser();
      entry.user_id = user!.user_id;
    }

    const {knex: db, tenant} = await createTenantKnex();
    const [createdEntry] = await db('schedule_entries').insert({
      ...entry,
      entry_id: uuidv4(),
      tenant,
      recurrence_pattern: entry.recurrence_pattern ? JSON.stringify(entry.recurrence_pattern) : null
    }).returning('*');
    return createdEntry;
  }

  static async update(entry_id: string, entry: Partial<IScheduleEntry>): Promise<IScheduleEntry | undefined> {
    const {knex: db} = await createTenantKnex();
    const [updatedEntry] = await db('schedule_entries')
      .where({ entry_id })
      .update({
        ...entry,
        recurrence_pattern: entry.recurrence_pattern ? JSON.stringify(entry.recurrence_pattern) : null
      })
      .returning('*');
    return updatedEntry;
  }

  static async delete(entry_id: string): Promise<boolean> {
    const {knex: db} = await createTenantKnex();
    const deletedCount = await db('schedule_entries').where({ entry_id }).del();
    return deletedCount > 0;
  }

  static async getRecurringEntriesInRange(start: Date, end: Date): Promise<IScheduleEntry[]> {
    const {knex: db} = await createTenantKnex();
    return db('schedule_entries')
      .whereNotNull('recurrence_pattern')
      .andWhere(function() {
        this.where('scheduled_end', '>=', start)
          .orWhereRaw("(recurrence_pattern->>'endDate')::date >= ?", [start])
          .orWhereRaw("recurrence_pattern->>'endDate' IS NULL");
      })
      .andWhere('scheduled_start', '<=', end);
  }
}

export default ScheduleEntry;
