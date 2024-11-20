// server/src/components/projects/TaskEdit.tsx
import React, { useState, useEffect } from 'react';
import { IProjectPhase, IProjectTask, ITaskChecklistItem } from '@/interfaces/project.interfaces';
import { IUserWithRoles } from '@/interfaces/auth.interfaces';
import { ProjectStatus, updateTaskWithChecklist, deleteTask, getTaskChecklistItems, moveTaskToPhase } from '@/lib/actions/projectActions';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/Button';
import { TextArea } from '@/components/ui/TextArea';
import EditableText from '@/components/ui/EditableText';
import { ListChecks } from 'lucide-react';
import UserPicker from '@/components/ui/UserPicker';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import CustomSelect from '@/components/ui/CustomSelect';
import { toast } from 'react-hot-toast';

interface TaskEditProps {
  task: IProjectTask;
  phase: IProjectPhase;
  phases: IProjectPhase[];
  onClose: () => void;
  onTaskUpdated: (updatedTask: IProjectTask|null) => void;
  projectStatuses: ProjectStatus[];
  users: IUserWithRoles[];
}

const TaskEdit: React.FC<TaskEditProps> = ({ 
  task,
  phase,
  phases,
  onClose,
  onTaskUpdated,
  projectStatuses,
  users
}) => {
  const [taskName, setTaskName] = useState(task.task_name);
  const [description, setDescription] = useState(task.description || '');
  const [selectedStatus, setSelectedStatus] = useState<string>(task.project_status_mapping_id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checklistItems, setChecklistItems] = useState<Omit<ITaskChecklistItem, 'tenant'>[]>([]);
  const [isEditingChecklist, setIsEditingChecklist] = useState(false);
  const [assignedUser, setAssignedUser] = useState<string | null>(task.assigned_to);
  const [selectedPhase, setSelectedPhase] = useState<IProjectPhase>(phase);
  const [showMoveConfirmation, setShowMoveConfirmation] = useState(false);

  useEffect(() => {
    const loadTaskData = async () => {
      try {
        const existingChecklistItems = await getTaskChecklistItems(task.task_id);
        setChecklistItems(existingChecklistItems);
      } catch (error) {
        console.error('Error loading checklist items:', error);
        setChecklistItems([]);
      }
    };

    loadTaskData();
  }, [task]);

  const handlePhaseChange = (phaseId: string) => {
    const newPhase = phases?.find(p => p.phase_id === phaseId);
    if (newPhase && newPhase.phase_id !== phase.phase_id) {
      setSelectedPhase(newPhase);
      setShowMoveConfirmation(true);
    }
  };

  const handleMoveConfirm = async () => {
    setIsSubmitting(true);
    try {
      // First move the task to new phase
      const movedTask = await moveTaskToPhase(task.task_id, selectedPhase.phase_id);
      
      // Then update the task with proper number values
      if (movedTask) {
        const taskData = {
          ...movedTask,
          estimated_hours: Number(movedTask.estimated_hours) || 0,
          actual_hours: Number(movedTask.actual_hours) || 0,
          checklist_items: checklistItems
        };
        const updatedTask = await updateTaskWithChecklist(movedTask.task_id, taskData);
        onTaskUpdated(updatedTask);
      }
      
      toast.success(`Task moved to ${selectedPhase.phase_name}`);
      onClose();
    } catch (error) {
      console.error('Error moving task:', error);
      toast.error('Failed to move task');
    } finally {
      setIsSubmitting(false);
      setShowMoveConfirmation(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (taskName.trim() === '') return;

    setIsSubmitting(true);

    try {
      const taskData = {
        task_name: taskName,
        project_status_mapping_id: selectedStatus,
        wbs_code: task.wbs_code,
        description: description,
        assigned_to: assignedUser,
        estimated_hours: Number(task.estimated_hours) || 0,
        actual_hours: Number(task.actual_hours) || 0,
        due_date: task.due_date,
        phase_id: phase.phase_id,
        checklist_items: checklistItems
      };

      const updatedTask = await updateTaskWithChecklist(task.task_id, taskData);
      onTaskUpdated(updatedTask);
      onClose();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to save task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsSubmitting(true);
  
    try {
      await deleteTask(task.task_id);
      onTaskUpdated(null);
      onClose();
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
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
      task_id: task.task_id,
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

  const phaseOptions = phases.map((p): { value: string; label: string } => ({
    value: p.phase_id,
    label: p.phase_name
  }));

  const statusOptions = projectStatuses.map((status): { value: string; label: string } => ({
    value: status.project_status_mapping_id,
    label: status.custom_name || status.name
  }));

  return (
    <Dialog.Root open={true} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black bg-opacity-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg w-[600px] max-h-[90vh] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold mb-4">
            Edit Task
          </Dialog.Title>
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="space-y-4">
              <EditableText
                value={taskName}
                onChange={setTaskName}
                placeholder="Title..."
                className="w-full text-lg font-semibold"
              />
              
              {/* Phase Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phase</label>
                <CustomSelect
                  value={selectedPhase.phase_id}
                  onValueChange={handlePhaseChange}
                  options={phaseOptions}
                  className="w-full"
                />
              </div>

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
                value={assignedUser || ''}
                onValueChange={(value) => {
                  setAssignedUser(value || null);
                }}
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
                <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
                  Delete
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update'}
                </Button>
              </div>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>

      {/* Move Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showMoveConfirmation}
        onClose={() => {
          setShowMoveConfirmation(false);
          setSelectedPhase(phase); // Reset to original phase if cancelled
        }}
        onConfirm={handleMoveConfirm}
        title="Move Task"
        message={`Are you sure you want to move task "${taskName}" to phase "${selectedPhase.phase_name}"?`}
        confirmLabel="Move"
        cancelLabel="Cancel"
      />
    </Dialog.Root>
  );
};

export default TaskEdit;
