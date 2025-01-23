'use server';
import { createTenantKnex } from '@/lib/db';
import { getCurrentUser } from '@/lib/actions/user-actions/userActions';
import { IWorkItem, IExtendedWorkItem, WorkItemType } from '@/interfaces/workItem.interfaces';
import ScheduleEntry from '@/lib/models/scheduleEntry';

interface SearchOptions {
  searchTerm?: string;
  type?: WorkItemType | 'all';
  sortBy?: 'name' | 'type';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  includeInactive?: boolean;
  assignedTo?: string;
  assignedToMe?: boolean;
  companyId?: string;
  dateRange?: {
    start?: Date;
    end?: Date;
  };
  existingWorkItemIds?: string[];
}

interface SearchResult {
  items: Omit<IExtendedWorkItem, "tenant">[];
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
    let ticketsQuery = db('tickets as t')
      .whereNotIn('t.ticket_id', options.existingWorkItemIds || [])
      .leftJoin('ticket_resources as tr', function() {
        this.on('t.tenant', 'tr.tenant')
            .andOn('t.ticket_id', 'tr.ticket_id');
      })
      .whereILike('t.title', db.raw('?', [`%${searchTerm}%`]))
      .select(
        't.ticket_id as work_item_id',
        't.title as name',
        't.url as description',
        db.raw("'ticket' as type"),
        't.ticket_number',
        't.title',
        db.raw('NULL as project_name'),
        db.raw('NULL as phase_name'),
        db.raw('NULL as task_name'),
        't.company_id',
        't.assigned_to',
        'tr.additional_user_id'
      );

    let projectTasksQuery = db('project_tasks as pt')
      .whereNotIn('pt.task_id', options.existingWorkItemIds || [])
      .join('project_phases as pp', 'pt.phase_id', 'pp.phase_id')
      .join('projects as p', 'pp.project_id', 'p.project_id')
      .leftJoin('task_resources as tr', function() {
        this.on('pt.tenant', 'tr.tenant')
            .andOn('pt.task_id', 'tr.task_id');
      })
      .whereILike('pt.task_name', db.raw('?', [`%${searchTerm}%`]))
      .modify((queryBuilder) => {
        if (!options.includeInactive) {
          queryBuilder.where('p.is_inactive', false);
        }
      })
      .select(
        'pt.task_id as work_item_id',
        'pt.task_name as name',
        'pt.description',
        db.raw("'project_task' as type"),
        db.raw('NULL as ticket_number'),
        db.raw('NULL as title'),
        'p.project_name',
        'pp.phase_name',
        'pt.task_name',
        'p.company_id',
        'pt.assigned_to',
        'tr.additional_user_id'
      );

    let adHocQuery = db('schedule_entries as se')
      .whereNotIn('se.entry_id', options.existingWorkItemIds || [])
      .where('work_item_type', 'ad_hoc')
      .whereILike('title', db.raw('?', [`%${searchTerm}%`]))
      .select(
        'se.entry_id as work_item_id',
        'se.title as name',
        'se.notes as description',
        db.raw("'ad_hoc' as type"),
        db.raw('NULL as ticket_number'),
        'se.title',
        db.raw('NULL as project_name'),
        db.raw('NULL as phase_name'),
        db.raw('NULL as task_name'),
        db.raw('NULL as company_id'),
        db.raw('NULL as assigned_to'),
        db.raw('NULL as additional_user_id')
      );

    // Apply filters
    if (options.type && options.type !== 'all') {
      if (options.type === 'ticket') {
        projectTasksQuery = projectTasksQuery.whereRaw('1 = 0');
        adHocQuery = adHocQuery.whereRaw('1 = 0');
      } else if (options.type === 'project_task') {
        ticketsQuery = ticketsQuery.whereRaw('1 = 0');
        adHocQuery = adHocQuery.whereRaw('1 = 0');
      } else if (options.type === 'ad_hoc') {
        ticketsQuery = ticketsQuery.whereRaw('1 = 0');
        projectTasksQuery = projectTasksQuery.whereRaw('1 = 0');
      }
    }

    // Filter by assigned user
    if (options.assignedToMe && options.assignedTo) {
      // "Assigned to me" filter
      ticketsQuery = ticketsQuery.where(function() {
        this.where('t.assigned_to', options.assignedTo)
            .orWhere('tr.additional_user_id', options.assignedTo);
      });
      projectTasksQuery = projectTasksQuery.where(function() {
        this.where('pt.assigned_to', options.assignedTo)
            .orWhere('tr.additional_user_id', options.assignedTo);
      });
      
      // Debug logging
      console.log('Filtering by assigned to me:', {
        userId: options.assignedTo,
        query: ticketsQuery.toString(),
        projectQuery: projectTasksQuery.toString()
      });
    } else if (options.assignedTo) {
      // Regular "Assigned to" filter
      ticketsQuery = ticketsQuery.where(function() {
        this.where('t.assigned_to', options.assignedTo)
            .orWhere('tr.additional_user_id', options.assignedTo);
      });
      projectTasksQuery = projectTasksQuery.where(function() {
        this.where('pt.assigned_to', options.assignedTo)
            .orWhere('tr.additional_user_id', options.assignedTo);
      });
      
      // Debug logging
      console.log('Filtering by assigned user:', {
        userId: options.assignedTo,
        query: ticketsQuery.toString(),
        projectQuery: projectTasksQuery.toString()
      });
    }

