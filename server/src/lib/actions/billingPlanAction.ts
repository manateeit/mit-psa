// server/src/lib/actions/billingPlanActions.ts
'use server'

import BillingPlan from '@/lib/models/billingPlan';
import { IBillingPlan } from '@/interfaces/billing.interfaces';

export async function getBillingPlans(): Promise<IBillingPlan[]> {
    try {
        const plans = await BillingPlan.getAll();
        return plans;
    } catch (error) {
        console.error('Error fetching billing plans:', error);
        throw new Error('Failed to fetch company billing plans');
    }
}

export async function createBillingPlan(
    planData: Omit<IBillingPlan, 'plan_id'>
): Promise<IBillingPlan> {
    try {
        const plan = await BillingPlan.create({ ...planData });
        return plan;
    } catch (error) {
        console.error('Error creating billing plan:', error);
        throw new Error('Failed to create billing plan');
    }
}
