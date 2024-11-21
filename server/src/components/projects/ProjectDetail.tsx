'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { IProject, IProjectPhase, IProjectTask, IProjectTicketLink } from '@/interfaces/project.interfaces';
import { Clipboard, PlayCircle, PauseCircle, CheckCircle, XCircle, Circle, Pencil, Check, X, Trash2, CheckSquare, Square, Plus } from 'lucide-react';
import { useDrawer } from '@/context/DrawerContext';
import TaskQuickAdd from './TaskQuickAdd';
import TaskEdit from './TaskEdit';
import PhaseQuickAdd from './PhaseQuickAdd';
import { Button } from '@/components/ui/Button';
import { updateTaskStatus, getProjectTaskStatuses, ProjectStatus, updatePhase, moveTaskToPhase, updateTaskWithChecklist, deletePhase, getTaskChecklistItems } from '@/lib/actions/projectActions';
import styles from './ProjectDetail.module.css';
import { Toaster, toast } from 'react-hot-toast';
import { IUserWithRoles } from '@/interfaces/auth.interfaces';
import UserPicker from '@/components/ui/UserPicker';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';

interface ProjectDetailProps {
  project: IProject;
  phases: IProjectPhase[];
  tasks: IProjectTask[];
  ticketLinks: IProjectTicketLink[];
  statuses: ProjectStatus[];
  users: IUserWithRoles[];
}

const statusIcons: { [key: string]: React.ReactNode } = {
  'To Do': <Clipboard className="w-4 h-4" />,
  'In Progress': <PlayCircle className="w-4 h-4" />,
  'On Hold': <PauseCircle className="w-4 h-4" />,
  'Done': <CheckCircle className="w-4 h-4" />,
  'Cancelled': <XCircle className="w-4 h-4" />
};

const borderColors = ['border-gray-300', 'border-indigo-300', 'border-green-300', 'border-yellow-300'];
const cycleColors = ['bg-gray-100', 'bg-indigo-100', 'bg-green-100', 'bg-yellow-100'];
const darkCycleColors = ['bg-gray-200', 'bg-indigo-200', 'bg-green-200', 'bg-yellow-200'];

