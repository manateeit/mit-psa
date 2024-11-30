'use client';

import React, { useState, useEffect } from 'react';
import { IProjectPhase, IProjectTask, ITaskChecklistItem, IProjectTicketLinkWithDetails, IProject, ProjectStatus } from '@/interfaces/project.interfaces';
import { ITicket, ITicketListItem, ITicketListFilters } from '@/interfaces/ticket.interfaces';
import { IUserWithRoles } from '@/interfaces/auth.interfaces';
import { 
  updateTaskWithChecklist, 
  addTaskToPhase, 
  getTaskChecklistItems, 
  moveTaskToPhase, 
  deleteTask, 
  addTicketLinkAction, 
  getTaskTicketLinksAction, 
  deleteTaskTicketLinkAction, 
  getProjects,
  getProjectTreeData,
  getProjectTaskStatuses 
} from '@/lib/actions/projectActions';
import { getTicketsForList, getTicketById } from '@/lib/actions/ticket-actions/ticketActions';
import { getCurrentUser } from '@/lib/actions/user-actions/userActions';
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
import TreeSelect, { TreeSelectOption } from '@/components/ui/TreeSelect';

interface TaskFormProps {
  task?: IProjectTask;
  phase: IProjectPhase;
  phases?: IProjectPhase[];
  onClose: () => void;
  onSubmit: (task: IProjectTask | null) => void;
  projectStatuses: ProjectStatus[];
  defaultStatus?: ProjectStatus;
  users: IUserWithRoles[];
  mode: 'create' | 'edit';
  onPhaseChange: (phaseId: string) => void;
}

