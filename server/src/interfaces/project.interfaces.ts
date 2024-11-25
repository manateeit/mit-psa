// server/src/interfaces/project.interfaces.ts
import { TenantEntity } from ".";

export type ItemType = 'project' | 'project_task' | 'ticket';

export interface IStandardStatus extends TenantEntity {
  standard_status_id: string;
  name: string;
  item_type: ItemType;
  display_order: number;
  is_closed: boolean;
}

export interface IStatus extends TenantEntity {
  status_id: string;
  name: string;
  status_type: ItemType;
  is_closed: boolean; 
  order_number?: number;
  created_by?: string;
}

export interface IProjectStatusMapping extends TenantEntity {
  project_status_mapping_id: string;
  project_id: string;
  status_id?: string;
  standard_status_id?: string;
  is_standard: boolean;
  custom_name: string | null;
  display_order: number;
  is_visible: boolean;
}

export interface IProject extends TenantEntity {
  project_id: string;
  company_id: string;
  project_name: string;
  description: string | null;
  start_date: Date | null;
  end_date: Date | null;
  created_at: Date;
  updated_at: Date;
  client_name?: string;
  wbs_code: string;
  is_inactive: boolean;
  status: string;
}

export interface IProjectPhase extends TenantEntity {
  phase_id: string;
  project_id: string;
  phase_name: string;
  description: string | null;
  start_date: Date | null;
  end_date: Date | null;
  status: string;
  order_number: number;
  created_at: Date;
  updated_at: Date;
  wbs_code: string;  
}

export interface IProjectTask extends TenantEntity {
  task_id: string;
  phase_id: string;
  task_name: string;
  description: string | null;
  assigned_to: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  project_status_mapping_id: string;
  created_at: Date;
  updated_at: Date;
  wbs_code: string;  
  due_date: Date | null;
  checklist_items?: ITaskChecklistItem[];
}

export interface IProjectTaskCardInfo extends IProjectTask {
  assigned_to_name: string;
}

export interface IProjectTicketLink extends TenantEntity {
  link_id: string;
  project_id: string;
  phase_id: string | null;
  task_id: string | null;
  ticket_id: string;
  created_at: Date;
}

export interface IProjectTicketLinkWithDetails extends IProjectTicketLink {
  ticket_number: string;
  title: string;
  status_name: string;
  is_closed: boolean;
}

export interface ITaskChecklistItem extends TenantEntity {
  checklist_item_id: string;
  task_id: string;
  item_name: string;
  description: string | null;
  assigned_to: string | null;
  completed: boolean;
  due_date: Date | null;
  created_at: Date;
  updated_at: Date;
  order_number: number;
}
