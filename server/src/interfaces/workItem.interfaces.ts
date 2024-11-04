import { TenantEntity } from ".";

export type WorkItemType = 'ticket' | 'project_task' | 'non_billable_category';

export interface IWorkItem extends TenantEntity {
  work_item_id: string;
  type: WorkItemType;
  name: string;
  description: string;
  is_billable: boolean;
}