import { ICompanyBillingPlan } from '../../interfaces/billing.interfaces';
import { createTenantKnex } from '@/lib/db';
import { Knex } from 'knex';

class CompanyBillingPlan {
    static async checkOverlappingBilling(
        companyId: string,
        serviceCategory: string,
        startDate: Date,
        endDate: Date | null,
        excludeBillingPlanId?: string
    ): Promise<ICompanyBillingPlan[]> {
        const {knex: db} = await createTenantKnex();
        const query = db('company_billing_plans')
            .where('company_id', companyId)
            .where('service_category', serviceCategory)
            .where(function (this: Knex.QueryBuilder) {
                this.where(function (this: Knex.QueryBuilder) {
                    this.where('start_date', '<=', startDate)
                        .where(function (this: Knex.QueryBuilder) {
                            this.where('end_date', '>=', startDate).orWhereNull('end_date');
                        });
                }).orWhere(function () {
                    this.where('start_date', '>=', startDate)
                        .where('start_date', '<=', endDate || db.raw('CURRENT_DATE'));
                });
            });

        if (excludeBillingPlanId) {
            query.whereNot('company_billing_plan_id', excludeBillingPlanId);
        }

        return query;
    }

    static async create(billingData: Omit<ICompanyBillingPlan, 'company_billing_plan_id'>): Promise<ICompanyBillingPlan> {
        const {knex: db} = await createTenantKnex();
        const [createdBillingPlan] = await db('company_billing_plans').insert(billingData).returning('*');
        return createdBillingPlan;
    }

    static async update(billingPlanId: string, billingData: Partial<ICompanyBillingPlan>): Promise<ICompanyBillingPlan> {
        const {knex: db} = await createTenantKnex();
        const [updatedBillingPlan] = await db('company_billing_plans')
            .where('company_billing_plan_id', billingPlanId)
            .update(billingData)
            .returning('*');
        return updatedBillingPlan;
    }

    static async getByCompanyId(companyId: string): Promise<ICompanyBillingPlan[]> {
        const {knex: db} = await createTenantKnex();
        return db('company_billing_plans').where('company_id', companyId);
    }

    static async getById(billingPlanId: string): Promise<ICompanyBillingPlan | null> {
        const {knex: db} = await createTenantKnex();
        const [billingPlan] = await db('company_billing_plans').where('company_billing_plan_id', billingPlanId);
        return billingPlan || null;
    }
}

export default CompanyBillingPlan;
