'use client';

import { useState, useEffect } from 'react';
import { QuickAddTicket } from '@/components/tickets/QuickAddTicket';
import { getCurrentUser } from '@/lib/actions/user-actions/userActions';
import { 
  addTicketLinkAction,
  deleteTaskTicketLinkAction,
  getTaskTicketLinksAction
} from '@/lib/actions/projectActions';
import { getTicketsForList, getTicketById } from '@/lib/actions/ticket-actions/ticketActions';
import { ITicketListFilters } from '@/interfaces/ticket.interfaces';
import { useDrawer } from '@/context/DrawerContext';
import TicketDetails from '@/components/tickets/TicketDetails';
import { ITicketListItem, ITicket } from '@/interfaces/ticket.interfaces';
import { IProjectTicketLinkWithDetails } from '@/interfaces/project.interfaces';
import { Button } from '@/components/ui/Button';
import { Link, Plus, ExternalLink, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import GenericDialog from '@/components/ui/GenericDialog';

interface TaskTicketLinksProps {
  taskId: string | null;
  phaseId: string;
  projectId: string;
  initialLinks?: IProjectTicketLinkWithDetails[];
  onShowLinkDialog: (options: { tickets: SelectOption[], onSelect: (ticketId: string) => void }) => void;
  onShowCreateDialog: (onTicketCreated: (ticket: ITicket) => void) => void;
  onLinksChange?: (links: IProjectTicketLinkWithDetails[]) => void;
}

interface SelectOption {
  value: string;
  label: string;
}

interface TicketDetails {
  ticket_id: string;
  ticket_number: string;
  title: string;
  status_name?: string;
  closed_at?: Date | null;
}

export default function TaskTicketLinks({
  taskId,
  phaseId,
  projectId,
  initialLinks = [],
  onShowLinkDialog,
  onShowCreateDialog,
  onLinksChange
}: TaskTicketLinksProps) {
  const [taskTicketLinks, setTaskTicketLinks] = useState<IProjectTicketLinkWithDetails[]>(initialLinks);
  const [availableTickets, setAvailableTickets] = useState<ITicketListItem[]>([]);
  const { openDrawer } = useDrawer();

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const user = await getCurrentUser();
        if (!user) {
          toast.error('No user session found');
          return;
        }
        const filters: ITicketListFilters = {
          channelFilterState: 'all'
        };
        const tickets = await getTicketsForList(user, filters);
        setAvailableTickets(tickets);
      } catch (error) {
        console.error('Error fetching tickets:', error);
        toast.error('Failed to load available tickets');
      }
    };

    fetchTickets();
  }, []);

  useEffect(() => {
    const fetchLinks = async () => {
      if (taskId) {
        try {
          const links = await getTaskTicketLinksAction(taskId);
          setTaskTicketLinks(links);
          onLinksChange?.(links);
        } catch (error) {
          console.error('Error fetching ticket links:', error);
        }
      }
    };

    fetchLinks();
  }, [taskId, onLinksChange]);

  const addTempTicketLink = (ticketDetails: TicketDetails | ITicketListItem | ITicket) => {
    // Check if ticket is already linked
    if (!('ticket_id' in ticketDetails) || !ticketDetails.ticket_id) {
      return null;
    }

    const isAlreadyLinked = taskTicketLinks.some(link => link.ticket_id === ticketDetails.ticket_id);
    if (isAlreadyLinked) {
      toast.error('This ticket is already linked to this task');
      return null;
    }

    const tempLink: IProjectTicketLinkWithDetails = {
      link_id: `temp-${Date.now()}`,
      task_id: 'temp',
      ticket_id: ticketDetails.ticket_id,
      ticket_number: 'ticket_number' in ticketDetails ? ticketDetails.ticket_number : `#${Date.now()}`,
      title: ticketDetails.title,
      created_at: new Date(),
      project_id: projectId,
      phase_id: phaseId,
      status_name: 'status_name' in ticketDetails ? ticketDetails.status_name || 'New' : 'New',
      is_closed: 'closed_at' in ticketDetails ? ticketDetails.closed_at !== null : false
    };
    const newLinks = [...taskTicketLinks, tempLink];
    setTaskTicketLinks(newLinks);
    onLinksChange?.(newLinks);
    return tempLink;
  };

  const onLinkTicket = async (ticketId: string) => {
    if (!ticketId) return;
    
    try {
      if (taskId) {
        await addTicketLinkAction(projectId, taskId, ticketId, phaseId);
        const links = await getTaskTicketLinksAction(taskId);
        setTaskTicketLinks(links);
        onLinksChange?.(links);
        toast.success('Ticket linked successfully');
      } else {
        // For new tasks, store the link temporarily
        const selectedTicketDetails = availableTickets.find(t => t.ticket_id === ticketId);
        if (selectedTicketDetails) {
          const link = addTempTicketLink(selectedTicketDetails);
          if (link) {
            toast.success('Ticket linked successfully');
          }
        }
      }
    } catch (error) {
      console.error('Error linking ticket:', error);
      if (error instanceof Error && error.message === 'This ticket is already linked to this task') {
        toast.error('This ticket is already linked to this task');
      } else {
        toast.error('Failed to link ticket');
      }
    }
  };

  const onViewTicket = async (ticketId: string) => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        toast.error('No user session found');
        return;
      }
      
      const ticket = await getTicketById(ticketId, user);
      if (!ticket) {
        toast.error('Failed to load ticket');
        return;
      }

      openDrawer(<TicketDetails initialTicket={ticket} />);
    } catch (error) {
      console.error('Error loading ticket:', error);
      toast.error('Failed to load ticket');
    }
  };

  const onDeleteLink = async (linkId: string) => {
    try {
      if (taskId) {
        await deleteTaskTicketLinkAction(linkId);
        const links = await getTaskTicketLinksAction(taskId);
        setTaskTicketLinks(links);
        onLinksChange?.(links);
      } else {
        // For new tasks, just remove from state
        const newLinks = taskTicketLinks.filter(link => link.link_id !== linkId);
        setTaskTicketLinks(newLinks);
        onLinksChange?.(newLinks);
      }
      toast.success('Ticket link removed');
    } catch (error) {
      console.error('Error deleting ticket link:', error);
      toast.error('Failed to remove ticket link');
    }
  };

  const handleShowLinkDialog = () => {
    const ticketOptions = availableTickets
      .filter((ticket): ticket is ITicketListItem & { ticket_id: string } => ticket.ticket_id !== undefined)
      .map((ticket): SelectOption => ({
        value: ticket.ticket_id,
        label: `${ticket.ticket_number} - ${ticket.title}`
      }));

    onShowLinkDialog({
      tickets: ticketOptions,
      onSelect: onLinkTicket
    });
  };

  const onNewTicketCreated = async (ticket: ITicket) => {
    if (!ticket.ticket_id) {
      toast.error('Invalid ticket ID');
      return;
    }
    try {
      if (taskId) {
        await onLinkTicket(ticket.ticket_id);
      } else {
        // For new tasks, add to temporary list
        const link = addTempTicketLink(ticket);
        if (link) {
          toast.success('Ticket created and linked successfully');
        }
      }
      
      // Update available tickets list
      const user = await getCurrentUser();
      if (user) {
        const filters: ITicketListFilters = {
          channelFilterState: 'all'
        };
        const tickets = await getTicketsForList(user, filters);
        setAvailableTickets(tickets);
      }
    } catch (error) {
      console.error('Error linking new ticket:', error);
      toast.error('Failed to link new ticket');
    }
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Associated Tickets</h3>
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="soft"
            onClick={handleShowLinkDialog}
            className="flex items-center"
          >
            <Link className="h-4 w-4 mr-1" />
            Link Ticket
          </Button>
          <Button
            type="button"
            variant="soft"
            onClick={() => onShowCreateDialog(onNewTicketCreated)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Create Ticket
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {taskTicketLinks.map((link): JSX.Element => (
          <div key={link.link_id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span>{link.ticket_number} - {link.title}</span>
            <div className="flex items-center space-x-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onViewTicket(link.ticket_id)}
                className="flex items-center text-sm"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onDeleteLink(link.link_id)}
                className="flex items-center text-sm text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