export default function ProjectDetail({ 
  project, 
  phases, 
  tasks, 
  ticketLinks: _ticketLinks, 
  statuses: initialStatuses, 
  users
}: ProjectDetailProps) {
  const [selectedTask, setSelectedTask] = useState<IProjectTask | null>(null);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showPhaseQuickAdd, setShowPhaseQuickAdd] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<IProjectPhase | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<IProjectPhase | null>(null);
  const { openDrawer: _openDrawer, closeDrawer: _closeDrawer } = useDrawer();
  const [projectTasks, setProjectTasks] = useState<IProjectTask[]>(tasks);
  const [projectPhases, setProjectPhases] = useState<IProjectPhase[]>(phases);
  const [projectStatuses, setProjectStatuses] = useState<ProjectStatus[]>(initialStatuses);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [defaultStatus, setDefaultStatus] = useState<ProjectStatus | null>(null);
  const [editingPhaseId, setEditingPhaseId] = useState<string | null>(null);
  const [editingPhaseName, setEditingPhaseName] = useState('');
  const [dragOverPhaseId, setDragOverPhaseId] = useState<string | null>(null);
  const [moveConfirmation, setMoveConfirmation] = useState<{
    taskId: string;
    taskName: string;
    sourcePhase: IProjectPhase;
    targetPhase: IProjectPhase;
  } | null>(null);

  const [deletePhaseConfirmation, setDeletePhaseConfirmation] = useState<{
    phaseId: string;
    phaseName: string;
  } | null>(null);

  useEffect(() => {
    const loadChecklistItems = async () => {
      try {
        const tasksWithChecklists = await Promise.all(
          tasks.map(async (task): Promise<IProjectTask> => {
            const checklistItems = await getTaskChecklistItems(task.task_id);
            return { ...task, checklist_items: checklistItems };
          })
        );
        setProjectTasks(tasksWithChecklists);
      } catch (error) {
        console.error('Error loading checklist items:', error);
      }
    };
    loadChecklistItems();
  }, [tasks]);

  useEffect(() => {
    const loadProjectStatuses = async () => {
      try {
        const statuses = await getProjectTaskStatuses(project.project_id);
        setProjectStatuses(statuses);
      } catch (error) {
        console.error('Error loading project statuses:', error);
      }
    };
    loadProjectStatuses();
  }, [project.project_id]);

  const filteredTasks = useMemo(() => {
    if (!selectedPhase) return [];
    return projectTasks.filter(task => task.wbs_code.startsWith(selectedPhase.wbs_code + '.'));
  }, [projectTasks, selectedPhase]);

  const completedTasksCount = useMemo(() => {
    return filteredTasks.filter(task =>
      projectStatuses.find(status => status.project_status_mapping_id === task.project_status_mapping_id)?.is_closed === true
    ).length;
  }, [filteredTasks, projectStatuses]);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    if (e.target instanceof HTMLElement) {
      e.target.classList.add('opacity-50');
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (e.target instanceof HTMLElement) {
      e.target.classList.remove('opacity-50');
    }
    setDragOverPhaseId(null);
  };

  const handleDrop = async (e: React.DragEvent, projectStatusMappingId: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text');
    try {
      const updatedTask = await updateTaskStatus(taskId, projectStatusMappingId);
      const checklistItems = await getTaskChecklistItems(taskId);
      const taskWithChecklist = { ...updatedTask, checklist_items: checklistItems };
      
      setProjectTasks(prevTasks =>
        prevTasks.map((task): IProjectTask => 
          task.task_id === taskId ? taskWithChecklist : task
        )
      );
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handlePhaseDragOver = (e: React.DragEvent, phaseId: string) => {
    e.preventDefault();
    setDragOverPhaseId(phaseId);
  };

  const handlePhaseDragLeave = () => {
    setDragOverPhaseId(null);
  };

  const handlePhaseDropZone = async (e: React.DragEvent, targetPhase: IProjectPhase) => {
    e.preventDefault();
    setDragOverPhaseId(null);
    
    const taskId = e.dataTransfer.getData('text/plain');
    const task = projectTasks.find(t => t.task_id === taskId);
    const sourcePhase = projectPhases.find(p => p.phase_id === task?.phase_id);
    
    if (task && sourcePhase && targetPhase.phase_id !== sourcePhase.phase_id) {
      setMoveConfirmation({
        taskId,
        taskName: task.task_name,
        sourcePhase,
        targetPhase
      });
    }
  };

  const handleMoveConfirm = async () => {
    if (!moveConfirmation) return;
    
    try {
      const updatedTask = await moveTaskToPhase(
        moveConfirmation.taskId,
        moveConfirmation.targetPhase.phase_id
      );
      
      const checklistItems = await getTaskChecklistItems(moveConfirmation.taskId);
      const taskWithChecklist = { ...updatedTask, checklist_items: checklistItems };
      
      setProjectTasks(prevTasks =>
        prevTasks.map((task): IProjectTask =>
          task.task_id === updatedTask.task_id ? taskWithChecklist : task
        )
      );
          
      toast.success(`Task moved to ${moveConfirmation.targetPhase.phase_name}`);
    } catch (error) {
      console.error('Error moving task:', error);
      toast.error('Failed to move task');
    } finally {
      setMoveConfirmation(null);
    }
  };

  const handleAddTask = useCallback(async (newTask: IProjectTask | null) => {
    if (!newTask) return;

    setIsAddingTask(true);
    try {
      if (selectedPhase && newTask.wbs_code.startsWith(selectedPhase.wbs_code)) {
        const checklistItems = await getTaskChecklistItems(newTask.task_id);
        const taskWithChecklist = { ...newTask, checklist_items: checklistItems };
        
        setProjectTasks((prevTasks) => {
          const updatedTasks = [...prevTasks, taskWithChecklist];
          console.log('New task added:', taskWithChecklist);
          console.log('Updated tasks:', updatedTasks);
          return updatedTasks;
        });
        setShowQuickAdd(false);
        toast.success('New task added successfully!');
      } else {
        console.error('New task does not match selected phase');
        toast.error('Error adding new task: Phase mismatch');
      }
    } catch (error) {
      console.error('Error adding new task:', error);
      toast.error('Error adding new task. Please try again.');
    } finally {
      setIsAddingTask(false);
    }
  }, [selectedPhase]);

  const handleCloseQuickAdd = useCallback(() => {
    setShowQuickAdd(false);
    setDefaultStatus(null);
    setIsAddingTask(false);
    setSelectedTask(null);
    console.log('TaskQuickAdd closed');
  }, []);

  const handlePhaseAdded = useCallback((newPhase: IProjectPhase) => {
    setProjectPhases((prevPhases) => [...prevPhases, newPhase]);
    setSelectedPhase(newPhase);
    setCurrentPhase(newPhase);
    toast.success('New phase added successfully!');
  }, []);

  const handleAddCard = useCallback((status: ProjectStatus) => {
    if (!selectedPhase) {
      toast.error('Please select a phase before adding a card.');
      return;
    }
    setIsAddingTask(true);
    setDefaultStatus(status);
    setCurrentPhase(selectedPhase);
    setShowQuickAdd(true);
  }, [selectedPhase]);

  const handleTaskUpdated = useCallback(async (updatedTask: IProjectTask | null) => {
    if (updatedTask) {
      try {
        const checklistItems = await getTaskChecklistItems(updatedTask.task_id);
        const taskWithChecklist = { ...updatedTask, checklist_items: checklistItems };
        
        setProjectTasks((prevTasks) =>
          prevTasks.map((task): IProjectTask => 
            task.task_id === updatedTask.task_id ? taskWithChecklist : task
          )
        );
        toast.success('Task updated successfully!');
      } catch (error) {
        console.error('Error updating task:', error);
        toast.error('Failed to update task');
      }
    } else {
      setProjectTasks((prevTasks) =>
        prevTasks.filter((task) => task.task_id !== selectedTask?.task_id)
      );
      toast.success('Task deleted successfully!');
    }
    setShowQuickAdd(false);
    setSelectedTask(null);
  }, [selectedTask]);

  const handleTaskSelected = useCallback((task: IProjectTask) => {
    setSelectedTask(task);
    setCurrentPhase(phases.find(phase => phase.phase_id === task.phase_id) || null);
    setShowQuickAdd(true);
  }, [phases]);

  const handleAssigneeChange = async (taskId: string, newAssigneeId: string) => {
    try {
      const task = projectTasks.find(t => t.task_id === taskId);
      if (!task) {
        throw new Error('Task not found');
      }
  
      const updatedTask = await updateTaskWithChecklist(taskId, {
        ...task,
        assigned_to: newAssigneeId,
        estimated_hours: Number(task.estimated_hours) || 0,
        actual_hours: Number(task.actual_hours) || 0,
        checklist_items: task.checklist_items
      });
  
      if (updatedTask) {
        const checklistItems = await getTaskChecklistItems(taskId);
        const taskWithChecklist = { ...updatedTask, checklist_items: checklistItems };
        
        setProjectTasks(prevTasks =>
          prevTasks.map((task): IProjectTask =>
            task.task_id === taskId ? taskWithChecklist : task
          )
        );
        toast.success('Task assignee updated successfully!');
      }
    } catch (error) {
      console.error('Error updating task assignee:', error);
      toast.error('Failed to update task assignee. Please try again.');
    }
  };

  const handleEditPhase = (phase: IProjectPhase) => {
    setEditingPhaseId(phase.phase_id);
    setEditingPhaseName(phase.phase_name);
  };

  const handleSavePhase = async (phase: IProjectPhase) => {
    try {
      if (!editingPhaseName.trim()) {
        toast.error('Phase name cannot be empty');
        return;
      }
  
      await updatePhase(phase.phase_id, {
        phase_name: editingPhaseName
      });
  
      setProjectPhases(prevPhases =>
        prevPhases.map((p): IProjectPhase =>
          p.phase_id === phase.phase_id
            ? { ...p, phase_name: editingPhaseName }
            : p
        )
      );
      
      setEditingPhaseId(null);
      setEditingPhaseName('');
      toast.success('Phase name updated successfully!');
    } catch (error) {
      console.error('Error updating phase name:', error);
      toast.error('Failed to update phase name. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingPhaseId(null);
    setEditingPhaseName('');
  };

  const handleDeletePhase = async () => {
    if (!deletePhaseConfirmation) return;

    try {
      await deletePhase(deletePhaseConfirmation.phaseId);
      setProjectPhases(prevPhases => 
        prevPhases.filter(phase => phase.phase_id !== deletePhaseConfirmation.phaseId)
      );
      if (selectedPhase?.phase_id === deletePhaseConfirmation.phaseId) {
        setSelectedPhase(null);
      }
      toast.success('Phase deleted successfully!');
    } catch (error) {
      console.error('Error deleting phase:', error);
      toast.error('Failed to delete phase. Please try again.');
    } finally {
      setDeletePhaseConfirmation(null);
    }
  };

  const handleEmptyTaskUpdate = async (_: IProjectTask | null) => {
    return Promise.resolve();
  };

  const renderProjectPhases = () => (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold">Project Phases</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              if (!selectedPhase) {
                toast.error('Please select a phase before adding a task.');
                return;
              }
              setCurrentPhase(selectedPhase);
              setShowQuickAdd(true);
            }}
            className="text-sm"
            disabled={!selectedPhase || isAddingTask}
          >
            {isAddingTask ? 'Adding...' : '+ Add Task'}
          </Button>
          <Button
            onClick={() => setShowPhaseQuickAdd(true)}
            className="text-sm"
          >
            + Add Phase
          </Button>
        </div>
      </div>
      <ul className="space-y-2">
        {projectPhases.map((phase) => (
          <li
            key={phase.phase_id}
            className={`flex items-center justify-between p-2 rounded cursor-pointer group transition-colors
              ${selectedPhase?.phase_id === phase.phase_id ? 'bg-blue-100' : 'hover:bg-gray-100'}
              ${dragOverPhaseId === phase.phase_id ? 'bg-purple-100' : ''}
            `}
            onClick={() => {
              if (editingPhaseId !== phase.phase_id) {
                setSelectedPhase(phase);
                setCurrentPhase(phase);
              }
            }}
            onDragOver={(e) => handlePhaseDragOver(e, phase.phase_id)}
            onDragLeave={handlePhaseDragLeave}
            onDrop={(e) => handlePhaseDropZone(e, phase)}
          >
            {editingPhaseId === phase.phase_id ? (
              <div className="flex items-center justify-between w-full">
                <input
                  type="text"
                  value={editingPhaseName}
                  onChange={(e) => setEditingPhaseName(e.target.value)}
                  className="flex-1 px-2 py-1 border rounded mr-2"
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSavePhase(phase);
                    }}
                    className="text-green-600 hover:text-green-800 p-1 rounded hover:bg-green-100"
                    title="Save"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCancelEdit();
                    }}
                    className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-100"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <>
                <span>{phase.wbs_code} {phase.phase_name}</span>
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEditPhase(phase);
                    }}
                    className="p-1 rounded hover:bg-gray-200"
                    title="Edit phase name"
                  >
                    <Pencil className="w-4 h-4 text-gray-500 hover:text-gray-700" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletePhaseConfirmation({
                        phaseId: phase.phase_id,
                        phaseName: phase.phase_name
                      });
                    }}
                    className="p-1 rounded hover:bg-red-100"
                    title="Delete phase"
                  >
                    <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-700" />
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );

  const getAssignedUser = (userId: string | null) => {
    if (!userId) return null;
    return users.find(u => u.user_id === userId);
  };

  const renderTaskCard = (task: IProjectTask) => {
    const assignedUser = getAssignedUser(task.assigned_to);
    const checklistItems = task.checklist_items || [];
    const completedItems = checklistItems.filter(item => item.completed).length;
    const hasChecklist = checklistItems.length > 0;
    const allCompleted = hasChecklist && completedItems === checklistItems.length;

    return (
      <div
        key={task.task_id}
        draggable
        onDragStart={(e) => handleDragStart(e, task.task_id)}
        onDragEnd={handleDragEnd}
        onClick={() => handleTaskSelected(task)}
        className="bg-white p-3 mb-2 rounded shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200 border border-gray-200 flex flex-col gap-1"
      >
        <p className="font-semibold text-base mb-1">{task.task_name}</p>
        {task.description && (
          <p className="text-sm text-gray-600 mb-2 line-clamp-2">
            {task.description}
          </p>
        )}
        <div onClick={(e) => e.stopPropagation()}>
          <UserPicker
            value={task.assigned_to || ''}
            onValueChange={(newAssigneeId: string) => handleAssigneeChange(task.task_id, newAssigneeId)}
            size="sm"
            users={users}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            {task.due_date ? (
              <>Due date: <span className='bg-primary-100 p-1 rounded-md'>{new Date(task.due_date).toLocaleDateString()}</span></>
            ) : (
              <>No due date</>
            )}
          </div>
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
        </div>
      </div>
    );
  };

  const renderKanbanBoard = () => (
    <div className={styles.kanbanBoard}>
      {projectStatuses.filter(status => status.is_visible).map((status, index): JSX.Element => {
        const backgroundColor = cycleColors[index % cycleColors.length];
        const darkBackgroundColor = darkCycleColors[index % cycleColors.length];
        const borderColor = borderColors[index % borderColors.length];
        const statusTasks = filteredTasks.filter(task => task.project_status_mapping_id === status.project_status_mapping_id);
        
        return (
          <div
            key={status.project_status_mapping_id}
            className={`${styles.kanbanColumn} ${backgroundColor} rounded-lg border-gray-200 shadow-sm border-2 border-solid`}
            onDrop={(e) => handleDrop(e, status.project_status_mapping_id)}
            onDragOver={handleDragOver}
          >
            <div className="font-bold text-sm p-3 rounded-t-lg flex items-center justify-between relative z-10">
              <div className={`flex ${darkBackgroundColor} rounded-[20px] border-2 ${borderColor} shadow-sm items-center ps-3 py-3 pe-4`}>
                {statusIcons[status.name] || <Circle className="w-4 h-4" />}
                <span className="ml-2">{status.custom_name || status.name}</span>
              </div>
              <div className={styles.statusHeader}>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleAddCard(status)}
                  disabled={isAddingTask || !selectedPhase}
                  tooltipText="Add Task"
                  tooltip={true}
                  className="!w-6 !h-6 !p-0 !min-w-0"
                >
                  <Plus className="w-4 h-4 text-white" />
                </Button>
                <div className={styles.taskCount}>
                  {statusTasks.length}
                </div>
              </div>
            </div>
            <div className={styles.kanbanTasks}>
              {statusTasks.map(renderTaskCard)}
            </div>
          </div>
        );
      })}
    </div>
  );

  const DonutChart: React.FC<{ percentage: number }> = ({ percentage }) => {
    const strokeWidth = 10;
    const size = 40;
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E9D5FF"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#9333EA"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          dy=".3em"
          fontSize="12"
          fontWeight="bold"
          fill="#4B5563"
        >
        </text>
      </svg>
    );
  };

  const renderContent = () => {
    if (!selectedPhase) {
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
          <p className="text-xl text-gray-600">Please select a phase to view the Kanban board.</p>
        </div>
      );
    }

    const completionPercentage = (completedTasksCount / filteredTasks.length) * 100 || 0;

    return (
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Kanban Board: {selectedPhase.phase_name}</h2>
          <div className="flex items-center space-x-2">
            <DonutChart percentage={completionPercentage} />
            <span className="text-sm font-semibold text-gray-600">
              {completedTasksCount} / {filteredTasks.length} Done
            </span>
          </div>
        </div>
        <div className={styles.kanbanWrapper}>
          {renderKanbanBoard()}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full">
      <Toaster position="top-right" />
      <div className={styles.mainContent}>
        <div className={styles.phasesList}>
          {renderProjectPhases()}
        </div>
        <div className={styles.kanbanContainer}>
          {renderContent()}
        </div>
      </div>

      {(showQuickAdd && (currentPhase || selectedPhase)) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg relative">
            <button
              onClick={handleCloseQuickAdd}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              ×
            </button>
            {selectedTask ? (
              <TaskEdit
                task={selectedTask}
                phase={currentPhase || selectedPhase!}
                phases={projectPhases}
                onClose={handleCloseQuickAdd}
                onTaskUpdated={handleTaskUpdated}
                projectStatuses={projectStatuses}
                users={users}
              />
            ) : (
              <TaskQuickAdd
                phase={currentPhase || selectedPhase!}
                onClose={handleCloseQuickAdd}
                onTaskAdded={handleAddTask}
                onTaskUpdated={handleEmptyTaskUpdate}
                projectStatuses={projectStatuses}
                defaultStatus={defaultStatus || undefined}
                onCancel={() => setIsAddingTask(false)}
                users={users}
              />
            )}
          </div>
        </div>
      )}

      {showPhaseQuickAdd && (
        <PhaseQuickAdd
          projectId={project.project_id}
          onClose={() => setShowPhaseQuickAdd(false)}
          onPhaseAdded={handlePhaseAdded}
          onCancel={() => setShowPhaseQuickAdd(false)}
        />
      )}

      {moveConfirmation && (
        <ConfirmationDialog
          isOpen={true}
          onClose={() => setMoveConfirmation(null)}
          onConfirm={handleMoveConfirm}
          title="Move Task"
          message={`Are you sure you want to move task "${moveConfirmation.taskName}" from phase "${moveConfirmation.sourcePhase.phase_name}" to "${moveConfirmation.targetPhase.phase_name}"?`}
          confirmLabel="Move"
          cancelLabel="Cancel"
        />
      )}

      {deletePhaseConfirmation && (
        <ConfirmationDialog
          isOpen={true}
          onClose={() => setDeletePhaseConfirmation(null)}
          onConfirm={handleDeletePhase}
          title="Delete Phase"
          message={`Are you sure you want to delete phase "${deletePhaseConfirmation.phaseName}"? This will also delete all tasks and their checklists in this phase.`}
          confirmLabel="Delete"
          cancelLabel="Cancel"
        />
      )}
    </div>
  );
}
