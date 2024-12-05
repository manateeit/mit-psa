'use client';

import { useEffect, useState } from 'react';
import { IProjectTask, IProjectTicketLinkWithDetails } from '@/interfaces/project.interfaces';
import { IUserWithRoles } from '@/interfaces/auth.interfaces';
import { CheckSquare, Square, Ticket, Users } from 'lucide-react';
import UserPicker from '@/components/ui/UserPicker';
import { getTaskTicketLinksAction, getTaskResourcesAction } from '@/lib/actions/projectActions';

interface TaskCardProps {
  task: IProjectTask;
  users: IUserWithRoles[];
  onTaskSelected: (task: IProjectTask) => void;
  onAssigneeChange: (taskId: string, newAssigneeId: string, newTaskName?: string) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  users,
  onTaskSelected,
  onAssigneeChange,
  onDragStart,
  onDragEnd,
}) => {
  const [taskTickets, setTaskTickets] = useState<IProjectTicketLinkWithDetails[]>(task.ticket_links || []);
  const [taskResources, setTaskResources] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [links, resources] = await Promise.all([
          task.task_id ? getTaskTicketLinksAction(task.task_id) : Promise.resolve(task.ticket_links || []),
          task.task_id ? getTaskResourcesAction(task.task_id) : Promise.resolve([])
        ]);
        setTaskTickets(links);
        setTaskResources(resources);
      } catch (error) {
        console.error('Error fetching task data:', error);
      }
    };

    fetchData();
  }, [task.task_id, task.ticket_links]);

  const checklistItems = task.checklist_items || [];
  const completedItems = checklistItems.filter(item => item.completed).length;
  const hasChecklist = checklistItems.length > 0;
  const allCompleted = hasChecklist && completedItems === checklistItems.length;

  const completedTickets = taskTickets.filter(link => link.is_closed).length;
  const hasTickets = taskTickets.length > 0;
  const allTicketsCompleted = hasTickets && completedTickets === taskTickets.length;

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    onDragStart(e, task.task_id);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    onDragEnd(e);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onTaskSelected(task)}
      className={`bg-white p-3 mb-2 rounded shadow-sm cursor-pointer hover:shadow-md transition-all duration-200 border border-gray-200 flex flex-col gap-1 ${
        isDragging ? 'opacity-50 ring-2 ring-purple-500 shadow-lg scale-105' : ''
      }`}
    >
      <div
        className="font-semibold text-base mb-1 w-full px-1"
        onClick={(e) => e.stopPropagation()}
      >
        {task.task_name}
      </div>
      {task.description && (
        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
          {task.description}
        </p>
      )}
      <div className="flex items-center gap-2">
        <div onClick={(e) => e.stopPropagation()}>
          <UserPicker
            value={task.assigned_to || ''}
            onValueChange={(newAssigneeId: string) => onAssigneeChange(task.task_id, newAssigneeId)}
            size="sm"
            users={users.filter(u => 
              !taskResources.some(r => r.additional_user_id === u.user_id)
            )}
          />
        </div>
        {taskResources.length > 0 && (
          <div className="flex items-center gap-1 text-gray-500 bg-primary-100 p-1 rounded-md">
            <Users className="w-3 h-3" />
            <span className="text-xs">+{taskResources.length}</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          {task.due_date ? (
            <>Due date: <span className='bg-primary-100 p-1 rounded-md'>{new Date(task.due_date).toLocaleDateString()}</span></>
          ) : (
            <>No due date</>
          )}
        </div>
        <div className="flex items-center gap-2">
          {hasChecklist && (
            <div className={`flex items-center gap-1 ${allCompleted ? 'bg-green-50 text-green-600' : 'text-gray-500'} px-2 py-1 rounded`}>
              {allCompleted ? (
                <CheckSquare className="w-3 h-3" />
              ) : (
                <Square className="w-3 h-3" />
              )}
              <span>{completedItems}/{checklistItems.length}</span>
            </div>
          )}
          {hasTickets && (
            <div className={`flex items-center gap-1 ${allTicketsCompleted ? 'bg-green-50 text-green-600' : 'text-gray-500'} px-2 py-1 rounded`}>
              <Ticket className="w-3 h-3" />
              <span>{completedTickets}/{taskTickets.length}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
