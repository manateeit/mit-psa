'use server';
import { createTenantKnex } from '@/lib/db';
import { IWorkItem, WorkItemType } from '@/interfaces/workItem.interfaces';

interface SearchOptions {
  searchTerm?: string;
  type?: WorkItemType | 'all';
  sortBy?: 'name' | 'type';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

interface SearchResult {
  items: Omit<IWorkItem, "tenant">[];
  total: number;
}

export async function searchWorkItems(options: SearchOptions): Promise<SearchResult> {
  try {
    const {knex: db} = await createTenantKnex();
    const searchTerm = options.searchTerm || '';
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;
    const offset = (page - 1) * pageSize;

    // Build base queries using proper parameter binding
    let ticketsQuery = db('tickets')
      .whereILike('title', db.raw('?', [`%${searchTerm}%`]))
      .select(
        'ticket_id as work_item_id',
        'title as name',
        'url as description',
        db.raw("'ticket' as type")
      );

    let projectTasksQuery = db('project_tasks')
      .whereILike('task_name', db.raw('?', [`%${searchTerm}%`]))
      .select(
        'task_id as work_item_id',
        'task_name as name',
        'description',
        db.raw("'project_task' as type")
      );

    // Apply type filter if specified
    if (options.type && options.type !== 'all') {
      if (options.type === 'ticket') {
        projectTasksQuery = projectTasksQuery.whereRaw('1 = 0');
      } else if (options.type === 'project_task') {
        ticketsQuery = ticketsQuery.whereRaw('1 = 0');
      }
    }

    // Combine queries
    let query = db.union([ticketsQuery, projectTasksQuery]);

    // Get total count before applying pagination
    const countResult = await db.from(query.as('combined')).count('* as count').first();
    const total = parseInt(countResult?.count as string || '0');

    // Apply sorting
    if (options.sortBy) {
      const sortColumn = options.sortBy === 'name' ? 'name' : 'type';
      query = db.from(query.as('combined'))
        .orderBy(sortColumn, options.sortOrder || 'asc');
    }

    // Apply pagination
    query = query.limit(pageSize).offset(offset);

    // Execute query
    const results = await query;

    // Format results
    const workItems: Omit<IWorkItem, "tenant">[] = results.map((item): Omit<IWorkItem, "tenant"> => ({
      ...item,
      is_billable: true, // You may need to adjust this based on your business logic
    }));

    return {
      items: workItems,
      total
    };
  } catch (error) {
    console.error('Error searching work items:', error);
    throw new Error('Failed to search work items');
  }
}

export async function getWorkItemById(workItemId: string, workItemType: WorkItemType): Promise<Omit<IWorkItem, "tenant"> | null> {
  try {
    const {knex: db} = await createTenantKnex();
    let workItem;

    if (workItemType === 'ticket') {
      workItem = await db('tickets')
        .where('ticket_id', workItemId)
        .select(
          'ticket_id as work_item_id',
          'title as name',
          'url as description',
          db.raw("'ticket' as type")
        )
        .first();
    } else if (workItemType === 'project_task') {
      workItem = await db('project_tasks')
        .where('task_id', workItemId)
        .select(
          'task_id as work_item_id',
          'task_name as name',
          'description',
          db.raw("'project_task' as type")
        )
        .first();
    }

    if (workItem) {
      return {
        ...workItem,
        is_billable: true, // Adjust this based on your business logic
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching work item by ID:', error);
    throw new Error('Failed to fetch work item by ID');
  }
}