export default function TaskForm({
  task,
  phase,
  phases,
  onClose,
  onSubmit,
  projectStatuses,
  defaultStatus,
  users,
  mode,
  onPhaseChange
}: TaskFormProps): JSX.Element {
  const { openDrawer } = useDrawer();
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [taskName, setTaskName] = useState(task?.task_name || '');
  const [description, setDescription] = useState(task?.description || '');
  const [projectTreeOptions, setProjectTreeOptions] = useState<TreeSelectOption[]>([]);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string>(phase.phase_id);
  const [selectedStatusId, setSelectedStatusId] = useState<string>(
    task?.project_status_mapping_id || 
    defaultStatus?.project_status_mapping_id || 
    projectStatuses[0]?.project_status_mapping_id
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checklistItems, setChecklistItems] = useState<Omit<ITaskChecklistItem, 'tenant'>[]>(task?.checklist_items || []);
  const [isEditingChecklist, setIsEditingChecklist] = useState(false);
  const [assignedUser, setAssignedUser] = useState<string>(task?.assigned_to || '');
  const [selectedPhase, setSelectedPhase] = useState<IProjectPhase>(phase);
  const [showMoveConfirmation, setShowMoveConfirmation] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [availableTickets, setAvailableTickets] = useState<ITicketListItem[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<string>('');
  const [taskTicketLinks, setTaskTicketLinks] = useState<IProjectTicketLinkWithDetails[]>([]);
  const [tempTaskId] = useState<string>(`temp-${Date.now()}`);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [estimatedHours, setEstimatedHours] = useState<number>(Number(task?.estimated_hours) || 0);
  const [actualHours, setActualHours] = useState<number>(Number(task?.actual_hours) || 0);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUserId(user.user_id);
          const filters: ITicketListFilters = {
            channelFilterState: 'all'
          };
          const tickets = await getTicketsForList(user, filters);
          setAvailableTickets(tickets);
        }

        if (task?.task_id) {
          const [existingChecklistItems, links] = await Promise.all([
            getTaskChecklistItems(task.task_id),
            getTaskTicketLinksAction(task.task_id)
          ]);
          setChecklistItems(existingChecklistItems);
          setTaskTicketLinks(links);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };
    fetchInitialData();
  }, [task]);

  useEffect(() => {
    const fetchProjectsData = async () => {
      if (mode === 'edit') {
        try {
          const treeData = await getProjectTreeData();
          if (treeData && treeData.length > 0) {
            setProjectTreeOptions(treeData);
          } else {
            toast.error('No projects available with valid phases and statuses');
          }
        } catch (error) {
          console.error('Error fetching projects:', error);
          toast.error('Error loading project data. Please try again.');
        }
      }
    };

    fetchProjectsData();
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (taskName.trim() === '') return;

    setIsSubmitting(true);

    try {
      let resultTask: IProjectTask | null = null;

      if (mode === 'edit' && task) {
        // Edit mode - only include fields that are part of IProjectTask
        const taskData: Partial<IProjectTask> = {
          task_name: taskName,
          project_status_mapping_id: selectedStatusId,
          description: description,
          assigned_to: assignedUser || currentUserId,
          estimated_hours: estimatedHours,
          actual_hours: actualHours,
          phase_id: task.phase_id,
          due_date: task.due_date,
          checklist_items: checklistItems
        };
        resultTask = await updateTaskWithChecklist(task.task_id, taskData);
      } else {
        // Create mode
        const taskData = {
          task_name: taskName,
          project_status_mapping_id: selectedStatusId,
          wbs_code: `${phase.wbs_code}.0`,
          description: description,
          assigned_to: assignedUser || currentUserId,
          estimated_hours: estimatedHours,
          actual_hours: actualHours,
          due_date: new Date(),
          phase_id: phase.phase_id
        };

        resultTask = await addTaskToPhase(phase.phase_id, taskData, checklistItems);
        
        // Link any tickets that were added during creation
        if (resultTask && taskTicketLinks.length > 0) {
          const linkErrors: string[] = [];
          
          for (const link of taskTicketLinks) {
            try {
              await addTicketLinkAction(phase.project_id, resultTask.task_id, link.ticket_id);
            } catch (error: any) {
              console.error('Error linking ticket:', error);
              linkErrors.push(`${link.ticket_number}: ${error.message || 'Unknown error'}`);
            }
          }
          
          if (linkErrors.length > 0) {
            toast.error(`Failed to link some tickets:\n${linkErrors.join('\n')}`);
          }
        }
      }
      
      onSubmit(resultTask);
      onClose();
    } catch (error) {
      console.error('Error saving task:', error);
      toast.error('Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhaseChange = (phaseId: string) => {
    if (!phases) return;
    
    const newPhase = phases.find(p => p.phase_id === phaseId);
    if (newPhase && newPhase.phase_id !== phase.phase_id) {
      setSelectedPhase(newPhase);
      setShowMoveConfirmation(true);
    }
  };

  const handleTreeSelectChange = async (value: string, type: 'project' | 'phase' | 'status') => {
    if (type === 'phase') {
      setSelectedPhaseId(value);
      handlePhaseChange(value);  // For same-project moves
      onPhaseChange(value);      // For cross-project moves
    } else if (type === 'status') {
      setSelectedStatusId(value);
    }
  };

  const handleMoveConfirm = async () => {
    if (!task) return;
    
    setIsSubmitting(true);
    try {
      const movedTask = await moveTaskToPhase(task.task_id, selectedPhaseId, selectedStatusId);
      
      if (movedTask) {
        const taskData: Partial<IProjectTask> = {
          estimated_hours: estimatedHours,
          actual_hours: actualHours,
          checklist_items: checklistItems
        };
        const updatedTask = await updateTaskWithChecklist(movedTask.task_id, taskData);
        onSubmit(updatedTask);
      }
      
      toast.success('Task moved successfully');
      onClose();
    } catch (error) {
      console.error('Error moving task:', error);
      toast.error('Failed to move task');
    } finally {
      setIsSubmitting(false);
      setShowMoveConfirmation(false);
    }
  };

  const handleCancelClick = (e?: React.MouseEvent) => {
    e?.preventDefault();
    setShowCancelConfirm(true);
  };

  const handleCancelConfirm = () => {
    setShowCancelConfirm(false);
    onClose();
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

  const updateChecklistItem = (index: number, field: keyof ITaskChecklistItem, value: any) => {
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
            phase_id: phase.phase_id,
            status_name: selectedTicketDetails.status_name,
            is_closed: selectedTicketDetails.closed_at !== null
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
        // For existing tasks, create permanent link
        await addTicketLinkAction(phase.project_id, task.task_id, ticket.ticket_id);
        const links = await getTaskTicketLinksAction(task.task_id);
        setTaskTicketLinks(links);
      } else {
        // For new tasks:
        // 1. Fetch updated tickets list to get full ticket details
        const user = await getCurrentUser();
        if (!user) {
          toast.error('No user session found');
          return;
        }
        const filters: ITicketListFilters = {
          channelFilterState: 'all'
        };
        const updatedTickets = await getTicketsForList(user, filters);
        setAvailableTickets(updatedTickets);

        // 2. Find the newly created ticket in the updated list
        const newTicketDetails = updatedTickets.find(t => t.ticket_id === ticket.ticket_id);
        if (!newTicketDetails) {
          toast.error('Failed to load ticket details');
          return;
        }

        // 3. Create temporary link with the full ticket details
        const tempLink: IProjectTicketLinkWithDetails = {
          link_id: `temp-${Date.now()}`,
          task_id: tempTaskId,
          ticket_id: ticket.ticket_id,
          ticket_number: ticket.ticket_number,
          title: ticket.title,
          created_at: new Date(),
          project_id: phase.project_id,
          phase_id: phase.phase_id,
          status_name: newTicketDetails.status_name,
          is_closed: false
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

  const handleDeleteConfirm = async () => {
    if (!task?.task_id) return;
    
    setIsSubmitting(true);
    try {
      await deleteTask(task.task_id);
      toast.success('Task deleted successfully');
      onSubmit(null);
      onClose();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };
  
  const handleDeleteDismiss = () => {
    setShowDeleteConfirm(false);
  };

  const ticketOptions = availableTickets
    .filter((ticket): ticket is ITicketListItem & { ticket_id: string } => ticket.ticket_id !== undefined)
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
              {mode === 'edit' ? 'Edit Task' : 'Add New Task'}
            </Dialog.Title>
            <form onSubmit={handleSubmit} className="flex flex-col">
              <div className="space-y-4">
                <EditableText
                  value={taskName}
                  onChange={setTaskName}
                  placeholder="Title..."
                  className="w-full text-lg font-semibold"
                />

                {mode === 'edit' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Move to</label>
                    <TreeSelect
                      value={selectedPhaseId}
                      onValueChange={handleTreeSelectChange}
                      options={projectTreeOptions}
                      placeholder="Select destination..."
                      className="w-full"
                    />
                  </div>
                )}
                <TextArea
                  value={description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                  placeholder="Description"
                  className="w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={3}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Hours
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={estimatedHours}
                      onChange={(e) => setEstimatedHours(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Actual Hours
                    </label>
                    <Input
                      type="number"
                      min="0"
                      step="0.5"
                      value={actualHours}
                      onChange={(e) => setActualHours(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
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
                  {mode === 'edit' && (
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isSubmitting}
                    >
                      Delete
                    </Button>
                  )}
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (mode === 'edit' ? 'Updating...' : 'Adding...') : (mode === 'edit' ? 'Update' : 'Save')}
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
        title="Cancel Task"
        message="Are you sure you want to cancel? Any unsaved changes will be lost."
        confirmLabel="Cancel"
        cancelLabel="Continue editing"
      />

      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        onClose={handleDeleteDismiss}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete task "${taskName}"? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />

      {mode === 'edit' && (
        <ConfirmationDialog
          isOpen={showMoveConfirmation}
          onClose={() => {
            setShowMoveConfirmation(false);
            setSelectedPhase(phase);
          }}
          onConfirm={handleMoveConfirm}
          title="Move Task"
          message={`Are you sure you want to move task "${taskName}" to phase "${selectedPhase.phase_name}"?`}
          confirmLabel="Move"
          cancelLabel="Cancel"
        />
      )}

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
              onTicketAdded={handleNewTicketCreated}
            />
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
