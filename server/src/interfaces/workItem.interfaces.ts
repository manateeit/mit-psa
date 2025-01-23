import { TenantEntity } from ".";

export type WorkItemType = 'ticket' | 'project_task' | 'non_billable_category' | 'ad_hoc';

export interface IWorkItem extends TenantEntity {
  work_item_id: string;
  type: WorkItemType;
  name: string;
  title?: string;
  description: string;
  is_billable: boolean;
  startTime?: Date;
  endTime?: Date;
  scheduled_start?: string;
  scheduled_end?: string;
}

export interface WorkItemWithStatus extends Omit<IExtendedWorkItem, "tenant"> {
  status: string;
  scheduled_start?: string;
  scheduled_end?: string;
}

export interface IExtendedWorkItem extends IWorkItem {
  // Ticket specific fields
  ticket_number?: string;
  title?: string;
  
  // Project task specific fields
  project_name?: string;
  phase_name?: string;
  task_name?: string;
}
