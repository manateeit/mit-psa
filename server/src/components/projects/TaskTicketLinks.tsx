'use client';

import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/lib/actions/user-actions/userActions';
import { 
  addTicketLinkAction,
  deleteTaskTicketLinkAction,
  getTaskTicketLinksAction
} from '@/lib/actions/projectActions';
import { getTicketsForList, getTicketById } from '@/lib/actions/ticket-actions/ticketActions'
import { ITicketListFilters } from '@/interfaces/ticket.interfaces';
import { useDrawer } from '@/context/DrawerContext';
import TicketDetails from '@/components/tickets/TicketDetails';
import { ITicketListItem, ITicket } from '@/interfaces/ticket.interfaces';
import { IProjectTicketLinkWithDetails } from '@/interfaces/project.interfaces';
import { Button } from '@/components/ui/Button';
import CustomSelect from '@/components/ui/CustomSelect';
import { Link, Plus, ExternalLink, Trash2 } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { QuickAddTicket } from '@/components/tickets/QuickAddTicket';
import { toast } from 'react-hot-toast';

interface TaskTicketLinksProps {
  taskId: string | null;
  phaseId: string;
  projectId: string;
  initialLinks?: IProjectTicketLinkWithDetails[];
}

export default function TaskTicketLinks({
  taskId,
  phaseId,
  projectId,
  initialLinks = []
}: TaskTicketLinksProps) {
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<string>('');
  const [taskTicketLinks, setTaskTicketLinks] = useState<IProjectTicketLinkWithDetails[]>(initialLinks);
  const [availableTickets, setAvailableTickets] = useState<ITicketListItem[]>([]);

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
        } catch (error) {
          console.error('Error fetching ticket links:', error);
        }
      }
    };

    fetchLinks();
  }, [taskId]);

  const handleLinkTicket = async () => {
    if (!selectedTicket) return;
    
    try {
      await onLinkTicket(selectedTicket);
      toast.success('Ticket linked successfully');
      setShowTicketDialog(false);
      setSelectedTicket('');
    } catch (error: any) {
      console.error('Error linking ticket:', error);
      if (error.message === 'This ticket is already linked to this task') {
        toast.error('This ticket is already linked to this task');
      } else {
        toast.error('Failed to link ticket');
      }
    }
  };

  const ticketOptions = availableTickets
    .filter((ticket): ticket is ITicketListItem & { ticket_id: string } => ticket.ticket_id !== undefined)
    .map((ticket): { value: string; label: string } => ({
      value: ticket.ticket_id,
      label: `${ticket.ticket_number} - ${ticket.title}`
    }));

  const { openDrawer } = useDrawer();

  const onLinkTicket = async (ticketId: string) => {
    if (!ticketId) return;
    
    try {
      if (taskId) {
        await addTicketLinkAction(projectId, taskId, ticketId);
        const links = await getTaskTicketLinksAction(taskId);
        setTaskTicketLinks(links);
      } else {
        // For new tasks, store the link temporarily
        const selectedTicketDetails = availableTickets.find(t => t.ticket_id === ticketId);
        if (selectedTicketDetails) {
          const tempLink: IProjectTicketLinkWithDetails = {
            link_id: `temp-${Date.now()}`,
            task_id: 'temp',
            ticket_id: ticketId,
            ticket_number: selectedTicketDetails.ticket_number,
            title: selectedTicketDetails.title,
            created_at: new Date(),
            project_id: projectId,
            phase_id: phaseId,
            status_name: selectedTicketDetails.status_name,
            is_closed: selectedTicketDetails.closed_at !== null
          };
          setTaskTicketLinks([...taskTicketLinks, tempLink]);
        }
      }
    } catch (error) {
      throw error;
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
      } else {
        // For new tasks, just remove from state
        setTaskTicketLinks(taskTicketLinks.filter(link => link.link_id !== linkId));
      }
      toast.success('Ticket link removed');
    } catch (error) {
      console.error('Error deleting ticket link:', error);
      toast.error('Failed to remove ticket link');
    }
  };

  const onNewTicketCreated = async (ticket: ITicket) => {
    if (!ticket.ticket_id) {
      toast.error('Invalid ticket ID');
      return;
    }
    try {
      await onLinkTicket(ticket.ticket_id);
      setShowNewTicketForm(false);
      toast.success('New ticket created and linked');
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
            onClick={() => setShowTicketDialog(true)}
            className="flex items-center"
          >
            <Link className="h-4 w-4 mr-1" />
            Link Ticket
          </Button>
          <Button
            type="button"
            variant="soft"
            onClick={() => setShowNewTicketForm(true)}
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

      <Dialog.Root open={showTicketDialog} onOpenChange={setShowTicketDialog}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-lg shadow-lg w-[400px]">
            <Dialog.Title className="text-lg font-semibold mb-4">Link Existing Ticket</Dialog.Title>
            <div className="space-y-4">
              <CustomSelect
                value={selectedTicket}
                onValueChange={setSelectedTicket}
                options={ticketOptions}
                placeholder="Select a ticket"
                className="w-full"
              />
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" onClick={() => setShowTicketDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleLinkTicket} disabled={!selectedTicket}>
                  Link Ticket
                </Button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root open={showNewTicketForm} onOpenChange={setShowNewTicketForm}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-lg shadow-lg w-[600px]">
            <Dialog.Title className="text-lg font-semibold mb-4">Create New Ticket</Dialog.Title>
            <QuickAddTicket 
              open={showNewTicketForm}
              onOpenChange={setShowNewTicketForm}
              onTicketAdded={onNewTicketCreated}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
