'use client';

import React, { useState, useEffect } from 'react';
import { IProjectPhase, IProjectTask, ITaskChecklistItem } from '@/interfaces/project.interfaces';
import { IUserWithRoles } from '@/interfaces/auth.interfaces';
import { ProjectStatus, addTaskToPhase, updateTask } from '@/lib/actions/projectActions';
import { getCurrentUser } from '@/lib/auth/session';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import EditableText from '@/components/ui/EditableText';
import { ListChecks } from 'lucide-react';
import UserPicker from '@/components/ui/UserPicker';
import { toast } from 'react-hot-toast';

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

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUserId(user.user_id);
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };
    fetchCurrentUser();
  }, []);

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
        };
        const updatedTask = await updateTask(task.task_id, taskData, checklistItems);
        await onTaskUpdated(updatedTask);
      } else {
        const taskData = {
          task_name: taskName,
          project_status_mapping_id: selectedStatus,
          wbs_code: `${phase.wbs_code}.${Date.now()}`,
          description: description,
          assigned_to: assignedUser || currentUserId,
          estimated_hours: 0,
          actual_hours: 0,
          due_date: new Date(),
          phase_id: phase.phase_id
        };
  
        const newTask = await addTaskToPhase(phase.phase_id, taskData, checklistItems);
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

  const toggleEditChecklist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditingChecklist(!isEditingChecklist);
  };

  const addChecklistItem = () => {
    const newItem: Omit<ITaskChecklistItem, 'tenant'> = {
      checklist_item_id: `temp-${Date.now()}`,
      task_id: task?.task_id || '',
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

  return (
    <Dialog.Root open={true} onOpenChange={onClose}>
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

              <Select.Root value={selectedStatus} onValueChange={setSelectedStatus}>
                <Select.Trigger className="inline-flex items-center justify-between w-full px-4 py-2 text-sm font-medium bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                  <Select.Value>
                    {projectStatuses.find(s => s.project_status_mapping_id === selectedStatus)?.name || 'Select status'}
                  </Select.Value>
                  <Select.Icon><ChevronDownIcon /></Select.Icon>
                </Select.Trigger>
                <Select.Portal>
                  <Select.Content className="overflow-hidden bg-white rounded-md shadow-lg">
                    <Select.Viewport className="p-1">
                      {projectStatuses.map((status): JSX.Element => (
                        <Select.Item
                          key={status.project_status_mapping_id}
                          value={status.project_status_mapping_id}
                          className="relative flex items-center px-8 py-2 text-sm text-gray-900 cursor-default select-none hover:bg-purple-100"
                        >
                          <Select.ItemText>{status.custom_name || status.name}</Select.ItemText>
                          <Select.ItemIndicator className="absolute left-2 inline-flex items-center">
                            <CheckIcon />
                          </Select.ItemIndicator>
                        </Select.Item>
                      ))}
                    </Select.Viewport>
                  </Select.Content>
                </Select.Portal>
              </Select.Root>

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
                        <input
                          type="text"
                          value={item.item_name}
                          onChange={(e) => updateChecklistItem(index, 'item_name', e.target.value)}
                          placeholder="Checklist item"
                          className="flex-grow p-2 border border-gray-300 rounded-md"
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

              <div className="flex justify-between mt-6">
                <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
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
  );
};

const ChevronDownIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2.5 4L6 7.5L9.5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.4669 3.72684C11.7558 3.91574 11.8369 4.30308 11.648 4.59198L7.39799 11.092C7.29783 11.2452 7.13556 11.3467 6.95402 11.3699C6.77247 11.3931 6.58989 11.3355 6.45446 11.2124L3.70446 8.71241C3.44905 8.48022 3.43023 8.08494 3.66242 7.82953C3.89461 7.57412 4.28989 7.55529 4.5453 7.78749L6.75292 9.79441L10.6018 3.90792C10.7907 3.61902 11.178 3.53795 11.4669 3.72684Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd" />
  </svg>
);

export default TaskQuickAdd;
