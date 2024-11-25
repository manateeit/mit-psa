'use client';

import React, { useState, useEffect } from 'react';
import { IProjectPhase, IProjectTask, ITaskChecklistItem, IProjectTicketLinkWithDetails } from '@/interfaces/project.interfaces';
import { IUserWithRoles } from '@/interfaces/auth.interfaces';
import { ITicket } from '@/interfaces/ticket.interfaces';
import { ProjectStatus, addTaskToPhase, updateTaskWithChecklist, addTicketLinkAction, getTaskTicketLinksAction, deleteTaskTicketLinkAction } from '@/lib/actions/projectActions';
import { getCurrentUser } from '@/lib/actions/user-actions/userActions';
import { getTickets, getTicketById } from '@/lib/actions/ticket-actions/ticketActions';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import EditableText from '@/components/ui/EditableText';
import { ListChecks, Link, Plus, ExternalLink, Trash2 } from 'lucide-react';
import UserPicker from '@/components/ui/UserPicker';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import CustomSelect from '@/components/ui/CustomSelect';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';
import { QuickAddTicket } from '@/components/tickets/QuickAddTicket';
import { useDrawer } from '@/context/DrawerContext';
import TicketDetails from '@/components/tickets/TicketDetails';

interface TaskQuickAddProps {
  phase: IProjectPhase;
  onClose: () => void;
  onTaskAdded: (newTask: IProjectTask|null) => void;
  onTaskUpdated: (updatedTask: IProjectTask|null) => Promise<void>;
  projectStatuses: ProjectStatus[];
  defaultStatus?: ProjectStatus;
  onCancel: () => void;
  users: IUserWithRoles[];
  task?: IProjectTask;
}

