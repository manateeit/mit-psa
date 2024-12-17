'use server'

import { createTenantKnex } from '@/lib/db';
import { getCurrentUser } from '@/lib/actions/user-actions/userActions';
import { IStatus, ItemType } from '@/interfaces/project.interfaces';

export async function getTicketStatuses() {
  try {
    // Get the current user to ensure we have a valid user
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    // Get the database connection with tenant
    const {knex: db, tenant} = await createTenantKnex();
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Fetch statuses for the current tenant
    const statuses = await db<IStatus>('statuses')
      .where({
        tenant,
        status_type: 'ticket' as ItemType
      })
      .select('*')
      .orderBy('order_number');

    return statuses;
  } catch (error) {
    console.error('Error fetching ticket statuses:', error);
    throw error;
  }
}

export async function createStatus(statusData: Omit<IStatus, 'status_id' | 'tenant'>): Promise<IStatus> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  if (!statusData.name || statusData.name.trim() === '') {
    throw new Error('Status name is required');
  }

  const {knex: db, tenant} = await createTenantKnex();
  try {
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    const newStatus = await db.transaction(async (trx) => {
      // Check if status with same name already exists
      const existingStatus = await trx('statuses')
        .where({
          tenant,
          name: statusData.name,
          status_type: statusData.status_type
        })
        .first();

      if (existingStatus) {
        throw new Error('A status with this name already exists');
      }

      // Get highest order_number if none specified
      if (!statusData.order_number) {
        const maxOrder = await trx('statuses')
          .where({
            tenant,
            status_type: statusData.status_type
          })
          .max('order_number as max')
          .first();
        
        statusData.order_number = (maxOrder?.max || 0) + 10;
      }

      const [status] = await trx<IStatus>('statuses')
        .insert({
          ...statusData,
          tenant,
          name: statusData.name.trim(),
          is_closed: false,
          created_by: user.user_id
        })
        .returning('*');

      return status;
    });

    return newStatus;

  } catch (error) {
    console.error('Error creating status:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to create status');
  }
}

export async function updateStatus(statusId: string, statusData: Partial<IStatus>) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  if (!statusId) {
    throw new Error('Status ID is required');
  }

  if (statusData.name && statusData.name.trim() === '') {
    throw new Error('Status name cannot be empty');
  }

  const {knex: db, tenant} = await createTenantKnex();
  try {
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Check if new name conflicts with existing status
    if (statusData.name) {
      const existingStatus = await db('statuses')
        .where({
          tenant,
          name: statusData.name,
          status_type: 'ticket' as ItemType
        })
        .whereNot('status_id', statusId)
        .first();

      if (existingStatus) {
        throw new Error('A status with this name already exists');
      }
    }

    const [updatedStatus] = await db<IStatus>('statuses')
      .where({
        tenant,
        status_id: statusId
      })
      .update({
        ...statusData,
      })
      .returning('*');

    if (!updatedStatus) {
      throw new Error('Status not found');
    }

    return updatedStatus;
  } catch (error) {
    console.error('Error updating status:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to update status');
  }
}

export async function deleteStatus(statusId: string) {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }

  if (!statusId) {
    throw new Error('Status ID is required');
  }

  const {knex: db, tenant} = await createTenantKnex();
  try {
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    // Check if status is in use
    const ticketsCount = await db('tickets')
      .where({
        tenant,
        status_id: statusId
      })
      .count('status_id as count')
      .first();

    if (ticketsCount && Number(ticketsCount.count) > 0) {
      throw new Error('Cannot delete status that is in use by tickets');
    }

    await db('statuses')
      .where({
        tenant,
        status_id: statusId
      })
      .del();
    return true;
  } catch (error) {
    console.error('Error deleting status:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to delete status');
  }
}
