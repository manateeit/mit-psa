'use server'

import { IUser, IChannel, ITicketStatus, IPriority, ICompany, IContact } from '@/interfaces';
import { getAllUsers, getCurrentUser } from '@/lib/actions/user-actions/userActions';
import { getAllChannels } from '@/lib/actions/channel-actions/channelActions';
import { getTicketStatuses } from '@/lib/actions/status-actions/statusActions';
import { getAllPriorities } from '@/lib/actions/priorityActions';
import { getAllCompanies, getCompanyById } from '@/lib/actions/companyActions';
import { getContactsByCompany } from '@/lib/actions/contact-actions/contactActions';

export interface TicketFormData {
  users: IUser[];
  channels: IChannel[];
  statuses: ITicketStatus[];
  priorities: IPriority[];
  companies: ICompany[];
  contacts?: IContact[];
  selectedCompany?: {
    company_id: string;
    company_name: string;
    client_type: string;
  };
}

export async function getTicketFormData(prefilledCompanyId?: string): Promise<TicketFormData> {
  try {
    // Get current user first to ensure tenant context
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('No active session found');
    }

    // Fetch all data in parallel
    const [
      users,
      channels,
      statuses,
      priorities,
      companies,
      selectedCompany
    ] = await Promise.all([
      getAllUsers(),
      getAllChannels(),
      getTicketStatuses(),
      getAllPriorities(),
      getAllCompanies(false),
      prefilledCompanyId ? getCompanyById(prefilledCompanyId) : null
    ]);

    // If we have a prefilled company, get its contacts
    let contacts: IContact[] = [];
    if (selectedCompany && selectedCompany.client_type === 'company') {
      contacts = await getContactsByCompany(selectedCompany.company_id);
    }

    return {
      users,
      channels,
      statuses,
      priorities,
      companies,
      contacts: contacts.length > 0 ? contacts : undefined,
      selectedCompany: selectedCompany && selectedCompany.client_type ? {
        company_id: selectedCompany.company_id,
        company_name: selectedCompany.company_name,
        client_type: selectedCompany.client_type
      } : undefined
    };
  } catch (error) {
    console.error('Error fetching ticket form data:', error);
    throw new Error('Failed to load form data');
  }
}