    // Filter by company
    if (options.companyId) {
      ticketsQuery = ticketsQuery.where('t.company_id', options.companyId);
      projectTasksQuery = projectTasksQuery.where('p.company_id', options.companyId);
      
      // Debug logging
      console.log('Filtering by company:', {
        companyId: options.companyId,
        query: ticketsQuery.toString(),
        projectQuery: projectTasksQuery.toString()
      });
    }

    // Filter by date range
    if (options.dateRange?.start) {
      ticketsQuery = ticketsQuery.where('t.entered_at', '>=', options.dateRange.start);
      projectTasksQuery = projectTasksQuery.where('pt.created_at', '>=', options.dateRange.start);
      adHocQuery = adHocQuery.where('se.scheduled_start', '>=', options.dateRange.start);
    }
    if (options.dateRange?.end) {
      ticketsQuery = ticketsQuery.where('t.closed_at', '<=', options.dateRange.end);
      projectTasksQuery = projectTasksQuery.where('pt.due_date', '<=', options.dateRange.end);
      adHocQuery = adHocQuery.where('se.scheduled_end', '<=', options.dateRange.end);
    }

    // Combine queries
    let query = db.union([ticketsQuery, projectTasksQuery, adHocQuery]);

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
    const workItems = results.map((item: any): Omit<IExtendedWorkItem, "tenant"> => ({
      work_item_id: item.work_item_id,
      type: item.type,
      name: item.name,
      description: item.description,
      is_billable: true, // You may need to adjust this based on your business logic
      ticket_number: item.ticket_number,
      title: item.title,
      project_name: item.project_name,
      phase_name: item.phase_name,
      task_name: item.task_name
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

export async function createWorkItem(item: Omit<IWorkItem, "work_item_id">): Promise<Omit<IExtendedWorkItem, "tenant">> {
  try {
    const {tenant} = await createTenantKnex();
    const currentUser = await getCurrentUser();
    
    if (!currentUser) {
      throw new Error('User not authenticated');
    }
    
    if (!item.startTime || !item.endTime) {
      throw new Error('Start time and end time are required for ad-hoc entries');
    }

    // Create schedule entry with current user assigned
    const scheduleEntry = await ScheduleEntry.create({
      title: item.title || 'Ad-hoc Entry',
      notes: item.description,
      scheduled_start: item.startTime,
      scheduled_end: item.endTime,
      status: 'scheduled',
      work_item_type: 'ad_hoc',
      work_item_id: null,
      assigned_user_ids: []  // This will be populated by the model
    }, {
      assignedUserIds: [currentUser.user_id]
    });

    // For ad-hoc entries, use title as name if provided, otherwise use a default name
    const name = item.title || 'Ad-hoc Entry';
    
    return {
      work_item_id: scheduleEntry.entry_id,
      type: 'ad_hoc',
      name: name,
      title: item.title,
      description: item.description,
      is_billable: item.is_billable,
      startTime: item.startTime,
      endTime: item.endTime
    };
  } catch (error) {
    console.error('Error creating work item:', error);
    throw new Error('Failed to create work item');
  }
}

export async function getWorkItemById(workItemId: string, workItemType: WorkItemType): Promise<Omit<IExtendedWorkItem, "tenant"> | null> {
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
          db.raw("'ticket' as type"),
          'ticket_number',
          'title',
          db.raw('NULL as project_name'),
          db.raw('NULL as phase_name'),
          db.raw('NULL as task_name')
        )
        .first();
    } else if (workItemType === 'project_task') {
      workItem = await db('project_tasks as pt')
        .join('project_phases as pp', 'pt.phase_id', 'pp.phase_id')
        .join('projects as p', 'pp.project_id', 'p.project_id')
        .where('pt.task_id', workItemId)
        .select(
          'pt.task_id as work_item_id',
          'pt.task_name as name',
          'pt.description',
          db.raw("'project_task' as type"),
          db.raw('NULL as ticket_number'),
          db.raw('NULL as title'),
          'p.project_name',
          'pp.phase_name',
          'pt.task_name'
        )
        .first();
    } else if (workItemType === 'ad_hoc') {
      workItem = await db('schedule_entries')
        .where('entry_id', workItemId)
        .select(
          'entry_id as work_item_id',
          'title as name',
          'notes as description',
          db.raw("'ad_hoc' as type"),
          db.raw('NULL as ticket_number'),
          'title',
          db.raw('NULL as project_name'),
          db.raw('NULL as phase_name'),
          db.raw('NULL as task_name')
        )
        .first();
    }

    if (workItem) {
      return {
        work_item_id: workItem.work_item_id,
        type: workItem.type,
        name: workItem.name,
        description: workItem.description,
        is_billable: true, // Adjust this based on your business logic
        ticket_number: workItem.ticket_number,
        title: workItem.title,
        project_name: workItem.project_name,
        phase_name: workItem.phase_name,
        task_name: workItem.task_name
      };
    }

    return null;
  } catch (error) {
    console.error('Error fetching work item by ID:', error);
    throw new Error('Failed to fetch work item by ID');
  }
}
