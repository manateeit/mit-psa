import { useEffect, useState } from 'react';

import { IProjectPhase, IProjectTask, ITaskChecklistItem } from '@/interfaces/project.interfaces';
import { getProjectPhase, getProjectTaskStatuses, getTaskChecklistItems, ProjectStatus } from '@/lib/actions/projectActions';
import TaskQuickAdd from './TaskQuickAdd';

interface TaskDetailProps {
  task: IProjectTask;
  onClose: () => void;
  onTaskUpdated: (updatedTask: IProjectTask) => void;
}

export default function TaskDetail({ task, onClose, onTaskUpdated }: TaskDetailProps): JSX.Element {
  const [statuses, setStatuses] = useState<ProjectStatus[]>([]);
  const [checklistItems, setChecklistItems] = useState<ITaskChecklistItem[]>([]);
  const [phase, setPhase] = useState<IProjectPhase | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const fetchedPhase = await getProjectPhase(task.phase_id);
        if (!fetchedPhase) return;
        setPhase(fetchedPhase);
        const projectStatuses = await getProjectTaskStatuses(fetchedPhase.project_id);
        setStatuses(projectStatuses);

        const items = await getTaskChecklistItems(task.task_id);
        setChecklistItems(items);
      } catch (error) {
        console.error('Error fetching task details:', error);
      }
    };
    fetchData();
  }, [task]);

  const handleTaskUpdated = async (updatedTask: IProjectTask | null) => {
    if (updatedTask) {
      onTaskUpdated(updatedTask);
    }
  };

  if (!phase) {
    return <div>Loading...</div>;
  }

  return (
    <TaskQuickAdd
      phase={phase}
      onClose={onClose}
      onTaskAdded={() => { } } // This won't be used for editing
      onTaskUpdated={handleTaskUpdated}
      projectStatuses={statuses}
      defaultStatus={statuses.find(s => s.project_status_mapping_id === task.project_status_mapping_id)}
      onCancel={onClose}
      task={task} users={[]}    />
  );
}
