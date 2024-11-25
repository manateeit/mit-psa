'use client';

import { IProjectPhase, IProjectTask } from '@/interfaces/project.interfaces';
import { IUserWithRoles } from '@/interfaces/auth.interfaces';
import { ProjectStatus } from '@/lib/actions/projectActions';
import TaskForm from './TaskForm';

interface TaskQuickAddProps {
  phase: IProjectPhase;
  onClose: () => void;
  onTaskAdded: (newTask: IProjectTask | null) => void;
  onTaskUpdated: (updatedTask: IProjectTask | null) => Promise<void>;
  projectStatuses: ProjectStatus[];
  defaultStatus?: ProjectStatus;
  onCancel: () => void;
  users: IUserWithRoles[];
  task?: IProjectTask;
}

export default function TaskQuickAdd({ 
  phase,
  onClose, 
  onTaskAdded,
  onTaskUpdated,
  projectStatuses, 
  defaultStatus,
  onCancel,
  users,
  task
}: TaskQuickAddProps): JSX.Element {
  const handleSubmit = async (resultTask: IProjectTask | null) => {
    if (task) {
      // Edit mode
      await onTaskUpdated(resultTask);
    } else {
      // Create mode
      onTaskAdded(resultTask);
    }
  };

  return (
    <TaskForm
      task={task}
      phase={phase}
      onClose={() => {
        onClose();
        if (!task) onCancel();
      }}
      onSubmit={handleSubmit}
      projectStatuses={projectStatuses}
      defaultStatus={defaultStatus}
      users={users}
      mode={task ? 'edit' : 'create'}
    />
  );
}
