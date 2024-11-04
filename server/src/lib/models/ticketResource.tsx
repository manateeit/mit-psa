// server/src/lib/models/ticket-resource.tsx
import logger from '../../utils/logger';
import { ITicketResource } from '../../interfaces/ticketResource.interfaces';
import { createTenantKnex } from '../db';
import { v4 as uuid4 } from 'uuid';

const TicketResource = {
  create: async (resourceData: Omit<ITicketResource, 'assignment_id' | 'tenant'>): Promise<ITicketResource> => {
    try {
      const {knex: db, tenant} = await createTenantKnex();
      const [createdResource] = await db<ITicketResource>('ticket_resources')
        .insert({
          ...resourceData,
          assignment_id: uuid4(),
          tenant: tenant!,
          assigned_at: new Date()
        })
        .returning('*');

      if (!createdResource) {
        throw new Error('Failed to create ticket resource');
      }

      return createdResource;
    } catch (error) {
      logger.error('Error creating ticket resource:', error);
      throw error;
    }
  },

  getByTicketId: async (ticket_id: string): Promise<ITicketResource[]> => {
    try {
      const {knex: db} = await createTenantKnex();
      const resources = await db<ITicketResource>('ticket_resources')
        .select('*')
        .where({ ticket_id });
      return resources;
    } catch (error) {
      logger.error(`Error getting resources for ticket ${ticket_id}:`, error);
      throw error;
    }
  },

  remove: async (assignment_id: string): Promise<void> => {
    try {
      const {knex: db} = await createTenantKnex();
      await db<ITicketResource>('ticket_resources')
        .where({ assignment_id })
        .del();
    } catch (error) {
      logger.error(`Error removing ticket resource ${assignment_id}:`, error);
      throw error;
    }
  },

  update: async (assignment_id: string, data: Partial<ITicketResource>): Promise<void> => {
    try {
      const {knex: db} = await createTenantKnex();
      await db<ITicketResource>('ticket_resources')
        .where({ assignment_id })
        .update(data);
    } catch (error) {
      logger.error(`Error updating ticket resource ${assignment_id}:`, error);
      throw error;
    }
  }
};

export default TicketResource;
