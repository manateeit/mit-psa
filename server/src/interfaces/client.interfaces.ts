import { TenantEntity } from './index';
import { IBillingPlan } from './billing.interfaces';

export interface IClient extends TenantEntity {
    id: string;
    name: string;
    billingPlan?: IBillingPlan;
}
