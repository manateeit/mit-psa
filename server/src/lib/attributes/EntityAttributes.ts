import { DBFieldAttribute, ComputedAttribute } from './AttributeSystem';
import { IUser, IRole, IUserWithRoles } from '@/interfaces/auth.interfaces';
import { ITicket } from '@/interfaces/ticket.interfaces';

export const USER_ATTRIBUTES = {
  id: new DBFieldAttribute<string, IUser>('id', 'user_id'),
  username: new DBFieldAttribute<string, IUser>('username', 'username'),
  roles: new DBFieldAttribute<IRole[], IUserWithRoles>('roles', 'roles'),
  isAdmin: new ComputedAttribute<boolean, IUserWithRoles>('isAdmin', (u) => u.roles.some(role => role.role_name === 'admin')),
  // Add more attributes as needed
};

export const TICKET_ATTRIBUTES = {
  id: new DBFieldAttribute<string, ITicket>('id', 'ticket_id'),
  title: new DBFieldAttribute<string, ITicket>('title', 'title'),
  // status: new DBFieldAttribute<string, ITicket>('status', 'status_id'),
  priority: new DBFieldAttribute<string, ITicket>('priority', 'priority_id'),
  isOverdue: new ComputedAttribute<boolean, ITicket>('isOverdue', (t) => {
    const dueDate = t.attributes?.due_date ? new Date(t.attributes.due_date as string) : null;
    return dueDate ? dueDate < new Date() : false;
  }),
  // Add more attributes as needed
};

export type UserAttributeKey = keyof typeof USER_ATTRIBUTES;
export type TicketAttributeKey = keyof typeof TICKET_ATTRIBUTES;