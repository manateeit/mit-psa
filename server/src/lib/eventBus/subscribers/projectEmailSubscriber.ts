import { getEventBus } from '../index';
import { 
  EventType, 
  BaseEvent,
  EventSchemas,
  ProjectCreatedEvent,
  ProjectUpdatedEvent,
  ProjectClosedEvent,
  ProjectAssignedEvent,
  ProjectTaskAssignedEvent
} from '../events';
import { sendEventEmail } from '../../notifications/sendEventEmail';
import logger from '../../../utils/logger';
import { createTenantKnex } from '../../db';

/**
 * Format changes record into a readable string
 */
async function formatChanges(db: any, changes: Record<string, unknown>): Promise<string> {
  const formattedChanges = await Promise.all(
    Object.entries(changes).map(async ([field, value]) => {
      if (typeof value === 'object' && value !== null) {
        const { from, to } = value as { from?: unknown; to?: unknown };
        if (from !== undefined && to !== undefined) {
          const fromValue = await resolveValue(db, field, from);
          const toValue = await resolveValue(db, field, to);
          return `${formatFieldName(field)}: ${fromValue} → ${toValue}`;
        }
      }
      const resolvedValue = await resolveValue(db, field, value);
      return `${formatFieldName(field)}: ${resolvedValue}`;
    })
  );
  return formattedChanges.join('\n');
}

/**
 * Resolve field values to human-readable names
 */
async function resolveValue(db: any, field: string, value: unknown): Promise<string> {
  if (value === null || value === undefined) {
    return 'None';
  }

  switch (field) {
    case 'status':
      const status = await db('statuses')
        .where('status_id', value)
        .first();
      return status?.name || String(value);

    case 'assigned_to':
    case 'updated_by':
    case 'closed_by':
      const user = await db('users')
        .where({
          user_id: value,
          is_inactive: false
        })
        .first();
      return user ? `${user.first_name} ${user.last_name}` : String(value);

    default:
      if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
      }
      if (typeof value === 'object') {
        return JSON.stringify(value);
      }
      return String(value);
  }
}

/**
 * Format field names to be more readable
 */