const TaskQuickAdd: React.FC<TaskQuickAddProps> = ({ 
  phase,
  onClose, 
  onTaskAdded, 
  projectStatuses, 
  defaultStatus, 
  onCancel,
  users,
  task,
  onTaskUpdated
}) => {
  const { openDrawer } = useDrawer();
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [taskName, setTaskName] = useState(task?.task_name || '');
  const [description, setDescription] = useState(task?.description || '');
  const [selectedStatus, setSelectedStatus] = useState<string>(
    defaultStatus?.project_status_mapping_id || projectStatuses[0].project_status_mapping_id
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checklistItems, setChecklistItems] = useState<Omit<ITaskChecklistItem, 'tenant'>[]>([]);
  const [isEditingChecklist, setIsEditingChecklist] = useState(false);
  const [assignedUser, setAssignedUser] = useState<string>(task?.assigned_to || '');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [availableTickets, setAvailableTickets] = useState<ITicket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string>('');
  const [taskTicketLinks, setTaskTicketLinks] = useState<IProjectTicketLinkWithDetails[]>([]);
  const [tempTaskId, setTempTaskId] = useState<string>('');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUserId(user.user_id);
          const tickets = await getTickets(user);
          setAvailableTickets(tickets);
        }

        if (task?.task_id) {
          const links = await getTaskTicketLinksAction(task.task_id);
          setTaskTicketLinks(links);
        }

        // Generate a temporary task ID for new tasks
        if (!task) {
          setTempTaskId(`temp-${Date.now()}`);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchInitialData();
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (taskName.trim() === '') return;
  
    setIsSubmitting(true);
  
    try {
      if (task) {
        // Edit mode
        const taskData = {
          ...task,
          task_name: taskName,
          project_status_mapping_id: selectedStatus,
          description: description,
          assigned_to: assignedUser || currentUserId,
          checklist_items: checklistItems
        };
        const updatedTask = await updateTaskWithChecklist(task.task_id, taskData);
        await onTaskUpdated(updatedTask);
      } else {
        // Create mode
        const taskData = {
          task_name: taskName,
          project_status_mapping_id: selectedStatus,
          wbs_code: `${phase.wbs_code}.0`,
          description: description,
          assigned_to: assignedUser || currentUserId,
          estimated_hours: 0,
          actual_hours: 0,
          due_date: new Date(),
          phase_id: phase.phase_id
        };
  
        const newTask = await addTaskToPhase(phase.phase_id, taskData, checklistItems);
        
        // Link any tickets that were added during creation
        if (newTask && taskTicketLinks.length > 0) {
          for (const link of taskTicketLinks) {
            try {
              await addTicketLinkAction(phase.project_id, newTask.task_id, link.ticket_id);
            } catch (error) {
              console.error('Error linking ticket:', error);
            }
          }
        }
        
        onTaskAdded(newTask);
      }
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setShowCancelConfirm(true);
  };

  const handleCancelConfirm = () => {
    setShowCancelConfirm(false);
    onClose();
    onCancel();
  };

  const handleCancelDismiss = () => {
    setShowCancelConfirm(false);
  };

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      handleCancelClick();
    }
  };

  const toggleEditChecklist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingChecklist(!isEditingChecklist);
  };

  const addChecklistItem = () => {
    const newItem: Omit<ITaskChecklistItem, 'tenant'> = {
      checklist_item_id: `temp-${Date.now()}`,
      task_id: task?.task_id || tempTaskId,
      item_name: '',
      description: null,
      assigned_to: null,
      completed: false,
      due_date: null,
      created_at: new Date(),
      updated_at: new Date(),
      order_number: checklistItems.length + 1,
    };
    setChecklistItems([...checklistItems, newItem]);
  };

  const updateChecklistItem = (index: number, field: keyof ITaskChecklistItem, value: string | boolean | null | Date) => {
    const updatedItems = [...checklistItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setChecklistItems(updatedItems);
  };

  const removeChecklistItem = (index: number) => {
    const updatedItems = checklistItems.filter((_, i) => i !== index);
    setChecklistItems(updatedItems);
  };

  const handleLinkTicket = async () => {
    if (!selectedTicket) return;
    
    try {
      if (task?.task_id) {
        await addTicketLinkAction(phase.project_id, task.task_id, selectedTicket);
        const links = await getTaskTicketLinksAction(task.task_id);
        setTaskTicketLinks(links);
      } else {
        // For new tasks, store the link temporarily
        const selectedTicketDetails = availableTickets.find(t => t.ticket_id === selectedTicket);
        if (selectedTicketDetails) {
          const tempLink: IProjectTicketLinkWithDetails = {
            link_id: `temp-${Date.now()}`,
            task_id: tempTaskId,
            ticket_id: selectedTicket,
            ticket_number: selectedTicketDetails.ticket_number,
            title: selectedTicketDetails.title,
            created_at: new Date(),
            project_id: phase.project_id,
            phase_id: phase.phase_id
          };
          setTaskTicketLinks([...taskTicketLinks, tempLink]);
        }
      }
      toast.success('Ticket linked successfully');
      setShowTicketDialog(false);
    } catch (error: any) {
      console.error('Error linking ticket:', error);
      if (error.message === 'This ticket is already linked to this task') {
        toast.error('This ticket is already linked to this task');
      } else {
        toast.error('Failed to link ticket');
      }
    }
  };

  const handleNewTicketCreated = async (ticket: ITicket) => {
    if (!ticket.ticket_id) {
      toast.error('Invalid ticket ID');
      return;
    }
    try {
      if (task?.task_id) {
        await addTicketLinkAction(phase.project_id, task.task_id, ticket.ticket_id);
        const links = await getTaskTicketLinksAction(task.task_id);
        setTaskTicketLinks(links);
      } else {
        // For new tasks, store the link temporarily
        const tempLink: IProjectTicketLinkWithDetails = {
          link_id: `temp-${Date.now()}`,
          task_id: tempTaskId,
          ticket_id: ticket.ticket_id,
          ticket_number: ticket.ticket_number,
          title: ticket.title,
          created_at: new Date(),
          project_id: phase.project_id,
          phase_id: phase.phase_id
        };
        setTaskTicketLinks([...taskTicketLinks, tempLink]);
      }
      toast.success('New ticket created and linked');
      setShowNewTicketForm(false);
    } catch (error: any) {
      console.error('Error linking new ticket:', error);
      if (error.message === 'This ticket is already linked to this task') {
        toast.error('This ticket is already linked to this task');
      } else {
        toast.error('Failed to link ticket');
      }
    }
  };

  const handleViewTicket = async (ticketId: string) => {
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

  const handleDeleteTicketLink = async (linkId: string) => {
    try {
      if (task?.task_id) {
        await deleteTaskTicketLinkAction(linkId);
        const links = await getTaskTicketLinksAction(task.task_id);
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
  
  const statusOptions = projectStatuses.map((status): { value: string; label: string } => ({
    value: status.project_status_mapping_id,
    label: status.custom_name || status.name
  }));

  const ticketOptions = availableTickets
    .filter((ticket): ticket is ITicket & { ticket_id: string } => ticket.ticket_id !== undefined)
    .map((ticket): { value: string; label: string } => ({
      value: ticket.ticket_id,
      label: `${ticket.ticket_number} - ${ticket.title}`
    }));

  return (
    <>
      <Dialog.Root open={true} onOpenChange={handleDialogClose}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg w-[600px] max-h-[90vh] overflow-y-auto">
            <Dialog.Title className="text-xl font-semibold mb-4">
              {task ? 'Edit Task' : 'Add New Task'}
            </Dialog.Title>
            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="space-y-4">
                <EditableText
                  value={taskName}
                  onChange={setTaskName}
                  placeholder="Title..."
                  className="w-full text-lg font-semibold"
                />

                <TextArea
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  placeholder="Description"
                  className="w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />

                <CustomSelect
                  value={selectedStatus}
                  onValueChange={setSelectedStatus}
                  options={statusOptions}
                  placeholder="Select status"
                  className="w-full"
                />

                <UserPicker
                  label="Assigned To"
                  value={assignedUser}
                  onValueChange={setAssignedUser}
                  size="sm"
                  users={users}
                />

                <div className="flex items-center justify-between mb-2">
                  <h3 className='font-semibold'>Checklist</h3>
                  <button 
                    onClick={toggleEditChecklist} 
                    className="text-gray-500 hover:text-gray-700"
                    type="button"
                  >
                    <ListChecks className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex flex-col space-y-2">
                  {checklistItems.map((item, index): JSX.Element => (
                    <div key={index} className="flex items-center space-x-2">
                      {isEditingChecklist ? (
                        <>
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={(e) => updateChecklistItem(index, 'completed', e.target.checked)}
                            className="mr-2"
                          />
                          <Input
                            value={item.item_name}
                            onChange={(e) => updateChecklistItem(index, 'item_name', e.target.value)}
                            placeholder="Checklist item"
                            className="flex-grow"
                          />
                          <button
                            type="button"
                            onClick={() => removeChecklistItem(index)}
                            className="text-red-500"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <>
                          <input
                            type="checkbox"
                            checked={item.completed}
                            onChange={(e) => updateChecklistItem(index, 'completed', e.target.checked)}
                            className="mr-2"
                          />
                          <span className={item.completed ? 'line-through text-gray-500' : ''}>
                            {item.item_name}
                          </span>
                        </>
                      )}
                    </div>
                  ))}
                </div>

                {isEditingChecklist && (
                  <Button type="button" variant="soft" onClick={addChecklistItem}>
                    Add an item
                  </Button>
                )}

                {/* Associated Tickets Section - Now shown for both new and existing tasks */}
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
                            onClick={() => handleViewTicket(link.ticket_id)}
                            className="flex items-center text-sm"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => handleDeleteTicketLink(link.link_id)}
                            className="flex items-center text-sm text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between mt-6">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={handleCancelClick} 
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (task ? 'Updating...' : 'Adding...') : (task ? 'Update' : 'Save')}
                  </Button>
                </div>
              </div>
            </form>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      <ConfirmationDialog
        isOpen={showCancelConfirm}
        onClose={handleCancelDismiss}
        onConfirm={handleCancelConfirm}
        title="Cancel Task Creation"
        message="Are you sure you want to cancel? Any unsaved changes will be lost."
        confirmLabel="Cancel"
        cancelLabel="Continue editing"
      />

      {/* Link Existing Ticket Dialog */}
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

      {/* Create New Ticket Dialog */}
      <Dialog.Root open={showNewTicketForm} onOpenChange={setShowNewTicketForm}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-4 rounded-lg shadow-lg w-[600px]">
            <Dialog.Title className="text-lg font-semibold mb-4">Create New Ticket</Dialog.Title>
            <QuickAddTicket 
              open={showNewTicketForm}
              onOpenChange={setShowNewTicketForm}
              onTicketAdded={handleNewTicketCreated}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};

export default TaskQuickAdd;
