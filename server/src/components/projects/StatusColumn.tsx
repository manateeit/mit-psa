'use client';

import { IProjectTask } from '@/interfaces/project.interfaces';
import { Button } from '@/components/ui/Button';
import { Circle, Plus } from 'lucide-react';
import TaskCard from './TaskCard';
import styles from './ProjectDetail.module.css';
import { IUserWithRoles } from '@/interfaces/auth.interfaces';
import { ProjectStatus } from '@/lib/actions/projectActions';

interface StatusColumnProps {
  status: ProjectStatus;
  tasks: IProjectTask[];
  users: IUserWithRoles[];
  statusIcon: React.ReactNode;
  backgroundColor: string;
  darkBackgroundColor: string;
  borderColor: string;
  isAddingTask: boolean;
  selectedPhase: boolean;
  onDrop: (e: React.DragEvent, statusId: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onAddCard: (status: ProjectStatus) => void;
  onTaskSelected: (task: IProjectTask) => void;
  onAssigneeChange: (taskId: string, newAssigneeId: string) => void;
  onDragStart: (e: React.DragEvent, taskId: string) => void;
  onDragEnd: (e: React.DragEvent) => void;
}

export const StatusColumn: React.FC<StatusColumnProps> = ({
  status,
  tasks,
  users,
  statusIcon,
  backgroundColor,
  darkBackgroundColor,
  borderColor,
  isAddingTask,
  selectedPhase,
  onDrop,
  onDragOver,
  onAddCard,
  onTaskSelected,
  onAssigneeChange,
  onDragStart,
  onDragEnd,
}) => {
  return (
    <div
      className={`${styles.kanbanColumn} ${backgroundColor} rounded-lg border-gray-200 shadow-sm border-2 border-solid`}
      onDrop={(e) => onDrop(e, status.project_status_mapping_id)}
      onDragOver={onDragOver}
    >
      <div className="font-bold text-sm p-3 rounded-t-lg flex items-center justify-between relative z-10">
        <div className={`flex ${darkBackgroundColor} rounded-[20px] border-2 ${borderColor} shadow-sm items-center ps-3 py-3 pe-4`}>
          {statusIcon}
          <span className="ml-2">{status.custom_name || status.name}</span>
        </div>
        <div className={styles.statusHeader}>
          <Button
            variant="default"
            size="sm"
            onClick={() => onAddCard(status)}
            disabled={isAddingTask || !selectedPhase}
            tooltipText="Add Task"
            tooltip={true}
            className="!w-6 !h-6 !p-0 !min-w-0"
          >
            <Plus className="w-4 h-4 text-white" />
          </Button>
          <div className={styles.taskCount}>
            {tasks.length}
          </div>
        </div>
      </div>
      <div className={styles.kanbanTasks}>
        {tasks.map((task): JSX.Element => (
          <TaskCard
            key={task.task_id}
            task={task}
            users={users}
            onTaskSelected={onTaskSelected}
            onAssigneeChange={onAssigneeChange}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
          />
        ))}
      </div>
    </div>
  );
};

export default StatusColumn;
