import { Knex } from 'knex';
import { 
  IWorkflowEventAttachment, 
  ICreateWorkflowEventAttachment, 
  IUpdateWorkflowEventAttachment 
} from '@shared/workflow/types/eventCatalog';

/**
 * Model for workflow event attachments
 */
export class WorkflowEventAttachmentModel {
  /**
   * Create a new workflow event attachment
   * 
   * @param knex Knex instance
   * @param data Workflow event attachment data
   * @returns The created workflow event attachment
   */
  static async create(
    knex: Knex,
    data: ICreateWorkflowEventAttachment
  ): Promise<IWorkflowEventAttachment> {
    const [attachment] = await knex('workflow_event_attachments')
      .insert(data)
      .returning('*');
    
    return attachment;
  }

  /**
   * Get a workflow event attachment by ID
   * 
   * @param knex Knex instance
   * @param attachmentId Attachment ID
   * @param tenantId Tenant ID
   * @returns The workflow event attachment or null if not found
   */
  static async getById(
    knex: Knex,
    attachmentId: string,
    tenantId: string
  ): Promise<IWorkflowEventAttachment | null> {
    const attachment = await knex('workflow_event_attachments')
      .where({
        attachment_id: attachmentId,
        tenant_id: tenantId
      })
      .first();
    
    return attachment || null;
  }

  /**
   * Get a workflow event attachment by workflow ID and event ID
   * 
   * @param knex Knex instance
   * @param workflowId Workflow ID
   * @param eventId Event ID
   * @param tenantId Tenant ID
   * @returns The workflow event attachment or null if not found
   */
  static async getByWorkflowAndEvent(
    knex: Knex,
    workflowId: string,
    eventId: string,
    tenantId: string
  ): Promise<IWorkflowEventAttachment | null> {
    const attachment = await knex('workflow_event_attachments')
      .where({
        workflow_id: workflowId,
        event_id: eventId,
        tenant_id: tenantId
      })
      .first();
    
    return attachment || null;
  }

  /**
   * Get all workflow event attachments for a workflow
   * 
   * @param knex Knex instance
   * @param workflowId Workflow ID
   * @param tenantId Tenant ID
   * @param options Query options
   * @returns Array of workflow event attachments
   */
  static async getAllForWorkflow(
    knex: Knex,
    workflowId: string,
    tenantId: string,
    options: {
      isActive?: boolean;
    } = {}
  ): Promise<IWorkflowEventAttachment[]> {
    const { isActive } = options;
    
    const query = knex('workflow_event_attachments')
      .where({
        workflow_id: workflowId,
        tenant_id: tenantId
      });
    
    if (isActive !== undefined) {
      query.where('is_active', isActive);
    }
    
    const attachments = await query
      .orderBy('created_at', 'asc');
    
    return attachments;
  }

  /**
   * Get all workflow event attachments for an event
   * 
   * @param knex Knex instance
   * @param eventId Event ID
   * @param tenantId Tenant ID
   * @param options Query options
   * @returns Array of workflow event attachments
   */
  static async getAllForEvent(
    knex: Knex,
    eventId: string,
    tenantId: string,
    options: {
      isActive?: boolean;
    } = {}
  ): Promise<IWorkflowEventAttachment[]> {
    const { isActive } = options;
    
    const query = knex('workflow_event_attachments')
      .where({
        event_id: eventId,
        tenant_id: tenantId
      });
    
    if (isActive !== undefined) {
      query.where('is_active', isActive);
    }
    
    const attachments = await query
      .orderBy('created_at', 'asc');
    
    return attachments;
  }

  /**
   * Update a workflow event attachment
   * 
   * @param knex Knex instance
   * @param attachmentId Attachment ID
   * @param tenantId Tenant ID
   * @param data Update data
   * @returns The updated workflow event attachment
   */
  static async update(
    knex: Knex,
    attachmentId: string,
    tenantId: string,
    data: IUpdateWorkflowEventAttachment
  ): Promise<IWorkflowEventAttachment | null> {
    const [attachment] = await knex('workflow_event_attachments')
      .where({
        attachment_id: attachmentId,
        tenant_id: tenantId
      })
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .returning('*');
    
    return attachment || null;
  }

  /**
   * Delete a workflow event attachment
   * 
   * @param knex Knex instance
   * @param attachmentId Attachment ID
   * @param tenantId Tenant ID
   * @returns True if the attachment was deleted, false otherwise
   */
  static async delete(
    knex: Knex,
    attachmentId: string,
    tenantId: string
  ): Promise<boolean> {
    const result = await knex('workflow_event_attachments')
      .where({
        attachment_id: attachmentId,
        tenant_id: tenantId
      })
      .delete();
    
    return result !== 0;
  }

  /**
   * Get all workflows attached to an event type
   * 
   * @param knex Knex instance
   * @param eventType Event type
   * @param tenantId Tenant ID
   * @returns Array of workflow IDs
   */
  static async getWorkflowsForEventType(
    knex: Knex,
    eventType: string,
    tenantId: string
  ): Promise<string[]> {
    const results = await knex('workflow_event_attachments as wea')
      .join('event_catalog as ec', function() {
        this.on('wea.event_id', 'ec.event_id')
            .andOn('wea.tenant_id', 'ec.tenant_id');
      })
      .where({
        'ec.event_type': eventType,
        'wea.tenant_id': tenantId,
        'wea.is_active': true
      })
      .select('wea.workflow_id');
    
    return results.map(r => r.workflow_id);
  }
}