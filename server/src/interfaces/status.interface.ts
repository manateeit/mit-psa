import { ItemType } from './project.interfaces';
import { TenantEntity } from ".";

export interface IStatus extends TenantEntity {
  status_id: string;
  name: string;
  status_type: ItemType;
  standard_status_id: string | null;
  is_custom: boolean;
  created_at: Date;
  updated_at: Date;
  is_closed: boolean;
  created_by?: string;
  order_number?: number;
}
