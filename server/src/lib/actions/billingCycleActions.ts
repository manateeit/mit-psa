'use server'

import { getServerSession } from "next-auth/next";
import { options } from '../../app/api/auth/[...nextauth]/options';
import { createTenantKnex } from '@/lib/db';
import { Knex } from 'knex';

interface BillingCycleResult {
  billing_cycle: string;
  company_id: string;
}

export async function getBillingCycle(companyId: string): Promise<string> {
  const session = await getServerSession(options);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  const {knex: conn} = await createTenantKnex();

  const result = await conn<BillingCycleResult>('company_billing_cycles')
    .where('company_id', companyId)
    .first();

  return result ? result.billing_cycle : 'monthly'; // Default to monthly if not set
}

export async function updateBillingCycle(companyId: string, billingCycle: string): Promise<void> {
  const session = await getServerSession(options);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  const {knex: conn} = await createTenantKnex();

  await conn('company_billing_cycles')
    .insert({ company_id: companyId, billing_cycle: billingCycle })
    .onConflict('company_id')
    .merge();
}

export async function getAllBillingCycles(): Promise<{ [companyId: string]: string }> {
  const session = await getServerSession(options);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }
  const {knex: conn} = await createTenantKnex();

  const results = await conn<BillingCycleResult>('company_billing_cycles').select('*');

  return results.reduce((acc: { [companyId: string]: string }, row: BillingCycleResult) => {
    acc[row.company_id] = row.billing_cycle;
    return acc;
  }, {});
}
