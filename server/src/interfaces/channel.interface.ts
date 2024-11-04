import { TenantEntity } from './index';

export interface IChannel extends TenantEntity {
  channel_id?: string;
  channel_name?: string;
  is_inactive: boolean;
}
