import { z } from 'zod';

export const ticketFormSchema = z.object({
  title: z.string(),
  channel_id: z.string(),
  company_id: z.string(),
  contact_name_id: z.string().nullable(),
  status_id: z.string(),
  assigned_to: z.string(),
  priority_id: z.string(),
  description: z.string()
});

export const ticketSchema = z.object({
  ticket_id: z.string().optional(),
  ticket_number: z.string(),
  title: z.string(),
  url: z.string().nullable(),
  channel_id: z.string(),
  company_id: z.string(),
  contact_name_id: z.string().nullable(),
  status_id: z.string(),
  category_id: z.string().nullable(),
  entered_by: z.string(),
  updated_by: z.string().nullable(),
  closed_by: z.string().nullable(),
  assigned_to: z.string().nullable(),
  entered_at: z.string().nullable(), // Changed from date to string
  updated_at: z.string().nullable(), // Changed from date to string
  closed_at: z.string().nullable(),  // Changed from date to string
  attributes: z.record(z.unknown()).nullable(),
  priority_id: z.string(),
  tenant: z.string()
});

export const ticketListItemSchema = ticketSchema.extend({
  status_id: z.string().nullable(),
  priority_id: z.string().nullable(),
  channel_id: z.string().nullable(),
  entered_by: z.string().nullable(),
  status_name: z.string(),
  priority_name: z.string(),
  channel_name: z.string(),
  entered_by_name: z.string()
});

export const ticketListFiltersSchema = z.object({
  channelId: z.string().optional(),
  statusId: z.string().optional(),
  priorityId: z.string().optional(),
  searchQuery: z.string().optional(),
  channelFilterState: z.enum(['active', 'inactive', 'all'])
});

export const ticketUpdateSchema = ticketSchema.partial();

export const ticketAttributesQuerySchema = z.object({
  ticketId: z.string()
});
