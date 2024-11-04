// server/src/lib/actions/ticketResourceActions.ts
'use server'

import { ITicketResource } from '@/interfaces/ticketResource.interfaces';
import { IUserWithRoles } from '@/interfaces/auth.interfaces';
import TicketResource from '@/lib/models/ticketResource';
import { hasPermission } from '@/lib/auth/rbac';
import { createTenantKnex } from '@/lib/db';

export async function addTicketResource(
  ticketId: string,
  additionalUserId: string,
  role: string,
  currentUser: IUserWithRoles
): Promise<ITicketResource> {
  if (!hasPermission(currentUser, 'ticket', 'update')) {
    throw new Error('Permission denied: Cannot add ticket resource');
  }

  try {
    const { knex: db, tenant } = await createTenantKnex();
    
    // First, verify that the ticket exists and has the correct assigned_to
    const ticket = await db('tickets')
      .where({
        ticket_id: ticketId,
        tenant: tenant
      })
      .first();

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Create the resource with the ticket's assigned_to
    const [resource] = await db('ticket_resources')
      .insert({
        ticket_id: ticketId,
        assigned_to: ticket.assigned_to,
        additional_user_id: additionalUserId,
        role: role,
        tenant: tenant,
        assigned_at: new Date()
      })
      .returning('*');

    return resource;
  } catch (error) {
    console.error('Failed to add ticket resource:', error);
    throw new Error('Failed to add ticket resource');
  }
}

export async function removeTicketResource(
  assignmentId: string,
  currentUser: IUserWithRoles
): Promise<void> {
  if (!hasPermission(currentUser, 'ticket', 'update')) {
    throw new Error('Permission denied: Cannot remove ticket resource');
  }

  try {
    const { knex: db, tenant } = await createTenantKnex();
    await db('ticket_resources')
      .where({
        assignment_id: assignmentId,
        tenant: tenant
      })
      .delete();
  } catch (error) {
    console.error('Failed to remove ticket resource:', error);
    throw new Error('Failed to remove ticket resource');
  }
}

export async function getTicketResources(
  ticketId: string,
  currentUser: IUserWithRoles
): Promise<ITicketResource[]> {
  if (!hasPermission(currentUser, 'ticket', 'read')) {
    throw new Error('Permission denied: Cannot view ticket resources');
  }

  try {
    const { knex: db, tenant } = await createTenantKnex();
    const resources = await db('ticket_resources')
      .where({
        ticket_id: ticketId,
        tenant: tenant
      })
      .select('*');

    return resources;
  } catch (error) {
    console.error('Failed to fetch ticket resources:', error);
    throw new Error('Failed to fetch ticket resources');
  }
}

// Helper function to check if a user can be added as additional agent
export async function canAddAsAdditionalAgent(
  ticketId: string,
  userId: string,
  currentUser: IUserWithRoles
): Promise<boolean> {
  try {
    const { knex: db, tenant } = await createTenantKnex();
    
    // Check if user is already an additional agent
    const existingResource = await db('ticket_resources')
      .where({
        ticket_id: ticketId,
        additional_user_id: userId,
        tenant: tenant
      })
      .first();

    if (existingResource) {
      return false;
    }

    // Check if user is the primary assigned agent
    const ticket = await db('tickets')
      .where({
        ticket_id: ticketId,
        assigned_to: userId,
        tenant: tenant
      })
      .first();

    return !ticket;
  } catch (error) {
    console.error('Error checking user availability:', error);
    return false;
  }
}
