'use server'

import { createTenantKnex } from '@/lib/db';
import { getServerSession } from "next-auth/next";
import { options } from "@/app/api/auth/[...nextauth]/options";
import { IPlanService } from '@/interfaces';

export async function getPlanServices(planId: string): Promise<IPlanService[]> {
  const session = await getServerSession(options);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const {knex: db} = await createTenantKnex();
    const planServices = await db('plan_services')
      .where({ plan_id: planId });
    return planServices;
  } catch (error) {
    console.error('Error fetching plan services:', error);
    throw new Error('Failed to fetch plan services');
  }
}

export async function addPlanService(planService: IPlanService): Promise<number> {
  const session = await getServerSession(options);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  console.log('Inserting plan service:', planService);

  try {
    const {knex: db} = await createTenantKnex();
    const result = await db('plan_services').insert(planService);
    const insertedId = result[0];
    return insertedId;
  } catch (error) {
    console.error('Error adding plan service:', error);
    throw new Error('Failed to add plan service');
  }
}

export async function updatePlanService(planId: string, serviceId: string, updates: Partial<IPlanService>): Promise<void> {
  const session = await getServerSession(options);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const {knex: db} = await createTenantKnex();
    await db('plan_services')
      .where({ plan_id: planId, service_id: serviceId })
      .update(updates);
  } catch (error) {
    console.error('Error updating plan service:', error);
    throw new Error('Failed to update plan service');
  }
}

export async function removePlanService(planId: string, serviceId: string): Promise<void> {
  const session = await getServerSession(options);
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  try {
    const {knex: db} = await createTenantKnex();
    await db('plan_services')
      .where({ plan_id: planId, service_id: serviceId })
      .del();
  } catch (error) {
    console.error('Error removing plan service:', error);
    throw new Error('Failed to remove plan service');
  }
}
