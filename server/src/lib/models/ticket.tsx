import { createTenantKnex } from '@/lib/db';
import { ITicket } from '@/interfaces/ticket.interfaces';
import { z } from 'zod';


const Ticket = {
  getAll: async (): Promise<ITicket[]> => {
    try {
      const { knex: db } = await createTenantKnex();
      // RLS will automatically filter tickets based on the current user's tenant
      const tickets = await db<ITicket>('tickets').select('*');
      return tickets;
    } catch (error) {
      console.error('Error getting all tickets:', error);
      throw error;
    }
  },

  get: async (id: string): Promise<ITicket> => {
    const {knex: db} = await createTenantKnex();
    // RLS will ensure that only tickets from the current user's tenant are accessible
    const [ticket] = await db('tickets')
      .select(
        'tickets.*',
        'priorities.priority_name'
      )
      .leftJoin('priorities', 'tickets.priority_id', 'priorities.priority_id')
      .where('tickets.ticket_id', id);
    
    return ticket;
  },

  insert: async (ticket: Partial<ITicket>): Promise<Pick<ITicket, "ticket_id">> => {
    try {
      const {knex: db, tenant} = await createTenantKnex();
      // RLS will automatically set the tenant for the new ticket
      const [insertedTicket] = await db<ITicket>('tickets').insert({ ...ticket, tenant: tenant! }).returning('ticket_id');
      return { ticket_id: insertedTicket.ticket_id };
    } catch (error) {
      console.error('Error inserting ticket:', error);
      throw error;
    }
  },

  update: async (id: string, ticket: Partial<ITicket>): Promise<void> => {
    try {
      const {knex: db} = await createTenantKnex();
      // RLS will ensure that only tickets from the current user's tenant can be updated
      await db<ITicket>('tickets').where({ ticket_id: id }).update(ticket);
    } catch (error) {
      console.error(`Error updating ticket with id ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string): Promise<void> => {
    try {
      const {knex: db} = await createTenantKnex();
      // RLS will ensure that only tickets from the current user's tenant can be deleted
      await db<ITicket>('tickets').where({ ticket_id: id }).del();
    } catch (error) {
      console.error(`Error deleting ticket with id ${id}:`, error);
      throw error;
    }
  },
};

export default Ticket;
