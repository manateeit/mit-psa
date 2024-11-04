import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { v4 as uuidv4 } from 'uuid';
import knex from 'knex';
import dotenv from 'dotenv';
import { IUserWithRoles, IRole, IRoleWithPermissions, IPermission } from '../../interfaces/auth.interfaces';
import { ITicket } from '../../interfaces/ticket.interfaces';
import * as ticketActions from '../../lib/actions/ticket-actions/ticketActions';

dotenv.config();

let db: knex.Knex;

beforeAll(async () => {
  db = knex({
    client: 'pg',
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      user: process.env.DB_USER_SERVER,
      password: process.env.DB_PASSWORD_SERVER,
      database: process.env.DB_NAME_SERVER
    },
    migrations: {
      directory: "./migrations"
    },
    seeds: {
      directory: "./seeds/dev"
    }
  });

  // Drop all tables
  await db.raw('DROP SCHEMA public CASCADE');
  await db.raw('CREATE SCHEMA public');

  // Ensure the database is set up correctly
  await db.raw(`SET app.environment = '${process.env.APP_ENV}'`);

  await db.migrate.latest();
  await db.seed.run();
});

vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

afterAll(async () => {
  await db.destroy();
});

describe('Ticket Permissions Infrastructure', () => {
  let tenantId: string;
  let companyId: string;
  let categoryId: string;
  let channelId: string;
  let contactId: string;
  let statusId: string;
  let priorityId: string;
  let viewTicketPermission: IPermission;
  let editTicketPermission: IPermission;
  let createTicketPermission: IPermission;
  let deleteTicketPermission: IPermission;
  let userRole: IRoleWithPermissions;
  let adminRole: IRoleWithPermissions;
  let regularUser: IUserWithRoles;
  let adminUser: IUserWithRoles;
  let testTicket: ITicket | undefined;

  beforeEach(async () => {
    // Create test data for each test
    ({ tenant: tenantId } = await db('tenants').select("tenant").first());

    companyId = uuidv4();
    await db('companies').insert({
      company_id: companyId,
      company_name: 'Test Company',
      tenant: tenantId,
    });

    // Create a channel
    channelId = uuidv4();
    await db('channels').insert({
      channel_id: channelId,
      channel_name: 'Test Channel',
      tenant: tenantId,
    });

    // Create a contact
    contactId = uuidv4();
    await db('contacts').insert({
      contact_name_id: contactId,
      full_name: 'Test Contact',
      email: 'test@example.com',
      company_id: companyId,
      tenant: tenantId,
    });

    priorityId = (await db('priorities'))[0].priority_id;

    // Create permissions
    viewTicketPermission = { permission_id: uuidv4(), resource: 'ticket', action: 'view' };
    editTicketPermission = { permission_id: uuidv4(), resource: 'ticket', action: 'edit' };
    createTicketPermission = { permission_id: uuidv4(), resource: 'ticket', action: 'create' };
    deleteTicketPermission = { permission_id: uuidv4(), resource: 'ticket', action: 'delete' };

    // Create roles
    userRole = {
      role_id: uuidv4(),
      role_name: 'User',
      description: 'Regular user role',
      permissions: [viewTicketPermission]
    };

    adminRole = {
      role_id: uuidv4(),
      role_name: 'Admin',
      description: 'Administrator role',
      permissions: [viewTicketPermission, editTicketPermission, createTicketPermission, deleteTicketPermission]
    };

    // Create users
    regularUser = {
      user_id: uuidv4(),
      tenant: tenantId,
      username: 'johndoe',
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      hashed_password: 'hashed_password_here',
      roles: [userRole],
      is_inactive: false
    };

    adminUser = {
      user_id: uuidv4(),
      tenant: tenantId,
      username: 'janeadmin',
      first_name: 'Jane',
      last_name: 'Admin',
      email: 'jane@example.com',
      hashed_password: 'hashed_password_here',
      roles: [adminRole],
      is_inactive: false
    };

    // Insert users into the database
    await db('users').insert([
      { ...regularUser, roles: JSON.stringify(regularUser.roles.map((role: IRole): string => role.role_name)), role: 'user' },
      { ...adminUser, roles: JSON.stringify(adminUser.roles.map((role: IRole): string => role.role_name)), role: 'admin' }
    ]);

    // Create a category
    categoryId = uuidv4();
    await db('categories').insert({
      category_id: categoryId,
      category_name: 'Test Category',
      tenant: tenantId,
      channel_id: channelId,
      created_by: adminUser.user_id,
    });

    // Create a test status with a unique order_number
    statusId = uuidv4();
    const uniqueOrderNumber = Math.floor(Date.now() / 1000) % 1000000 + Math.floor(Math.random() * 1000);
    await db('statuses').insert({
      status_id: statusId,
      status_name: `Test Status ${uniqueOrderNumber}`,
      tenant: tenantId,
      created_by: adminUser.user_id,
      status_type: 'ticket',
      order_number: uniqueOrderNumber
    });

    // Create a test ticket in the database
    testTicket = {
      tenant: tenantId,
      ticket_id: uuidv4(),
      ticket_number: 'TKT-001',
      title: 'Test Ticket',
      channel_id: channelId,
      company_id: companyId,
      contact_name_id: contactId,
      status_id: statusId,
      category_id: categoryId,
      entered_by: regularUser.user_id,
      priority_id: priorityId
    };

    await db('tickets').insert(testTicket);
  });

  afterEach(async () => {
    // Clean up test data
    await db('tickets').where('status_id', statusId).del();
    await db('statuses').where('status_id', statusId).del();
    await db('contacts').where('contact_name_id', contactId).del();
    await db('categories').where('category_id', categoryId).del();
    await db('channels').where('channel_id', channelId).del();
    await db('users').whereIn('user_id', [regularUser.user_id, adminUser.user_id]).del();
    await db('companies').where('company_id', companyId).del();
  });

  it('should allow regular user to view tickets', async () => {
    const tickets = (await ticketActions.getTickets(regularUser));
    expect(tickets.length).toBeGreaterThanOrEqual(1);
    expect(tickets.map((ticket): string => ticket.ticket_id!)).toContain(testTicket?.ticket_id);
  });

  it('should allow admin user to edit a ticket', async () => {
    const updateData: Partial<ITicket> = {
      status_id: statusId,
      updated_by: adminUser.user_id,
    };
    const result = await ticketActions.updateTicket(testTicket!.ticket_id!, updateData, adminUser);
    expect(result).toBe('success');

    const updatedTicket = await db('tickets').where('ticket_id', testTicket!.ticket_id).first();
    expect(updatedTicket.status_id).toBe(updateData.status_id);
  });

  it('should not allow regular user to edit a ticket', async () => {
    const updateData: Partial<ITicket> = {
      status_id: statusId,
      updated_by: regularUser.user_id,
    };
    await expect(ticketActions.updateTicket(testTicket!.ticket_id!, updateData, regularUser))
      .rejects.toThrow('Permission denied: Cannot edit ticket');

    const unchangedTicket = await db('tickets').where('ticket_id', testTicket!.ticket_id).first();
    expect(unchangedTicket.status_id).toBe(testTicket!.status_id);
  });

  it('should allow admin user to create a ticket', async () => {
    const mockFormData = new FormData();
    mockFormData.append('title', 'New Test Ticket');
    mockFormData.append('ticket_number', 'TKT-002');
    mockFormData.append('status_id', statusId);
    mockFormData.append('channel_id', channelId);
    mockFormData.append('company_id', companyId);
    mockFormData.append('contact_name_id', contactId);
    mockFormData.append('category_id', categoryId);
    mockFormData.append('priority_id', priorityId);

    // Clean up the newly created ticket
    await db('tickets').where('ticket_id', testTicket?.ticket_id).del();

    try {
      const newTicket = await ticketActions.addTicket(mockFormData, adminUser);
      expect(newTicket).toBeDefined();
      expect(newTicket?.title).toBe('New Test Ticket');

      if (newTicket && newTicket.ticket_id) {
        const retrievedTicket = await db('tickets').where('ticket_id', newTicket.ticket_id).first();
        expect(retrievedTicket.ticket_id).toEqual(newTicket.ticket_id);
      } else {
        throw new Error('New ticket was not created successfully');
      }
    } finally {
      // Clean up the newly created ticket
      await db('tickets').where('ticket_id', testTicket?.ticket_id).del();
    }
  });

  it('should not allow regular user to create a ticket', async () => {
    const mockFormData = new FormData();
    mockFormData.append('title', 'New Test Ticket');
    mockFormData.append('ticket_number', 'TKT-002');
    mockFormData.append('status_id', statusId);
    mockFormData.append('channel_id', channelId);
    mockFormData.append('company_id', companyId);
    mockFormData.append('contact_name_id', contactId);
    mockFormData.append('category_id', categoryId);
    mockFormData.append('priority_id', priorityId);

    await expect(ticketActions.addTicket(mockFormData, regularUser))
      .rejects.toThrow('Permission denied: Cannot create ticket');
  });

  it('should allow admin user to delete a ticket', async () => {
    const result = await ticketActions.deleteTicket(testTicket!.ticket_id!, adminUser);
    expect(result).toBe('success');

    const deletedTicket = await db('tickets').where('ticket_id', testTicket!.ticket_id).first();
    expect(deletedTicket).toBeUndefined();
  });

  it('should not allow regular user to delete a ticket', async () => {
    await expect(ticketActions.deleteTicket(testTicket!.ticket_id!, regularUser))
      .rejects.toThrow('Permission denied: Cannot delete ticket');

    const unchangedTicket = await db('tickets').where('ticket_id', testTicket!.ticket_id).first();
    expect(unchangedTicket).toBeDefined();
  });
});