function formatFieldName(field: string): string {
  return field
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Handle project created events
 */
async function handleProjectCreated(event: ProjectCreatedEvent): Promise<void> {
  const { payload } = event;
  const { tenantId } = payload;
  
  try {
    logger.info('[ProjectEmailSubscriber] Handling project created event:', {
      eventId: event.id,
      projectId: payload.projectId,
      tenantId
    });

    const { knex: db } = await createTenantKnex();
    
    logger.info('[ProjectEmailSubscriber] Fetching project details');
    
    // Get project details with debug logging
    const query = db('projects as p')
      .select(
        'p.*',
        'c.email as company_email',
        's.name as status_name',
        'u.first_name as manager_first_name',
        'u.last_name as manager_last_name'
      )
      .leftJoin('companies as c', function() {
        this.on('c.company_id', '=', 'p.company_id')
            .andOn('c.tenant', '=', 'p.tenant');
      })
      .leftJoin('statuses as s', function() {
        this.on('s.status_id', '=', 'p.status')
            .andOn('s.tenant', '=', 'p.tenant');
      })
      .leftJoin('users as u', function() {
        this.on('u.user_id', '=', 'p.assigned_to')
            .andOn('u.tenant', '=', 'p.tenant')
            .andOn('u.is_inactive', '=', db.raw('false'));
      })
      .where('p.project_id', payload.projectId)
      .first();

    logger.debug('[ProjectEmailSubscriber] Executing query:', {
      sql: query.toString()
    });

    const project = await query;

    logger.info('[ProjectEmailSubscriber] Project details:', {
      projectId: payload.projectId,
      found: !!project,
      hasCompanyEmail: !!project?.company_email,
      companyId: project?.company_id
    });

    if (!project) {
      logger.warn('[ProjectEmailSubscriber] Project not found:', {
        eventId: event.id,
        projectId: payload.projectId
      });
      return;
    }

    if (!project.company_email) {
      logger.warn('[ProjectEmailSubscriber] Company email not found:', {
        eventId: event.id,
        projectId: payload.projectId,
        companyId: project.company_id
      });
      return;
    }

    await sendEventEmail({
      tenantId,
      to: project.company_email,
      subject: `Project Created: ${project.project_name}`,
      template: 'project-created',
      context: {
        project: {
          id: project.project_number,
          name: project.project_name,
          description: project.description || '',
          status: project.status_name || 'Unknown',
          manager: project.manager_first_name && project.manager_last_name ? 
            `${project.manager_first_name} ${project.manager_last_name}` : 'Unassigned',
          startDate: project.start_date,
          endDate: project.end_date,
          createdBy: payload.userId,
          url: `/projects/${project.project_number}`
        }
      }
    });

  } catch (error) {
    logger.error('Error handling project created event:', {
      error,
      eventId: event.id,
      projectId: payload.projectId
    });
    throw error;
  }
}

/**
 * Handle project updated events
 */
async function handleProjectUpdated(event: ProjectUpdatedEvent): Promise<void> {
  const { payload } = event;
  const { tenantId } = payload;
  
  try {
    const { knex: db } = await createTenantKnex();
    
    // Get project details
    const project = await db('projects as p')
      .select(
        'p.*',
        'c.email as company_email',
        's.name as status_name',
        'u.first_name as manager_first_name',
        'u.last_name as manager_last_name'
      )
      .leftJoin('companies as c', function() {
        this.on('c.company_id', '=', 'p.company_id')
            .andOn('c.tenant', '=', 'p.tenant');
      })
      .leftJoin('statuses as s', function() {
        this.on('s.status_id', '=', 'p.status')
            .andOn('s.tenant', '=', 'p.tenant');
      })
      .leftJoin('users as u', function() {
        this.on('u.user_id', '=', 'p.assigned_to')
            .andOn('u.tenant', '=', 'p.tenant')
            .andOn('u.is_inactive', '=', db.raw('false'));
      })
      .where('p.project_id', payload.projectId)
      .first();

    if (!project || !project.company_email) {
      logger.warn('Could not send project updated email - missing project or company email:', {
        eventId: event.id,
        projectId: payload.projectId
      });
      return;
    }

    // Format changes with database lookups
    const formattedChanges = await formatChanges(db, payload.changes || {});

    // Get updater's name
    const updater = await db('users')
      .where({
        user_id: payload.userId,
        is_inactive: false
      })
      .first();

    await sendEventEmail({
      tenantId,
      to: project.company_email,
      subject: `Project Updated: ${project.project_name}`,
      template: 'project-updated',
      context: {
        project: {
          id: project.project_number,
          name: project.project_name,
          status: project.status_name || 'Unknown',
          manager: project.manager_first_name && project.manager_last_name ? 
            `${project.manager_first_name} ${project.manager_last_name}` : 'Unassigned',
          changes: formattedChanges,
          updatedBy: updater ? `${updater.first_name} ${updater.last_name}` : payload.userId,
          url: `/projects/${project.project_number}`
        }
      }
    });

  } catch (error) {
    logger.error('Error handling project updated event:', {
      error,
      eventId: event.id,
      projectId: payload.projectId
    });
    throw error;
  }
}

/**
 * Handle project closed events
 */
async function handleProjectClosed(event: ProjectClosedEvent): Promise<void> {
  const { payload } = event;
  const { tenantId } = payload;
  
  try {
    const { knex: db } = await createTenantKnex();
    
    // Get project details
    const project = await db('projects as p')
      .select(
        'p.*',
        'c.email as company_email',
        's.name as status_name',
        'u.first_name as manager_first_name',
        'u.last_name as manager_last_name'
      )
      .leftJoin('companies as c', function() {
        this.on('c.company_id', '=', 'p.company_id')
            .andOn('c.tenant', '=', 'p.tenant');
      })
      .leftJoin('statuses as s', function() {
        this.on('s.status_id', '=', 'p.status')
            .andOn('s.tenant', '=', 'p.tenant');
      })
      .leftJoin('users as u', function() {
        this.on('u.user_id', '=', 'p.assigned_to')
            .andOn('u.tenant', '=', 'p.tenant');
      })
      .where('p.project_id', payload.projectId)
      .first();

    if (!project || !project.company_email) {
      logger.warn('Could not send project closed email - missing project or company email:', {
        eventId: event.id,
        projectId: payload.projectId
      });
      return;
    }

    await sendEventEmail({
      tenantId,
      to: project.company_email,
      subject: `Project Closed: ${project.project_name}`,
      template: 'project-closed',
      context: {
        project: {
          id: project.project_number,
          name: project.project_name,
          status: project.status_name || 'Unknown',
          manager: project.manager_first_name && project.manager_last_name ? 
            `${project.manager_first_name} ${project.manager_last_name}` : 'Unassigned',
          changes: await formatChanges(db, payload.changes || {}),
          closedBy: payload.userId,
          url: `/projects/${project.project_number}`
        }
      }
    });

  } catch (error) {
    logger.error('Error handling project closed event:', {
      error,
      eventId: event.id,
      projectId: payload.projectId
    });
    throw error;
  }
}

/**
 * Handle project assigned events
 */
async function handleProjectAssigned(event: ProjectAssignedEvent): Promise<void> {
  const { payload } = event;
  const { tenantId, assignedTo } = payload;
  
  try {
    const { knex: db } = await createTenantKnex();
    
    // Get project and user details
    const project = await db('projects as p')
      .select(
        'p.*',
        'u.email as user_email',
        'u.first_name as user_first_name',
        'u.last_name as user_last_name',
        'au.first_name as assigner_first_name',
        'au.last_name as assigner_last_name'
      )
      .leftJoin('users as u', function() {
        this.on('u.user_id', '=', assignedTo)
            .andOn('u.tenant', '=', 'p.tenant')
            .andOn('u.is_inactive', '=', db.raw('false'));
      })
      .leftJoin('users as au', function() {
        this.on('au.user_id', '=', db.raw('?', [payload.userId]))
            .andOn('au.tenant', '=', 'p.tenant')
            .andOn('au.is_inactive', '=', db.raw('false'));
      })
      .where('p.project_id', payload.projectId)
      .first();

    if (!project || !project.user_email) {
      logger.warn('Could not send project assigned email - missing project or user email:', {
        eventId: event.id,
        projectId: payload.projectId,
        userId: assignedTo
      });
      return;
    }

    await sendEventEmail({
      tenantId,
      to: project.user_email,
      subject: `You have been assigned to project: ${project.project_name}`,
      template: 'project-assigned',
      context: {
        project: {
          name: project.project_name,
          description: project.description || '',
          startDate: project.start_date,
          assignedBy: `${project.assigner_first_name} ${project.assigner_last_name}`,
          url: `/projects/${project.project_number}`
        }
      }
    });

  } catch (error) {
    logger.error('Error handling project assigned event:', {
      error,
      eventId: event.id,
      projectId: payload.projectId
    });
    throw error;
  }
}

/**
 * Handle project task assigned events
 */
async function handleProjectTaskAssigned(event: ProjectTaskAssignedEvent): Promise<void> {
  const { payload } = event;
  const { tenantId, assignedTo, additionalUsers = [] } = payload;
  
  try {
    const { knex: db } = await createTenantKnex();
    
    // Get task, project and user details
    const query = db('project_tasks as t')
      .select(
        't.task_id',
        't.task_name',
        't.description',
        't.due_date',
        'p.project_name',
        'p.project_id',
        'p.wbs_code as project_number',
        'u.email as user_email',
        'u.first_name as user_first_name',
        'u.last_name as user_last_name',
        'au.first_name as assigner_first_name',
        'au.last_name as assigner_last_name'
      )
      .leftJoin('project_phases as ph', function() {
        this.on('ph.phase_id', '=', 't.phase_id')
            .andOn('ph.tenant', '=', 't.tenant');
      })
      .leftJoin('projects as p', function() {
        this.on('p.project_id', '=', 'ph.project_id')
            .andOn('p.tenant', '=', 'ph.tenant');
      })
      .leftJoin('users as u', function() {
        this.on('u.user_id', '=', 't.assigned_to')
            .andOn('u.tenant', '=', 't.tenant')
            .andOn('u.is_inactive', '=', db.raw('false'));
      })
      .leftJoin('users as au', function() {
        this.on('au.user_id', '=', db.raw('?', [payload.userId]))
            .andOn('au.tenant', '=', 't.tenant')
            .andOn('au.is_inactive', '=', db.raw('false'));
      })
      .where({
        't.task_id': payload.taskId,
        't.tenant': tenantId
      });

    logger.debug('[ProjectEmailSubscriber] Task query:', {
      sql: query.toString(),
      bindings: query.toSQL().bindings
    });

    const task = await query
      .first();

    if (!task) {
      logger.warn('Could not send task assigned email - task not found:', {
        eventId: event.id,
        taskId: payload.taskId
      });
      return;
    }

    // Get additional users' emails
    const additionalUserEmails = await db('users')
      .select('email', 'user_id')
      .where({
        tenant: tenantId,
        is_inactive: false
      })
      .whereIn('user_id', additionalUsers);

    // Send email to primary assignee
    if (task.user_email) {
      await sendEventEmail({
        tenantId,
        to: task.user_email,
        subject: `You have been assigned to task: ${task.task_name}`,
        template: 'project-task-assigned',
        context: {
          task: {
            name: task.task_name,
            project: task.project_name,
            dueDate: task.due_date,
            assignedBy: `${task.assigner_first_name} ${task.assigner_last_name}`,
            url: `/projects/${task.project_number}/tasks/${task.task_id}`
          }
        }
      });
    }

    // Send emails to additional users
    for (const user of additionalUserEmails) {
      await sendEventEmail({
        tenantId,
        to: user.email,
        subject: `You have been added to task: ${task.task_name}`,
        template: 'project-task-assigned',
        context: {
          task: {
            name: task.task_name,
            project: task.project_name,
            dueDate: task.due_date,
            assignedBy: `${task.assigner_first_name} ${task.assigner_last_name}`,
            url: `/projects/${task.project_number}/tasks/${task.task_id}`
          }
        }
      });
    }

  } catch (error) {
    logger.error('Error handling project task assigned event:', {
      error,
      eventId: event.id,
      taskId: payload.taskId
    });
    throw error;
  }
}

/**
 * Handle all project events
 */
async function handleProjectEvent(event: BaseEvent): Promise<void> {
  logger.info('[ProjectEmailSubscriber] Handling project event:', {
    eventId: event.id,
    eventType: event.eventType,
    timestamp: event.timestamp
  });

  const eventSchema = EventSchemas[event.eventType];
  if (!eventSchema) {
    logger.warn('[ProjectEmailSubscriber] Unknown event type:', {
      eventType: event.eventType,
      eventId: event.id
    });
    return;
  }

  const validatedEvent = eventSchema.parse(event);

  switch (event.eventType) {
    case 'PROJECT_CREATED':
      await handleProjectCreated(validatedEvent as ProjectCreatedEvent);
      break;
    case 'PROJECT_UPDATED':
      await handleProjectUpdated(validatedEvent as ProjectUpdatedEvent);
      break;
    case 'PROJECT_CLOSED':
      await handleProjectClosed(validatedEvent as ProjectClosedEvent);
      break;
    case 'PROJECT_ASSIGNED':
      await handleProjectAssigned(validatedEvent as ProjectAssignedEvent);
      break;
    case 'PROJECT_TASK_ASSIGNED':
      await handleProjectTaskAssigned(validatedEvent as ProjectTaskAssignedEvent);
      break;
    default:
      logger.warn('[ProjectEmailSubscriber] Unhandled project event type:', {
        eventType: event.eventType,
        eventId: event.id
      });
  }
}

/**
 * Register project email subscriber
 */
export async function registerProjectEmailSubscriber(): Promise<void> {
  try {
    logger.info('[ProjectEmailSubscriber] Starting registration');
    
    const projectEventTypes: EventType[] = [
      'PROJECT_CREATED',
      'PROJECT_UPDATED',
      'PROJECT_CLOSED',
      'PROJECT_ASSIGNED',
      'PROJECT_TASK_ASSIGNED'
    ];

    for (const eventType of projectEventTypes) {
      await getEventBus().subscribe(eventType, handleProjectEvent);
      logger.info(`[ProjectEmailSubscriber] Successfully subscribed to ${eventType} events`);
    }

  } catch (error) {
    logger.error('Failed to register project email subscribers:', error);
    throw error;
  }
}

/**
 * Unregister project email subscriber
 */
export async function unregisterProjectEmailSubscriber(): Promise<void> {
  try {
    const projectEventTypes: EventType[] = [
      'PROJECT_CREATED',
      'PROJECT_UPDATED',
      'PROJECT_CLOSED',
      'PROJECT_ASSIGNED',
      'PROJECT_TASK_ASSIGNED'
    ];

    for (const eventType of projectEventTypes) {
      await getEventBus().unsubscribe(eventType, handleProjectEvent);
    }

    logger.info('[ProjectEmailSubscriber] Successfully unregistered from all project events');
  } catch (error) {
    logger.error('Failed to unregister project email subscribers:', error);
    throw error;
  }
}
